import { EventEmitter } from 'node:events';
import WebSocket from 'ws';
import {
  negotiateUrl, connectUrl, subscribeMessage,
  type NegotiateResponse, type HubMessage,
} from './protocol.js';
import { isCompressedTopic, canonicalTopic, decodeZlibTopic } from './decoder.js';

const USER_AGENT = 'BestHTTP'; // F1's own apps send this; some endpoints filter on it
const RECONNECT_BASE_MS = 2_000;
const RECONNECT_MAX_MS  = 60_000;

export interface TopicUpdate {
  topic: string;          // canonical (no .z suffix)
  data: unknown;          // already decompressed if applicable
  isInitial: boolean;     // true on subscribe-response snapshot, false on streaming updates
  timestamp: string;      // ISO
}

/**
 * Events emitted:
 *   "topic"        — TopicUpdate for any topic message
 *   "connected"    — WebSocket is open and subscribed
 *   "disconnected" — connection dropped; client will auto-reconnect
 *   "error"        — non-fatal error during processing
 */
export class F1SignalRClient extends EventEmitter {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private shouldRun = true;
  private reconnectTimer: NodeJS.Timeout | null = null;

  start(): void {
    this.shouldRun = true;
    this.connect().catch(err => {
      this.emit('error', err);
      this.scheduleReconnect();
    });
  }

  stop(): void {
    this.shouldRun = false;
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.ws) {
      try { this.ws.close(); } catch { /* ignore */ }
      this.ws = null;
    }
  }

  // ─── Connection lifecycle ──────────────────────────────────────────────────
  private async connect(): Promise<void> {
    log('[signalr] negotiate…');
    const negotiateRes = await fetch(negotiateUrl(), {
      headers: { 'User-Agent': USER_AGENT },
    });
    if (!negotiateRes.ok) {
      throw new Error(`negotiate failed: HTTP ${negotiateRes.status}`);
    }
    const cookieHeader = negotiateRes.headers.get('set-cookie') ?? '';
    const negotiate = await negotiateRes.json() as NegotiateResponse;
    log(`[signalr] negotiated, token=${negotiate.ConnectionToken.slice(0, 12)}…`);

    const ws = new WebSocket(connectUrl(negotiate.ConnectionToken), {
      headers: {
        'User-Agent': USER_AGENT,
        // SignalR classic requires the negotiate cookie on the WS handshake
        Cookie: cookieHeader,
      },
      perMessageDeflate: false,
    });

    this.ws = ws;

    ws.on('open', () => {
      log('[signalr] websocket open — subscribing');
      ws.send(subscribeMessage(1));
      this.reconnectAttempts = 0;
      this.emit('connected');
    });

    ws.on('message', (raw: WebSocket.RawData) => {
      try {
        const text = raw.toString('utf8');
        if (!text || text === '{}') return;
        const msg = JSON.parse(text) as HubMessage;
        this.handleHubMessage(msg);
      } catch (err) {
        this.emit('error', new Error(`bad message: ${(err as Error).message}`));
      }
    });

    ws.on('close', (code, reason) => {
      log(`[signalr] websocket closed code=${code} reason=${reason?.toString() ?? ''}`);
      this.ws = null;
      this.emit('disconnected');
      this.scheduleReconnect();
    });

    ws.on('error', err => {
      this.emit('error', err);
      // ws will emit close after error; reconnect is scheduled there
    });
  }

  // ─── Message routing ──────────────────────────────────────────────────────
  private handleHubMessage(msg: HubMessage): void {
    // Initial subscribe response: full state for every topic, keyed by topic name
    if (msg.R && typeof msg.R === 'object') {
      const now = new Date().toISOString();
      for (const [topic, data] of Object.entries(msg.R)) {
        this.emitTopic(topic, data, true, now);
      }
      return;
    }

    // Streaming updates: array of {H, M, A} where A = [topic, data, timestamp]
    if (Array.isArray(msg.M)) {
      for (const entry of msg.M) {
        if (entry.M !== 'feed' || !Array.isArray(entry.A) || entry.A.length < 2) continue;
        const [topic, data, ts] = entry.A as [string, unknown, string?];
        this.emitTopic(topic, data, false, ts ?? new Date().toISOString());
      }
    }
  }

  private emitTopic(rawTopic: string, rawData: unknown, isInitial: boolean, ts: string): void {
    let data = rawData;
    if (isCompressedTopic(rawTopic) && typeof rawData === 'string') {
      try {
        data = decodeZlibTopic(rawData);
      } catch (err) {
        this.emit('error', new Error(`decode ${rawTopic}: ${(err as Error).message}`));
        return;
      }
    }
    const update: TopicUpdate = {
      topic: canonicalTopic(rawTopic),
      data,
      isInitial,
      timestamp: ts,
    };
    this.emit('topic', update);
  }

  // ─── Reconnect with exponential backoff + jitter ──────────────────────────
  private scheduleReconnect(): void {
    if (!this.shouldRun) return;
    this.reconnectAttempts += 1;
    const expo = Math.min(
      RECONNECT_BASE_MS * Math.pow(2, this.reconnectAttempts - 1),
      RECONNECT_MAX_MS,
    );
    const jitter = Math.floor(Math.random() * 1_000);
    const delay  = expo + jitter;
    log(`[signalr] reconnect in ${delay}ms (attempt ${this.reconnectAttempts})`);
    this.reconnectTimer = setTimeout(() => {
      this.connect().catch(err => {
        this.emit('error', err);
        this.scheduleReconnect();
      });
    }, delay);
  }
}

function log(...args: unknown[]): void {
  // eslint-disable-next-line no-console
  console.log(...args);
}

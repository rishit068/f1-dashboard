import { WebSocketServer, WebSocket as WSClient } from 'ws';
import type { Server } from 'node:http';
import type { ServerMessage } from '../types.js';

/**
 * Maintains the set of connected frontend clients and broadcasts JSON messages
 * to all of them. Also sends a snapshot to each new client on connect so they
 * can render immediately instead of waiting for the next state change.
 */
export class Broadcaster {
  private wss: WebSocketServer;
  private clients = new Set<WSClient>();
  private snapshotProvider: () => ServerMessage;

  constructor(server: Server, path: string, snapshotProvider: () => ServerMessage) {
    this.snapshotProvider = snapshotProvider;
    this.wss = new WebSocketServer({ server, path });

    this.wss.on('connection', (socket, req) => {
      this.clients.add(socket);
      const addr = req.socket.remoteAddress;
      log(`[ws] client connected (${addr}, total=${this.clients.size})`);

      // Send current snapshot immediately
      try {
        socket.send(JSON.stringify(snapshotProvider()));
      } catch (err) {
        log('[ws] snapshot send failed:', (err as Error).message);
      }

      socket.on('close', () => {
        this.clients.delete(socket);
        log(`[ws] client disconnected (total=${this.clients.size})`);
      });

      socket.on('error', err => {
        log('[ws] client error:', err.message);
      });
    });
  }

  broadcast(msg: ServerMessage): void {
    const payload = JSON.stringify(msg);
    for (const client of this.clients) {
      if (client.readyState === client.OPEN) {
        try { client.send(payload); } catch { /* drop */ }
      }
    }
  }

  clientCount(): number {
    return this.clients.size;
  }
}

function log(...args: unknown[]): void {
  // eslint-disable-next-line no-console
  console.log(...args);
}

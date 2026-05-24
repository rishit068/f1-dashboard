import { useEffect, useRef, useState } from 'react';
import type { LiveRaceState, LivePhase, OpenF1Session } from '../types';

/**
 * Connects to the F1 live backend over WebSocket. Returns the most recent
 * server-pushed state. Auto-reconnects on disconnect with backoff.
 *
 * The backend URL comes from `VITE_LIVE_WS_URL` (set in `.env.local`).
 * Falls back to `ws://localhost:8080/live` for local dev.
 */

const WS_URL = (import.meta.env.VITE_LIVE_WS_URL as string | undefined)
  ?? 'ws://localhost:8080/live';

const RECONNECT_MIN_MS = 1_000;
const RECONNECT_MAX_MS = 30_000;

interface ServerStateMessage {
  type:    'snapshot' | 'state';
  phase:   LivePhase;
  session: BackendSession | null;
  state:   LiveRaceState | null;
}
interface ServerPhaseMessage {
  type:    'phase';
  phase:   LivePhase;
  session: BackendSession | null;
}
interface ServerErrorMessage {
  type:    'error';
  message: string;
}
type ServerMessage = ServerStateMessage | ServerPhaseMessage | ServerErrorMessage;

/** Server-side session metadata — looser than OpenF1Session, narrowed below. */
interface BackendSession {
  session_key:        number;
  session_name:       string;
  session_type:       string;
  date_start:         string;
  date_end:           string;
  year:               number;
  meeting_key:        number;
  meeting_name?:      string;
  circuit_short_name: string;
  country_name:       string;
  location:           string;
  total_laps?:        number;
}

/**
 * Shape consumed by the legacy `NoLiveSession` diagnostics panel. Kept here
 * (rather than in useLiveSession.ts which has been removed) so callers can
 * import a single canonical type.
 */
export interface LiveSessionDebug {
  lastCheck:        Date | null;
  lastSessionName:  string | null;
  lastSessionType:  string | null;
  sessionStart:     Date | null;
  sessionEnd:       Date | null;
  isValidType:      boolean;
  isWithinWindow:   boolean;
  apiError:         string | null;
  apiStatus:        number | null;
}

export interface LiveBackendResult {
  /** ws connection state. */
  connected:  boolean;
  /** `true` while attempting the first connect. */
  checking:   boolean;
  /** Latest phase reported by the server. */
  phase:      LivePhase;
  /** Latest session metadata, or null. */
  session:    OpenF1Session | null;
  /** Latest aggregated state, or null. */
  state:      LiveRaceState | null;
  /** Last connection error message (cleared on next successful connect). */
  error:      string | null;
}

export function useLiveBackend(): LiveBackendResult {
  const [connected, setConnected] = useState(false);
  const [checking,  setChecking]  = useState(true);
  const [phase,     setPhase]     = useState<LivePhase>('NONE');
  const [session,   setSession]   = useState<OpenF1Session | null>(null);
  const [state,     setState]     = useState<LiveRaceState | null>(null);
  const [error,     setError]     = useState<string | null>(null);

  const wsRef        = useRef<WebSocket | null>(null);
  const reconnectRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const attemptRef   = useRef(0);
  const stoppedRef   = useRef(false);

  useEffect(() => {
    stoppedRef.current = false;

    const connect = () => {
      if (stoppedRef.current) return;
      const ws = new WebSocket(WS_URL);
      wsRef.current = ws;

      ws.onopen = () => {
        attemptRef.current = 0;
        setConnected(true);
        setChecking(false);
        setError(null);
      };

      ws.onmessage = ev => {
        try {
          const msg = JSON.parse(ev.data) as ServerMessage;
          if (msg.type === 'snapshot' || msg.type === 'state') {
            setPhase(msg.phase);
            setSession(coerceSession(msg.session));
            setState(msg.state);
          } else if (msg.type === 'phase') {
            setPhase(msg.phase);
            setSession(coerceSession(msg.session));
          } else if (msg.type === 'error') {
            setError(msg.message);
          }
        } catch (err) {
          // Bad frame — ignore but log
          // eslint-disable-next-line no-console
          console.warn('[live-backend] bad message:', err);
        }
      };

      ws.onerror = () => {
        // onclose will follow and trigger reconnect; just record the error
        setError('Cannot reach live backend.');
      };

      ws.onclose = () => {
        setConnected(false);
        wsRef.current = null;
        scheduleReconnect();
      };
    };

    const scheduleReconnect = () => {
      if (stoppedRef.current) return;
      attemptRef.current += 1;
      const delay = Math.min(
        RECONNECT_MIN_MS * 2 ** (attemptRef.current - 1),
        RECONNECT_MAX_MS,
      );
      reconnectRef.current = setTimeout(connect, delay);
    };

    connect();

    return () => {
      stoppedRef.current = true;
      if (reconnectRef.current) clearTimeout(reconnectRef.current);
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.close();
      }
    };
  }, []);

  return { connected, checking, phase, session, state, error };
}

/** Backend `BackendSession` shape → frontend `OpenF1Session` (identical fields). */
function coerceSession(s: BackendSession | null): OpenF1Session | null {
  if (!s) return null;
  return {
    session_key:        s.session_key,
    session_name:       s.session_name,
    session_type:       s.session_type,
    date_start:         s.date_start,
    date_end:           s.date_end,
    gmt_offset:         '',
    year:               s.year,
    circuit_short_name: s.circuit_short_name,
    country_name:       s.country_name,
    location:           s.location,
    meeting_key:        s.meeting_key,
    meeting_name:       s.meeting_name,
    total_laps:         s.total_laps,
  };
}

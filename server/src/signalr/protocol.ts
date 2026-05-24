// F1 SignalR endpoint constants + URL builders.
//
// F1 uses ASP.NET SignalR "classic" (1.5 protocol), NOT SignalR Core. The
// handshake is:
//   1. POST/GET /signalr/negotiate → returns ConnectionToken + ConnectionId
//   2. Upgrade ws://host/signalr/connect (carrying the token) → WebSocket
//   3. Send {"H","M","A","I"} subscribe message to Streaming hub
//
// All topics with `.z` suffix carry zlib-deflated, base64-encoded JSON.

export const F1_HOST     = 'livetiming.formula1.com';
export const F1_HTTP     = `https://${F1_HOST}/signalr`;
export const F1_WS       = `wss://${F1_HOST}/signalr`;
export const CLIENT_PROT = '1.5';

// Hub name F1 uses for the livetiming stream
export const HUB_NAME = 'Streaming';

/** connectionData blob the SignalR endpoint expects on every request. */
const CONNECTION_DATA = JSON.stringify([{ name: HUB_NAME }]);

/** Topics we subscribe to. Order is the same one F1's own app uses. */
export const TOPICS = [
  'Heartbeat',
  'CarData.z',              // zlib compressed
  'Position.z',             // zlib compressed
  'ExtrapolatedClock',
  'TopThree',
  'TimingStats',
  'TimingAppData',
  'WeatherData',
  'TrackStatus',
  'SessionStatus',
  'DriverList',
  'RaceControlMessages',
  'SessionInfo',
  'SessionData',
  'LapCount',
  'TimingData',
  'TeamRadio',
] as const;

export type Topic = (typeof TOPICS)[number];

export function negotiateUrl(): string {
  const params = new URLSearchParams({
    clientProtocol: CLIENT_PROT,
    connectionData: CONNECTION_DATA,
  });
  return `${F1_HTTP}/negotiate?${params.toString()}`;
}

export function connectUrl(connectionToken: string): string {
  const params = new URLSearchParams({
    transport:        'webSockets',
    clientProtocol:   CLIENT_PROT,
    connectionToken,
    connectionData:   CONNECTION_DATA,
  });
  return `${F1_WS}/connect?${params.toString()}`;
}

/**
 * Body for the "Subscribe" RPC sent over the WebSocket once connected.
 * The integer `I` field is a per-message id; we use 1 for the first call.
 */
export function subscribeMessage(invocationId = 1): string {
  return JSON.stringify({
    H: HUB_NAME,
    M: 'Subscribe',
    A: [TOPICS],
    I: invocationId,
  });
}

// ─── Wire types ──────────────────────────────────────────────────────────────

/** Response shape from the negotiate endpoint. */
export interface NegotiateResponse {
  Url: string;
  ConnectionToken: string;
  ConnectionId: string;
  KeepAliveTimeout: number;
  DisconnectTimeout: number;
  TryWebSockets: boolean;
  ProtocolVersion: string;
  TransportConnectTimeout: number;
}

/**
 * Messages received from F1's SignalR server over the WebSocket.
 * `M` is the message array — each entry has `H` (hub), `M` (method), `A` (args).
 * For our use case `M` always = "feed" and `A` = ["TopicName", data, timestamp].
 *
 * The first message after connect is a "result" envelope (no M field, just R)
 * containing the full initial state for all subscribed topics — keyed by topic.
 */
export interface HubMessage {
  C?: string;                              // message id
  M?: Array<{ H: string; M: string; A: unknown[] }>;
  R?: Record<string, unknown>;             // initial state on subscribe response
  I?: string;                              // matches our invocation id
  S?: number;                              // status flag
}

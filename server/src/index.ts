import express from 'express';
import { createServer } from 'node:http';
import { F1SignalRClient } from './signalr/client.js';
import { StateAggregator } from './state/aggregator.js';
import { Broadcaster } from './transport/broadcaster.js';
import type { ServerMessage } from './types.js';

const PORT = parseInt(process.env.PORT ?? '8080', 10);
const HOST = process.env.HOST ?? '0.0.0.0';

// ─── HTTP server (health checks + CORS for frontend) ─────────────────────────
const app = express();
app.use((req, res, next) => {
  // Permissive CORS — only health/info endpoints exist over HTTP
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  next();
});

app.get('/healthz', (_req, res) => {
  res.json({
    status:   'ok',
    upstream: signalrStatus,
    clients:  broadcaster?.clientCount() ?? 0,
    session:  aggregator.sessionMeta(),
    phase:    aggregator.phase(),
    hasData:  aggregator.hasAnyData(),
    uptime:   process.uptime(),
  });
});

app.get('/', (_req, res) => {
  res.type('text/plain').send(
    'F1 Live backend.\n' +
    'WebSocket: connect to /live for real-time race state.\n' +
    'Health: GET /healthz\n',
  );
});

const httpServer = createServer(app);

// ─── State + SignalR ─────────────────────────────────────────────────────────
const aggregator    = new StateAggregator();
const signalrClient = new F1SignalRClient();
let   signalrStatus = 'starting';

// Throttle broadcasts — F1 sends many small updates; we batch into ~250 ms ticks
let dirty = false;
let broadcastTimer: NodeJS.Timeout | null = null;
const BROADCAST_INTERVAL_MS = 250;

function buildStateMessage(): ServerMessage {
  return {
    type:    'state',
    phase:   aggregator.phase(),
    session: aggregator.sessionMeta(),
    state:   aggregator.snapshot(),
  };
}

function buildSnapshotMessage(): ServerMessage {
  return {
    type:    'snapshot',
    phase:   aggregator.phase(),
    session: aggregator.sessionMeta(),
    state:   aggregator.snapshot(),
  };
}

function scheduleBroadcast(): void {
  if (broadcastTimer) return;
  broadcastTimer = setTimeout(() => {
    broadcastTimer = null;
    if (!dirty) return;
    dirty = false;
    broadcaster.broadcast(buildStateMessage());
  }, BROADCAST_INTERVAL_MS);
}

// ─── WebSocket bridge ─────────────────────────────────────────────────────────
const broadcaster = new Broadcaster(httpServer, '/live', buildSnapshotMessage);

// ─── Wire SignalR → aggregator → broadcaster ────────────────────────────────
signalrClient.on('topic', update => {
  aggregator.ingest(update.topic, update.data, update.isInitial);
  dirty = true;
  scheduleBroadcast();
});

signalrClient.on('connected', () => {
  signalrStatus = 'connected';
  console.log('[upstream] connected to F1 SignalR');
});

signalrClient.on('disconnected', () => {
  signalrStatus = 'disconnected';
  console.log('[upstream] disconnected — will reconnect');
  // Inform clients connection state changed (but keep last state visible)
  broadcaster.broadcast({
    type:    'phase',
    phase:   aggregator.phase(),
    session: aggregator.sessionMeta(),
  });
});

signalrClient.on('error', err => {
  console.error('[upstream] error:', err.message ?? err);
});

// ─── Start ────────────────────────────────────────────────────────────────────
httpServer.listen(PORT, HOST, () => {
  console.log(`[http] listening on http://${HOST}:${PORT}`);
  console.log(`[ws]   accepting clients on ws://${HOST}:${PORT}/live`);
  signalrClient.start();
});

// ─── Graceful shutdown ────────────────────────────────────────────────────────
function shutdown(): void {
  console.log('[shutdown] closing...');
  signalrClient.stop();
  httpServer.close(() => process.exit(0));
  setTimeout(() => process.exit(0), 3000).unref();
}
process.on('SIGTERM', shutdown);
process.on('SIGINT',  shutdown);

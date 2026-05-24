# F1 Live Backend

Bridges F1's official SignalR livetiming feed → clean WebSocket the dashboard
frontend consumes. Replaces the OpenF1 REST polling (which was paywalled
during live sessions).

```
F1 SignalR (livetiming.formula1.com)
        │
        ▼
   Node.js server (this repo)
        │  ws://host/live
        ▼
   React dashboard
```

## Local development

```bash
cd server
npm install
npm run dev       # tsx watch — auto-reloads on save
```

The server starts on `http://localhost:8080` with:
- `GET  /healthz` — JSON status, current session info, upstream connection state
- `WS   /live`    — connect here to receive live state updates

Smoke test:
```bash
curl http://localhost:8080/healthz
```

Should report `upstream: "connected"` within a few seconds of startup, and
populate `session` with the most recent F1 session metadata.

## Deploy to Fly.io

One-time setup:
```bash
brew install flyctl     # macOS
fly auth signup         # or fly auth login
```

First deploy from this directory (`server/`):
```bash
fly launch --no-deploy  # creates app + reads fly.toml; will prompt for app name
fly deploy              # builds Dockerfile and ships it
```

Re-deploy after changes:
```bash
fly deploy
```

Check logs:
```bash
fly logs
```

Once deployed you'll get a URL like `https://<your-app>.fly.dev`. Use that
as the WebSocket origin in the frontend:

```bash
# In the project root (one level up), create .env.local
echo 'VITE_LIVE_WS_URL=wss://<your-app>.fly.dev/live' > ../.env.local
```

## Architecture notes

- **Single upstream connection.** All frontend clients share one SignalR
  connection — Fly's free-tier VM happily handles hundreds of WebSocket
  fan-outs at minimal memory.
- **Always-on.** `auto_stop_machines = false` and `min_machines_running = 1`
  keep the VM alive so the SignalR connection stays warm. Cold reconnects
  cost 2-3 s and we don't want users to see that.
- **Throttled broadcast.** F1 sends many small deltas; the server batches
  them into 250 ms broadcasts so the frontend isn't overwhelmed.
- **Auto-reconnect.** SignalR client backs off exponentially (2s → 60s) on
  drop. Health endpoint reports the upstream state.

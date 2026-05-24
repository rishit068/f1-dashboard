import { Component, type ReactNode } from 'react';
import type { Race, LivePhase, OpenF1Session, LiveRaceState } from '../../types';
import type { LiveSessionDebug } from '../../hooks/useLiveBackend';
import SessionHeader from './SessionHeader';
import AlertBanner from './AlertBanner';
import RaceTower from './RaceTower';
import RaceControlFeed from './RaceControlFeed';
import FastestLapsBoard from './FastestLapsBoard';
import NoLiveSession from './NoLiveSession';

// ── Error boundary ─────────────────────────────────────────────────────────────
interface EBState { hasError: boolean }
class LiveErrorBoundary extends Component<{ children: ReactNode }, EBState> {
  state: EBState = { hasError: false };
  static getDerivedStateFromError(): EBState { return { hasError: true }; }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          padding: 40, textAlign: 'center', color: '#888',
          background: '#f5f5f0', borderTop: '2px solid #e8002d',
        }}>
          <div style={{ fontSize: 20, marginBottom: 8 }}>⚠</div>
          <div style={{ fontWeight: 700, color: '#e8002d', marginBottom: 4 }}>Live section error</div>
          <div style={{ fontSize: 13 }}>Data may be delayed. Retrying automatically.</div>
        </div>
      );
    }
    return this.props.children;
  }
}

// ── Checking state (first connect to backend) ─────────────────────────────────
function CheckingState() {
  return (
    <div style={{ background: '#15151e', padding: '80px 32px', textAlign: 'center' }}>
      <div style={{
        display: 'inline-block',
        width: 36, height: 36, borderRadius: '50%',
        border: '3px solid rgba(232,0,45,0.25)',
        borderTopColor: '#e8002d',
        animation: 'spin 0.9s linear infinite',
        marginBottom: 16,
      }} />
      <div style={{ color: '#555', fontSize: 12, letterSpacing: 1.5 }}>
        CONNECTING TO LIVE BACKEND…
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

interface Props {
  /** Most recent session metadata reported by the backend. */
  session: OpenF1Session | null;
  /** Backend-derived phase: LIVE / COMPLETE / NONE. */
  phase: LivePhase;
  /** Aggregated live state, or null if not yet received. */
  data: LiveRaceState | null;
  /** Next race (for the no-session countdown card). */
  nextRace: Race | null;
  /** True until the WebSocket has connected for the first time. */
  checking: boolean;
  /** Diagnostic info for the no-session panel. */
  debug: LiveSessionDebug;
}

export default function LiveSection({ session: _session, phase, data, nextRace, checking, debug }: Props) {
  return (
    <section id="live" style={{ paddingTop: 52 }}>
      <LiveErrorBoundary>
        {checking ? (
          <CheckingState />
        ) : phase === 'NONE' || !data || data.drivers.length === 0 ? (
          <NoLiveSession nextRace={nextRace} debug={debug} />
        ) : (
          <>
            <SessionHeader data={data} phase={phase} />
            <AlertBanner status={data.safetyCarStatus} />
            <RaceTower data={data} />
            <div style={{ background: '#f5f5f0', padding: '40px 32px 56px' }}>
              <div style={{
                maxWidth: 1200, margin: '0 auto',
                display: 'flex', gap: 40, flexWrap: 'wrap',
              }}>
                <RaceControlFeed messages={data.raceControl} />
                <FastestLapsBoard board={data.fastestLapsBoard} currentLap={data.currentLap} />
              </div>
            </div>
          </>
        )}
      </LiveErrorBoundary>
    </section>
  );
}

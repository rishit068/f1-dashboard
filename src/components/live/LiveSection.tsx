import { Component, useState, useEffect, type ReactNode } from 'react';
import type { Race, LivePhase } from '../../types';
import { useLiveRaceData } from '../../hooks/useLiveRaceData';
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

// ── Checking state (first load, < 8 seconds) ──────────────────────────────────
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
        CHECKING FOR LIVE SESSION…
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

// ── Inner data consumer ────────────────────────────────────────────────────────
interface InnerProps {
  sessionKey: number;
  phase: LivePhase;
  nextRace: Race | null;
}

function LiveDataView({ sessionKey, phase, nextRace }: InnerProps) {
  const { data, loading } = useLiveRaceData(sessionKey, phase === 'LIVE' || phase === 'COMPLETE');

  // Hard 8-second timeout — if still loading, bail to NoLiveSession
  const [timedOut, setTimedOut] = useState(false);
  useEffect(() => {
    if (!loading) return;
    const id = setTimeout(() => setTimedOut(true), 8_000);
    return () => clearTimeout(id);
  }, [loading]);

  // State 3 — timed out or definitely no data
  if (timedOut && !data) {
    return <NoLiveSession nextRace={nextRace} />;
  }

  // State 1 — loading spinner (only while first fetch is in flight)
  if (loading && !data) {
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
          LOADING LIVE DATA…
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  // State 3 — load finished but empty (stale session key, no actual race data)
  if (!data || data.drivers.length === 0) {
    return <NoLiveSession nextRace={nextRace} />;
  }

  // State 2 — live data confirmed
  return (
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
  );
}

// ── Public component ───────────────────────────────────────────────────────────
interface Props {
  sessionKey: number | null;
  phase: LivePhase;
  nextRace: Race | null;
  checking: boolean;
}

export default function LiveSection({ sessionKey, phase, nextRace, checking }: Props) {
  return (
    <section id="live" style={{ paddingTop: 52 }}>
      <LiveErrorBoundary>
        {checking ? (
          <CheckingState />
        ) : (phase === 'NONE' || sessionKey == null) ? (
          <NoLiveSession nextRace={nextRace} />
        ) : (
          <LiveDataView sessionKey={sessionKey} phase={phase} nextRace={nextRace} />
        )}
      </LiveErrorBoundary>
    </section>
  );
}

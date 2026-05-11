import { Component, type ReactNode } from 'react';
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

// ── Inner data consumer ────────────────────────────────────────────────────────
interface InnerProps {
  sessionKey: number;
  phase: LivePhase;
  nextRace: Race | null;
}

function LiveDataView({ sessionKey, phase }: InnerProps) {
  const data = useLiveRaceData(sessionKey, phase === 'LIVE' || phase === 'COMPLETE');

  if (!data) {
    return (
      <div style={{ background: '#15151e', padding: '80px 32px', textAlign: 'center' }}>
        <div style={{
          display: 'inline-block',
          width: 40, height: 40, borderRadius: '50%',
          border: '3px solid rgba(232,0,45,0.3)',
          borderTopColor: '#e8002d',
          animation: 'spin 0.9s linear infinite',
          marginBottom: 16,
        }} />
        <div style={{ color: '#888', fontSize: 13, letterSpacing: 1 }}>
          LOADING LIVE DATA…
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <>
      <SessionHeader data={data} phase={phase} />
      <AlertBanner status={data.safetyCarStatus} />
      <RaceTower data={data} />

      {/* Bottom two-column section */}
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
}

export default function LiveSection({ sessionKey, phase, nextRace }: Props) {
  return (
    <section id="live" style={{ paddingTop: 52 }}>
      <LiveErrorBoundary>
        {(phase === 'NONE' || sessionKey == null) ? (
          <NoLiveSession nextRace={nextRace} />
        ) : (
          <LiveDataView sessionKey={sessionKey} phase={phase} nextRace={nextRace} />
        )}
      </LiveErrorBoundary>
    </section>
  );
}

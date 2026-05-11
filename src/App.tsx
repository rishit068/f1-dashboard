import { useState, useEffect } from 'react';
import './index.css';
import { useF1Data } from './hooks/useF1Data';
import { useLiveSession } from './hooks/useLiveSession';
import IntroAnimation from './components/IntroAnimation';
import StickyNav from './components/StickyNav';
import Hero from './components/Hero';
import SeasonCalendar from './components/SeasonCalendar';
import DriversChampionship from './components/DriversChampionship';
import ConstructorsCup from './components/ConstructorsCup';
import PaddockIntel from './components/PaddockIntel';
import LiveSection from './components/live/LiveSection';

export default function App() {
  const [introDone, setIntroDone] = useState(false);
  const [contentVisible, setContentVisible] = useState(false);
  const [showLive, setShowLive] = useState(false);

  const {
    nextRace, allRaces,
    driverStandings, constructorStandings,
    loading, errors, currentRound, totalRounds,
  } = useF1Data();

  const { session: liveSession, phase: livePhase, isLive } = useLiveSession();

  useEffect(() => {
    if (introDone) {
      const id = setTimeout(() => setContentVisible(true), 80);
      return () => clearTimeout(id);
    }
  }, [introDone]);

  // Auto-show live panel when a race goes live
  useEffect(() => {
    if (isLive) setShowLive(true);
  }, [isLive]);

  const handleLiveClick = () => {
    setShowLive(v => !v);
    if (!showLive) {
      setTimeout(() => {
        document.getElementById('live')?.scrollIntoView({ behavior: 'smooth' });
      }, 50);
    }
  };

  return (
    <>
      {!introDone && <IntroAnimation onDone={() => setIntroDone(true)} />}

      <div style={{ opacity: contentVisible ? 1 : 0, transition: 'opacity 0.5s ease' }}>
        <StickyNav isLive={isLive} onLiveClick={handleLiveClick} />

        <main>
          {/* ── LIVE SECTION (shown when toggled or auto-live) ── */}
          {showLive && (
            <div className="fade-up" style={{ animationFillMode: 'both' }}>
              <LiveSection
                sessionKey={liveSession?.session_key ?? null}
                phase={livePhase}
                nextRace={nextRace}
              />
            </div>
          )}

          {/* ── HERO ── */}
          <div className={contentVisible ? 'fade-up' : ''} style={{ animationDelay: '0ms', animationFillMode: 'both' }}>
            <Hero race={nextRace} loading={loading} total={totalRounds} />
          </div>

          {/* ── CALENDAR ── */}
          <div className={contentVisible ? 'fade-up' : ''} style={{ animationDelay: '80ms', animationFillMode: 'both' }}>
            <SeasonCalendar races={allRaces} nextRace={nextRace} loading={loading} />
          </div>

          {/* ── THREE-COLUMN DASHBOARD ── */}
          <div
            id="standings"
            className={contentVisible ? 'fade-up' : ''}
            style={{ animationDelay: '160ms', animationFillMode: 'both' }}
          >
            <section style={{ background: '#ffffff', borderTop: '1px solid #e8e8e0', borderBottom: '1px solid #e8e8e0' }}>
              <div style={{
                maxWidth: 1200, margin: '0 auto',
                padding: '52px 32px 60px',
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: 0,
              }}>
                <div id="drivers" style={{ paddingRight: 40 }}>
                  <DriversChampionship standings={driverStandings} loading={loading} round={currentRound} />
                </div>
                <div style={{ borderLeft: '1px solid #e8e8e0', borderRight: '1px solid #e8e8e0', paddingLeft: 40, paddingRight: 40 }}>
                  <ConstructorsCup standings={constructorStandings} loading={loading} round={currentRound} />
                </div>
                <div id="constructors" style={{ paddingLeft: 40 }}>
                  <PaddockIntel driverStandings={driverStandings} loading={loading} round={currentRound} />
                </div>
              </div>
            </section>
          </div>

          {/* ── FOOTER ── */}
          <footer style={{
            background: '#15151e',
            padding: '32px',
            textAlign: 'center',
            color: 'rgba(255,255,255,0.2)',
            fontSize: 11,
            letterSpacing: 1,
          }}>
            <span style={{ color: '#e8002d', fontWeight: 700 }}>F1</span>
            {' '}LIVE DASHBOARD · BUILT FOR RISHIT · DATA: JOLPI.CA + OPENF1.ORG
          </footer>
        </main>

        {/* Error banners */}
        {errors.length > 0 && (
          <div className="error-banner">⚠ Some data unavailable</div>
        )}
      </div>
    </>
  );
}

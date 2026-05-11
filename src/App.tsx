import { useState, useEffect } from 'react';
import './index.css';
import { useF1Data } from './hooks/useF1Data';
import { useLiveSession } from './hooks/useLiveSession';
import { useIsMobile } from './hooks/useBreakpoint';
import IntroAnimation from './components/IntroAnimation';
import StickyNav from './components/StickyNav';
import BottomTabBar, { type TabId } from './components/BottomTabBar';
import Hero from './components/Hero';
import SeasonCalendar from './components/SeasonCalendar';
import DriversChampionship from './components/DriversChampionship';
import ConstructorsCup from './components/ConstructorsCup';
import PaddockIntel from './components/PaddockIntel';
import LiveSection from './components/live/LiveSection';
import RaceResultSheet from './components/results/RaceResultSheet';
import type { SelectedRace } from './types';

export default function App() {
  const [introDone, setIntroDone] = useState(false);
  const [contentVisible, setContentVisible] = useState(false);
  const [showLive, setShowLive] = useState(false);
  const [activeTab, setActiveTab] = useState<TabId>('next');
  const [selectedRace, setSelectedRace] = useState<SelectedRace | null>(null);
  const isMobile = useIsMobile();

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

  // Auto-show live panel when race goes live
  useEffect(() => {
    if (isLive) { setShowLive(true); setActiveTab('live'); }
  }, [isLive]);

  // Handle tab taps on mobile
  const handleTab = (id: TabId) => {
    setActiveTab(id);
    if (id === 'live') {
      setShowLive(v => !v);
      if (!showLive) {
        setTimeout(() => document.getElementById('live')?.scrollIntoView({ behavior: 'smooth' }), 50);
      }
    } else {
      // Close live panel when switching away on mobile
      if (isMobile) setShowLive(false);
      const targets: Record<TabId, string> = {
        next: 'next', drivers: 'drivers', teams: 'constructors',
        calendar: 'calendar', live: 'live',
      };
      setTimeout(() => document.getElementById(targets[id])?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50);
    }
  };

  // Desktop LIVE toggle (from nav button)
  const handleDesktopLiveClick = () => {
    setShowLive(v => !v);
    if (!showLive) setTimeout(() => document.getElementById('live')?.scrollIntoView({ behavior: 'smooth' }), 50);
  };

  const navH = isMobile ? 48 : 52;
  const bottomBarH = isMobile ? 64 : 0;

  return (
    <>
      {!introDone && <IntroAnimation onDone={() => setIntroDone(true)} />}

      <div style={{ opacity: contentVisible ? 1 : 0, transition: 'opacity 0.5s ease' }}>

        {/* ── Top nav ── */}
        <StickyNav isLive={isLive} onLiveClick={handleDesktopLiveClick} />

        {/* ── Bottom tab bar (mobile only) ── */}
        {isMobile && (
          <BottomTabBar active={activeTab} isLive={isLive} onTab={handleTab} />
        )}

        <main style={{
          paddingTop: navH,
          paddingBottom: isMobile ? bottomBarH + 'px' : 0,
          overflowX: 'hidden',
        }}>

          {/* ── LIVE SECTION ── */}
          {showLive && (
            <div className="fade-up" style={{ animationFillMode: 'both' }}>
              <LiveSection
                sessionKey={liveSession?.session_key ?? null}
                phase={livePhase}
                nextRace={nextRace}
              />
            </div>
          )}

          {/* ── HERO / NEXT RACE ── */}
          <div id="next" className={contentVisible ? 'fade-up' : ''} style={{ animationDelay: '0ms', animationFillMode: 'both' }}>
            <Hero race={nextRace} loading={loading} total={totalRounds} />
          </div>

          {/* ── CALENDAR ── */}
          <div id="calendar" className={contentVisible ? 'fade-up' : ''} style={{ animationDelay: '80ms', animationFillMode: 'both' }}>
            <SeasonCalendar races={allRaces} nextRace={nextRace} loading={loading} onSelectRace={setSelectedRace} />
          </div>

          {/* ── THREE-COLUMN / STACKED STANDINGS ── */}
          <div
            id="standings"
            className={contentVisible ? 'fade-up' : ''}
            style={{ animationDelay: '160ms', animationFillMode: 'both' }}
          >
            <section style={{ background: '#ffffff', borderTop: '1px solid #e8e8e0', borderBottom: '1px solid #e8e8e0' }}>
              {isMobile ? (
                /* ── Mobile: stacked 1-column ── */
                <div style={{ padding: '28px 16px 32px' }}>
                  <div id="drivers">
                    <DriversChampionship standings={driverStandings} loading={loading} round={currentRound} />
                  </div>
                  <div style={{ height: 1, background: '#e8e8e0', margin: '28px 0' }} />
                  <div id="constructors">
                    <ConstructorsCup standings={constructorStandings} loading={loading} round={currentRound} />
                  </div>
                  <div style={{ height: 1, background: '#e8e8e0', margin: '28px 0' }} />
                  <PaddockIntel driverStandings={driverStandings} loading={loading} round={currentRound} />
                </div>
              ) : (
                /* ── Desktop: 3-column grid ── */
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
              )}
            </section>
          </div>

          {/* ── FOOTER ── */}
          <footer style={{
            background: '#15151e',
            padding: isMobile ? '20px 16px' : '32px',
            textAlign: 'center',
            color: 'rgba(255,255,255,0.2)',
            fontSize: 10, letterSpacing: 1,
          }}>
            <span style={{ color: '#e8002d', fontWeight: 700 }}>F1</span>
            {' '}LIVE DASHBOARD · BUILT FOR RISHIT · DATA: JOLPI.CA + OPENF1.ORG
          </footer>
        </main>

        {/* ── Error banner ── */}
        {errors.length > 0 && (
          <div className="error-banner">⚠ Some data unavailable</div>
        )}
      </div>

      {/* ── Race Result Sheet / Modal ── */}
      {selectedRace && (
        <RaceResultSheet race={selectedRace} onClose={() => setSelectedRace(null)} />
      )}
    </>
  );
}

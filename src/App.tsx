import { useState, useEffect } from 'react';
import './index.css';
import { useF1Data } from './hooks/useF1Data';
import { useLiveBackend, type LiveSessionDebug } from './hooks/useLiveBackend';
import { useIsMobile } from './hooks/useBreakpoint';
import { isSessionLive, isValidSession } from './utils/sessionHelpers';
import { useDriverSeasonResults } from './hooks/useDriverSeasonResults';
import { useHashRoute, isLiveRoute } from './hooks/useHashRoute';
import WelcomeIntro from './components/WelcomeIntro';
import StickyNav from './components/StickyNav';
import BottomTabBar, { type TabId } from './components/BottomTabBar';
import Hero from './components/Hero';
import SeasonCalendar from './components/SeasonCalendar';
import DriversChampionship from './components/DriversChampionship';
import ConstructorsCup from './components/ConstructorsCup';
import PaddockIntel from './components/PaddockIntel';
import RaceResultSheet from './components/results/RaceResultSheet';
import DriverProfileSheet from './components/DriverProfileSheet';
import LivePage from './pages/LivePage';
import type { SelectedRace, DriverStanding } from './types';

// Reusable glass column style for the three standings panels
const glassColumnStyle: React.CSSProperties = {
  background: 'rgba(255,255,255,0.03)',
  backdropFilter: 'blur(16px)',
  WebkitBackdropFilter: 'blur(16px)',
  border: '1px solid rgba(255,255,255,0.07)',
  borderRadius: 20,
  padding: '28px 24px',
  boxShadow: '0 8px 32px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.08)',
};

export default function App() {
  // Intro plays on every page load — no storage gate
  const [introDone, setIntroDone] = useState(false);
  const [contentVisible, setContentVisible] = useState(false);
  const [activeTab, setActiveTab] = useState<TabId>('next');
  const [selectedRace, setSelectedRace] = useState<SelectedRace | null>(null);
  const [selectedDriver, setSelectedDriver] = useState<DriverStanding | null>(null);
  const isMobile = useIsMobile();

  // Routing — `#/live` swaps the whole page out for LivePage
  const { hash, navigate } = useHashRoute();
  const onLivePage = isLiveRoute(hash);

  // Fetch driver season stats here so the sheet can be rendered at root level
  // (avoids iOS Safari overflow:hidden clipping fixed-position children)
  const { stats: driverStats, loading: loadingDriverStats } = useDriverSeasonResults();

  const {
    nextRace, allRaces,
    driverStandings, constructorStandings,
    loading, errors, currentRound, totalRounds,
  } = useF1Data();

  // Live data now comes from our own Node backend (server/) which bridges
  // F1's official SignalR feed → WebSocket. Replaces the old OpenF1 polling.
  const live = useLiveBackend();
  const liveSession  = live.session;
  const livePhase    = live.phase;
  const isLive       = live.phase === 'LIVE';
  const liveChecking = live.checking;

  // Build the legacy `LiveSessionDebug` shape so NoLiveSession's diagnostic
  // panel doesn't need rewriting. Backend connection error replaces api error.
  const liveDebug: LiveSessionDebug = {
    lastCheck:       new Date(),
    lastSessionName: liveSession?.session_name ?? null,
    lastSessionType: liveSession?.session_type ?? null,
    sessionStart:    liveSession ? new Date(liveSession.date_start) : null,
    sessionEnd:      liveSession ? new Date(liveSession.date_end) : null,
    isValidType:     liveSession ? isValidSession(liveSession) : false,
    isWithinWindow:  liveSession ? isSessionLive(liveSession) : false,
    apiError:        live.error,
    apiStatus:       live.connected ? 200 : null,
  };

  useEffect(() => {
    if (introDone) {
      const id = setTimeout(() => setContentVisible(true), 80);
      return () => clearTimeout(id);
    }
  }, [introDone]);

  // Auto-show live page when race goes live
  useEffect(() => {
    if (isLive && !onLivePage) setActiveTab('live');
  }, [isLive, onLivePage]);

  // Keep activeTab in sync when route changes
  useEffect(() => {
    if (onLivePage) setActiveTab('live');
  }, [onLivePage]);

  // Scroll to anchor when returning to dashboard with a hash like "#drivers"
  useEffect(() => {
    if (onLivePage) return;
    if (!hash || hash === '#' || hash === '#/') return;
    const id = hash.replace(/^#\/?/, '');
    if (!id) return;
    const tryScroll = () => {
      const el = document.getElementById(id);
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    };
    setTimeout(tryScroll, 100);
  }, [hash, onLivePage]);

  // Handle tab taps on mobile
  const handleTab = (id: TabId) => {
    setActiveTab(id);
    if (id === 'live') {
      navigate('#/live');
      return;
    }
    // Coming back to dashboard from a possible /live page
    if (onLivePage) {
      navigate(`#${id === 'teams' ? 'constructors' : id}`);
      return;
    }
    const targets: Record<TabId, string> = {
      next: 'next', drivers: 'drivers', teams: 'constructors',
      calendar: 'calendar', live: 'live',
    };
    setTimeout(() => document.getElementById(targets[id])?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50);
  };

  // Desktop LIVE button → navigate to dedicated live page
  const handleDesktopLiveClick = () => {
    navigate('#/live');
  };

  // From LivePage: go back to dashboard
  const handleBackToDashboard = () => {
    navigate('#/');
  };

  const navH = isMobile ? 48 : 52;
  const bottomBarH = isMobile ? 64 : 0;

  return (
    <>
      {/* ── Background orb layer (glass design depends on this) ────────────
          Fixed full-viewport behind everything. Five soft coloured radial
          gradients give the frosted glass effect something to refract. */}
      <div className="bg-orb-layer" aria-hidden="true">
        <div className="bg-orb bg-orb--tl" />
        <div className="bg-orb bg-orb--tr" />
        <div className="bg-orb bg-orb--c"  />
        <div className="bg-orb bg-orb--bl" />
        <div className="bg-orb bg-orb--br" />
      </div>

      {!introDone && <WelcomeIntro onComplete={() => setIntroDone(true)} />}

      {/* ── /live route — dedicated standalone page ── */}
      {onLivePage && contentVisible && (
        <LivePage
          liveSession={liveSession}
          livePhase={livePhase}
          isLive={isLive}
          liveChecking={liveChecking}
          liveDebug={liveDebug}
          liveState={live.state}
          nextRace={nextRace}
          onBack={handleBackToDashboard}
        />
      )}

      {/* ── Main dashboard ── */}
      <div style={{
        opacity: contentVisible && !onLivePage ? 1 : 0,
        transition: 'opacity 0.5s ease',
        display: onLivePage ? 'none' : 'block',
      }}>

        {/* ── Top nav ── */}
        <StickyNav isLive={isLive} liveSession={liveSession} onLiveClick={handleDesktopLiveClick} />

        {/* ── Bottom tab bar (mobile only) ── */}
        {isMobile && (
          <BottomTabBar active={activeTab} isLive={isLive} liveSession={liveSession} onTab={handleTab} />
        )}

        <main style={{
          paddingTop: navH,
          paddingBottom: isMobile ? bottomBarH + 'px' : 0,
          overflowX: 'hidden',
        }}>

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
            <section style={{ background: 'transparent', borderTop: 'none', borderBottom: 'none' }}>
              {isMobile ? (
                /* ── Mobile: stacked glass cards, full width ── */
                <div style={{ padding: '28px 16px 32px', display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <div id="drivers" style={glassColumnStyle}>
                    <DriversChampionship standings={driverStandings} loading={loading} round={currentRound} allRaces={allRaces} onSelectDriver={setSelectedDriver} />
                  </div>
                  <div id="constructors" style={glassColumnStyle}>
                    <ConstructorsCup standings={constructorStandings} driverStandings={driverStandings} loading={loading} round={currentRound} />
                  </div>
                  <div style={glassColumnStyle}>
                    <PaddockIntel driverStandings={driverStandings} loading={loading} round={currentRound} />
                  </div>
                </div>
              ) : (
                /* ── Desktop: 3 glass columns side-by-side ── */
                <div style={{
                  maxWidth: 1200, margin: '0 auto',
                  padding: '52px 32px 60px',
                  display: 'grid',
                  gridTemplateColumns: 'repeat(3, 1fr)',
                  gap: 14,
                }}>
                  <div id="drivers" style={glassColumnStyle}>
                    <DriversChampionship standings={driverStandings} loading={loading} round={currentRound} allRaces={allRaces} onSelectDriver={setSelectedDriver} />
                  </div>
                  <div style={glassColumnStyle}>
                    <ConstructorsCup standings={constructorStandings} driverStandings={driverStandings} loading={loading} round={currentRound} />
                  </div>
                  <div id="constructors" style={glassColumnStyle}>
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
            {' '}LIVE DASHBOARD · BUILT FOR RISHIT · DATA: JOLPI.CA + LIVETIMING.FORMULA1.COM
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

      {/* ── Driver Profile Sheet ──
          Rendered here (outside <main overflowX="hidden">) so that position:fixed
          works correctly on iOS Safari — overflow:hidden on any ancestor breaks fixed. */}
      {selectedDriver && (
        <DriverProfileSheet
          standing={selectedDriver}
          stats={driverStats?.get(selectedDriver.Driver.driverId) ?? null}
          loadingStats={loadingDriverStats}
          allRaces={allRaces}
          onClose={() => setSelectedDriver(null)}
        />
      )}
    </>
  );
}

import { useEffect, useState } from 'react';
import type { Race, OpenF1Session, LivePhase, LiveRaceState } from '../types';
import type { LiveSessionDebug } from '../hooks/useLiveBackend';
import { formatIST } from '../utils';
import { useIsMobile } from '../hooks/useBreakpoint';
import LiveSection from '../components/live/LiveSection';
import {
  getSessionShortLabel, getSessionColors,
} from '../utils/sessionHelpers';

interface Props {
  liveSession: OpenF1Session | null;
  livePhase: LivePhase;
  isLive: boolean;
  liveChecking: boolean;
  liveDebug: LiveSessionDebug;
  liveState: LiveRaceState | null;
  nextRace: Race | null;
  onBack: () => void;
}

export default function LivePage({
  liveSession, livePhase, isLive, liveChecking, liveDebug, liveState, nextRace, onBack,
}: Props) {
  const isMobile = useIsMobile();
  const [clock, setClock] = useState('');
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const tick = () => setClock(formatIST(new Date()));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Restore scroll position on mount — start at top
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const navH = isMobile ? 48 : 52;
  const liveLabel = isLive ? getSessionShortLabel(liveSession) : 'LIVE';
  const liveColor = isLive ? getSessionColors(liveSession).primary : '#888';

  return (
    <div style={{ background: '#f5f5f0', minHeight: '100vh' }}>
      <style>{`
        @keyframes livePulse {
          0%, 100% { opacity: 1; }
          50%      { opacity: 0.2; }
        }
        .live-dot { animation: livePulse 1.2s ease-in-out infinite; }
        .back-btn { transition: background 0.2s, transform 0.15s; }
        .back-btn:hover { background: rgba(255,255,255,0.08); }
        .back-btn:active { transform: scale(0.94); }
      `}</style>

      {/* ── Top nav (page-specific) ───────────────────────────────────────── */}
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 500,
        height: navH,
        background: scrolled ? 'rgba(21,21,30,0.96)' : '#15151e',
        backdropFilter: scrolled ? 'blur(12px)' : 'none',
        borderBottom: '1px solid rgba(232,0,45,0.25)',
        display: 'flex', alignItems: 'center',
        padding: isMobile ? '0 12px' : '0 24px',
        transition: 'background 0.3s',
      }}>
        {/* Back button */}
        <button
          className="back-btn"
          onClick={onBack}
          aria-label="Back to dashboard"
          style={{
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.06)',
            color: '#fff',
            width: isMobile ? 36 : 40, height: isMobile ? 32 : 36,
            borderRadius: 8,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', flexShrink: 0,
            fontSize: 18, fontWeight: 600,
            WebkitTapHighlightColor: 'transparent',
          }}
        >‹</button>

        {/* F1 Logo — clickable home */}
        <a
          href="#/"
          aria-label="F1 home"
          onClick={e => { e.preventDefault(); onBack(); }}
          style={{
            display: 'flex', alignItems: 'center', flexShrink: 0,
            marginLeft: isMobile ? 10 : 16,
            textDecoration: 'none',
          }}
        >
          <img
            src="/f1-logo.png"
            alt="F1"
            style={{
              height: isMobile ? 20 : 24, width: 'auto',
              display: 'block', objectFit: 'contain',
            }}
          />
        </a>

        {/* Page title */}
        <div style={{
          flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
          gap: 8,
        }}>
          {isLive && (
            <span
              className="live-dot"
              style={{ color: liveColor, fontSize: 10, lineHeight: 1 }}
            >●</span>
          )}
          <span style={{
            fontFamily: "'Titillium Web', sans-serif",
            fontSize: isMobile ? 11 : 12,
            fontWeight: 700,
            letterSpacing: 2.5,
            color: isLive ? liveColor : '#888',
            textTransform: 'uppercase',
          }}>
            {isLive ? `${liveLabel} · LIVE` : 'LIVE TIMING'}
          </span>
        </div>

        {/* IST clock */}
        <div style={{
          fontSize: 11, fontWeight: 700,
          color: 'rgba(255,255,255,0.45)',
          letterSpacing: 1, fontVariantNumeric: 'tabular-nums',
          flexShrink: 0,
        }}>
          {clock}
        </div>
      </nav>

      {/* ── Body ──────────────────────────────────────────────────────────── */}
      <main style={{ paddingTop: navH, overflowX: 'hidden' }}>
        <LiveSection
          session={liveSession}
          phase={livePhase}
          data={liveState}
          nextRace={nextRace}
          checking={liveChecking}
          debug={liveDebug}
        />

        {/* Footer */}
        <footer style={{
          background: '#15151e',
          padding: isMobile ? '20px 16px' : '32px',
          textAlign: 'center',
          color: 'rgba(255,255,255,0.2)',
          fontSize: 10, letterSpacing: 1,
        }}>
          <span style={{ color: '#e8002d', fontWeight: 700 }}>F1</span>
          {' '}LIVE DASHBOARD · LIVE TIMING PAGE · DATA: LIVETIMING.FORMULA1.COM
        </footer>
      </main>
    </div>
  );
}

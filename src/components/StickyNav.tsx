import { useEffect, useState } from 'react';
import { formatIST } from '../utils';
import { useIsMobile } from '../hooks/useBreakpoint';
import { getSessionShortLabel, getSessionColors } from '../utils/sessionHelpers';
import type { OpenF1Session } from '../types';

interface Props {
  isLive: boolean;
  liveSession?: OpenF1Session | null;
  onLiveClick: () => void;
}

export default function StickyNav({ isLive, liveSession = null, onLiveClick }: Props) {
  const liveLabel = isLive ? getSessionShortLabel(liveSession) : 'LIVE';
  const liveColor = isLive ? getSessionColors(liveSession).primary : '#e8002d';
  const [clock, setClock] = useState('');
  const [scrolled, setScrolled] = useState(false);
  const isMobile = useIsMobile();

  useEffect(() => {
    const tick = () => setClock(formatIST(new Date()));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 60);
    window.addEventListener('scroll', handler, { passive: true });
    return () => window.removeEventListener('scroll', handler);
  }, []);

  return (
    <>
      <style>{`
        @keyframes livePulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.2; }
        }
        .live-dot { animation: livePulse 1.2s ease-in-out infinite; }
        .nav-link {
          color: rgba(255,255,255,0.7);
          text-decoration: none;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 1.8px;
          transition: color 0.2s;
        }
        .nav-link:hover { color: #e8002d; }
      `}</style>

      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0,
        zIndex: 500,
        height: isMobile ? 48 : 52,
        background: scrolled ? 'rgba(21,21,30,0.96)' : '#15151e',
        backdropFilter: scrolled ? 'blur(12px)' : 'none',
        borderBottom: '1px solid rgba(232,0,45,0.25)',
        display: 'flex', alignItems: 'center',
        padding: isMobile ? '0 16px' : '0 32px',
        transition: 'background 0.3s',
      }}>
        {/* F1 Logo (official red-on-white mark) */}
        <a
          href="#next"
          aria-label="F1 home"
          style={{
            display: 'flex', alignItems: 'center', flexShrink: 0,
            textDecoration: 'none',
          }}
        >
          <img
            src="/f1-logo.png"
            alt="F1"
            style={{
              height: isMobile ? 20 : 24,
              width: 'auto',
              display: 'block',
              objectFit: 'contain',
            }}
          />
        </a>

        {/* Desktop nav links */}
        {!isMobile && (
          <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 32 }}>
            <button
              onClick={onLiveClick}
              style={{
                background: 'none', border: 'none', padding: 0,
                fontFamily: "'Titillium Web', sans-serif",
                fontSize: 11, fontWeight: 700, letterSpacing: 1.8,
                cursor: isLive ? 'pointer' : 'default',
                color: isLive ? '#ffffff' : '#555555',
                display: 'flex', alignItems: 'center', gap: 5,
                transition: 'color 0.2s',
              }}
            >
              {isLive && <span className="live-dot" style={{ color: liveColor, fontSize: 10 }}>●</span>}
              {liveLabel}
            </button>
            {[
              { label: 'DRIVERS',      href: '#drivers' },
              { label: 'CONSTRUCTORS', href: '#constructors' },
              { label: 'TEAMS',        href: '#constructors' },
              { label: 'CALENDAR',     href: '#calendar' },
            ].map(({ label, href }) => (
              <a key={label} href={href} className="nav-link">{label}</a>
            ))}
          </div>
        )}

        {/* Mobile: spacer to push clock right */}
        {isMobile && <div style={{ flex: 1 }} />}

        {/* IST Clock */}
        <div style={{
          fontSize: isMobile ? 11 : 11,
          fontWeight: 700, color: 'rgba(255,255,255,0.45)',
          letterSpacing: 1, fontVariantNumeric: 'tabular-nums',
          flexShrink: 0,
        }}>
          {clock}
        </div>
      </nav>
    </>
  );
}

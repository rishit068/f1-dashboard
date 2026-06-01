import { useEffect, useState } from 'react';
import { useIsMobile } from '../hooks/useBreakpoint';

interface Props {
  onComplete: () => void;
}

// ── Letter palette ──────────────────────────────────────────────────────────
// Match the dashboard's red-on-near-black palette exactly:
//   white  → #ffffff
//   red    → #e8002d (F1 brand red)
// Alternating white / red / white / red / white / red.
const RED       = '#e8002d';
const RED_GLOW  = '0 0 20px rgba(232,0,45,0.8), 0 0 40px rgba(232,0,45,0.4), 0 0 80px rgba(232,0,45,0.15)';

const LETTERS = [
  { ch: 'R', color: '#ffffff', glow: '' },
  { ch: 'I', color: RED,       glow: RED_GLOW },
  { ch: 'S', color: '#ffffff', glow: '' },
  { ch: 'H', color: RED,       glow: RED_GLOW },
  { ch: 'I', color: '#ffffff', glow: '' },
  { ch: 'T', color: RED,       glow: RED_GLOW },
] as const;

const LINE4_TEXT = 'TELEMETRY ONLINE';

export default function WelcomeIntro({ onComplete }: Props) {
  const isMobile = useIsMobile();

  const [lights, setLights] = useState<[number, number, number, number, number]>([0, 0, 0, 0, 0]);
  const [showFlash,  setShowFlash]  = useState(false);
  const [showLine1,  setShowLine1]  = useState(false);
  const [showName,   setShowName]   = useState(false);
  const [showLine3,  setShowLine3]  = useState(false);
  const [showLine4,  setShowLine4]  = useState(false);
  const [typedLine4, setTypedLine4] = useState('');
  const [exiting,    setExiting]    = useState(false);

  // ─── Master schedule ──────────────────────────────────────────────────────
  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];
    const at = (ms: number, fn: () => void) => timers.push(setTimeout(fn, ms));
    const turnOn = (i: number) =>
      setLights(prev => {
        const next = [...prev] as typeof prev;
        next[i] = 1;
        return next;
      });

    // Lights on
    at( 700, () => turnOn(0));
    at( 900, () => turnOn(1));
    at(1100, () => turnOn(2));
    at(1300, () => turnOn(3));
    at(1500, () => turnOn(4));

    // Lights snap off + white flash
    at(2000, () => setLights([0, 0, 0, 0, 0]));
    at(2000, () => setShowFlash(true));
    at(2100, () => setShowFlash(false));

    // Phase 4 — line 1
    at(2300, () => setShowLine1(true));

    // Phase 5 — name (per-letter staggered via CSS animation-delay)
    at(2800, () => setShowName(true));

    // Phase 6 — line 3
    at(3600, () => setShowLine3(true));

    // Phase 7 — line 4 fade-in + typewriter (38 ms/char)
    at(4100, () => setShowLine4(true));
    at(4400, () => {
      let i = 0;
      const id = setInterval(() => {
        i += 1;
        setTypedLine4(LINE4_TEXT.slice(0, i));
        if (i >= LINE4_TEXT.length) clearInterval(id);
      }, 38);
      setTimeout(() => clearInterval(id), 1500);
    });

    // Phase 8 — overlay exit
    at(4800, () => setExiting(true));
    at(5350, () => onComplete());

    return () => timers.forEach(clearTimeout);
  }, [onComplete]);

  const sideLineW = isMobile ? 44 : 70;

  return (
    <>
      <style>{`
        @keyframes welcomeFlash {
          0%   { opacity: 0; }
          50%  { opacity: 0.18; }
          100% { opacity: 0; }
        }
        @keyframes welcomeTextShimmer {
          0%   { background-position: 200% center; }
          100% { background-position: -200% center; }
        }
        @keyframes welcomeLetterDrop {
          from { opacity: 0; transform: translateY(-24px) scale(0.7); filter: blur(6px); }
          to   { opacity: 1; transform: translateY(0) scale(1);       filter: blur(0); }
        }
        @keyframes welcomeLetterExit {
          from { opacity: 1; transform: translateY(0); }
          to   { opacity: 0; transform: translateY(-8px); }
        }
        @keyframes welcomeFadeUp {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes welcomeLightOn {
          0%   { transform: scale(0.7); }
          60%  { transform: scale(1.05); }
          100% { transform: scale(1); }
        }
        @keyframes welcomeRedPulse {
          0%, 100% {
            opacity: 1; transform: scale(1);
            box-shadow: 0 0 6px rgba(232,0,45,0.9), 0 0 12px rgba(232,0,45,0.5);
          }
          50% {
            opacity: 0.4; transform: scale(1.6);
            box-shadow: 0 0 3px rgba(232,0,45,0.5), 0 0 6px rgba(232,0,45,0.25);
          }
        }
        @keyframes welcomeSpeedLine {
          0%   { opacity: 0; transform: rotate(-18deg) translateY(-20px); }
          20%  { opacity: 1; }
          80%  { opacity: 1; }
          100% { opacity: 0; transform: rotate(-18deg) translateY(40px); }
        }
        @keyframes welcomeOverlayExit {
          from { opacity: 1; transform: scale(1); }
          to   { opacity: 0; transform: scale(1.04); }
        }
        .welcome-overlay.exiting {
          animation: welcomeOverlayExit 0.55s cubic-bezier(0.4, 0, 1, 1) forwards;
          pointer-events: none;
        }
      `}</style>

      <div
        className={`welcome-overlay${exiting ? ' exiting' : ''}`}
        style={{
          position: 'fixed', inset: 0, zIndex: 9999,
          background: 'rgba(4,6,13,0.92)',
          backdropFilter: 'blur(4px)',
          WebkitBackdropFilter: 'blur(4px)',
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          overflow: 'hidden', userSelect: 'none',
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg width='4' height='4' viewBox='0 0 4 4' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 3h1v1H1V3zm2-2h1v1H3V1z' fill='rgba(255,255,255,0.022)'/%3E%3C/svg%3E\")",
        } as React.CSSProperties}
      >
        {/* Vignette */}
        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          background: 'radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.6) 100%)',
        }} />
        {/* Top edge fade */}
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: 80,
          background: 'linear-gradient(to bottom, rgba(0,0,0,0.4), transparent)',
          pointerEvents: 'none',
        }} />
        {/* Bottom edge fade */}
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0, height: 80,
          background: 'linear-gradient(to top, rgba(0,0,0,0.4), transparent)',
          pointerEvents: 'none',
        }} />

        {/* Speed lines — red on dark, desktop only */}
        {!isMobile && (
          <>
            {[
              { right: '8%',  top: '20%', height: 80,  delay: 0   },
              { right: '12%', top: '45%', height: 120, delay: 0.4 },
              { right: '6%',  top: '65%', height: 100, delay: 0.8 },
              { right: '16%', top: '30%', height: 140, delay: 1.2 },
              { right: '10%', top: '55%', height: 90,  delay: 1.6 },
            ].map((l, i) => (
              <div key={i} style={{
                position: 'absolute',
                right: l.right, top: l.top,
                width: 1, height: l.height,
                background: 'linear-gradient(to bottom, transparent, rgba(232,0,45,0.18), transparent)',
                transform: 'rotate(-18deg)',
                animation: `welcomeSpeedLine 2.5s linear infinite`,
                animationDelay: `${l.delay}s`,
                pointerEvents: 'none',
              }} />
            ))}
          </>
        )}

        {/* Race lights */}
        <div style={{
          position: 'relative', zIndex: 2,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          gap: 12, marginBottom: 44,
        }}>
          {[0, 1, 2, 3, 4].map(i => {
            const on = lights[i] === 1;
            return (
              <div
                key={i}
                style={{
                  width: 26, height: 26, borderRadius: '50%',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  // Frosted glass outer ring — both off and on states
                  background: on ? 'rgba(255,24,1,0.12)' : 'rgba(255,255,255,0.03)',
                  backdropFilter: 'blur(8px)',
                  WebkitBackdropFilter: 'blur(8px)',
                  border: on ? '1px solid rgba(255,24,1,0.40)' : '1px solid rgba(255,255,255,0.08)',
                  transition: on ? 'none' : 'background 0.06s, border-color 0.06s',
                } as React.CSSProperties}
              >
                <div style={{
                  width: 16, height: 16, borderRadius: '50%',
                  background: on
                    ? 'radial-gradient(circle at 35% 32%, #ff7080 0%, #e8002d 45%, #8b0019 100%)'
                    : '#1a1a2e',
                  boxShadow: on
                    ? '0 0 8px rgba(232,0,45,0.9), 0 0 16px rgba(232,0,45,0.6), 0 0 32px rgba(232,0,45,0.3), inset 0 1px 1px rgba(255,255,255,0.3)'
                    : 'none',
                  animation: on ? 'welcomeLightOn 0.1s ease-in forwards' : 'none',
                  transition: on ? 'none' : 'background 0.06s, box-shadow 0.06s',
                }} />
              </div>
            );
          })}
        </div>

        {/* White flash */}
        {showFlash && (
          <div style={{
            position: 'absolute', inset: 0, zIndex: 5,
            background: '#ffffff', pointerEvents: 'none',
            animation: 'welcomeFlash 0.1s ease-out forwards',
          }} />
        )}

        {/* Line 1 — red shimmer text + red side lines */}
        <div style={{
          position: 'relative', zIndex: 2,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          gap: 14, marginBottom: 18,
          opacity: showLine1 ? 1 : 0,
          transform: showLine1 ? 'translateY(0)' : 'translateY(6px)',
          transition: 'opacity 0.5s ease, transform 0.5s ease',
        }}>
          <span style={{
            display: 'inline-block', height: 1,
            width: showLine1 ? sideLineW : 0,
            background: 'linear-gradient(90deg, transparent 0%, rgba(232,0,45,0.7) 50%, rgba(232,0,45,0.1) 100%)',
            transition: 'width 0.6s ease',
          }} />
          <span style={{
            fontFamily: "'JetBrains Mono', 'SF Mono', Menlo, monospace",
            fontSize: isMobile ? 9 : 10,
            fontWeight: 500,
            letterSpacing: isMobile ? '3px' : '5px',
            textTransform: 'uppercase',
            whiteSpace: 'nowrap',
          }}>
            <span style={{
              backgroundImage: 'linear-gradient(90deg, #e8002d 0%, #ff6080 50%, #e8002d 100%)',
              backgroundSize: '200% auto',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              color: 'transparent',
              WebkitTextFillColor: 'transparent',
              animation: 'welcomeTextShimmer 3s linear infinite',
            }}>
              PIT WALL ACTIVE
            </span>
            <span style={{
              color: 'rgba(232,0,45,0.45)',
              margin: '0 12px',
              fontWeight: 300,
            }}>·</span>
            <span style={{
              backgroundImage: 'linear-gradient(90deg, #e8002d 0%, #ff6080 50%, #e8002d 100%)',
              backgroundSize: '200% auto',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              color: 'transparent',
              WebkitTextFillColor: 'transparent',
              animation: 'welcomeTextShimmer 3s linear infinite',
            }}>
              DRIVER CONFIRMED
            </span>
          </span>
          <span style={{
            display: 'inline-block', height: 1,
            width: showLine1 ? sideLineW : 0,
            background: 'linear-gradient(90deg, rgba(232,0,45,0.1) 0%, rgba(232,0,45,0.7) 50%, transparent 100%)',
            transition: 'width 0.6s ease',
          }} />
        </div>

        {/* RISHIT name — alternating white / red */}
        <div style={{
          position: 'relative', zIndex: 2,
          marginBottom: 22,
          display: 'flex', justifyContent: 'center', alignItems: 'center',
        }}>
          {/* Ambient red glow behind the name */}
          {showName && (
            <div style={{
              position: 'absolute',
              width: 700, height: 200,
              left: '50%', top: '50%',
              transform: 'translate(-50%, -50%)',
              background: 'radial-gradient(ellipse at center, rgba(232,0,45,0.10) 0%, rgba(232,0,45,0.04) 60%, transparent 100%)',
              filter: 'blur(20px)',
              pointerEvents: 'none',
              zIndex: -1,
            }} />
          )}

          <div style={{
            position: 'relative',
            display: 'flex', justifyContent: 'center',
            fontFamily: "'Orbitron', 'Titillium Web', sans-serif",
            fontSize: isMobile ? 'clamp(56px, 18vw, 90px)' : 'clamp(70px, 15vw, 128px)',
            fontWeight: 900,
            letterSpacing: isMobile ? '0.08em' : '0.15em',
            lineHeight: 1,
            textTransform: 'uppercase',
          }}>
            {LETTERS.map((L, i) => (
              <span
                key={i}
                style={{
                  display: 'inline-block',
                  color: L.color,
                  textShadow: showName ? L.glow || 'none' : 'none',
                  opacity: showName && !exiting ? undefined : (exiting ? undefined : 0),
                  animation: exiting
                    ? `welcomeLetterExit 0.3s ease-in forwards`
                    : (showName ? `welcomeLetterDrop 0.45s cubic-bezier(0.16, 1, 0.3, 1) forwards` : 'none'),
                  animationDelay: exiting ? `${i * 0.04}s` : (showName ? `${i * 0.10}s` : '0s'),
                  ...(showName || exiting ? {} : {
                    transform: 'translateY(-24px) scale(0.7)',
                    filter: 'blur(6px)',
                  }),
                }}
              >
                {L.ch}
              </span>
            ))}
          </div>
        </div>

        {/* Line 3 — neutral light-on-dark, no chromatic accents */}
        <div style={{
          position: 'relative', zIndex: 2,
          textAlign: 'center', marginBottom: 16,
          opacity: showLine3 ? 1 : 0,
          transform: showLine3 ? 'translateY(0)' : 'translateY(8px)',
          transition: 'opacity 0.5s ease, transform 0.5s ease',
          display: 'flex', flexDirection: isMobile ? 'column' : 'row',
          alignItems: 'center', justifyContent: 'center',
          gap: isMobile ? 4 : 0,
        }}>
          <span style={{
            fontFamily: "'Titillium Web', sans-serif",
            fontSize: isMobile ? 9 : 11, fontWeight: 700,
            letterSpacing: isMobile ? 2.5 : 4,
            textTransform: 'uppercase',
            color: 'rgba(255,255,255,0.55)',
            whiteSpace: 'nowrap',
          }}>
            2026 FORMULA 1 SEASON
          </span>
          {!isMobile && (
            <span style={{
              fontFamily: "'Titillium Web', sans-serif",
              color: 'rgba(255,255,255,0.2)',
              margin: '0 10px',
              fontWeight: 300, fontSize: 14,
              verticalAlign: 'middle',
            }}>·</span>
          )}
          <span style={{
            fontFamily: "'Titillium Web', sans-serif",
            fontSize: isMobile ? 9 : 11, fontWeight: 700,
            letterSpacing: isMobile ? 2.5 : 4,
            textTransform: 'uppercase',
            color: 'rgba(255,255,255,0.55)',
            whiteSpace: 'nowrap',
          }}>
            ALL SYSTEMS GO
          </span>
        </div>

        {/* Line 4 — red telemetry dot + red typewriter text */}
        <div style={{
          position: 'relative', zIndex: 2,
          textAlign: 'center',
          opacity: showLine4 ? 1 : 0,
          transition: 'opacity 0.3s ease',
          minHeight: '1.2em',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          gap: 0,
        }}>
          <span style={{
            display: 'inline-block',
            width: 7, height: 7, borderRadius: '50%',
            background: RED,
            marginRight: 10,
            verticalAlign: 'middle',
            animation: 'welcomeRedPulse 1.1s ease-in-out infinite',
          }} />
          <span style={{
            fontFamily: "'JetBrains Mono', 'SF Mono', Menlo, monospace",
            fontSize: isMobile ? 10 : 11,
            fontWeight: 400,
            letterSpacing: 3,
            textTransform: 'uppercase',
            color: RED,
            verticalAlign: 'middle',
            whiteSpace: 'nowrap',
          }}>
            {typedLine4}
          </span>
        </div>
      </div>
    </>
  );
}

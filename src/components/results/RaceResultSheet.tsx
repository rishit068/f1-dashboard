import { useEffect, useRef, useState } from 'react';
import type { SelectedRace } from '../../types';
import { useRaceResult } from '../../hooks/useRaceResult';
import { useIsMobile } from '../../hooks/useBreakpoint';
import { COUNTRY_FLAGS } from '../../utils';
import PodiumCard from './PodiumCard';
import ResultRow from './ResultRow';
import ResultSkeleton from './ResultSkeleton';

interface Props {
  race: SelectedRace;
  onClose: () => void;
}

// ── Swipe-to-close hook ────────────────────────────────────────────────────────
function useSwipeClose(onClose: () => void, enabled: boolean) {
  const ref = useRef<HTMLDivElement>(null);
  const startY = useRef(0);
  const currentY = useRef(0);
  const [dragOffset, setDragOffset] = useState(0);

  useEffect(() => {
    if (!enabled || !ref.current) return;
    const el = ref.current;

    const onTouchStart = (e: TouchEvent) => {
      startY.current = e.touches[0].clientY;
      currentY.current = 0;
    };
    const onTouchMove = (e: TouchEvent) => {
      const dy = e.touches[0].clientY - startY.current;
      if (dy < 0) return; // don't allow drag up
      currentY.current = dy;
      setDragOffset(dy);
    };
    const onTouchEnd = () => {
      if (currentY.current > 80) {
        onClose();
      } else {
        setDragOffset(0);
      }
      currentY.current = 0;
    };

    el.addEventListener('touchstart', onTouchStart, { passive: true });
    el.addEventListener('touchmove', onTouchMove, { passive: true });
    el.addEventListener('touchend', onTouchEnd, { passive: true });
    return () => {
      el.removeEventListener('touchstart', onTouchStart);
      el.removeEventListener('touchmove', onTouchMove);
      el.removeEventListener('touchend', onTouchEnd);
    };
  }, [enabled, onClose]);

  return { ref, dragOffset };
}

// ── Share helper ───────────────────────────────────────────────────────────────
function handleShare(raceName: string) {
  if (navigator.share) {
    navigator.share({ title: `F1 Race Result: ${raceName}`, url: window.location.href }).catch(() => {});
  } else {
    navigator.clipboard?.writeText(window.location.href).catch(() => {});
  }
}

// ── Fastest lap footer note ────────────────────────────────────────────────────
function FlNote({ driver, time, pos }: { driver: string; time: string; pos: number }) {
  if (!driver || pos > 10) return null;
  return (
    <div style={{ padding: '10px 16px 4px', fontSize: 11, color: 'rgba(255,255,255,0.55)' }}>
      <span style={{ color: '#d783ff', marginRight: 4 }}>⬟</span>
      Fastest Lap bonus point awarded to{' '}
      <strong style={{ color: '#ffffff' }}>{driver}</strong>
      {time ? ` (${time})` : ''} (P{pos})
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────
export default function RaceResultSheet({ race, onClose }: Props) {
  const isMobile = useIsMobile();
  const { data, loading, error, fetch, retry } = useRaceResult();
  const [closing, setClosing] = useState(false);
  const { ref: sheetRef, dragOffset } = useSwipeClose(handleClose, isMobile);

  useEffect(() => {
    fetch(race.season, race.round);
  }, [race.season, race.round, fetch]);

  // Lock body scroll when open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') handleClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  function handleClose() {
    setClosing(true);
    setTimeout(onClose, 340);
  }

  const flag = COUNTRY_FLAGS[race.country] ?? '🏁';
  const flDriver = data?.results.find(r => r.fastestLap);
  const flPos = typeof flDriver?.position === 'number' ? flDriver.position : 99;

  // ── Animations ─────────────────────────────────────────────────────────────
  const sheetAnim = isMobile
    ? (closing ? 'slideSheetDown 0.34s cubic-bezier(0.32,0.72,0,1) forwards'
                : 'slideSheetUp 0.35s cubic-bezier(0.32,0.72,0,1) forwards')
    : (closing ? 'fadeScaleOut 0.25s ease forwards'
                : 'fadeScaleIn 0.25s ease forwards');

  const backdropAnim = closing ? 'fadeBackdropOut 0.3s ease forwards' : 'fadeBackdropIn 0.3s ease forwards';

  return (
    <>
      <style>{`
        @keyframes slideSheetUp   { from { transform: translateY(100%) } to { transform: translateY(0) } }
        @keyframes slideSheetDown { from { transform: translateY(0) }    to { transform: translateY(100%) } }
        @keyframes fadeScaleIn    { from { opacity:0; transform:translate(-50%,-50%) scale(0.94) } to { opacity:1; transform:translate(-50%,-50%) scale(1) } }
        @keyframes fadeScaleOut   { from { opacity:1; transform:translate(-50%,-50%) scale(1) }   to { opacity:0; transform:translate(-50%,-50%) scale(0.94) } }
        @keyframes fadeBackdropIn { from { opacity:0 } to { opacity:1 } }
        @keyframes fadeBackdropOut{ from { opacity:1 } to { opacity:0 } }
      `}</style>

      {/* ── Backdrop — blurred dim ── */}
      <div
        onClick={handleClose}
        style={{
          position: 'fixed', inset: 0,
          background: 'rgba(0,0,0,0.65)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          zIndex: 1999,
          animation: backdropAnim,
        } as React.CSSProperties}
      />

      {/* ── Sheet / Modal — heavy glass ── */}
      <div
        ref={sheetRef}
        style={isMobile ? {
          position: 'fixed', bottom: 0, left: 0, right: 0,
          height: '92vh',
          background: 'rgba(8,12,24,0.85)',
          backdropFilter: 'blur(32px) saturate(200%)',
          WebkitBackdropFilter: 'blur(32px) saturate(200%)',
          borderRadius: '22px 22px 0 0',
          borderTop: '1px solid rgba(255,255,255,0.10)',
          boxShadow: '0 -8px 48px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.10)',
          zIndex: 2000,
          display: 'flex', flexDirection: 'column',
          animation: sheetAnim,
          transform: dragOffset > 0 ? `translateY(${dragOffset}px)` : undefined,
          transition: dragOffset > 0 ? 'none' : 'transform 0.2s ease',
          overflow: 'hidden',
        } as React.CSSProperties : {
          position: 'fixed',
          top: '50%', left: '50%',
          transform: 'translate(-50%,-50%)',
          width: 'min(680px, 90vw)',
          maxHeight: '85vh',
          background: 'rgba(8,12,24,0.85)',
          backdropFilter: 'blur(32px) saturate(200%)',
          WebkitBackdropFilter: 'blur(32px) saturate(200%)',
          border: '1px solid rgba(255,255,255,0.10)',
          borderRadius: 16,
          zIndex: 2000,
          display: 'flex', flexDirection: 'column',
          animation: sheetAnim,
          boxShadow: '0 20px 60px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.10)',
          overflow: 'hidden',
        } as React.CSSProperties}
      >
        {/* ── Drag handle (mobile only) ── */}
        {isMobile && (
          <div style={{ padding: '12px 0 4px', display: 'flex', justifyContent: 'center', flexShrink: 0 }}>
            <div style={{ width: 36, height: 4, background: '#ddd', borderRadius: 2 }} />
          </div>
        )}

        {/* ── Dark Header ── */}
        <div style={{ background: '#15151e', flexShrink: 0 }}>
          {/* Top row: badge + close */}
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', padding: '14px 16px 8px' }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                <div style={{
                  background: 'rgba(232,0,45,0.18)', border: '1px solid rgba(232,0,45,0.35)',
                  borderRadius: 20, padding: '3px 12px',
                  display: 'flex', alignItems: 'center', gap: 5,
                }}>
                  <span style={{ fontSize: 9, fontWeight: 800, letterSpacing: 2, color: '#e8002d' }}>
                    ROUND {race.round} · {race.season}
                  </span>
                </div>
                <div style={{ fontSize: 14 }}>{flag}</div>
              </div>
              <div style={{
                color: '#fff', fontSize: 18, fontWeight: 800, lineHeight: 1.2,
                whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
              }}>
                {race.raceName}
              </div>
              <div style={{ color: '#666', fontSize: 11, marginTop: 3 }}>
                {race.circuitName} · {race.locality}, {race.country}
              </div>
            </div>

            {/* Controls */}
            <div style={{ display: 'flex', gap: 4, flexShrink: 0, marginLeft: 8 }}>
              <button
                onClick={() => handleShare(race.raceName)}
                style={{
                  width: 44, height: 44, border: 'none', borderRadius: 8,
                  background: 'rgba(255,255,255,0.07)', color: '#888',
                  fontSize: 16, cursor: 'pointer', display: 'flex',
                  alignItems: 'center', justifyContent: 'center',
                  WebkitTapHighlightColor: 'transparent',
                }}
                title="Share"
              >
                ↗
              </button>
              <button
                onClick={handleClose}
                style={{
                  width: 44, height: 44, border: 'none', borderRadius: 8,
                  background: 'rgba(255,255,255,0.07)', color: '#fff',
                  fontSize: 22, cursor: 'pointer', display: 'flex',
                  alignItems: 'center', justifyContent: 'center',
                  lineHeight: 1, WebkitTapHighlightColor: 'transparent',
                }}
                title="Close"
              >
                ×
              </button>
            </div>
          </div>

          {/* Stats strip */}
          <div style={{
            display: 'flex',
            borderTop: '1px solid rgba(255,255,255,0.06)',
            marginTop: 6,
          }}>
            {[
              { label: 'WINNER',       value: data ? `${data.results[0]?.familyName ?? '–'}` : '–' },
              { label: 'FASTEST LAP',  value: data?.fastestLapTime || '–' },
              { label: 'LAPS',         value: data ? `${data.totalLaps}/${data.totalLaps}` : '–' },
            ].map(({ label, value }, i) => (
              <div key={label} style={{
                flex: 1, textAlign: 'center', padding: '10px 6px',
                borderLeft: i > 0 ? '1px solid rgba(255,255,255,0.06)' : 'none',
              }}>
                <div style={{ fontSize: 8, fontWeight: 700, letterSpacing: 1.5, color: '#555', marginBottom: 4, textTransform: 'uppercase' }}>
                  {label}
                </div>
                <div style={{ fontSize: 13, fontWeight: 800, color: '#fff', fontVariantNumeric: 'tabular-nums' }}>
                  {value}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Scrollable body ── */}
        <div style={{ flex: 1, overflowY: 'auto', background: 'transparent', WebkitOverflowScrolling: 'touch' }}>
          {loading && (
            <div>
              <div style={{ padding: '16px 16px 8px' }}>
                <div className="skeleton-light" style={{ height: 100, borderRadius: 12 }} />
              </div>
              <div style={{ background: 'transparent', marginTop: 8 }}>
                <ResultSkeleton />
              </div>
            </div>
          )}

          {error && (
            <div style={{ padding: 40, textAlign: 'center' }}>
              <div style={{ fontSize: 32, marginBottom: 12 }}>🏁</div>
              <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.6)', marginBottom: 16, lineHeight: 1.6 }}>{error}</div>
              <button
                onClick={retry}
                style={{
                  background: '#e8002d', color: '#fff', border: 'none',
                  borderRadius: 6, padding: '10px 24px',
                  fontSize: 13, fontWeight: 700, cursor: 'pointer',
                  letterSpacing: 0.5,
                }}
              >
                Retry
              </button>
            </div>
          )}

          {data && (
            <>
              {/* Podium */}
              <div style={{ padding: '12px 16px 0' }}>
                <PodiumCard results={data.results} />
              </div>

              {/* Results table heading */}
              <div style={{ padding: '14px 16px 8px', display: 'flex', alignItems: 'baseline', gap: 8 }}>
                <span style={{ fontSize: 16, fontWeight: 700, color: '#ffffff' }}>Race</span>
                <span style={{ fontSize: 16, fontFamily: 'Georgia, serif', fontStyle: 'italic', color: '#e8002d' }}>Results</span>
                <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', letterSpacing: 1, marginLeft: 4 }}>
                  {data.date ? new Date(data.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : ''}
                </span>
              </div>

              {/* Rows — each row gets glass treatment via ResultRow */}
              <div style={{ background: 'transparent', padding: '0 16px', display: 'flex', flexDirection: 'column', gap: 6 }}>
                {data.results.map((r, i) => (
                  <ResultRow key={`${r.driverNumber}-${i}`} result={r} index={i} />
                ))}
              </div>

              {/* Fastest lap footer */}
              {flDriver && (
                <FlNote
                  driver={data.fastestLapDriver}
                  time={data.fastestLapTime}
                  pos={flPos}
                />
              )}

              {/* Bottom spacer for mobile */}
              <div style={{ height: 32 }} />
            </>
          )}
        </div>
      </div>
    </>
  );
}

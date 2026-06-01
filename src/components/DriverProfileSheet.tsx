import { useEffect, useRef, useState } from 'react';
import type { DriverStanding, DriverSeasonStats, DriverRaceResult, Race } from '../types';
import { getTeamColor, NAT_FLAGS, COUNTRY_FLAGS, COUNTRY_CODES } from '../utils';
import { useIsMobile } from '../hooks/useBreakpoint';

interface Props {
  standing: DriverStanding;
  stats: DriverSeasonStats | null;
  loadingStats: boolean;
  allRaces: Race[];
  onClose: () => void;
}

// ── Swipe-to-close ────────────────────────────────────────────────────────────
function useSwipeClose(onClose: () => void, enabled: boolean) {
  const ref = useRef<HTMLDivElement>(null);
  const startY = useRef(0);
  const currentY = useRef(0);
  const [dragOffset, setDragOffset] = useState(0);

  useEffect(() => {
    if (!enabled || !ref.current) return;
    const el = ref.current;
    const onTouchStart = (e: TouchEvent) => { startY.current = e.touches[0].clientY; currentY.current = 0; };
    const onTouchMove = (e: TouchEvent) => {
      const dy = e.touches[0].clientY - startY.current;
      if (dy < 0) return;
      currentY.current = dy;
      setDragOffset(dy);
    };
    const onTouchEnd = () => {
      if (currentY.current > 80) onClose();
      else setDragOffset(0);
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

// ── Helpers ───────────────────────────────────────────────────────────────────
const POS_MEDAL: Record<number, string> = { 1: '🏆', 2: '🥈', 3: '🥉' };
const POS_COLOR: Record<number, string> = { 1: '#FFD700', 2: '#C0C0C0', 3: '#CD7F32' };

function posColor(pos: number | null): string {
  if (pos === null) return '#e8002d';
  return POS_COLOR[pos] ?? (pos <= 10 ? '#15151e' : '#aaa');
}

function bubbleBg(pos: number | null, teamColor: string): string {
  if (pos === null) return '#e8002d';
  if (pos === 1) return '#FFD700';
  if (pos === 2) return '#C0C0C0';
  if (pos === 3) return '#CD7F32';
  if (pos <= 10) return teamColor;
  return '#d0d0d0';
}

function bubbleText(pos: number | null): string {
  if (pos === null) return 'DNF';
  return `P${pos}`;
}

function countryShort(country: string, locality: string): string {
  return COUNTRY_CODES[country] ?? locality.slice(0, 3).toUpperCase();
}

function fmtDate(d: string): string {
  return new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

// ── Skeleton ──────────────────────────────────────────────────────────────────
function CardSkeleton() {
  return (
    <div style={{
      margin: '0 16px 10px', borderRadius: 12, overflow: 'hidden',
      background: 'rgba(255,255,255,0.04)',
      backdropFilter: 'blur(10px)',
      WebkitBackdropFilter: 'blur(10px)',
      border: '1px solid rgba(255,255,255,0.08)',
    } as React.CSSProperties}>
      <div style={{ background: 'rgba(0,0,0,0.25)', padding: '10px 14px', height: 52 }} />
      <div style={{ background: 'transparent', padding: '14px', display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div style={{ height: 18, width: 80, borderRadius: 4, background: 'linear-gradient(90deg,#f0f0f0 25%,#e0e0e0 50%,#f0f0f0 75%)', backgroundSize: '200% 100%', animation: 'driverShimmer 1.3s infinite' }} />
        <div style={{ height: 12, width: 160, borderRadius: 4, background: 'linear-gradient(90deg,#f0f0f0 25%,#e0e0e0 50%,#f0f0f0 75%)', backgroundSize: '200% 100%', animation: 'driverShimmer 1.3s infinite' }} />
      </div>
    </div>
  );
}

// ── Race card ─────────────────────────────────────────────────────────────────
function RaceCard({ result }: { result: DriverRaceResult }) {
  const pos = result.position;
  const isDNF = pos === null;
  const isWin = pos === 1;
  const medal = pos !== null ? POS_MEDAL[pos] : '';
  const gridDiff = pos !== null && result.grid > 0 ? result.grid - pos : 0;
  const flag = COUNTRY_FLAGS[result.country] ?? '🏁';
  const label = isDNF
    ? (result.positionText === 'D' ? 'DSQ' : result.positionText === 'W' ? 'DNS' : 'DNF')
    : `P${pos}`;

  return (
    <div style={{
      margin: '0 16px 10px',
      borderRadius: 12, overflow: 'hidden',
      background: isWin ? 'rgba(255,215,0,0.04)' : 'rgba(255,255,255,0.04)',
      backdropFilter: 'blur(10px)',
      WebkitBackdropFilter: 'blur(10px)',
      border: isWin ? '1px solid rgba(255,215,0,0.20)' : isDNF ? '1px solid rgba(232,0,45,0.20)' : '1px solid rgba(255,255,255,0.08)',
      borderLeft: isWin ? '3px solid rgba(255,215,0,0.4)' : isDNF ? '3px solid rgba(232,0,45,0.35)' : '1px solid rgba(255,255,255,0.08)',
      boxShadow: isWin ? '0 4px 16px rgba(255,215,0,0.10)' : '0 2px 8px rgba(0,0,0,0.15)',
    } as React.CSSProperties}>
      {/* Race header strip */}
      <div style={{
        background: 'rgba(0,0,0,0.25)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        padding: '10px 14px',
      } as React.CSSProperties}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{
            background: 'rgba(255,24,1,0.20)',
            border: '1px solid rgba(255,24,1,0.35)',
            color: '#e8002d', fontSize: 9, fontWeight: 800,
            padding: '2px 6px', borderRadius: 3, letterSpacing: 0.5, flexShrink: 0,
          }}>
            R{String(result.round).padStart(2, '0')}
          </div>
          <span style={{ fontSize: 13, fontWeight: 700, color: '#fff', flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {result.raceName.replace(' Grand Prix', ' GP')}
          </span>
          <span style={{ fontSize: 14, flexShrink: 0 }}>{flag}</span>
        </div>
        <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.55)', marginTop: 4 }}>
          {result.locality} · {fmtDate(result.date)}
        </div>
      </div>

      {/* Result body */}
      <div style={{
        background: 'transparent', padding: '12px 14px',
        borderBottom: result.fastestLap ? '2px solid rgba(151,83,255,0.4)' : undefined,
      }}>
        {/* Position + points */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            {medal && <span style={{ fontSize: 18 }}>{medal}</span>}
            <span style={{ fontSize: isDNF ? 14 : 20, fontWeight: 900, color: posColor(pos) }}>
              {label}
            </span>
            {isWin && (
              <span style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,215,0,0.75)', letterSpacing: 0.5 }}>
                WINNER
              </span>
            )}
          </div>
          <span style={{ fontSize: 15, fontWeight: 800, color: result.points > 0 ? '#ffffff' : 'rgba(255,255,255,0.35)', fontVariantNumeric: 'tabular-nums' }}>
            +{result.points}
            <span style={{ fontSize: 9, marginLeft: 2, color: result.points > 0 ? 'rgba(255,255,255,0.45)' : 'inherit' }}>PTS</span>
          </span>
        </div>

        {/* Details row */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '3px 14px', fontSize: 11, color: 'rgba(255,255,255,0.55)' }}>
          {result.grid > 0 && (
            <span>
              P{result.grid} start
              {pos !== null && gridDiff > 0 && <span style={{ marginLeft: 3, color: '#27B34A', fontWeight: 700 }}>▲{gridDiff}</span>}
              {pos !== null && gridDiff < 0 && <span style={{ marginLeft: 3, color: '#e8002d', fontWeight: 700 }}>▼{Math.abs(gridDiff)}</span>}
              {pos !== null && gridDiff === 0 && <span style={{ marginLeft: 3, color: 'rgba(255,255,255,0.35)' }}>↔</span>}
            </span>
          )}
          {result.gap && (
            <span style={{ fontFamily: 'monospace', color: 'rgba(255,255,255,0.45)' }}>{result.gap}</span>
          )}
          {result.fastestLap && (
            <span style={{ color: '#9b59b6' }}>⬟ {result.fastestLapTime}</span>
          )}
        </div>

        {isDNF && (
          <div style={{ marginTop: 8, padding: '4px 8px', background: 'rgba(232,0,45,0.06)', borderRadius: 4, fontSize: 10, color: '#e8002d', fontWeight: 700 }}>
            {label} — {result.status}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Upcoming race row ─────────────────────────────────────────────────────────
function UpcomingCard({ race }: { race: Race }) {
  const flag = COUNTRY_FLAGS[race.Circuit.Location.country] ?? '🏁';
  return (
    <div style={{
      margin: '0 16px 8px', borderRadius: 12, overflow: 'hidden',
      background: 'rgba(255,255,255,0.02)',
      backdropFilter: 'blur(8px)',
      WebkitBackdropFilter: 'blur(8px)',
      border: '1px solid rgba(255,255,255,0.06)',
      opacity: 0.7,
    } as React.CSSProperties}>
      <div style={{ background: 'transparent', padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.4)', fontSize: 9, fontWeight: 800, padding: '2px 6px', borderRadius: 3, letterSpacing: 0.5, flexShrink: 0 }}>
          R{String(race.round).padStart(2, '0')}
        </div>
        <span style={{ fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.7)', flex: 1 }}>
          {race.raceName.replace(' Grand Prix', ' GP')} {flag}
        </span>
        <span style={{
          fontSize: 9, fontWeight: 700, letterSpacing: 1,
          color: 'rgba(255,255,255,0.55)',
          background: 'rgba(255,255,255,0.05)',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
          border: '1px solid rgba(255,255,255,0.10)',
          padding: '2px 7px', borderRadius: 3,
        } as React.CSSProperties}>
          UPCOMING
        </span>
      </div>
    </div>
  );
}

// ── Season stats grid ─────────────────────────────────────────────────────────
function SeasonStatsGrid({ stats, bestRaceName }: { stats: DriverSeasonStats; bestRaceName: string }) {
  const cells = [
    { label: 'RACES', value: stats.completedRaces },
    { label: 'WINS', value: stats.wins },
    { label: 'PODIUMS', value: stats.podiums },
    { label: 'FASTEST LAPS', value: stats.fastestLaps },
    { label: 'PTS / RACE', value: stats.pointsPerRace.toFixed(1) },
    { label: 'DNFs', value: stats.dnfs },
  ];

  return (
    <div className="glass-gradient-border" style={{
      margin: '0 16px 16px', borderRadius: 14, padding: 18,
    }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 10 }}>
        {cells.map(c => (
          <div key={c.label} style={{
            background: 'rgba(0,0,0,0.20)',
            backdropFilter: 'blur(6px)',
            WebkitBackdropFilter: 'blur(6px)',
            border: '1px solid rgba(255,255,255,0.06)',
            borderRadius: 8, padding: '12px 14px',
          } as React.CSSProperties}>
            <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.45)', letterSpacing: 1.2, fontWeight: 700, marginBottom: 4 }}>{c.label}</div>
            <div style={{ fontSize: 22, fontWeight: 900, color: '#ffffff', fontVariantNumeric: 'tabular-nums' }}>{c.value}</div>
          </div>
        ))}
      </div>

      {stats.bestResult !== null && (
        <div style={{
          padding: '10px 14px', borderRadius: 8,
          background: 'rgba(255,215,0,0.06)',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
          border: '1px solid rgba(255,215,0,0.25)',
          borderLeft: '3px solid rgba(255,215,0,0.6)',
          fontSize: 12, color: 'rgba(255,255,255,0.7)',
        } as React.CSSProperties}>
          <span style={{ fontWeight: 700, color: '#ffffff' }}>Best result: </span>
          P{stats.bestResult} · {bestRaceName}
        </div>
      )}
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────
export default function DriverProfileSheet({ standing, stats, loadingStats, allRaces, onClose }: Props) {
  const isMobile = useIsMobile();
  const [closing, setClosing] = useState(false);
  const { ref: sheetRef, dragOffset } = useSwipeClose(handleClose, isMobile);

  const teamColor = getTeamColor(standing.Constructors[0]?.constructorId ?? '');
  const flag = NAT_FLAGS[standing.Driver.nationality] ?? '';
  const pos = parseInt(standing.position, 10);
  const posBadgeColor = POS_COLOR[pos] ?? '#555';
  const driverNum = standing.Driver.permanentNumber ?? standing.Driver.code;

  // Body scroll lock + escape
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);
  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') handleClose(); };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, []);

  function handleClose() {
    setClosing(true);
    setTimeout(onClose, 340);
  }

  // Upcoming races = those not in stats.results
  const completedRounds = new Set(stats?.results.map(r => r.round) ?? []);
  const upcomingRaces = allRaces.filter(r => !completedRounds.has(parseInt(r.round, 10)));

  // Best result race name
  const bestResult = stats?.results.find(r => r.position === stats.bestResult);
  const bestRaceName = bestResult ? bestResult.raceName.replace(' Grand Prix', ' GP') : '';

  // Animations
  const sheetAnim = isMobile
    ? (closing ? 'slideSheetDown 0.34s cubic-bezier(0.32,0.72,0,1) forwards' : 'slideSheetUp 0.35s cubic-bezier(0.32,0.72,0,1) forwards')
    : (closing ? 'fadeScaleOut 0.25s ease forwards' : 'fadeScaleIn 0.25s ease forwards');
  const backdropAnim = closing ? 'fadeBackdropOut 0.3s ease forwards' : 'fadeBackdropIn 0.3s ease forwards';

  return (
    <>
      <style>{`
        @keyframes slideSheetUp   { from{transform:translateY(100%)} to{transform:translateY(0)} }
        @keyframes slideSheetDown { from{transform:translateY(0)}    to{transform:translateY(100%)} }
        @keyframes fadeScaleIn    { from{opacity:0;transform:translate(-50%,-50%) scale(0.94)} to{opacity:1;transform:translate(-50%,-50%) scale(1)} }
        @keyframes fadeScaleOut   { from{opacity:1;transform:translate(-50%,-50%) scale(1)}   to{opacity:0;transform:translate(-50%,-50%) scale(0.94)} }
        @keyframes fadeBackdropIn { from{opacity:0} to{opacity:1} }
        @keyframes fadeBackdropOut{ from{opacity:1} to{opacity:0} }
        @keyframes driverShimmer  { 0%{background-position:-200% 0} 100%{background-position:200% 0} }
      `}</style>

      {/* Backdrop */}
      <div onClick={handleClose} style={{
        position: 'fixed', inset: 0,
        background: 'rgba(0,0,0,0.65)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        zIndex: 1999, animation: backdropAnim,
      } as React.CSSProperties} />

      {/* Sheet — heavy glass */}
      <div
        ref={sheetRef}
        style={isMobile ? {
          position: 'fixed', bottom: 0, left: 0, right: 0, height: '94vh',
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
          position: 'fixed', top: '50%', left: '50%',
          transform: 'translate(-50%,-50%)',
          width: 'min(680px, 90vw)', maxHeight: '88vh',
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
        {/* Drag handle */}
        {isMobile && (
          <div style={{ padding: '12px 0 4px', display: 'flex', justifyContent: 'center', flexShrink: 0 }}>
            <div style={{ width: 36, height: 4, background: '#ddd', borderRadius: 2 }} />
          </div>
        )}

        {/* ── Header — team-tinted glass ── */}
        <div style={{
          background: `linear-gradient(135deg, ${teamColor}22, rgba(255,255,255,0.03))`,
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderBottom: '1px solid rgba(255,255,255,0.08)',
          flexShrink: 0, position: 'relative', overflow: 'hidden',
        } as React.CSSProperties}>
          {/* Driver number watermark */}
          <div style={{
            position: 'absolute', right: 16, top: 10,
            fontSize: 64, fontWeight: 900, lineHeight: 1,
            color: teamColor, opacity: 0.12,
            userSelect: 'none', pointerEvents: 'none',
            fontVariantNumeric: 'tabular-nums',
          }}>
            #{driverNum}
          </div>

          {/* Top row */}
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', padding: '16px 16px 10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
              {/* Position badge */}
              <div style={{
                width: 40, height: 40, borderRadius: '50%', flexShrink: 0,
                border: `2px solid ${posBadgeColor}`,
                background: pos <= 3 ? `${posBadgeColor}22` : 'transparent',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 16, fontWeight: 900, color: posBadgeColor,
              }}>
                {pos}
              </div>
              {/* Name + nationality */}
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 20, fontWeight: 900, color: '#fff', lineHeight: 1.1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {standing.Driver.givenName} {standing.Driver.familyName}
                </div>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)', marginTop: 3 }}>
                  {flag} {standing.Driver.nationality}
                </div>
              </div>
            </div>

            {/* Close */}
            <button
              onClick={handleClose}
              style={{ width: 44, height: 44, border: 'none', borderRadius: 8, background: 'rgba(255,255,255,0.07)', color: '#fff', fontSize: 22, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, WebkitTapHighlightColor: 'transparent' as never }}
            >×</button>
          </div>

          {/* Team colour bar + name */}
          <div style={{ height: 4, background: teamColor, boxShadow: `0 0 12px ${teamColor}66` }} />
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 1.8, color: teamColor, textAlign: 'center', padding: '6px 0 8px', textTransform: 'uppercase' }}>
            {standing.Constructors[0]?.name ?? ''}
          </div>

          {/* Stats strip */}
          <div style={{ display: 'flex', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
            {[
              { label: 'POINTS', value: standing.points },
              { label: 'WINS', value: standing.wins },
              { label: 'BEST RESULT', value: stats?.bestResult != null ? `P${stats.bestResult}` : '–' },
            ].map(({ label, value }, i) => (
              <div key={label} style={{ flex: 1, textAlign: 'center', padding: '12px 6px', borderLeft: i > 0 ? '1px solid rgba(255,255,255,0.06)' : 'none' }}>
                <div style={{ fontSize: 8, fontWeight: 700, letterSpacing: 1.5, color: 'rgba(255,255,255,0.55)', marginBottom: 4 }}>{label}</div>
                <div style={{ fontSize: 16, fontWeight: 900, color: '#fff', fontVariantNumeric: 'tabular-nums' }}>{value}</div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Scrollable body ── */}
        <div style={{ flex: 1, overflowY: 'auto', background: 'transparent', WebkitOverflowScrolling: 'touch' }}>

          {/* Season at a glance */}
          {(stats?.results.length ?? 0) > 0 && (
            <div style={{
              background: 'rgba(0,0,0,0.2)',
              backdropFilter: 'blur(8px)',
              WebkitBackdropFilter: 'blur(8px)',
              padding: '14px 0 12px',
              borderBottom: '1px solid rgba(255,255,255,0.06)',
            } as React.CSSProperties}>
              <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 1.5, color: 'rgba(255,255,255,0.45)', padding: '0 16px 10px' }}>
                SEASON AT A GLANCE
              </div>
              <div style={{ display: 'flex', gap: 10, overflowX: 'auto', paddingLeft: 16, paddingRight: 16, scrollSnapType: 'x mandatory', WebkitOverflowScrolling: 'touch', paddingBottom: 4 }}>
                {stats!.results.map(r => (
                  <div key={r.round} style={{ flexShrink: 0, scrollSnapAlign: 'center', textAlign: 'center' }}>
                    <div style={{
                      width: 48, height: 48, borderRadius: '50%',
                      background: bubbleBg(r.position, teamColor),
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 11, fontWeight: 800,
                      color: r.position === 2 ? '#444' : '#fff',
                      boxShadow: r.position === 1 ? '0 2px 8px rgba(255,215,0,0.4)' : undefined,
                    }}>
                      {bubbleText(r.position)}
                    </div>
                    <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.55)', marginTop: 4, fontWeight: 600 }}>
                      {countryShort(r.country, r.locality)}
                    </div>
                  </div>
                ))}
              </div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', textAlign: 'center', marginTop: 10, paddingBottom: 2 }}>
                {stats!.totalPoints} PTS across {stats!.completedRaces} race{stats!.completedRaces !== 1 ? 's' : ''} · Avg {stats!.pointsPerRace} PTS/race
              </div>
            </div>
          )}

          {/* Race results heading */}
          <div style={{ padding: '16px 16px 8px', display: 'flex', alignItems: 'baseline', gap: 8 }}>
            <span style={{ fontSize: 16, fontWeight: 700, color: '#ffffff' }}>Race</span>
            <span style={{ fontSize: 16, fontFamily: 'Georgia, serif', fontStyle: 'italic', color: '#e8002d' }}>Results</span>
            <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.45)', letterSpacing: 1, marginLeft: 4 }}>
              2026 · {stats?.completedRaces ?? 0} RACES COMPLETED
            </span>
          </div>

          {/* Loading skeleton */}
          {loadingStats && !stats && (
            <>
              <CardSkeleton />
              <CardSkeleton />
              <CardSkeleton />
            </>
          )}

          {/* Race cards */}
          {stats?.results.map(r => (
            <RaceCard key={r.round} result={r} />
          ))}

          {/* Upcoming races */}
          {upcomingRaces.length > 0 && (
            <>
              <div style={{ padding: '12px 16px 6px', fontSize: 10, fontWeight: 700, letterSpacing: 1.2, color: '#bbb' }}>
                UPCOMING
              </div>
              {upcomingRaces.slice(0, 5).map(r => (
                <UpcomingCard key={r.round} race={r} />
              ))}
            </>
          )}

          {/* Season stats */}
          {stats && stats.completedRaces > 0 && (
            <>
              <div style={{ padding: '20px 16px 10px', display: 'flex', alignItems: 'baseline', gap: 8 }}>
                <span style={{ fontSize: 16, fontWeight: 700, color: '#15151e' }}>Season</span>
                <span style={{ fontSize: 16, fontFamily: 'Georgia, serif', fontStyle: 'italic', color: '#e8002d' }}>Statistics</span>
              </div>
              <SeasonStatsGrid stats={stats} bestRaceName={bestRaceName} />
            </>
          )}

          <div style={{ height: 32 }} />
        </div>
      </div>
    </>
  );
}

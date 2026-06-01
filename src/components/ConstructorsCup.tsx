import { useState } from 'react';
import type { ConstructorStanding, DriverStanding } from '../types';
import { getTeamColor, NAT_FLAGS } from '../utils';
import { useIsMobile } from '../hooks/useBreakpoint';

interface Props {
  standings: ConstructorStanding[];
  driverStandings: DriverStanding[];
  loading: boolean;
  round: number;
}

const POS_COLORS: Record<number, string> = { 1: '#FFD700', 2: '#C0C0C0', 3: '#CD7F32' };

// ── Team name fuzzy matching ───────────────────────────────────────────────────
const TEAM_NAME_MAP: Record<string, string[]> = {
  'Mercedes': ['Mercedes', 'Mercedes-AMG'],
  'Ferrari': ['Ferrari', 'Scuderia Ferrari'],
  'McLaren': ['McLaren'],
  'Red Bull': ['Red Bull', 'Red Bull Racing'],
  'Aston Martin': ['Aston Martin'],
  'Alpine': ['Alpine', 'Alpine F1 Team'],
  'Williams': ['Williams'],
  'RB': ['RB', 'RB F1 Team', 'Racing Bulls'],
  'Kick Sauber': ['Sauber', 'Kick Sauber'],
  'Haas': ['Haas', 'Haas F1 Team'],
};

function teamsMatch(a: string, b: string): boolean {
  const al = a.toLowerCase();
  const bl = b.toLowerCase();
  if (al.includes(bl) || bl.includes(al)) return true;
  // Check alias map
  for (const aliases of Object.values(TEAM_NAME_MAP)) {
    const hasA = aliases.some(x => x.toLowerCase().includes(al) || al.includes(x.toLowerCase()));
    const hasB = aliases.some(x => x.toLowerCase().includes(bl) || bl.includes(x.toLowerCase()));
    if (hasA && hasB) return true;
  }
  return false;
}

function getDriversForTeam(teamName: string, driverStandings: DriverStanding[]): DriverStanding[] {
  return driverStandings
    .filter(d => teamsMatch(d.Constructors[0]?.name ?? '', teamName))
    .sort((a, b) => Number(b.points) - Number(a.points));
}

// ── Driver skeleton (loading placeholder) ─────────────────────────────────────
function DriverSkeleton() {
  const ph = 'linear-gradient(90deg, rgba(255,255,255,0.04) 25%, rgba(255,255,255,0.08) 50%, rgba(255,255,255,0.04) 75%)';
  return (
    <>
      {[0, 1].map(i => (
        <div key={i} style={{
          display: 'flex', alignItems: 'center', gap: 10,
          padding: '10px 16px', borderBottom: '1px solid rgba(255,255,255,0.06)', minHeight: 56,
        }}>
          <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'rgba(255,255,255,0.06)', flexShrink: 0 }} />
          <div style={{ width: 4, height: 36, borderRadius: 2, background: 'rgba(255,255,255,0.08)', flexShrink: 0 }} />
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
            <div style={{ height: 13, width: 120, borderRadius: 3, background: ph, backgroundSize: '200% 100%', animation: 'shimmer 1.4s infinite' }} />
            <div style={{ height: 10, width: 70, borderRadius: 3, background: ph, backgroundSize: '200% 100%', animation: 'shimmer 1.4s infinite' }} />
          </div>
          <div style={{ width: 48, height: 20, borderRadius: 3, background: ph, backgroundSize: '200% 100%', animation: 'shimmer 1.4s infinite', flexShrink: 0 }} />
        </div>
      ))}
    </>
  );
}

// ── Expanded breakdown panel ──────────────────────────────────────────────────
function DriverBreakdown({
  teamColor, drivers, loading,
}: {
  teamColor: string;
  drivers: DriverStanding[];
  loading: boolean;
}) {
  const d1 = drivers[0] ?? null;
  const d2 = drivers[1] ?? null;
  const pts1 = d1 ? Number(d1.points) : 0;
  const pts2 = d2 ? Number(d2.points) : 0;
  const combined = pts1 + pts2 || 1; // avoid /0
  const pct1 = Math.round((pts1 / combined) * 100);
  const pct2 = 100 - pct1;

  const driverRow = (d: DriverStanding | null, fallback: string) => {
    if (!d) {
      return (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10,
          padding: '10px 16px', borderBottom: '1px solid rgba(255,255,255,0.06)', minHeight: 56,
          color: 'rgba(255,255,255,0.35)', fontSize: 12, fontStyle: 'italic',
        }}>
          <div style={{ width: 28, height: 28, borderRadius: '50%', border: '1.5px solid rgba(255,255,255,0.10)', flexShrink: 0 }} />
          <div style={{ width: 4, height: 36, borderRadius: 2, background: 'rgba(255,255,255,0.10)', flexShrink: 0 }} />
          <span>{fallback}</span>
        </div>
      );
    }
    const pos = parseInt(d.position, 10);
    const posColor = POS_COLORS[pos] ?? '#ccc';
    const flag = NAT_FLAGS[d.Driver.nationality] ?? '';
    const pts = Number(d.points);
    const num = d.Driver.permanentNumber ?? d.Driver.code;

    return (
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10,
        padding: '10px 16px', borderBottom: '1px solid rgba(255,255,255,0.06)', minHeight: 56,
      }}>
        {/* Championship position badge */}
        <div style={{
          width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
          border: `1.5px solid ${posColor}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 11, fontWeight: 700, color: posColor,
        }}>
          {pos}
        </div>
        {/* Team colour bar */}
        <div style={{ width: 4, height: 36, borderRadius: 2, background: teamColor, flexShrink: 0 }} />
        {/* Driver info */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 4,
            fontSize: 13, fontWeight: 700, color: '#ffffff',
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
          }}>
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {d.Driver.givenName} {d.Driver.familyName}
            </span>
            <span style={{ fontSize: 12, flexShrink: 0 }}>{flag}</span>
          </div>
          <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.55)', marginTop: 2 }}>
            #{num} · {d.wins} win{d.wins !== '1' ? 's' : ''}
          </div>
        </div>
        {/* Points */}
        <div style={{ flexShrink: 0, textAlign: 'right' }}>
          <div style={{ fontSize: 16, fontWeight: 900, color: '#ffffff', fontVariantNumeric: 'tabular-nums' }}>
            {pts}
            <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.45)', marginLeft: 2 }}>PTS</span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div style={{
      borderLeft: `3px solid ${teamColor}`,
      background: 'rgba(0,0,0,0.2)',
      backdropFilter: 'blur(12px)',
      WebkitBackdropFilter: 'blur(12px)',
      borderRadius: '0 0 12px 12px',
    } as React.CSSProperties}>
      {/* Label */}
      <div style={{
        fontSize: 10, color: 'rgba(255,255,255,0.45)', letterSpacing: 1.5, fontWeight: 700,
        padding: '10px 16px 6px', borderTop: '1px solid rgba(255,255,255,0.06)',
      }}>
        DRIVER BREAKDOWN
      </div>

      {loading ? (
        <>
          <DriverSkeleton />
          <style>{`@keyframes shimmer { 0%{background-position:-200% 0} 100%{background-position:200% 0} }`}</style>
        </>
      ) : (
        <>
          {driverRow(d1, 'Driver data unavailable')}
          {driverRow(d2, 'Second driver data unavailable')}
        </>
      )}

      {/* Points split bar */}
      {!loading && (pts1 + pts2 > 0) && (
        <div style={{ padding: '10px 16px 14px' }}>
          <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.45)', letterSpacing: 1.2, fontWeight: 700, marginBottom: 6 }}>
            POINTS SPLIT
          </div>
          <div style={{
            display: 'flex', height: 6, borderRadius: 3, overflow: 'hidden',
            background: 'rgba(255,255,255,0.06)',
            backdropFilter: 'blur(4px)',
            WebkitBackdropFilter: 'blur(4px)',
          } as React.CSSProperties}>
            <div style={{ width: `${pct1}%`, background: teamColor, transition: 'width 0.4s ease' }} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 5 }}>
            <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.55)' }}>
              {d1 ? d1.Driver.familyName : '–'} · {pct1}%
            </span>
            <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.55)' }}>
              {d2 ? d2.Driver.familyName : '–'} · {pct2}%
            </span>
          </div>
        </div>
      )}
      {!loading && (pts1 + pts2 === 0) && (
        <div style={{ padding: '10px 16px 14px', fontSize: 11, color: 'rgba(255,255,255,0.35)', textAlign: 'center' }}>
          No points scored yet
        </div>
      )}
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────
export default function ConstructorsCup({ standings, driverStandings, loading, round }: Props) {
  const isMobile = useIsMobile();
  const [expandedTeam, setExpandedTeam] = useState<string | null>(null);
  const [hasExpandedOnce, setHasExpandedOnce] = useState<boolean>(() => {
    try { return localStorage.getItem('f1_expanded_constructor') === '1'; } catch { return false; }
  });

  function toggleTeam(name: string) {
    setExpandedTeam(prev => prev === name ? null : name);
    if (!hasExpandedOnce) {
      setHasExpandedOnce(true);
      try { localStorage.setItem('f1_expanded_constructor', '1'); } catch { /* ok */ }
    }
  }

  function handleKeyDown(e: React.KeyboardEvent, name: string) {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleTeam(name); }
  }

  return (
    <div style={{ flex: '1 1 0', minWidth: 0 }}>
      <style>{`
        @keyframes expandDown {
          from { opacity: 0; max-height: 0; transform: translateY(-6px); }
          to   { opacity: 1; max-height: 400px; transform: translateY(0); }
        }
        @keyframes collapseUp {
          from { opacity: 1; max-height: 400px; }
          to   { opacity: 0; max-height: 0; }
        }
        .ctor-row { transition: background 0.18s ease, border-radius 0.18s ease; }
        .ctor-row:hover {
          background: rgba(255,255,255,0.05) !important;
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
          border-radius: 10px;
        }
      `}</style>

      <h3 className="mixed-heading" style={{ fontSize: isMobile ? 18 : 22, marginBottom: 4 }}>
        Constructors' <span className="serif-red">Cup</span>
      </h3>
      <div className="label" style={{ marginBottom: isMobile ? 14 : 20 }}>
        AFTER {round} ROUNDS · 2026
      </div>

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="skeleton-light" style={{ height: isMobile ? 60 : 52, borderRadius: 6 }} />
          ))}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {standings.map(s => {
            const pos = parseInt(s.position, 10);
            const teamColor = getTeamColor(s.Constructor.constructorId);
            const posColor = POS_COLORS[pos] ?? 'rgba(0,0,0,0.25)';
            const isExpanded = expandedTeam === s.Constructor.name;
            const teamDrivers = getDriversForTeam(s.Constructor.name, driverStandings);

            return (
              <div key={s.Constructor.constructorId} style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                {/* ── Constructor row ── */}
                <div
                  className="ctor-row"
                  role="button"
                  tabIndex={0}
                  onClick={() => toggleTeam(s.Constructor.name)}
                  onKeyDown={e => handleKeyDown(e, s.Constructor.name)}
                  style={{
                    padding: isMobile ? '14px 4px' : '0 8px 10px',
                    marginBottom: isMobile ? 0 : 2,
                    cursor: 'pointer',
                    WebkitTapHighlightColor: 'transparent',
                    background: 'transparent',
                    transition: 'background 0.15s ease',
                    outline: 'none',
                    borderRadius: 4,
                    userSelect: 'none',
                  }}
                >
                  {/* Colored top bar with soft glow */}
                  <div style={{
                    height: 2, background: teamColor, borderRadius: 2,
                    marginBottom: 8, marginTop: isMobile ? 0 : 10,
                    boxShadow: `0 0 8px ${teamColor}80`,
                    filter: 'blur(0.5px)',
                  }} />

                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    {/* Position */}
                    <span style={{ fontSize: 12, fontWeight: 700, width: 20, textAlign: 'center', color: posColor, flexShrink: 0 }}>
                      {pos}
                    </span>

                    {/* Name + hint */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: '#ffffff' }}>
                        {s.Constructor.name}
                      </div>
                      <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.55)', letterSpacing: 0.3, marginTop: 1 }}>
                        {s.wins} win{s.wins !== '1' ? 's' : ''}
                        {isMobile && !hasExpandedOnce && (
                          <span style={{ color: 'rgba(255,255,255,0.35)', fontStyle: 'italic', marginLeft: 6 }}>
                            tap for driver details
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Points */}
                    <div style={{ fontSize: isMobile ? 16 : 18, fontWeight: 900, color: '#ffffff', fontVariantNumeric: 'tabular-nums' }}>
                      {s.points}
                      <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.45)', marginLeft: 2, fontWeight: 600 }}>PTS</span>
                    </div>

                    {/* Chevron */}
                    <span style={{
                      color: isExpanded ? teamColor : 'rgba(255,255,255,0.35)',
                      fontSize: 12,
                      display: 'inline-block',
                      transform: `rotate(${isExpanded ? 180 : 0}deg)`,
                      transition: 'transform 0.25s ease, color 0.15s ease',
                      flexShrink: 0,
                      marginLeft: 2,
                    }}>
                      ▼
                    </span>
                  </div>
                </div>

                {/* ── Expandable breakdown ── */}
                <div style={{
                  overflow: 'hidden',
                  animation: isExpanded ? 'expandDown 0.25s ease forwards' : undefined,
                  maxHeight: isExpanded ? 400 : 0,
                  opacity: isExpanded ? 1 : 0,
                  transition: isExpanded ? 'none' : 'max-height 0.2s ease, opacity 0.2s ease',
                }}>
                  <DriverBreakdown
                    teamColor={teamColor}
                    drivers={teamDrivers}
                    loading={driverStandings.length === 0}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

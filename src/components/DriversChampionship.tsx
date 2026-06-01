import { useState } from 'react';
import type { DriverStanding, Race } from '../types';
import { getTeamColor, NAT_FLAGS } from '../utils';
import { useIsMobile } from '../hooks/useBreakpoint';

interface Props {
  standings: DriverStanding[];
  loading: boolean;
  round: number;
  allRaces?: Race[];
  onSelectDriver: (driver: DriverStanding) => void;
}

const POS_COLORS: Record<number, string> = { 1: '#FFD700', 2: '#C0C0C0', 3: '#CD7F32' };

export default function DriversChampionship({ standings, loading, round, allRaces: _allRaces = [], onSelectDriver }: Props) {
  const isMobile = useIsMobile();
  const [hasExpandedOnce, setHasExpandedOnce] = useState<boolean>(() => {
    try { return localStorage.getItem('f1_expanded_driver') === '1'; } catch { return false; }
  });

  function selectDriver(s: DriverStanding) {
    onSelectDriver(s);
    if (!hasExpandedOnce) {
      setHasExpandedOnce(true);
      try { localStorage.setItem('f1_expanded_driver', '1'); } catch { /* ok */ }
    }
  }

  return (
    <div style={{ flex: '1 1 0', minWidth: 0 }}>
      <style>{`
        .driver-row { transition: background 0.18s ease, border-radius 0.18s ease; }
        .driver-row:hover {
          background: rgba(255,255,255,0.05) !important;
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
          border-radius: 10px;
        }
        .driver-row:hover .driver-info-icon { color: rgba(0,212,255,0.6) !important; }
      `}</style>

      <h3 className="mixed-heading" style={{ fontSize: isMobile ? 18 : 22, marginBottom: 4 }}>
        Drivers' <span className="serif-red">Championship</span>
      </h3>
      <div className="label" style={{ marginBottom: isMobile ? 14 : 20 }}>
        TOP 10 · AFTER {round} ROUNDS
      </div>

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="skeleton-light" style={{ height: isMobile ? 52 : 48, borderRadius: 10 }} />
          ))}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {standings.slice(0, 10).map(s => {
            const pos = parseInt(s.position, 10);
            const teamColor = getTeamColor(s.Constructors[0]?.constructorId ?? '');
            const flag = NAT_FLAGS[s.Driver.nationality] ?? '';
            const posColor = POS_COLORS[pos] ?? 'rgba(0,0,0,0.25)';

            return (
              <div
                key={s.Driver.driverId}
                className="driver-row"
                role="button"
                tabIndex={0}
                onClick={() => selectDriver(s)}
                onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); selectDriver(s); } }}
                style={{
                  display: 'flex', alignItems: 'center', gap: isMobile ? 10 : 12,
                  padding: isMobile ? '13px 8px' : '10px 12px',
                  borderBottom: '1px solid rgba(255,255,255,0.06)',
                  minHeight: isMobile ? 52 : 44,
                  cursor: 'pointer',
                  WebkitTapHighlightColor: 'transparent',
                  outline: 'none',
                  userSelect: 'none',
                  // P1 gets a subtle gold tint
                  background: pos === 1 ? 'rgba(255,215,0,0.04)' : 'transparent',
                  border: pos === 1 ? '1px solid rgba(255,215,0,0.12)' : '1px solid transparent',
                  borderRadius: pos === 1 ? 10 : 0,
                  // Inset team-color glow stripe on the left
                  boxShadow: `inset 3px 0 0 ${teamColor}`,
                }}
              >
                {/* Position */}
                <span style={{ fontSize: 12, fontWeight: 700, width: 22, textAlign: 'center', flexShrink: 0, color: posColor }}>
                  {pos}
                </span>

                {/* Driver info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#ffffff', display: 'flex', alignItems: 'center', gap: 4, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {s.Driver.givenName} {s.Driver.familyName}
                    {!isMobile && <span style={{ fontSize: 13 }}>{flag}</span>}
                  </div>
                  <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.55)', marginTop: 1 }}>
                    {s.Constructors[0]?.name ?? ''}
                    {isMobile && !hasExpandedOnce && (
                      <span style={{ color: 'rgba(255,255,255,0.35)', fontStyle: 'italic', marginLeft: 6 }}>tap for season details</span>
                    )}
                  </div>
                </div>

                {/* Points */}
                <div style={{ fontSize: isMobile ? 16 : 18, fontWeight: 900, color: '#ffffff', fontVariantNumeric: 'tabular-nums', flexShrink: 0 }}>
                  {s.points}
                  <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.45)', marginLeft: 2, fontWeight: 600 }}>PTS</span>
                </div>

                {/* Info icon */}
                <span className="driver-info-icon" style={{ fontSize: 14, color: 'rgba(255,255,255,0.25)', flexShrink: 0, marginLeft: 2, transition: 'color 0.2s' }}>ⓘ</span>
              </div>
            );
          })}
        </div>
      )}

    </div>
  );
}

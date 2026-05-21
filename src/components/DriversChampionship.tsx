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
      <style>{`.driver-row:hover { background: rgba(232,0,45,0.04) !important; }`}</style>

      <h3 className="mixed-heading" style={{ fontSize: isMobile ? 18 : 22, marginBottom: 4 }}>
        Drivers' <span className="serif-red">Championship</span>
      </h3>
      <div className="label" style={{ marginBottom: isMobile ? 14 : 20 }}>
        TOP 10 · AFTER {round} ROUNDS
      </div>

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="skeleton-light" style={{ height: isMobile ? 52 : 48, borderRadius: 6 }} />
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
                  padding: isMobile ? '13px 4px' : '10px 8px',
                  borderBottom: '1px solid #f0f0ea',
                  minHeight: isMobile ? 52 : 44,
                  cursor: 'pointer',
                  borderLeft: '3px solid transparent',
                  WebkitTapHighlightColor: 'transparent',
                  transition: 'background 0.15s',
                  outline: 'none',
                  userSelect: 'none',
                  background: 'transparent',
                }}
                onMouseEnter={e => {
                  if (isMobile) return;
                  (e.currentTarget as HTMLElement).style.borderLeftColor = '#e8002d';
                }}
                onMouseLeave={e => {
                  if (isMobile) return;
                  (e.currentTarget as HTMLElement).style.borderLeftColor = 'transparent';
                }}
              >
                {/* Position */}
                <span style={{ fontSize: 12, fontWeight: 700, width: 22, textAlign: 'center', flexShrink: 0, color: posColor }}>
                  {pos}
                </span>

                {/* Team color bar */}
                <div style={{ width: 3, height: isMobile ? 34 : 36, borderRadius: 2, background: teamColor, flexShrink: 0 }} />

                {/* Driver info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#15151e', display: 'flex', alignItems: 'center', gap: 4, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {s.Driver.givenName} {s.Driver.familyName}
                    {!isMobile && <span style={{ fontSize: 13 }}>{flag}</span>}
                  </div>
                  <div style={{ fontSize: 10, color: '#888', marginTop: 1 }}>
                    {s.Constructors[0]?.name ?? ''}
                    {isMobile && !hasExpandedOnce && (
                      <span style={{ color: '#ccc', fontStyle: 'italic', marginLeft: 6 }}>tap for season details</span>
                    )}
                  </div>
                </div>

                {/* Points */}
                <div style={{ fontSize: isMobile ? 16 : 18, fontWeight: 900, color: '#15151e', fontVariantNumeric: 'tabular-nums', flexShrink: 0 }}>
                  {s.points}
                  <span style={{ fontSize: 9, color: '#bbb', marginLeft: 2, fontWeight: 600 }}>PTS</span>
                </div>

                {/* Info icon */}
                <span style={{ fontSize: 14, color: '#ddd', flexShrink: 0, marginLeft: 2 }}>ⓘ</span>
              </div>
            );
          })}
        </div>
      )}

    </div>
  );
}

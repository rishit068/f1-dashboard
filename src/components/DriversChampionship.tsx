import type { DriverStanding } from '../types';
import { getTeamColor, NAT_FLAGS } from '../utils';
import { useIsMobile } from '../hooks/useBreakpoint';

interface Props {
  standings: DriverStanding[];
  loading: boolean;
  round: number;
}

const POS_COLORS: Record<number, string> = { 1: '#FFD700', 2: '#C0C0C0', 3: '#CD7F32' };

export default function DriversChampionship({ standings, loading, round }: Props) {
  const isMobile = useIsMobile();

  return (
    <div style={{ flex: '1 1 0', minWidth: 0 }}>
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
          {standings.slice(0, 10).map((s) => {
            const pos = parseInt(s.position, 10);
            const teamColor = getTeamColor(s.Constructors[0]?.constructorId ?? '');
            const flag = NAT_FLAGS[s.Driver.nationality] ?? '';
            const posColor = POS_COLORS[pos] ?? 'rgba(0,0,0,0.25)';

            return (
              <div
                key={s.Driver.driverId}
                className="driver-card"
                style={{
                  display: 'flex', alignItems: 'center', gap: isMobile ? 10 : 12,
                  padding: isMobile ? '13px 0' : '10px 8px',
                  borderBottom: '1px solid #f0f0ea',
                  minHeight: isMobile ? 52 : 44,
                  transition: 'background 0.15s',
                  cursor: 'default',
                  borderLeft: '3px solid transparent',
                  WebkitTapHighlightColor: 'transparent',
                }}
                onMouseEnter={e => {
                  if (isMobile) return;
                  const el = e.currentTarget as HTMLElement;
                  el.style.background = '#fafafa';
                  el.style.borderLeftColor = '#e8002d';
                }}
                onMouseLeave={e => {
                  if (isMobile) return;
                  const el = e.currentTarget as HTMLElement;
                  el.style.background = 'transparent';
                  el.style.borderLeftColor = 'transparent';
                }}
              >
                {/* Position */}
                <span style={{
                  fontSize: isMobile ? 13 : 12, fontWeight: 700,
                  width: isMobile ? 20 : 22, textAlign: 'center', flexShrink: 0,
                  color: posColor,
                }}>
                  {pos}
                </span>

                {/* Team color bar */}
                <div style={{ width: 3, height: isMobile ? 34 : 36, borderRadius: 2, background: teamColor, flexShrink: 0 }} />

                {/* Driver info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontSize: isMobile ? 13 : 13, fontWeight: 700, color: '#15151e',
                    display: 'flex', alignItems: 'center', gap: 4,
                    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                  }}>
                    {s.Driver.givenName} {s.Driver.familyName}
                    {!isMobile && <span style={{ fontSize: 13 }}>{flag}</span>}
                  </div>
                  <div style={{ fontSize: isMobile ? 10 : 10, color: '#888', marginTop: 1 }}>
                    {s.Constructors[0]?.name ?? ''}
                  </div>
                </div>

                {/* Points */}
                <div style={{
                  fontSize: isMobile ? 16 : 18, fontWeight: 900, color: '#15151e',
                  fontVariantNumeric: 'tabular-nums', flexShrink: 0,
                }}>
                  {s.points}
                  <span style={{ fontSize: 9, color: '#bbb', marginLeft: 2, fontWeight: 600 }}>PTS</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

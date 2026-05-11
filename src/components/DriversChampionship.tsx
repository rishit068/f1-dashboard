import type { DriverStanding } from '../types';
import { getTeamColor, NAT_FLAGS } from '../utils';

interface Props {
  standings: DriverStanding[];
  loading: boolean;
  round: number;
}

const POS_COLORS: Record<number, string> = { 1: '#FFD700', 2: '#C0C0C0', 3: '#CD7F32' };

export default function DriversChampionship({ standings, loading, round }: Props) {
  return (
    <div style={{ flex: '1 1 0', minWidth: 0 }}>
      <h3 className="mixed-heading" style={{ fontSize: 22, marginBottom: 4 }}>
        Drivers' <span className="serif-red">Championship</span>
      </h3>
      <div className="label" style={{ marginBottom: 20 }}>
        TOP 10 · AFTER {round} ROUNDS
      </div>

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="skeleton-light" style={{ height: 48, borderRadius: 6 }} />
          ))}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
          {standings.slice(0, 10).map((s) => {
            const pos = parseInt(s.position, 10);
            const teamColor = getTeamColor(s.Constructors[0]?.constructorId ?? '');
            const flag = NAT_FLAGS[s.Driver.nationality] ?? '';
            const posColor = POS_COLORS[pos] ?? 'rgba(0,0,0,0.25)';

            return (
              <div
                key={s.Driver.driverId}
                style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '10px 8px',
                  borderBottom: '1px solid #f0f0ea',
                  transition: 'background 0.15s',
                  cursor: 'default',
                  borderLeft: '3px solid transparent',
                }}
                onMouseEnter={e => {
                  const el = e.currentTarget as HTMLElement;
                  el.style.background = '#fafafa';
                  el.style.borderLeftColor = '#e8002d';
                }}
                onMouseLeave={e => {
                  const el = e.currentTarget as HTMLElement;
                  el.style.background = 'transparent';
                  el.style.borderLeftColor = 'transparent';
                }}
              >
                {/* Position */}
                <span style={{
                  fontSize: 12, fontWeight: 700, width: 22, textAlign: 'center',
                  color: posColor,
                  flexShrink: 0,
                }}>
                  {pos}
                </span>

                {/* Team color bar */}
                <div style={{
                  width: 3, height: 36, borderRadius: 2,
                  background: teamColor, flexShrink: 0,
                }} />

                {/* Driver info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontSize: 13, fontWeight: 700, color: '#15151e',
                    display: 'flex', alignItems: 'center', gap: 6,
                  }}>
                    <span>{s.Driver.givenName} {s.Driver.familyName}</span>
                    <span style={{ fontSize: 14 }}>{flag}</span>
                  </div>
                  <div style={{ fontSize: 10, color: '#888', letterSpacing: 0.3, marginTop: 1 }}>
                    {s.Constructors[0]?.name ?? ''}
                  </div>
                </div>

                {/* Points */}
                <div style={{
                  fontSize: 18, fontWeight: 900, color: '#15151e',
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

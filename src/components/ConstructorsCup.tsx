import type { ConstructorStanding } from '../types';
import { getTeamColor } from '../utils';

interface Props {
  standings: ConstructorStanding[];
  loading: boolean;
  round: number;
}

const POS_COLORS: Record<number, string> = { 1: '#FFD700', 2: '#C0C0C0', 3: '#CD7F32' };

export default function ConstructorsCup({ standings, loading, round }: Props) {
  return (
    <div style={{ flex: '1 1 0', minWidth: 0 }}>
      <h3 className="mixed-heading" style={{ fontSize: 22, marginBottom: 4 }}>
        Constructors' <span className="serif-red">Cup</span>
      </h3>
      <div className="label" style={{ marginBottom: 20 }}>
        AFTER {round} ROUNDS · 2026
      </div>

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="skeleton-light" style={{ height: 52, borderRadius: 6 }} />
          ))}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
          {standings.map(s => {
            const pos = parseInt(s.position, 10);
            const teamColor = getTeamColor(s.Constructor.constructorId);
            const posColor = POS_COLORS[pos] ?? 'rgba(0,0,0,0.25)';

            return (
              <div
                key={s.Constructor.constructorId}
                style={{
                  borderBottom: '1px solid #f0f0ea',
                  padding: '0 8px 10px',
                  marginBottom: 2,
                  transition: 'background 0.15s',
                  cursor: 'default',
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = '#fafafa'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
              >
                {/* Colored top bar */}
                <div style={{
                  height: 3, background: teamColor, borderRadius: 2,
                  marginBottom: 8, marginTop: 10,
                  boxShadow: `0 0 8px ${teamColor}66`,
                }} />

                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  {/* Position */}
                  <span style={{
                    fontSize: 12, fontWeight: 700, width: 22, textAlign: 'center',
                    color: posColor, flexShrink: 0,
                  }}>
                    {pos}
                  </span>

                  {/* Team name */}
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#15151e' }}>
                      {s.Constructor.name}
                    </div>
                    <div style={{ fontSize: 10, color: '#888', letterSpacing: 0.3 }}>
                      {s.wins} wins
                    </div>
                  </div>

                  {/* Points */}
                  <div style={{
                    fontSize: 18, fontWeight: 900, color: '#15151e',
                    fontVariantNumeric: 'tabular-nums',
                  }}>
                    {s.points}
                    <span style={{ fontSize: 9, color: '#bbb', marginLeft: 2, fontWeight: 600 }}>PTS</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

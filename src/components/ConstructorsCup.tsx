import type { ConstructorStanding } from '../types';
import { getTeamColor } from '../utils';
import { useIsMobile } from '../hooks/useBreakpoint';

interface Props {
  standings: ConstructorStanding[];
  loading: boolean;
  round: number;
}

const POS_COLORS: Record<number, string> = { 1: '#FFD700', 2: '#C0C0C0', 3: '#CD7F32' };

export default function ConstructorsCup({ standings, loading, round }: Props) {
  const isMobile = useIsMobile();

  return (
    <div style={{ flex: '1 1 0', minWidth: 0 }}>
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

            return (
              <div
                key={s.Constructor.constructorId}
                style={{
                  borderBottom: '1px solid #f0f0ea',
                  padding: isMobile ? '14px 0' : '0 8px 10px',
                  marginBottom: isMobile ? 0 : 2,
                  cursor: 'default',
                  WebkitTapHighlightColor: 'transparent',
                }}
              >
                {/* Colored top bar */}
                <div style={{
                  height: 3, background: teamColor, borderRadius: 2,
                  marginBottom: 8, marginTop: isMobile ? 0 : 10,
                  boxShadow: `0 0 8px ${teamColor}66`,
                }} />
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: 12, fontWeight: 700, width: 20, textAlign: 'center', color: posColor, flexShrink: 0 }}>
                    {pos}
                  </span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: isMobile ? 13 : 13, fontWeight: 700, color: '#15151e' }}>
                      {s.Constructor.name}
                    </div>
                    <div style={{ fontSize: 10, color: '#888', letterSpacing: 0.3 }}>
                      {s.wins} win{s.wins !== '1' ? 's' : ''}
                    </div>
                  </div>
                  <div style={{ fontSize: isMobile ? 16 : 18, fontWeight: 900, color: '#15151e', fontVariantNumeric: 'tabular-nums' }}>
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

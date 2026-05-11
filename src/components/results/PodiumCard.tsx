import type { RaceResult } from '../../types';
import { NAT_FLAGS } from '../../utils';

interface Props { results: RaceResult[] }

interface PodiumEntry {
  pos: 1 | 2 | 3;
  result: RaceResult;
  medal: string;
}

const POS_LABEL = { 1: '🥇', 2: '🥈', 3: '🥉' } as const;

export default function PodiumCard({ results }: Props) {
  const p1 = results.find(r => r.position === 1);
  const p2 = results.find(r => r.position === 2);
  const p3 = results.find(r => r.position === 3);
  if (!p1) return null;

  const entries: PodiumEntry[] = [
    ...(p2 ? [{ pos: 2 as const, result: p2, medal: POS_LABEL[2] }] : []),
    { pos: 1 as const, result: p1, medal: POS_LABEL[1] },
    ...(p3 ? [{ pos: 3 as const, result: p3, medal: POS_LABEL[3] }] : []),
  ];

  return (
    <div style={{
      background: 'linear-gradient(135deg, #15151e 0%, #1e1e2a 100%)',
      borderRadius: 12, margin: '0 16px 8px',
      padding: '16px 12px 12px',
      display: 'flex', gap: 6,
      border: '1px solid rgba(255,255,255,0.06)',
      boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
    }}>
      {entries.map(({ pos, result: r, medal }) => {
        const flag = NAT_FLAGS[r.nationality] ?? '';
        const isFirst = pos === 1;
        return (
          <div key={pos} style={{
            flex: 1, textAlign: 'center',
            borderTop: `3px solid ${r.teamColor}`,
            padding: '10px 4px 6px',
            borderRadius: '0 0 8px 8px',
            background: isFirst ? 'rgba(255,215,0,0.06)' : 'rgba(255,255,255,0.02)',
            marginTop: isFirst ? -8 : 0,
            boxShadow: isFirst ? `0 0 16px ${r.teamColor}44` : 'none',
          }}>
            <div style={{ fontSize: isFirst ? 22 : 18, marginBottom: 4 }}>{medal}</div>
            <div style={{
              fontSize: isFirst ? 14 : 12, fontWeight: 800,
              color: '#fff', lineHeight: 1.2,
              whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
            }}>
              {r.familyName} {flag}
            </div>
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', marginTop: 2, lineHeight: 1.2 }}>
              {r.team}
            </div>
            <div style={{
              fontSize: isFirst ? 13 : 11, fontWeight: 700,
              color: r.points > 0 ? '#e8002d' : '#555',
              marginTop: 6,
            }}>
              {r.points} PTS
            </div>
          </div>
        );
      })}
    </div>
  );
}

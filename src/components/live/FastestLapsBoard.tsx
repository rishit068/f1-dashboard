import type { FastestLapEntry } from '../../types';
import { useIsMobile } from '../../hooks/useBreakpoint';

interface Props { board: FastestLapEntry[]; currentLap: number }

function fmtLap(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = (sec % 60).toFixed(3).padStart(6, '0');
  return `${m}:${s}`;
}

export default function FastestLapsBoard({ board, currentLap }: Props) {
  const isMobile = useIsMobile();

  return (
    <div style={{ flex: isMobile ? '1 1 100%' : '0 0 35%', minWidth: isMobile ? 0 : 260 }}>
      <h3 className="mixed-heading" style={{ fontSize: isMobile ? 18 : 20, marginBottom: 4 }}>
        Fastest <span className="serif-red">Laps</span>
      </h3>
      <div className="label" style={{ marginBottom: isMobile ? 12 : 16 }}>TOP 5 THIS RACE</div>

      <div style={{ border: '1px solid #e8e8e0', borderRadius: 8, background: '#fff', overflow: 'hidden' }}>
        {board.length === 0 ? (
          <div style={{ padding: 24, textAlign: 'center', color: '#888', fontSize: 13 }}>
            No laps recorded yet…
          </div>
        ) : (
          board.map((entry, i) => (
            <div key={`${entry.driverNumber}-${entry.lapNumber}`} style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: isMobile ? '10px 14px' : '12px 16px',
              minHeight: 48,
              borderBottom: i < board.length - 1 ? '1px solid #f5f5f0' : 'none',
              background: i === 0 ? 'rgba(215,131,255,0.06)' : 'transparent',
            }}>
              <span style={{ fontSize: 13, fontWeight: 800, width: 20, color: i === 0 ? '#d783ff' : '#bbb' }}>{i + 1}</span>
              <div style={{ width: 3, height: 30, background: entry.teamColor, borderRadius: 2, flexShrink: 0 }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#15151e' }}>{entry.driverName}</div>
                <div style={{ fontSize: 10, color: '#aaa', marginTop: 1 }}>LAP {entry.lapNumber}</div>
              </div>
              <div style={{ fontSize: isMobile ? 13 : 14, fontWeight: 800, color: i === 0 ? '#d783ff' : '#555', fontVariantNumeric: 'tabular-nums' }}>
                {fmtLap(entry.lapTime)}
              </div>
            </div>
          ))
        )}
      </div>

      <div style={{ marginTop: 10, padding: '8px 12px', background: '#f5f5f0', border: '1px solid #e8e8e0', borderRadius: 8, fontSize: 11, color: '#888' }}>
        <span style={{ fontWeight: 700, color: '#555' }}>LAP RECORD</span>
        {' '}· 1:29.708 · Current lap:{' '}
        <span style={{ fontWeight: 700, color: '#15151e' }}>{currentLap}</span>
      </div>
    </div>
  );
}

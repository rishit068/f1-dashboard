import type { OpenF1Session, OpenF1Position, OpenF1Interval, OpenF1Driver } from '../types';

interface Props {
  session: OpenF1Session;
  positions: OpenF1Position[];
  intervals: OpenF1Interval[];
  drivers: OpenF1Driver[];
}

export default function LiveRaceOverlay({ session, positions, intervals, drivers }: Props) {
  // Build a driver map by number
  const driverMap = new Map(drivers.map(d => [d.driver_number, d]));

  // Get latest position per driver
  const latestPos = new Map<number, number>();
  for (const p of positions) {
    const existing = latestPos.get(p.driver_number);
    if (!existing || new Date(p.date) > new Date(positions.find(x => x.driver_number === p.driver_number && x.position === existing)?.date ?? 0)) {
      latestPos.set(p.driver_number, p.position);
    }
  }

  // Get latest interval per driver
  const latestInterval = new Map<number, OpenF1Interval>();
  for (const i of intervals) {
    latestInterval.set(i.driver_number, i);
  }

  // Sort drivers by position
  const sorted = Array.from(latestPos.entries())
    .sort(([, a], [, b]) => a - b)
    .slice(0, 10);

  return (
    <div style={{
      position: 'fixed', top: 60, right: 16,
      width: 280,
      background: 'rgba(21,21,30,0.97)',
      border: '1px solid rgba(232,0,45,0.3)',
      borderRadius: 10,
      overflow: 'hidden',
      zIndex: 400,
      boxShadow: '0 8px 40px rgba(0,0,0,0.6)',
    }}>
      {/* Header */}
      <div style={{
        background: '#e8002d',
        padding: '8px 14px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{
            width: 8, height: 8, borderRadius: '50%',
            background: '#fff', display: 'block',
            animation: 'pulse 1s infinite',
          }} />
          <span style={{ fontSize: 11, fontWeight: 800, color: '#fff', letterSpacing: 2 }}>
            LIVE RACE
          </span>
        </div>
        <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.7)' }}>
          {session.circuit_short_name}
        </span>
      </div>

      {/* Leaderboard */}
      <div style={{ padding: '8px 0' }}>
        {sorted.length === 0 ? (
          <div style={{ padding: '20px', textAlign: 'center', color: '#555', fontSize: 12 }}>
            Waiting for live data…
          </div>
        ) : sorted.map(([driverNum, pos]) => {
          const driver = driverMap.get(driverNum);
          const interval = latestInterval.get(driverNum);
          const color = driver?.team_colour ? `#${driver.team_colour}` : '#888';

          return (
            <div key={driverNum} style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '6px 14px',
              borderBottom: '1px solid rgba(255,255,255,0.05)',
            }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: '#888', width: 18 }}>{pos}</span>
              <div style={{ width: 2, height: 24, background: color, borderRadius: 2 }} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#fff' }}>
                  {driver?.name_acronym ?? `CAR ${driverNum}`}
                </div>
                <div style={{ fontSize: 9, color: '#555' }}>
                  {driver?.team_name ?? ''}
                </div>
              </div>
              <div style={{
                fontSize: 10, color: '#888',
                fontVariantNumeric: 'tabular-nums',
                textAlign: 'right',
              }}>
                {pos === 1
                  ? 'LEADER'
                  : interval?.gap_to_leader != null
                    ? `+${interval.gap_to_leader.toFixed(3)}`
                    : '–'
                }
              </div>
            </div>
          );
        })}
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
      `}</style>
    </div>
  );
}

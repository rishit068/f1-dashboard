import { useMemo } from 'react';
import type { LiveRaceState } from '../../types';
import RaceRow from './RaceRow';
import MobileDriverCard from './MobileDriverCard';
import { useIsMobile } from '../../hooks/useBreakpoint';

interface Props { data: LiveRaceState }

const TH: React.CSSProperties = {
  padding: '8px 8px',
  fontSize: 9, fontWeight: 700, letterSpacing: 1.8,
  color: '#aaa', textTransform: 'uppercase',
  borderBottom: '2px solid #e8e8e0',
  whiteSpace: 'nowrap', background: '#fafaf8',
};

export default function RaceTower({ data }: Props) {
  const isMobile = useIsMobile();
  const fastestDriverNum = useMemo(() => data.fastestLap?.driverNumber ?? null, [data.fastestLap]);
  const px = isMobile ? 16 : 32;
  const pt = isMobile ? 24 : 40;

  return (
    <div style={{ background: '#f5f5f0', padding: `${pt}px ${px}px 0` }}>
      <div style={{ maxWidth: isMobile ? '100%' : 1200, margin: '0 auto' }}>

        {/* Heading */}
        <div style={{ marginBottom: isMobile ? 14 : 20, display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', paddingLeft: isMobile ? 0 : 0 }}>
          <h2 className="mixed-heading">
            Race <span className="serif-red">Tower</span>
          </h2>
          {!isMobile && (
            <span className="label">
              LIVE POSITIONS · ROUND {data.session.round ?? '–'} · UPDATING EVERY 4S
            </span>
          )}
          {isMobile && (
            <span className="label">EVERY 4S</span>
          )}
        </div>

        {/* Table card */}
        <div style={{
          background: '#fff',
          border: isMobile ? 'none' : '1px solid #e8e8e0',
          borderRadius: isMobile ? 0 : 10,
          overflow: 'hidden',
          boxShadow: isMobile ? 'none' : '0 2px 16px rgba(0,0,0,0.05)',
          marginLeft: isMobile ? -px : 0,
          marginRight: isMobile ? -px : 0,
        }}>
          {data.drivers.length === 0 ? (
            <div style={{ padding: 40, textAlign: 'center', color: '#888', fontSize: 14 }}>
              Awaiting live timing data…
            </div>
          ) : isMobile ? (
            /* ── Mobile: card list ── */
            <div>
              {data.drivers.map(driver => (
                <MobileDriverCard key={driver.driverNumber} driver={driver} />
              ))}
            </div>
          ) : (
            /* ── Desktop: full table ── */
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={{ ...TH, textAlign: 'left', paddingLeft: 16 }}>POS</th>
                  <th style={{ ...TH, textAlign: 'left' }}>DRIVER</th>
                  <th style={{ ...TH, textAlign: 'center' }}>TIRE</th>
                  <th style={{ ...TH, textAlign: 'center' }}>LAP</th>
                  <th style={{ ...TH, textAlign: 'right' }}>GAP</th>
                  <th style={{ ...TH, textAlign: 'right' }}>INTERVAL</th>
                  <th style={{ ...TH, textAlign: 'right' }}>LAST LAP</th>
                  <th style={{ ...TH, textAlign: 'center' }}>STATUS</th>
                  <th style={{ ...TH, textAlign: 'center', paddingRight: 16 }}>PITS</th>
                </tr>
              </thead>
              <tbody>
                {data.drivers.map(driver => (
                  <RaceRow
                    key={driver.driverNumber}
                    driver={driver}
                    fastestLapDriverNum={fastestDriverNum}
                  />
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}

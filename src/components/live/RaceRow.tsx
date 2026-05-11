import { memo, useEffect, useRef, useState } from 'react';
import type { LiveDriver } from '../../types';
import TireChip from './TireChip';

const POS_COLOR: Record<number, string> = { 1: '#FFD700', 2: '#C0C0C0', 3: '#CD7F32' };

const STATUS_BADGE: Record<string, { text: string; bg: string; color: string }> = {
  PIT_IN:  { text: 'PIT IN',  bg: '#FF8C00', color: '#fff' },
  PIT_OUT: { text: 'PIT OUT', bg: '#39B54A', color: '#fff' },
  DNF:     { text: 'DNF',     bg: '#e8002d', color: '#fff' },
  DSQ:     { text: 'DSQ',     bg: '#e8002d', color: '#fff' },
};

interface Props {
  driver: LiveDriver;
  fastestLapDriverNum: number | null;
}

export default memo(function RaceRow({ driver: d }: Props) {
  const [flash, setFlash] = useState<'none' | 'green' | 'red'>('none');
  const prevPos = useRef(d.position);

  useEffect(() => {
    if (d.positionChange === 'gained') {
      setFlash('green');
      const id = setTimeout(() => setFlash('none'), 800);
      return () => clearTimeout(id);
    } else if (d.positionChange === 'lost') {
      setFlash('red');
      const id = setTimeout(() => setFlash('none'), 800);
      return () => clearTimeout(id);
    }
    prevPos.current = d.position;
  }, [d.positionChange, d.position]);

  const gapVal = d.gapToLeader === 'LEADER' ? 0 : parseFloat(d.interval.replace('+', ''));
  const inDrsRange = !isNaN(gapVal) && gapVal > 0 && gapVal <= 1.0;
  const inDrsZone  = !isNaN(gapVal) && gapVal > 0 && gapVal <= 0.5;
  const isDnf = d.status === 'DNF' || d.status === 'DSQ';
  const statusBadge = STATUS_BADGE[d.status];

  const flashBg = flash === 'green'
    ? 'rgba(39,244,86,0.13)'
    : flash === 'red'
    ? 'rgba(232,0,45,0.10)'
    : 'transparent';

  return (
    <tr style={{
      background: flashBg,
      opacity: isDnf ? 0.4 : 1,
      transition: 'background 0.4s ease',
      borderLeft: d.position === 1 ? '2px solid rgba(255,215,0,0.4)' : '2px solid transparent',
    }}>
      {/* POS */}
      <td style={{ padding: '10px 8px 10px 16px', width: 48 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <span style={{
            fontSize: 13, fontWeight: 800,
            color: POS_COLOR[d.position] ?? '#999',
            fontVariantNumeric: 'tabular-nums',
          }}>
            {d.position}
          </span>
          {d.positionChange === 'gained' && (
            <span style={{ color: '#27f456', fontSize: 9, fontWeight: 700 }}>▲</span>
          )}
          {d.positionChange === 'lost' && (
            <span style={{ color: '#e8002d', fontSize: 9, fontWeight: 700 }}>▼</span>
          )}
        </div>
      </td>

      {/* DRIVER */}
      <td style={{ padding: '10px 12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 4, height: 34, borderRadius: 2, background: d.teamColor, flexShrink: 0 }} />
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#15151e' }}>
              {d.fullName}
            </div>
            <div style={{ fontSize: 10, color: '#888', marginTop: 1 }}>{d.teamName}</div>
          </div>
        </div>
      </td>

      {/* TIRE */}
      <td style={{ padding: '10px 12px', textAlign: 'center' }}>
        <TireChip compound={d.tireCompound} laps={d.tireLaps} />
      </td>

      {/* LAP */}
      <td style={{ padding: '10px 8px', textAlign: 'center', fontVariantNumeric: 'tabular-nums' }}>
        <span style={{ fontSize: 12, color: '#888' }}>{d.currentLap || '–'}</span>
      </td>

      {/* GAP TO LEADER */}
      <td style={{ padding: '10px 8px', textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
        {d.gapToLeader === 'LEADER' ? (
          <span style={{ fontSize: 11, fontWeight: 700, color: '#27f4d2', letterSpacing: 0.5 }}>LEADER</span>
        ) : d.gapToLeader.includes('LAP') ? (
          <span style={{ fontSize: 11, color: '#FF8C00', fontWeight: 700 }}>{d.gapToLeader}</span>
        ) : (
          <span style={{ fontSize: 12, color: '#555', transition: 'color 0.3s' }}>{d.gapToLeader}</span>
        )}
      </td>

      {/* INTERVAL */}
      <td style={{ padding: '10px 8px', textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 4 }}>
          {inDrsZone && (
            <span style={{
              fontSize: 8, fontWeight: 800, color: '#27f456',
              background: 'rgba(39,244,86,0.12)',
              padding: '1px 5px', borderRadius: 3,
              letterSpacing: 1,
            }}>DRS</span>
          )}
          <span style={{
            fontSize: 12,
            color: inDrsRange ? '#e8002d' : '#555',
            fontWeight: inDrsRange ? 700 : 400,
            animation: inDrsRange ? 'drsGlow 1.5s ease-in-out infinite' : 'none',
            transition: 'color 0.3s',
          }}>
            {d.interval === '–' ? '—' : d.interval}
          </span>
        </div>
      </td>

      {/* LAST LAP */}
      <td style={{ padding: '10px 8px', textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 4 }}>
          {d.isFastestLap && (
            <span style={{ color: '#d783ff', fontSize: 10 }}>⬟</span>
          )}
          <span style={{
            fontSize: 12,
            color: d.isFastestLap ? '#d783ff' : d.isPersonalBest ? '#39B54A' : '#555',
            fontWeight: d.isFastestLap || d.isPersonalBest ? 700 : 400,
            transition: 'color 0.3s',
          }}>
            {d.lastLapFormatted}
          </span>
        </div>
      </td>

      {/* STATUS */}
      <td style={{ padding: '10px 8px', textAlign: 'center' }}>
        {statusBadge && d.status !== 'RACING' ? (
          <span style={{
            background: statusBadge.bg, color: statusBadge.color,
            fontSize: 8, fontWeight: 800, letterSpacing: 1,
            padding: '2px 6px', borderRadius: 3,
          }}>
            {statusBadge.text}
          </span>
        ) : d.drsOpen ? (
          <span style={{ fontSize: 9, color: '#39B54A', fontWeight: 700, letterSpacing: 1 }}>DRS</span>
        ) : (
          <span style={{ color: '#ddd' }}>—</span>
        )}
      </td>

      {/* PIT STOPS */}
      <td style={{ padding: '10px 16px 10px 8px', textAlign: 'center' }}>
        <span style={{ fontSize: 12, color: '#888', fontVariantNumeric: 'tabular-nums' }}>
          {d.pitStops > 0 ? d.pitStops : '—'}
        </span>
      </td>
    </tr>
  );
}, (prev, next) => {
  // Only re-render if meaningful data changed
  return (
    prev.driver.position === next.driver.position &&
    prev.driver.gapToLeader === next.driver.gapToLeader &&
    prev.driver.interval === next.driver.interval &&
    prev.driver.lastLapFormatted === next.driver.lastLapFormatted &&
    prev.driver.tireCompound === next.driver.tireCompound &&
    prev.driver.tireLaps === next.driver.tireLaps &&
    prev.driver.drsOpen === next.driver.drsOpen &&
    prev.driver.positionChange === next.driver.positionChange &&
    prev.driver.status === next.driver.status &&
    prev.fastestLapDriverNum === next.fastestLapDriverNum
  );
});

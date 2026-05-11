import { memo, useEffect, useState } from 'react';
import type { LiveDriver } from '../../types';
import TireChip from './TireChip';

const POS_COLOR: Record<number, string> = { 1: '#FFD700', 2: '#C0C0C0', 3: '#CD7F32' };

const STATUS_BADGE: Record<string, { text: string; bg: string }> = {
  PIT_IN:  { text: 'PIT IN',  bg: '#FF8C00' },
  PIT_OUT: { text: 'PIT OUT', bg: '#39B54A' },
  DNF:     { text: 'DNF',     bg: '#e8002d' },
  DSQ:     { text: 'DSQ',     bg: '#e8002d' },
};

interface Props { driver: LiveDriver }

export default memo(function MobileDriverCard({ driver: d }: Props) {
  const [flash, setFlash] = useState<'none' | 'green' | 'red'>('none');

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
  }, [d.positionChange, d.position]);

  const gapVal = parseFloat(d.interval.replace('+', '').replace('s', ''));
  const inDrsZone = !isNaN(gapVal) && gapVal > 0 && gapVal <= 0.5;
  const inDrsRange = !isNaN(gapVal) && gapVal > 0 && gapVal <= 1.0;
  const isDnf = d.status === 'DNF' || d.status === 'DSQ';
  const badge = STATUS_BADGE[d.status];

  const flashBg = flash === 'green'
    ? 'rgba(39,244,86,0.10)'
    : flash === 'red'
    ? 'rgba(232,0,45,0.08)'
    : '#fff';

  return (
    <div
      className="race-card"
      style={{
        background: flashBg,
        borderBottom: '1px solid #f0f0f0',
        padding: '12px 16px',
        minHeight: 64,
        opacity: isDnf ? 0.4 : 1,
        transition: 'background 0.4s ease',
        WebkitTapHighlightColor: 'transparent',
        touchAction: 'manipulation',
      }}
    >
      {/* Row 1: POS · bar · NAME · TIRE */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5 }}>
        {/* Position + arrow */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 3, width: 28, flexShrink: 0 }}>
          <span style={{ fontSize: 14, fontWeight: 800, color: POS_COLOR[d.position] ?? '#999', fontVariantNumeric: 'tabular-nums' }}>
            {d.position}
          </span>
          {d.positionChange === 'gained' && <span style={{ color: '#27f456', fontSize: 9 }}>▲</span>}
          {d.positionChange === 'lost'   && <span style={{ color: '#e8002d', fontSize: 9 }}>▼</span>}
        </div>

        {/* Team color bar */}
        <div style={{ width: 4, height: 36, borderRadius: 2, background: d.teamColor, flexShrink: 0 }} />

        {/* Driver name */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontSize: 14, fontWeight: 700, color: '#15151e',
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
          }}>
            {d.fullName}
          </div>
        </div>

        {/* Tire chip */}
        <TireChip compound={d.tireCompound} laps={d.tireLaps} />
      </div>

      {/* Row 2: team · gap · lap · last-lap */}
      <div style={{ display: 'flex', alignItems: 'center', paddingLeft: 40, gap: 8 }}>
        {/* Team name */}
        <span style={{ fontSize: 10, color: '#888', flex: '0 0 auto', maxWidth: 90, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {d.teamName}
        </span>

        <span style={{ color: '#ddd', fontSize: 10 }}>·</span>

        {/* Gap */}
        {d.gapToLeader === 'LEADER' ? (
          <span style={{ fontSize: 11, fontWeight: 700, color: '#27f4d2' }}>LEADER</span>
        ) : (
          <span style={{
            fontSize: 11, fontVariantNumeric: 'tabular-nums',
            color: inDrsRange ? '#e8002d' : '#555',
            fontWeight: inDrsRange ? 700 : 400,
          }}>
            {d.gapToLeader}
          </span>
        )}

        {inDrsZone && (
          <span style={{ fontSize: 8, background: '#39B54A', color: '#fff', padding: '1px 5px', borderRadius: 3, fontWeight: 800, letterSpacing: 0.5 }}>DRS</span>
        )}

        <span style={{ color: '#ddd', fontSize: 10 }}>·</span>

        {/* Lap */}
        <span style={{ fontSize: 11, color: '#888', fontVariantNumeric: 'tabular-nums' }}>
          L{d.currentLap || '–'}
        </span>

        {/* Spacer */}
        <div style={{ flex: 1 }} />

        {/* Last lap time */}
        <span style={{
          fontSize: 11, fontVariantNumeric: 'tabular-nums',
          color: d.isFastestLap ? '#d783ff' : d.isPersonalBest ? '#39B54A' : '#888',
          fontWeight: d.isFastestLap ? 700 : 400,
          display: 'flex', alignItems: 'center', gap: 3,
        }}>
          {d.isFastestLap && <span style={{ fontSize: 9 }}>⬟</span>}
          {d.lastLapFormatted}
        </span>
      </div>

      {/* Status badge (if relevant) */}
      {badge && d.status !== 'RACING' && (
        <div style={{ paddingLeft: 40, marginTop: 4 }}>
          <span style={{
            background: badge.bg, color: '#fff',
            fontSize: 8, fontWeight: 800, letterSpacing: 1,
            padding: '2px 8px', borderRadius: 3,
          }}>
            {badge.text}
          </span>
        </div>
      )}
    </div>
  );
}, (p, n) =>
  p.driver.position === n.driver.position &&
  p.driver.gapToLeader === n.driver.gapToLeader &&
  p.driver.interval === n.driver.interval &&
  p.driver.lastLapFormatted === n.driver.lastLapFormatted &&
  p.driver.tireCompound === n.driver.tireCompound &&
  p.driver.tireLaps === n.driver.tireLaps &&
  p.driver.drsOpen === n.driver.drsOpen &&
  p.driver.positionChange === n.driver.positionChange &&
  p.driver.status === n.driver.status
);

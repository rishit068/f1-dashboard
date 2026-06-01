import { memo } from 'react';
import type { RaceResult } from '../../types';
import { NAT_FLAGS } from '../../utils';

interface Props {
  result: RaceResult;
  index: number;
}

const POS_COLOR = (pos: RaceResult['position']): string => {
  if (pos === 1) return '#FFD700';
  if (pos === 2) return '#C0C0C0';
  if (pos === 3) return '#CD7F32';
  if (typeof pos === 'number') return pos <= 10 ? '#ffffff' : 'rgba(255,255,255,0.55)';
  return '#e8002d'; // DNF/DSQ/DNS
};

export default memo(function ResultRow({ result: r, index: _index }: Props) {
  const flag = NAT_FLAGS[r.nationality] ?? '';
  const isDnf = typeof r.position !== 'number';
  const gridDiff = typeof r.position === 'number' ? r.grid - r.position : 0;
  const posColor = POS_COLOR(r.position);
  const isP1 = r.position === 1;

  // Gap display
  let gapDisplay = r.gap;
  if (r.position === 1) gapDisplay = r.raceTime;
  else if (r.status && r.status !== 'Finished' && !r.gap.startsWith('+')) {
    gapDisplay = r.status;
  }

  // Grid change
  let gridEl: React.ReactNode = null;
  if (!isDnf && r.grid > 0) {
    if (gridDiff > 0) {
      gridEl = <span style={{ color: '#27B34A', fontSize: 10, fontWeight: 700 }}>▲{gridDiff}</span>;
    } else if (gridDiff < 0) {
      gridEl = <span style={{ color: '#e8002d', fontSize: 10, fontWeight: 700 }}>▼{Math.abs(gridDiff)}</span>;
    } else {
      gridEl = <span style={{ color: '#bbb', fontSize: 10 }}>↔</span>;
    }
  }

  // Gap color
  const gapColor = isDnf || r.status === 'Finished' || r.gap.startsWith('+')
    ? 'rgba(255,255,255,0.55)'
    : '#e8002d'; // accident/engine etc

  // Glass row — P1 gets a gold tint
  const baseBg     = isP1 ? 'rgba(255,215,0,0.05)' : 'rgba(255,255,255,0.04)';
  const baseBorder = isP1 ? 'rgba(255,215,0,0.15)' : 'rgba(255,255,255,0.08)';
  return (
    <div
      style={{
        display: 'flex', alignItems: 'center', gap: 10,
        padding: '12px 16px',
        minHeight: 64,
        background: baseBg,
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        border: `1px solid ${baseBorder}`,
        borderRadius: 12,
        cursor: 'default',
        WebkitTapHighlightColor: 'transparent',
        touchAction: 'manipulation',
        transition: 'background 0.15s, border-color 0.15s',
      } as React.CSSProperties}
      onMouseEnter={e => {
        const el = e.currentTarget as HTMLElement;
        el.style.background = isP1 ? 'rgba(255,215,0,0.08)' : 'rgba(255,255,255,0.07)';
        el.style.borderColor = isP1 ? 'rgba(255,215,0,0.25)' : 'rgba(255,255,255,0.12)';
      }}
      onMouseLeave={e => {
        const el = e.currentTarget as HTMLElement;
        el.style.background = baseBg;
        el.style.borderColor = baseBorder;
      }}
    >
      {/* Position */}
      <div style={{ width: 28, flexShrink: 0, textAlign: 'center' }}>
        {isDnf ? (
          <span style={{ fontSize: 10, fontWeight: 800, color: '#e8002d', letterSpacing: 0.5 }}>
            {String(r.position)}
          </span>
        ) : (
          <span style={{ fontSize: 16, fontWeight: 800, color: posColor, fontVariantNumeric: 'tabular-nums' }}>
            {r.position}
          </span>
        )}
      </div>

      {/* Team color bar */}
      <div style={{ width: 4, height: 40, borderRadius: 2, background: r.teamColor, flexShrink: 0 }} />

      {/* Driver info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        {/* Name + flag */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 5,
          fontSize: 14, fontWeight: 700, color: '#ffffff',
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
        }}>
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {r.fullName}
          </span>
          <span style={{ fontSize: 13, flexShrink: 0 }}>{flag}</span>
        </div>

        {/* Team + grid info */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 3 }}>
          <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.55)' }}>{r.team}</span>
          {r.grid > 0 && (
            <>
              <span style={{ color: 'rgba(255,255,255,0.25)', fontSize: 10 }}>·</span>
              <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.45)' }}>P{r.grid}</span>
              {gridEl}
            </>
          )}
        </div>
      </div>

      {/* Right side: points + time */}
      <div style={{ flexShrink: 0, textAlign: 'right' }}>
        {/* Points */}
        <div style={{
          fontSize: 14, fontWeight: 800,
          color: r.points > 0 ? '#ffffff' : 'rgba(255,255,255,0.35)',
          fontVariantNumeric: 'tabular-nums',
        }}>
          {r.points > 0 ? `${r.points}` : '—'}
          {r.points > 0 && <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.45)', marginLeft: 2 }}>PTS</span>}
        </div>

        {/* Race time / gap */}
        <div style={{
          fontSize: 10, color: gapColor,
          fontVariantNumeric: 'tabular-nums', fontFamily: 'monospace',
          marginTop: 2, maxWidth: 90, textAlign: 'right',
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
        }}>
          {gapDisplay}
        </div>

        {/* Fastest lap + laps */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, justifyContent: 'flex-end', marginTop: 2 }}>
          {r.fastestLap && (
            <span style={{ fontSize: 11, color: '#d783ff' }} title="Fastest Lap">⬟</span>
          )}
          <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.35)' }}>{r.laps}L</span>
        </div>
      </div>
    </div>
  );
});

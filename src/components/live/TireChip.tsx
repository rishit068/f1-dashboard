import { memo } from 'react';

const TIRE_CFG: Record<string, { bg: string; color: string; label: string }> = {
  SOFT:         { bg: '#e8002d', color: '#fff',  label: 'S' },
  MEDIUM:       { bg: '#FFF200', color: '#000',  label: 'M' },
  HARD:         { bg: '#FFFFFF', color: '#000',  label: 'H' },
  INTERMEDIATE: { bg: '#39B54A', color: '#fff',  label: 'I' },
  WET:          { bg: '#0067FF', color: '#fff',  label: 'W' },
  UNKNOWN:      { bg: '#555',    color: '#ccc',  label: '?' },
};

interface Props {
  compound: string;
  laps: number;
}

export default memo(function TireChip({ compound, laps }: Props) {
  const cfg = TIRE_CFG[compound.toUpperCase()] ?? TIRE_CFG.UNKNOWN;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
      <div style={{
        width: 26, height: 26, borderRadius: '50%',
        background: cfg.bg,
        color: cfg.color,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 10, fontWeight: 800,
        border: compound === 'HARD' ? '1.5px solid #ccc' : 'none',
        boxShadow: '0 1px 4px rgba(0,0,0,0.2)',
      }}>
        {cfg.label}
      </div>
      <span style={{ fontSize: 9, color: '#888', lineHeight: 1 }}>L{laps}</span>
    </div>
  );
});

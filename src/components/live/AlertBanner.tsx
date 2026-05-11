import type { LiveRaceState } from '../../types';

interface Props {
  status: LiveRaceState['safetyCarStatus'];
}

const CONFIGS = {
  SAFETY_CAR: {
    bg: '#FFD700', color: '#000',
    text: '⚠ SAFETY CAR DEPLOYED',
    animation: 'none',
  },
  VIRTUAL_SC: {
    bg: '#FFA500', color: '#000',
    text: '⚠ VIRTUAL SAFETY CAR',
    animation: 'none',
  },
  RED_FLAG: {
    bg: '#e8002d', color: '#fff',
    text: '🔴 RED FLAG — RACE SUSPENDED',
    animation: 'livePulse 0.9s ease-in-out infinite',
  },
};

export default function AlertBanner({ status }: Props) {
  if (status === 'NONE') return null;
  const cfg = CONFIGS[status];

  return (
    <div style={{
      background: cfg.bg,
      color: cfg.color,
      textAlign: 'center',
      padding: '10px 32px',
      fontSize: 13,
      fontWeight: 800,
      letterSpacing: 3,
      animation: cfg.animation,
      borderBottom: `2px solid ${cfg.color === '#fff' ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.2)'}`,
    }}>
      {cfg.text}
    </div>
  );
}

import { useEffect, useState } from 'react';

interface Props {
  onDone: () => void;
}

export default function IntroAnimation({ onDone }: Props) {
  const [phase, setPhase] = useState<'lights' | 'name' | 'done'>('lights');
  const [litCount, setLitCount] = useState(0);
  const [allOut, setAllOut] = useState(false);
  const [showName, setShowName] = useState(false);

  useEffect(() => {
    // Light up 5 lights, 200ms each
    const timers: ReturnType<typeof setTimeout>[] = [];
    for (let i = 1; i <= 5; i++) {
      timers.push(setTimeout(() => setLitCount(i), i * 200));
    }
    // All go out at 1.4s
    timers.push(setTimeout(() => setAllOut(true), 1400));
    // Show "RISHIT" at 1.7s
    timers.push(setTimeout(() => { setPhase('name'); setShowName(true); }, 1700));
    // Fade out name, signal done at 2.7s
    timers.push(setTimeout(() => { setShowName(false); }, 2500));
    timers.push(setTimeout(() => { setPhase('done'); onDone(); }, 2900));
    return () => timers.forEach(clearTimeout);
  }, [onDone]);

  if (phase === 'done') return null;

  return (
    <div style={{
      position: 'fixed', inset: 0, background: '#0a0a10',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      zIndex: 9999, gap: 48,
    }}>
      {/* Five F1 start lights */}
      <div style={{ display: 'flex', gap: 20 }}>
        {[1, 2, 3, 4, 5].map(i => (
          <div key={i} style={{
            width: 56, height: 56,
            borderRadius: '50%',
            background: (!allOut && litCount >= i) ? '#e8002d' : '#1e1e2a',
            border: '2px solid #2e2e3a',
            boxShadow: (!allOut && litCount >= i)
              ? '0 0 24px 8px rgba(232,0,45,0.7), 0 0 4px 2px rgba(232,0,45,0.9)'
              : 'none',
            transition: 'background 0.12s, box-shadow 0.12s',
          }} />
        ))}
      </div>

      {/* RISHIT name reveal */}
      {phase === 'name' && (
        <div style={{
          fontSize: 72, fontWeight: 900, color: '#ffffff',
          letterSpacing: 16, fontFamily: "'Titillium Web', sans-serif",
          opacity: showName ? 1 : 0,
          transform: showName ? 'scale(1)' : 'scale(0.92)',
          transition: 'opacity 0.35s ease, transform 0.35s ease',
          textTransform: 'uppercase',
        }}>
          RISHIT
        </div>
      )}
    </div>
  );
}

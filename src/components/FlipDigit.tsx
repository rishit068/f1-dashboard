import { useEffect, useRef, useState } from 'react';
import { padTwo } from '../utils';

interface Props {
  value: number;
  label: string;
}

export default function FlipDigit({ value, label }: Props) {
  const [display, setDisplay] = useState(value);
  const [animating, setAnimating] = useState(false);
  const prevRef = useRef(value);

  useEffect(() => {
    if (value !== prevRef.current) {
      setAnimating(true);
      const id = setTimeout(() => {
        setDisplay(value);
        setAnimating(false);
      }, 140);
      prevRef.current = value;
      return () => clearTimeout(id);
    }
  }, [value]);

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
    }}>
      <div style={{
        background: '#1e1e2a',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: 8,
        padding: '14px 20px',
        minWidth: 80,
        textAlign: 'center',
        boxShadow: '0 4px 20px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.05)',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* Horizontal divider line through middle (classic flip clock look) */}
        <div style={{
          position: 'absolute', left: 0, right: 0, top: '50%',
          height: 1, background: 'rgba(0,0,0,0.4)', zIndex: 2,
        }} />
        <span
          key={display}
          className={animating ? '' : ''}
          style={{
            display: 'block',
            fontSize: 48, fontWeight: 900, color: '#ffffff',
            fontVariantNumeric: 'tabular-nums',
            letterSpacing: -1,
            animation: animating ? undefined : 'flipIn 0.28s ease-out',
            lineHeight: 1,
          }}
        >
          {padTwo(display)}
        </span>
      </div>
      <span style={{
        fontSize: 9, fontWeight: 700, letterSpacing: 2.5,
        color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase',
      }}>
        {label}
      </span>
    </div>
  );
}

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
      <div className="glass-gradient-border glass-hover" style={{
        borderRadius: 14,
        padding: '20px 24px',
        minWidth: 84,
        textAlign: 'center',
        position: 'relative',
        overflow: 'hidden',
      }}>
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
            textShadow: '0 0 20px rgba(0,212,255,0.20)',
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

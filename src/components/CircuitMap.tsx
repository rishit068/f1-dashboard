import { useState } from 'react';
import { getCircuitImage } from '../data/circuitImages';

interface Props {
  circuitId: string;
  color?: string;
  isMobile?: boolean;
}

function CircuitFallback() {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      width: '100%', minHeight: 180,
    }}>
      <div style={{ fontSize: 40, marginBottom: 10 }}>🏎️</div>
      <div style={{ fontSize: 11, color: '#333', letterSpacing: 0.5 }}>Circuit map unavailable</div>
    </div>
  );
}

function Shimmer({ isMobile }: { isMobile: boolean }) {
  return (
    <>
      <style>{`
        @keyframes circuitShimmer {
          0%   { background-position: 200% center; }
          100% { background-position: -200% center; }
        }
      `}</style>
      <div style={{
        width: '100%',
        height: isMobile ? 180 : 240,
        borderRadius: 8,
        background: 'linear-gradient(90deg, #111520 0%, #1c2035 45%, #111520 100%)',
        backgroundSize: '200% 100%',
        animation: 'circuitShimmer 1.4s ease-in-out infinite',
      }} />
    </>
  );
}

export default function CircuitMap({ circuitId, color = '#e8002d', isMobile = false }: Props) {
  const circuit = getCircuitImage(circuitId);
  const [loaded, setLoaded] = useState(false);
  const [error,  setError]  = useState(false);

  // No data or no imageUrl → immediate fallback
  if (!circuit || !circuit.imageUrl) return <CircuitFallback />;
  if (error) return <CircuitFallback />;

  return (
    <div style={{ position: 'relative', width: '100%' }}>
      {/* Shimmer shown until image resolves */}
      {!loaded && (
        <div style={{ position: 'absolute', inset: 0, zIndex: 0 }}>
          <Shimmer isMobile={isMobile} />
        </div>
      )}

      {/* Image wrapper — fades in once loaded */}
      <div style={{
        position: 'relative', zIndex: 1,
        opacity: loaded ? 1 : 0,
        transition: 'opacity 0.5s ease',
        minHeight: loaded ? 0 : (isMobile ? 180 : 240),
      }}>
        {/* Team-colour radial glow */}
        <div style={{
          position: 'absolute', inset: 0, borderRadius: 8,
          pointerEvents: 'none', zIndex: 2,
          background: `radial-gradient(ellipse 80% 70% at 50% 50%, transparent 50%, ${color}18 100%)`,
        }} />

        {/*
          Circuit image from Wikimedia Commons CDN.
          All URLs are verified with the Commons API (correct MD5 hash prefix).
          filter: invert(1) hue-rotate(180deg) flips the white-background Wikipedia
          circuit maps so the track appears light on our dark panel.
        */}
        <img
          src={circuit.imageUrl}
          alt={`${circuit.name} circuit map`}
          onLoad={() => setLoaded(true)}
          onError={() => setError(true)}
          style={{
            display: 'block',
            width: '100%',
            maxWidth: isMobile ? 340 : 400,
            height: 'auto',
            margin: '0 auto',
            borderRadius: 6,
            filter: 'invert(1) hue-rotate(180deg) brightness(0.88) contrast(1.05)',
          } as React.CSSProperties}
        />

        {/* Circuit name watermark */}
        {loaded && (
          <div style={{
            position: 'absolute', bottom: 6, left: 8, zIndex: 3,
            fontSize: 8, fontWeight: 700, letterSpacing: 1.2,
            color: 'rgba(255,255,255,0.15)', fontFamily: 'monospace',
            textTransform: 'uppercase', pointerEvents: 'none',
            userSelect: 'none',
          }}>
            {circuit.name}
          </div>
        )}
      </div>
    </div>
  );
}

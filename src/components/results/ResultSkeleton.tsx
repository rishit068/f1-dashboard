export default function ResultSkeleton() {
  const ph = 'linear-gradient(90deg, rgba(255,255,255,0.04) 25%, rgba(255,255,255,0.08) 50%, rgba(255,255,255,0.04) 75%)';
  return (
    <div style={{ padding: '0 16px', display: 'flex', flexDirection: 'column', gap: 6 }}>
      {Array.from({ length: 7 }).map((_, i) => (
        <div
          key={i}
          style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '12px 16px',
            minHeight: 64,
            background: 'rgba(255,255,255,0.04)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 12,
          }}
        >
          {/* Pos circle */}
          <div style={{
            width: 28, height: 28, borderRadius: '50%',
            background: ph,
            backgroundSize: '200% 100%',
            animation: 'resultShimmer 1.4s infinite',
            flexShrink: 0,
          }} />
          {/* Bar */}
          <div style={{ width: 4, height: 38, borderRadius: 2, background: 'rgba(255,255,255,0.08)', flexShrink: 0 }} />
          {/* Name + team */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
            <div style={{
              height: 14, width: `${140 + (i % 3) * 20}px`, borderRadius: 4,
              background: ph,
              backgroundSize: '200% 100%',
              animation: 'resultShimmer 1.4s infinite',
            }} />
            <div style={{
              height: 10, width: '90px', borderRadius: 4,
              background: ph,
              backgroundSize: '200% 100%',
              animation: 'resultShimmer 1.4s infinite',
            }} />
          </div>
          {/* Points */}
          <div style={{
            width: 48, height: 20, borderRadius: 4,
            background: ph,
            backgroundSize: '200% 100%',
            animation: 'resultShimmer 1.4s infinite',
            flexShrink: 0,
          }} />
        </div>
      ))}
      <style>{`
        @keyframes resultShimmer {
          0%   { background-position: -200% 0; }
          100% { background-position:  200% 0; }
        }
      `}</style>
    </div>
  );
}

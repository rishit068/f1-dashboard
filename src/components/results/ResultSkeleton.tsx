export default function ResultSkeleton() {
  return (
    <div>
      {Array.from({ length: 7 }).map((_, i) => (
        <div
          key={i}
          style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '12px 16px',
            minHeight: 64,
            background: i % 2 === 0 ? '#fff' : '#fafafa',
            borderBottom: '1px solid #f0f0f0',
          }}
        >
          {/* Pos circle */}
          <div style={{
            width: 28, height: 28, borderRadius: '50%',
            background: 'linear-gradient(90deg,#f0f0f0 25%,#e0e0e0 50%,#f0f0f0 75%)',
            backgroundSize: '200% 100%',
            animation: 'resultShimmer 1.4s infinite',
            flexShrink: 0,
          }} />
          {/* Bar */}
          <div style={{ width: 4, height: 38, borderRadius: 2, background: '#e8e8e0', flexShrink: 0 }} />
          {/* Name + team */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
            <div style={{
              height: 14, width: `${140 + (i % 3) * 20}px`, borderRadius: 4,
              background: 'linear-gradient(90deg,#f0f0f0 25%,#e0e0e0 50%,#f0f0f0 75%)',
              backgroundSize: '200% 100%',
              animation: 'resultShimmer 1.4s infinite',
            }} />
            <div style={{
              height: 10, width: '90px', borderRadius: 4,
              background: 'linear-gradient(90deg,#f0f0f0 25%,#e0e0e0 50%,#f0f0f0 75%)',
              backgroundSize: '200% 100%',
              animation: 'resultShimmer 1.4s infinite',
            }} />
          </div>
          {/* Points */}
          <div style={{
            width: 48, height: 20, borderRadius: 4,
            background: 'linear-gradient(90deg,#f0f0f0 25%,#e0e0e0 50%,#f0f0f0 75%)',
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

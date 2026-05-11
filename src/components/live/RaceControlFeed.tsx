import type { RaceControlMessage } from '../../types';
import { useIsMobile } from '../../hooks/useBreakpoint';

interface Props { messages: RaceControlMessage[] }

const FLAG_COLOR: Record<string, string> = {
  GREEN: '#39B54A', YELLOW: '#FFD700', RED: '#e8002d',
  BLUE: '#0067FF', BLACK: '#222', WHITE: '#ddd', SC: '#FFD700', VSC: '#FFA500', '': '#888',
};

function formatMsgIST(dateStr: string): string {
  return new Date(dateStr).toLocaleTimeString('en-IN', {
    hour: '2-digit', minute: '2-digit', second: '2-digit',
    hour12: false, timeZone: 'Asia/Kolkata',
  }) + ' IST';
}

export default function RaceControlFeed({ messages }: Props) {
  const isMobile = useIsMobile();

  return (
    <div style={{ flex: '1 1 65%', minWidth: 0 }}>
      <h3 className="mixed-heading" style={{ fontSize: isMobile ? 18 : 20, marginBottom: 4 }}>
        Race <span className="serif-red">Control</span>
      </h3>
      <div className="label" style={{ marginBottom: isMobile ? 12 : 16 }}>OFFICIAL MESSAGES · LIVE</div>

      <div style={{
        maxHeight: isMobile ? 320 : 420,
        overflowY: 'auto',
        border: '1px solid #e8e8e0',
        borderRadius: 8,
        background: '#fff',
        WebkitOverflowScrolling: 'touch',
      }}>
        {messages.length === 0 ? (
          <div style={{ padding: 28, textAlign: 'center', color: '#888', fontSize: 13 }}>
            Awaiting race control messages…
          </div>
        ) : (
          messages.map((msg, i) => {
            const dotColor = FLAG_COLOR[msg.flag?.toUpperCase() ?? ''] ?? '#888';
            return (
              <div key={i} style={{
                display: 'flex', gap: isMobile ? 0 : 12, alignItems: 'flex-start',
                padding: isMobile ? '12px 16px' : '12px 16px',
                borderBottom: i < messages.length - 1 ? '1px solid #f5f5f0' : 'none',
                /* Mobile: 4px left border instead of dot */
                borderLeft: isMobile ? `4px solid ${dotColor}` : 'none',
              }}>
                {/* Desktop only: dot */}
                {!isMobile && (
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: dotColor, marginTop: 4, flexShrink: 0, boxShadow: `0 0 6px ${dotColor}88` }} />
                )}

                <div style={{ flex: 1, minWidth: 0 }}>
                  {msg.category && (
                    <div style={{ fontSize: 9, fontWeight: 800, letterSpacing: 1.5, color: dotColor === '#888' ? '#555' : dotColor, marginBottom: 3 }}>
                      {msg.category.toUpperCase()}
                    </div>
                  )}
                  <div style={{ fontSize: 12, color: '#333', lineHeight: 1.5 }}>{msg.message}</div>
                  {/* Time below on mobile */}
                  {isMobile && (
                    <div style={{ fontSize: 9, color: '#bbb', marginTop: 4 }}>
                      {msg.lapNumber != null ? `LAP ${msg.lapNumber} · ` : ''}{formatMsgIST(msg.date)}
                    </div>
                  )}
                </div>

                {/* Desktop: time right-aligned */}
                {!isMobile && (
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    {msg.lapNumber != null && <div style={{ fontSize: 9, color: '#aaa', letterSpacing: 0.5 }}>LAP {msg.lapNumber}</div>}
                    <div style={{ fontSize: 9, color: '#bbb', marginTop: 2 }}>{formatMsgIST(msg.date)}</div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

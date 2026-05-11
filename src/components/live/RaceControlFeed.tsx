import type { RaceControlMessage } from '../../types';

interface Props {
  messages: RaceControlMessage[];
}

const FLAG_DOT: Record<string, string> = {
  GREEN:  '#39B54A',
  YELLOW: '#FFD700',
  RED:    '#e8002d',
  BLUE:   '#0067FF',
  BLACK:  '#222',
  WHITE:  '#ddd',
  SC:     '#FFD700',
  VSC:    '#FFA500',
  '':     '#888',
};

function formatMsgIST(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleTimeString('en-IN', {
    hour: '2-digit', minute: '2-digit', second: '2-digit',
    hour12: false, timeZone: 'Asia/Kolkata',
  }) + ' IST';
}

export default function RaceControlFeed({ messages }: Props) {
  return (
    <div style={{ flex: '1 1 65%', minWidth: 0 }}>
      <h3 className="mixed-heading" style={{ fontSize: 20, marginBottom: 4 }}>
        Race <span className="serif-red">Control</span>
      </h3>
      <div className="label" style={{ marginBottom: 16 }}>OFFICIAL MESSAGES · LIVE</div>

      <div style={{
        maxHeight: 420, overflowY: 'auto',
        border: '1px solid #e8e8e0',
        borderRadius: 8,
        background: '#fff',
      }}>
        {messages.length === 0 ? (
          <div style={{ padding: 32, textAlign: 'center', color: '#888', fontSize: 13 }}>
            Awaiting race control messages…
          </div>
        ) : (
          messages.map((msg, i) => {
            const dotColor = FLAG_DOT[msg.flag?.toUpperCase() ?? ''] ?? '#888';
            return (
              <div key={i} style={{
                display: 'flex', gap: 12, alignItems: 'flex-start',
                padding: '12px 16px',
                borderBottom: i < messages.length - 1 ? '1px solid #f5f5f0' : 'none',
              }}>
                {/* Flag dot */}
                <div style={{
                  width: 8, height: 8, borderRadius: '50%',
                  background: dotColor,
                  marginTop: 4, flexShrink: 0,
                  boxShadow: `0 0 6px ${dotColor}88`,
                }} />

                <div style={{ flex: 1, minWidth: 0 }}>
                  {msg.category && (
                    <div style={{
                      fontSize: 9, fontWeight: 800, letterSpacing: 1.5,
                      color: dotColor === '#888' ? '#555' : dotColor,
                      marginBottom: 3,
                    }}>
                      {msg.category.toUpperCase()}
                    </div>
                  )}
                  <div style={{ fontSize: 12, color: '#333', lineHeight: 1.5 }}>
                    {msg.message}
                  </div>
                </div>

                {/* Lap + time */}
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  {msg.lapNumber != null && (
                    <div style={{ fontSize: 9, color: '#aaa', letterSpacing: 0.5 }}>
                      LAP {msg.lapNumber}
                    </div>
                  )}
                  <div style={{ fontSize: 9, color: '#bbb', marginTop: 2 }}>
                    {formatMsgIST(msg.date)}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

import { useEffect, useState } from 'react';
import type { LiveRaceState, LivePhase } from '../../types';

interface Props {
  data: LiveRaceState;
  phase: LivePhase;
}

function SecondsSince(date: Date) {
  const [secs, setSecs] = useState(0);
  useEffect(() => {
    const tick = () => setSecs(Math.floor((Date.now() - date.getTime()) / 1000));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [date]);
  return secs;
}

function SCBadge({ status }: { status: LiveRaceState['safetyCarStatus'] }) {
  if (status === 'NONE') return null;
  const cfg = {
    SAFETY_CAR: { bg: '#FFD700', color: '#000', text: 'SAFETY CAR', pulse: false },
    VIRTUAL_SC:  { bg: 'transparent', color: '#FFD700', text: 'VIRTUAL SC', pulse: false, border: '1px solid #FFD700' },
    RED_FLAG:    { bg: '#e8002d', color: '#fff', text: 'RED FLAG', pulse: true },
  }[status];
  if (!cfg) return null;
  return (
    <div style={{
      background: cfg.bg,
      color: cfg.color,
      border: ('border' in cfg) ? cfg.border : undefined,
      padding: '4px 12px',
      borderRadius: 4,
      fontSize: 10,
      fontWeight: 800,
      letterSpacing: 2,
      animation: cfg.pulse ? 'livePulse 0.8s ease-in-out infinite' : 'none',
    }}>
      {cfg.text}
    </div>
  );
}

export default function SessionHeader({ data, phase }: Props) {
  const secs = SecondsSince(data.lastUpdated);
  const pct = data.session.totalLaps > 0
    ? Math.min(100, (data.currentLap / data.session.totalLaps) * 100)
    : 0;
  const wx = data.weather;

  return (
    <div style={{
      background: '#15151e',
      padding: '0 32px',
      borderBottom: '1px solid rgba(255,255,255,0.06)',
    }}>
      <div style={{
        maxWidth: 1200, margin: '0 auto',
        height: 90,
        display: 'flex', alignItems: 'center',
        gap: 40,
      }}>
        {/* Left — session status */}
        <div style={{ flex: '1 1 auto', minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
            {phase === 'LIVE' ? (
              <div style={{
                background: 'rgba(232,0,45,0.15)',
                border: '1px solid rgba(232,0,45,0.4)',
                borderRadius: 20, padding: '3px 12px',
                display: 'flex', alignItems: 'center', gap: 6,
              }}>
                <span className="live-dot" style={{ color: '#e8002d', fontSize: 8 }}>●</span>
                <span style={{ fontSize: 9, fontWeight: 800, letterSpacing: 2, color: '#e8002d' }}>
                  RACE IN PROGRESS
                </span>
              </div>
            ) : (
              <div style={{
                background: 'rgba(136,136,136,0.15)',
                border: '1px solid rgba(136,136,136,0.3)',
                borderRadius: 20, padding: '3px 12px',
              }}>
                <span style={{ fontSize: 9, fontWeight: 800, letterSpacing: 2, color: '#888' }}>
                  RACE COMPLETE
                </span>
              </div>
            )}
            <SCBadge status={data.safetyCarStatus} />
          </div>
          <div style={{ color: '#fff', fontSize: 18, fontWeight: 700, lineHeight: 1.2 }}>
            {data.session.name}
          </div>
          <div style={{ color: '#888', fontSize: 11, marginTop: 2, letterSpacing: 0.5 }}>
            {data.session.circuit}
            {data.session.round ? ` · Round ${data.session.round}` : ''}
          </div>
        </div>

        {/* Center — lap counter + bar */}
        <div style={{ textAlign: 'center', flexShrink: 0 }}>
          <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: 2, color: '#888', marginBottom: 4 }}>
            LAP
          </div>
          <div style={{
            fontSize: 40, fontWeight: 900, color: '#fff',
            fontVariantNumeric: 'tabular-nums', lineHeight: 1,
          }}>
            {data.currentLap}
            <span style={{ fontSize: 22, color: '#555', fontWeight: 600 }}>
              /{data.session.totalLaps}
            </span>
          </div>
          {/* Progress bar */}
          <div style={{
            width: 140, height: 3, background: '#2a2a35',
            borderRadius: 2, marginTop: 8, overflow: 'hidden',
          }}>
            <div style={{
              width: `${pct}%`, height: '100%',
              background: '#e8002d',
              transition: 'width 0.8s ease',
              borderRadius: 2,
            }} />
          </div>
        </div>

        {/* Right — weather + last updated */}
        <div style={{ flexShrink: 0, textAlign: 'right' }}>
          {wx && (
            <div style={{
              display: 'flex', gap: 16, alignItems: 'center',
              marginBottom: 6, justifyContent: 'flex-end',
            }}>
              <WeatherItem icon="🌡️" label="Track" value={`${wx.trackTemp.toFixed(0)}°C`} />
              <WeatherItem icon="🌤️" label="Air"   value={`${wx.airTemp.toFixed(0)}°C`} />
              <WeatherItem icon="💧" label="Hum"   value={`${wx.humidity.toFixed(0)}%`} />
              <WeatherItem icon="🌧️" label="Rain"  value={wx.rainfall > 0 ? 'Yes' : 'No'} />
              <WeatherItem icon="💨" label="Wind"  value={`${wx.windSpeed.toFixed(1)}m/s`} />
            </div>
          )}
          <div style={{
            fontSize: 9, color: '#444', letterSpacing: 1,
            transition: 'color 0.3s',
          }}>
            ↻ Updated {secs}s ago
            {data.isStale && <span style={{ color: '#e8002d', marginLeft: 6 }}>⚠ DATA MAY BE DELAYED</span>}
          </div>
        </div>
      </div>
    </div>
  );
}

function WeatherItem({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{ fontSize: 13, marginBottom: 1 }}>{icon}</div>
      <div style={{ fontSize: 8, color: '#555', letterSpacing: 1 }}>{label}</div>
      <div style={{ fontSize: 10, fontWeight: 700, color: '#ccc' }}>{value}</div>
    </div>
  );
}

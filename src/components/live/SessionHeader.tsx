import { useEffect, useState } from 'react';
import type { LiveRaceState, LivePhase } from '../../types';
import { useIsMobile } from '../../hooks/useBreakpoint';
import {
  getSessionDisplayName, getSessionColors, getSessionIcon, getLapDisplay,
} from '../../utils/sessionHelpers';

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
    SAFETY_CAR: { bg: '#FFD700', color: '#000', text: 'SC',        pulse: false },
    VIRTUAL_SC:  { bg: 'transparent', color: '#FFD700', text: 'VSC', pulse: false, border: '1px solid #FFD700' },
    RED_FLAG:    { bg: '#e8002d', color: '#fff', text: 'RED FLAG',  pulse: true },
  }[status];
  if (!cfg) return null;
  return (
    <div style={{
      background: cfg.bg, color: cfg.color,
      border: ('border' in cfg) ? cfg.border : undefined,
      padding: '3px 10px', borderRadius: 4,
      fontSize: 9, fontWeight: 800, letterSpacing: 2,
      animation: cfg.pulse ? 'livePulse 0.8s ease-in-out infinite' : 'none',
      flexShrink: 0,
    }}>
      {cfg.text}
    </div>
  );
}

export default function SessionHeader({ data, phase }: Props) {
  const isMobile = useIsMobile();
  const secs = SecondsSince(data.lastUpdated);
  const wx = data.weather;

  // Session-aware labelling: practice = green, qualifying = cyan, sprint = amber, race = red
  const sessionLike = { session_name: data.session.name };
  const sessionColors = getSessionColors(sessionLike);
  const sessionLabel  = getSessionDisplayName(sessionLike);
  const sessionIcon   = getSessionIcon(sessionLike);
  const lap           = getLapDisplay(sessionLike, data.currentLap, data.session.totalLaps);
  const pct           = lap.showProgress ? Math.min(100, lap.progress * 100) : 0;

  if (isMobile) {
    return (
      <div style={{ background: '#15151e', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        {/* Top row: session badge · session name · SC badge */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 16px 6px' }}>
          {phase === 'LIVE' ? (
            <div style={{
              background: sessionColors.tint, border: `1px solid ${sessionColors.border}`,
              borderRadius: 20, padding: '3px 10px',
              display: 'flex', alignItems: 'center', gap: 5, flexShrink: 0,
            }}>
              <span className="live-dot" style={{ color: sessionColors.primary, fontSize: 7 }}>●</span>
              <span style={{ fontSize: 8, fontWeight: 800, letterSpacing: 1.5, color: sessionColors.primary }}>
                {sessionIcon} {sessionLabel} · LIVE
              </span>
            </div>
          ) : (
            <div style={{ background: 'rgba(136,136,136,0.15)', border: '1px solid rgba(136,136,136,0.3)', borderRadius: 20, padding: '3px 10px', flexShrink: 0 }}>
              <span style={{ fontSize: 8, fontWeight: 800, letterSpacing: 1.5, color: '#888' }}>{sessionLabel} · DONE</span>
            </div>
          )}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ color: '#fff', fontSize: 14, fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {data.session.name}
            </div>
            <div style={{ color: '#666', fontSize: 10, marginTop: 1 }}>{data.session.circuit}</div>
          </div>
          <SCBadge status={data.safetyCarStatus} />
        </div>

        {/* Lap / session counter row */}
        <div style={{ padding: '0 16px 8px', textAlign: 'center' }}>
          {lap.showProgress ? (
            <>
              <div style={{ fontSize: 22, fontWeight: 900, color: '#fff', fontVariantNumeric: 'tabular-nums', letterSpacing: -0.5 }}>
                LAP{' '}
                <span style={{ color: sessionColors.primary }}>{data.currentLap}</span>
                <span style={{ fontSize: 14, color: '#555', fontWeight: 600 }}>/{data.session.totalLaps}</span>
              </div>
              <div style={{ width: '100%', height: 4, background: '#2a2a35', borderRadius: 2, marginTop: 6, overflow: 'hidden' }}>
                <div style={{ width: `${pct}%`, height: '100%', background: sessionColors.primary, borderRadius: 2, transition: 'width 1s ease' }} />
              </div>
            </>
          ) : (
            <div style={{ fontSize: 16, fontWeight: 800, color: sessionColors.primary, letterSpacing: 1.5, padding: '4px 0 6px' }}>
              {lap.value} IN PROGRESS
            </div>
          )}
        </div>

        {/* Weather strip — horizontal scroll */}
        {wx && (
          <div style={{ display: 'flex', gap: 0, overflowX: 'auto', borderTop: '1px solid rgba(255,255,255,0.04)', scrollbarWidth: 'none' }}>
            {[
              { icon: '🌡️', label: 'TRACK', val: `${wx.trackTemp.toFixed(0)}°C` },
              { icon: '🌤️', label: 'AIR',   val: `${wx.airTemp.toFixed(0)}°C` },
              { icon: '💧', label: 'HUM',   val: `${wx.humidity.toFixed(0)}%` },
              { icon: '🌧️', label: 'RAIN',  val: wx.rainfall > 0 ? 'Yes' : 'No' },
              { icon: '💨', label: 'WIND',  val: `${wx.windSpeed.toFixed(1)}m/s` },
            ].map(w => (
              <div key={w.label} style={{ flex: '0 0 60px', textAlign: 'center', padding: '7px 4px' }}>
                <div style={{ fontSize: 12 }}>{w.icon}</div>
                <div style={{ fontSize: 8, color: '#555', letterSpacing: 0.5 }}>{w.label}</div>
                <div style={{ fontSize: 10, fontWeight: 700, color: '#aaa' }}>{w.val}</div>
              </div>
            ))}
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'flex-end', paddingRight: 12 }}>
              <span style={{ fontSize: 9, color: '#444' }}>↻ {secs}s ago</span>
            </div>
          </div>
        )}
      </div>
    );
  }

  /* ── Desktop layout (unchanged) ─────────────────────────────────────────── */
  return (
    <div style={{ background: '#15151e', padding: '0 32px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', height: 90, display: 'flex', alignItems: 'center', gap: 40 }}>
        {/* Left */}
        <div style={{ flex: '1 1 auto', minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
            {phase === 'LIVE' ? (
              <div style={{ background: sessionColors.tint, border: `1px solid ${sessionColors.border}`, borderRadius: 20, padding: '3px 12px', display: 'flex', alignItems: 'center', gap: 6 }}>
                <span className="live-dot" style={{ color: sessionColors.primary, fontSize: 8 }}>●</span>
                <span style={{ fontSize: 9, fontWeight: 800, letterSpacing: 2, color: sessionColors.primary }}>
                  {sessionIcon} {sessionLabel} · LIVE
                </span>
              </div>
            ) : (
              <div style={{ background: 'rgba(136,136,136,0.15)', border: '1px solid rgba(136,136,136,0.3)', borderRadius: 20, padding: '3px 12px' }}>
                <span style={{ fontSize: 9, fontWeight: 800, letterSpacing: 2, color: '#888' }}>{sessionLabel} · COMPLETE</span>
              </div>
            )}
            <SCBadge status={data.safetyCarStatus} />
          </div>
          <div style={{ color: '#fff', fontSize: 18, fontWeight: 700, lineHeight: 1.2 }}>{data.session.name}</div>
          <div style={{ color: '#888', fontSize: 11, marginTop: 2 }}>{data.session.circuit}{data.session.round ? ` · Round ${data.session.round}` : ''}</div>
        </div>
        {/* Center */}
        <div style={{ textAlign: 'center', flexShrink: 0 }}>
          <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: 2, color: '#888', marginBottom: 4 }}>{lap.label}</div>
          {lap.showProgress ? (
            <>
              <div style={{ fontSize: 40, fontWeight: 900, color: '#fff', fontVariantNumeric: 'tabular-nums', lineHeight: 1 }}>
                {data.currentLap}
                <span style={{ fontSize: 22, color: '#555', fontWeight: 600 }}>/{data.session.totalLaps}</span>
              </div>
              <div style={{ width: 140, height: 3, background: '#2a2a35', borderRadius: 2, marginTop: 8, overflow: 'hidden' }}>
                <div style={{ width: `${pct}%`, height: '100%', background: sessionColors.primary, transition: 'width 0.8s ease', borderRadius: 2 }} />
              </div>
            </>
          ) : (
            <div style={{ fontSize: 28, fontWeight: 900, color: sessionColors.primary, lineHeight: 1, letterSpacing: 1 }}>
              {lap.value}
            </div>
          )}
        </div>
        {/* Right */}
        <div style={{ flexShrink: 0, textAlign: 'right' }}>
          {wx && (
            <div style={{ display: 'flex', gap: 16, alignItems: 'center', marginBottom: 6, justifyContent: 'flex-end' }}>
              {[
                { icon: '🌡️', label: 'Track', value: `${wx.trackTemp.toFixed(0)}°C` },
                { icon: '🌤️', label: 'Air',   value: `${wx.airTemp.toFixed(0)}°C` },
                { icon: '💧', label: 'Hum',   value: `${wx.humidity.toFixed(0)}%` },
                { icon: '🌧️', label: 'Rain',  value: wx.rainfall > 0 ? 'Yes' : 'No' },
                { icon: '💨', label: 'Wind',  value: `${wx.windSpeed.toFixed(1)}m/s` },
              ].map(({ icon, label, value }) => (
                <div key={label} style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 13, marginBottom: 1 }}>{icon}</div>
                  <div style={{ fontSize: 8, color: '#555', letterSpacing: 1 }}>{label}</div>
                  <div style={{ fontSize: 10, fontWeight: 700, color: '#ccc' }}>{value}</div>
                </div>
              ))}
            </div>
          )}
          <div style={{ fontSize: 9, color: '#444', letterSpacing: 1 }}>
            ↻ Updated {secs}s ago
            {data.isStale && <span style={{ color: '#e8002d', marginLeft: 6 }}>⚠ DATA MAY BE DELAYED</span>}
          </div>
        </div>
      </div>
    </div>
  );
}

import { useRef, useState } from 'react';
import type { Race, SelectedRace } from '../types';
import { formatDateRange, COUNTRY_FLAGS, COUNTRY_CODES } from '../utils';
import { useIsMobile } from '../hooks/useBreakpoint';
import { getCircuitImage } from '../data/circuitImages';
import CircuitMap from './CircuitMap';

interface Props {
  races: Race[];
  nextRace: Race | null;
  loading: boolean;
  onSelectRace: (race: SelectedRace) => void;
}

type TileStatus = 'past' | 'next' | 'future';

// ── IST helpers ───────────────────────────────────────────────────────────────
function toIST(dateStr: string, timeStr: string): string {
  try {
    const dt = new Date(`${dateStr}T${timeStr}`);
    if (isNaN(dt.getTime())) return '';
    return dt.toLocaleString('en-IN', {
      timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit', hour12: true,
    });
  } catch { return ''; }
}
function sessionLabel(s?: { date: string; time: string }): string {
  if (!s) return '';
  try {
    const dt = new Date(`${s.date}T${s.time}`);
    if (isNaN(dt.getTime())) return '';
    const day = dt.toLocaleString('en-IN', {
      timeZone: 'Asia/Kolkata', weekday: 'short', day: '2-digit', month: 'short',
    });
    const time = toIST(s.date, s.time);
    return `${day} · ${time} IST`;
  } catch { return ''; }
}
function daysUntil(dateStr: string): number {
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const race = new Date(dateStr); race.setHours(0, 0, 0, 0);
  return Math.ceil((race.getTime() - today.getTime()) / 86_400_000);
}
function fmtDate(d: string): string {
  try { return new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }); }
  catch { return d; }
}

// ── Circuit panel (rendered inside the calendar section) ──────────────────────
interface PanelProps {
  race: Race;
  status: TileStatus;
  isMobile: boolean;
  onViewResults: () => void;
}

function CircuitPanel({ race, status, isMobile, onViewResults }: PanelProps) {
  const circuit = getCircuitImage(race.Circuit.circuitId);
  const flag = COUNTRY_FLAGS[race.Circuit.Location.country] ?? '🏁';
  const days = daysUntil(race.date);

  const sessions: { label: string; info: string }[] = [];
  if (race.FirstPractice)    sessions.push({ label: 'FP1',    info: sessionLabel(race.FirstPractice) });
  if (race.Sprint)           sessions.push({ label: 'Sprint', info: sessionLabel(race.Sprint) });
  else if (race.SecondPractice) sessions.push({ label: 'FP2', info: sessionLabel(race.SecondPractice) });
  if (race.SprintQualifying) sessions.push({ label: 'SQ',     info: sessionLabel(race.SprintQualifying) });
  else if (race.ThirdPractice)  sessions.push({ label: 'FP3', info: sessionLabel(race.ThirdPractice) });
  if (race.Qualifying)       sessions.push({ label: 'Quali',  info: sessionLabel(race.Qualifying) });
  sessions.push({ label: 'Race', info: race.time ? sessionLabel({ date: race.date, time: race.time }) : fmtDate(race.date) });

  const statCells = circuit ? [
    { label: 'CIRCUIT LENGTH', value: circuit.length },
    { label: 'TURNS',          value: String(circuit.turns) },
    { label: 'LAP RECORD',     value: circuit.lapRecord },
    { label: 'RECORD HOLDER',  value: circuit.lapRecordDriver.split(' ').map((p, i) => i === 0 ? p[0] + '.' : p).join(' ') },
    { label: 'DRS ZONES',      value: String(circuit.drsZones) },
    { label: 'YEAR',           value: circuit.lapRecordYear },
  ] : [];

  return (
    <div className="glass-gradient-border" style={{
      borderRadius: 18, overflow: 'hidden',
      padding: isMobile ? 16 : 20,
      display: 'flex', flexDirection: isMobile ? 'column' : 'row',
      gap: isMobile ? 16 : 0,
    }}>
      {/* Left: circuit map area — slightly darker glass tray for image contrast */}
      <div style={{
        flex: isMobile ? 'none' : '0 0 55%',
        background: 'rgba(0,0,0,0.3)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        borderRadius: 10,
        padding: 16, minHeight: isMobile ? 200 : 270,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      } as React.CSSProperties}>
        <CircuitMap circuitId={race.Circuit.circuitId} color="#e8002d" isMobile={isMobile} />
      </div>

      {/* Right: info — transparent, glass comes from parent */}
      <div style={{ flex: 1, paddingLeft: isMobile ? 0 : 20, background: 'transparent' }}>
        {/* Heading */}
        <div style={{ marginBottom: 12 }}>
          <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.45)', letterSpacing: 1.5, fontWeight: 700, marginBottom: 4 }}>
            ROUND {race.round} · {race.season} {flag}
          </div>
          <div style={{ fontSize: isMobile ? 17 : 20, fontWeight: 900, color: '#fff', lineHeight: 1.2 }}>
            {race.raceName.replace(' Grand Prix', '')}
            {' '}<span style={{ fontFamily: 'Georgia,serif', fontStyle: 'italic', color: '#e8002d' }}>Grand Prix</span>
          </div>
          {circuit && (
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.55)', marginTop: 3 }}>
              {circuit.name} · {race.Circuit.Location.locality}
            </div>
          )}
        </div>

        {/* Stats — glass stat tiles */}
        {statCells.length > 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, marginBottom: 12 }}>
            {statCells.map(c => (
              <div key={c.label} style={{
                background: 'rgba(0,0,0,0.2)',
                backdropFilter: 'blur(6px)',
                WebkitBackdropFilter: 'blur(6px)',
                border: '1px solid rgba(255,255,255,0.06)',
                borderRadius: 8, padding: '8px 10px',
              } as React.CSSProperties}>
                <div style={{ fontSize: 8, color: 'rgba(255,255,255,0.45)', letterSpacing: 1, fontWeight: 700, marginBottom: 3 }}>{c.label}</div>
                <div style={{ fontSize: 13, fontWeight: 800, color: '#fff', fontVariantNumeric: 'tabular-nums' }}>{c.value}</div>
              </div>
            ))}
          </div>
        )}

        {/* Status badge */}
        <div style={{ marginBottom: 12 }}>
          {status === 'past' && (
            <div>
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: 5,
                background: 'rgba(0,230,118,0.10)',
                backdropFilter: 'blur(10px)',
                WebkitBackdropFilter: 'blur(10px)',
                border: '1px solid rgba(0,230,118,0.25)',
                borderRadius: 20, padding: '4px 10px', marginBottom: 8,
              } as React.CSSProperties}>
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#27b34a' }} />
                <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: 1, color: '#27b34a' }}>RACE COMPLETE</span>
              </div>
              <div>
                <button onClick={onViewResults} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 11, color: '#e8002d', fontWeight: 700, padding: 0, display: 'flex', alignItems: 'center', gap: 4, WebkitTapHighlightColor: 'transparent' as never }}>
                  View full results →
                </button>
              </div>
            </div>
          )}
          {status === 'next' && (
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 5,
              background: 'rgba(255,24,1,0.10)',
              backdropFilter: 'blur(10px)',
              WebkitBackdropFilter: 'blur(10px)',
              border: '1px solid rgba(255,24,1,0.30)',
              borderRadius: 20, padding: '4px 10px',
            } as React.CSSProperties}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#e8002d', animation: 'livePulse 1.4s ease infinite' }} />
              <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: 1, color: '#e8002d' }}>
                NEXT RACE{days > 0 ? ` · In ${days} day${days !== 1 ? 's' : ''}` : ' · This weekend'}
              </span>
            </div>
          )}
          {status === 'future' && (
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 5,
              background: 'rgba(255,255,255,0.05)',
              backdropFilter: 'blur(8px)',
              WebkitBackdropFilter: 'blur(8px)',
              border: '1px solid rgba(255,255,255,0.10)',
              borderRadius: 20, padding: '4px 10px',
            } as React.CSSProperties}>
              <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: 1, color: 'rgba(255,255,255,0.55)' }}>UPCOMING · {fmtDate(race.date)}</span>
            </div>
          )}
        </div>

        {/* Sessions */}
        {sessions.filter(s => s.info).length > 0 && (
          <div>
            <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.45)', letterSpacing: 1.2, fontWeight: 700, marginBottom: 6 }}>SESSION TIMES</div>
            {sessions.filter(s => s.info).map(s => (
              <div key={s.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 4 }}>
                <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.7)', fontWeight: 700, letterSpacing: 0.5, minWidth: 46 }}>{s.label}</span>
                <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.55)', textAlign: 'right' }}>{s.info}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Calendar tile ─────────────────────────────────────────────────────────────
function CalendarTile({
  race, status, isMobile, isSelected, onExpand,
}: {
  race: Race; status: TileStatus; isMobile: boolean; isSelected: boolean; onExpand: () => void;
}) {
  const flag = COUNTRY_FLAGS[race.Circuit.Location.country]
    ?? COUNTRY_FLAGS[race.raceName.split(' ')[0]] ?? '🏁';
  const code = COUNTRY_CODES[race.Circuit.Location.country]
    ?? race.Circuit.Location.country.slice(0, 3).toUpperCase();
  const dateRange = formatDateRange(race);
  const isNext = status === 'next';
  const isPast = status === 'past';
  const w = isMobile ? (isNext ? 124 : 110) : (isNext ? 150 : 128);

  // ── Glass card style — three variants ───────────────────────────────────
  // • next  → cyan glass with top shimmer
  // • selected → cyan-tinted glass with extra ring
  // • past/future → neutral .glass-sm with hover lift
  const tileStyle: React.CSSProperties = {
    position: 'relative',
    minWidth: w, width: w, flexShrink: 0,
    borderRadius: 16,
    padding: isMobile ? '14px 10px' : '16px 14px 14px',
    opacity: isPast && !isSelected ? 0.5 : 1,
    cursor: 'pointer',
    transform: isSelected || isNext ? 'scale(1.04)' : 'scale(1)',
    scrollSnapAlign: 'center',
    WebkitTapHighlightColor: 'transparent',
    touchAction: 'manipulation',
    transition: 'all 0.25s ease',
    display: 'flex', flexDirection: 'column',
    outline: 'none',
    // Glass background fills — overrides depend on state
    background:
      isSelected ? 'rgba(0,212,255,0.10)' :
      isNext     ? 'rgba(0,212,255,0.08)' :
      isPast     ? 'rgba(255,255,255,0.02)' :
                   'rgba(255,255,255,0.04)',
    backdropFilter: 'blur(12px)',
    WebkitBackdropFilter: 'blur(12px)',
    border:
      isSelected ? '1px solid rgba(0,212,255,0.35)' :
      isNext     ? '1px solid rgba(0,212,255,0.2)'  :
      isPast     ? '1px solid rgba(255,255,255,0.05)' :
                   '1px solid rgba(255,255,255,0.08)',
    boxShadow:
      isSelected
        ? '0 0 0 1px rgba(0,212,255,0.2), 0 12px 40px rgba(0,212,255,0.15), inset 0 1px 0 rgba(0,212,255,0.15)'
        : isNext
        ? '0 8px 32px rgba(0,0,0,0.3), 0 0 0 1px rgba(0,212,255,0.05), inset 0 1px 0 rgba(0,212,255,0.10)'
        : '0 4px 16px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.08)',
  };

  return (
    <div
      onClick={onExpand}
      role="button"
      tabIndex={0}
      onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onExpand(); } }}
      style={tileStyle}
      onMouseEnter={e => {
        if (isMobile || isPast || isSelected || isNext) return;
        const el = e.currentTarget as HTMLElement;
        el.style.background = 'rgba(255,255,255,0.08)';
        el.style.borderColor = 'rgba(255,255,255,0.15)';
        el.style.transform = 'translateY(-3px)';
        el.style.boxShadow = '0 12px 40px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.12)';
      }}
      onMouseLeave={e => {
        if (isMobile || isPast || isSelected || isNext) return;
        const el = e.currentTarget as HTMLElement;
        el.style.background = 'rgba(255,255,255,0.04)';
        el.style.borderColor = 'rgba(255,255,255,0.08)';
        el.style.transform = 'scale(1)';
        el.style.boxShadow = '0 4px 16px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.08)';
      }}
    >
      {/* NEXT-card top shimmer line */}
      {isNext && (
        <span aria-hidden="true" style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: 2,
          background: 'linear-gradient(90deg, transparent, rgba(0,212,255,0.6), transparent)',
          borderRadius: '16px 16px 0 0', pointerEvents: 'none',
        }} />
      )}
      {isNext && (
        <div style={{
          position: 'absolute', top: 8, left: 8,
          background: 'rgba(0,212,255,0.20)',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
          border: '1px solid rgba(0,212,255,0.35)',
          color: '#00d4ff', fontSize: isMobile ? 8 : 9, fontWeight: 700,
          letterSpacing: 1.2, padding: '2px 8px', borderRadius: 6,
        } as React.CSSProperties}>NEXT</div>
      )}
      <div style={{ fontSize: isMobile ? 9 : 10, fontWeight: 700, letterSpacing: 2, color: 'rgba(255,255,255,0.35)', marginBottom: 6, marginTop: isNext ? 18 : 0 }}>
        R{race.round.padStart(2, '0')}
      </div>
      <div style={{ fontSize: isMobile ? 18 : 22, marginBottom: 3 }}>{flag}</div>
      <div style={{ fontSize: isMobile ? 18 : 20, fontWeight: 900, color: '#ffffff', letterSpacing: -0.5, lineHeight: 1 }}>{code}</div>
      <div style={{ fontSize: 10, fontWeight: 600, marginTop: 3, color: 'rgba(255,255,255,0.65)' }}>{race.Circuit.Location.locality}</div>
      <div style={{ fontSize: isMobile ? 9 : 10, marginTop: 4, color: 'rgba(255,255,255,0.4)', letterSpacing: 0.3 }}>{dateRange}</div>
      {/* Bottom action chip — also gets glass for RESULTS → */}
      <div style={{ marginTop: 6, display: 'flex', alignItems: 'center', gap: 4 }}>
        {isSelected ? (
          <span style={{ fontSize: 9, fontWeight: 700, color: '#00d4ff' }}>▲ close</span>
        ) : isPast ? (
          <span style={{
            fontSize: 9, fontWeight: 700, letterSpacing: 0.5,
            color: '#00d4ff',
            background: 'rgba(0,212,255,0.08)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
            border: '1px solid rgba(0,212,255,0.2)',
            borderRadius: 4, padding: '2px 8px',
          } as React.CSSProperties}>RESULTS →</span>
        ) : (
          <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)' }}>🗺</span>
        )}
      </div>
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────
export default function SeasonCalendar({ races, nextRace, loading, onSelectRace }: Props) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();
  const [expandedCircuitId, setExpandedCircuitId] = useState<string | null>(null);
  const [panelRace, setPanelRace]     = useState<Race | null>(null);
  const [panelStatus, setPanelStatus] = useState<TileStatus>('future');

  const scroll = (dir: 'left' | 'right') => {
    scrollRef.current?.scrollBy({ left: dir === 'right' ? 320 : -320, behavior: 'smooth' });
  };

  const px = isMobile ? 16 : 32;
  const py = isMobile ? 28 : 56;

  function handleTileClick(race: Race, status: TileStatus) {
    const cid = race.Circuit.circuitId;
    if (expandedCircuitId === cid) {
      setExpandedCircuitId(null);
    } else {
      setExpandedCircuitId(cid);
      setPanelRace(race);
      setPanelStatus(status);
    }
  }

  function handleViewResults(race: Race) {
    setExpandedCircuitId(null);
    onSelectRace({
      season: race.season, round: race.round, raceName: race.raceName,
      circuitName: race.Circuit.circuitName,
      locality: race.Circuit.Location.locality, country: race.Circuit.Location.country,
      date: race.date,
    });
  }

  return (
    <section id="calendar" style={{ background: 'transparent', padding: `${py}px 0 ${isMobile ? 24 : 48}px` }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: `0 ${px}px` }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: isMobile ? 16 : 28 }}>
          <h2 className="mixed-heading">Season <span className="serif-red">Calendar</span></h2>
          {!isMobile && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: 2, color: 'rgba(255,255,255,0.5)' }}>{races.length} ROUNDS</span>
              <button onClick={() => scroll('left')} style={arrowBtn}>‹</button>
              <button onClick={() => scroll('right')} style={arrowBtn}>›</button>
            </div>
          )}
          {isMobile && <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: 1.5, color: 'rgba(255,255,255,0.5)' }}>{races.length} ROUNDS</span>}
        </div>

        {/* Scroll track */}
        {loading ? (
          <div style={{ display: 'flex', gap: isMobile ? 10 : 12, overflowX: 'hidden' }}>
            {Array.from({ length: isMobile ? 5 : 8 }).map((_, i) => (
              <div key={i} className="skeleton-light" style={{ minWidth: isMobile ? 110 : 128, height: isMobile ? 130 : 140, borderRadius: 8 }} />
            ))}
          </div>
        ) : (
          <div
            ref={scrollRef}
            className="hide-scroll"
            style={{
              display: 'flex', gap: isMobile ? 10 : 12,
              overflowX: 'auto', paddingBottom: 8,
              scrollSnapType: isMobile ? 'x mandatory' : 'none',
              WebkitOverflowScrolling: 'touch',
              marginLeft: isMobile ? -16 : 0, marginRight: isMobile ? -16 : 0,
              paddingLeft: isMobile ? 16 : 0, paddingRight: isMobile ? 16 : 0,
              alignItems: 'flex-end',
            } as React.CSSProperties}
          >
            {races.map(race => {
              const raceDate = new Date(race.date);
              const isNext = nextRace?.round === race.round;
              const status: TileStatus = isNext ? 'next' : raceDate < new Date() ? 'past' : 'future';
              return (
                <CalendarTile
                  key={race.round}
                  race={race}
                  status={status}
                  isMobile={isMobile}
                  isSelected={expandedCircuitId === race.Circuit.circuitId}
                  onExpand={() => handleTileClick(race, status)}
                />
              );
            })}
          </div>
        )}

        {/* Expanded circuit panel */}
        <div style={{
          overflow: 'hidden',
          maxHeight: expandedCircuitId ? 640 : 0,
          opacity: expandedCircuitId ? 1 : 0,
          marginTop: expandedCircuitId ? 14 : 0,
          transition: 'max-height 0.42s ease, opacity 0.3s ease, margin-top 0.3s ease',
        }}>
          {panelRace && (
            <CircuitPanel
              race={panelRace}
              status={panelStatus}
              isMobile={isMobile}
              onViewResults={() => handleViewResults(panelRace)}
            />
          )}
        </div>

      </div>
    </section>
  );
}

const arrowBtn: React.CSSProperties = {
  background: 'rgba(255,255,255,0.05)',
  backdropFilter: 'blur(8px)',
  WebkitBackdropFilter: 'blur(8px)',
  border: '1px solid rgba(255,255,255,0.10)',
  borderRadius: 6,
  width: 32, height: 32, cursor: 'pointer', fontSize: 18, lineHeight: '30px',
  color: 'rgba(255,255,255,0.7)',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  transition: 'background 0.2s, border-color 0.2s',
};

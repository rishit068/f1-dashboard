import { useRef } from 'react';
import type { Race } from '../types';
import { formatDateRange, COUNTRY_FLAGS, COUNTRY_CODES } from '../utils';

interface Props {
  races: Race[];
  nextRace: Race | null;
  loading: boolean;
}

function CalendarTile({ race, status }: { race: Race; status: 'past' | 'next' | 'future' }) {
  const flag = COUNTRY_FLAGS[race.Circuit.Location.country]
    ?? COUNTRY_FLAGS[race.raceName.split(' ')[0]]
    ?? '🏁';
  const code = COUNTRY_CODES[race.Circuit.Location.country]
    ?? race.Circuit.Location.country.slice(0, 3).toUpperCase();
  const dateRange = formatDateRange(race);

  const isNext = status === 'next';
  const isPast = status === 'past';

  return (
    <div style={{
      position: 'relative',
      minWidth: isNext ? 150 : 128,
      flexShrink: 0,
      background: isNext ? '#15151e' : '#ffffff',
      border: isNext ? '1px solid rgba(232,0,45,0.4)' : '1px solid #e8e8e0',
      borderRadius: 8,
      padding: '14px 14px 12px',
      opacity: isPast ? 0.45 : 1,
      cursor: 'default',
      transition: 'transform 0.2s, box-shadow 0.2s',
      boxShadow: isNext ? '0 4px 24px rgba(232,0,45,0.15)' : '0 1px 4px rgba(0,0,0,0.05)',
      transform: isNext ? 'scale(1.04)' : 'scale(1)',
    }}
    onMouseEnter={e => {
      if (!isNext) (e.currentTarget as HTMLElement).style.transform = 'translateY(-3px)';
    }}
    onMouseLeave={e => {
      if (!isNext) (e.currentTarget as HTMLElement).style.transform = 'scale(1)';
    }}
    >
      {/* NEXT badge */}
      {isNext && (
        <div style={{
          position: 'absolute', top: -1, left: -1,
          background: '#e8002d', color: '#fff',
          fontSize: 8, fontWeight: 700, letterSpacing: 1.5,
          padding: '2px 8px', borderRadius: '7px 0 4px 0',
        }}>
          NEXT
        </div>
      )}

      {/* Round # */}
      <div style={{
        fontSize: 9, fontWeight: 700, letterSpacing: 2,
        color: isNext ? 'rgba(255,255,255,0.35)' : '#bbb',
        marginBottom: 8,
        marginTop: isNext ? 10 : 0,
      }}>
        R{race.round.padStart(2, '0')}
      </div>

      {/* Flag + code */}
      <div style={{ fontSize: 22, marginBottom: 4 }}>{flag}</div>
      <div style={{
        fontSize: 20, fontWeight: 900,
        color: isNext ? '#ffffff' : '#15151e',
        letterSpacing: -0.5,
        lineHeight: 1,
      }}>
        {code}
      </div>

      {/* City */}
      <div style={{
        fontSize: 11, fontWeight: 600, marginTop: 4,
        color: isNext ? 'rgba(255,255,255,0.7)' : '#444',
      }}>
        {race.Circuit.Location.locality}
      </div>

      {/* Date */}
      <div style={{
        fontSize: 10, marginTop: 6,
        color: isNext ? 'rgba(255,255,255,0.45)' : '#888',
        letterSpacing: 0.5,
      }}>
        {dateRange}
      </div>
    </div>
  );
}

export default function SeasonCalendar({ races, nextRace, loading }: Props) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (dir: 'left' | 'right') => {
    if (!scrollRef.current) return;
    scrollRef.current.scrollBy({ left: dir === 'right' ? 320 : -320, behavior: 'smooth' });
  };

  return (
    <section id="calendar" style={{ background: '#f5f5f0', padding: '56px 0 48px' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 32px' }}>

        {/* Header row */}
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 28 }}>
          <h2 className="mixed-heading">
            Season <span className="serif-red">Calendar</span>
          </h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: 2, color: '#888' }}>
              {races.length} ROUNDS
            </span>
            <button onClick={() => scroll('left')} style={arrowBtn}>‹</button>
            <button onClick={() => scroll('right')} style={arrowBtn}>›</button>
          </div>
        </div>

        {/* Horizontal scroll container */}
        {loading ? (
          <div style={{ display: 'flex', gap: 12 }}>
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="skeleton-light" style={{ minWidth: 128, height: 140, borderRadius: 8 }} />
            ))}
          </div>
        ) : (
          <div
            ref={scrollRef}
            style={{
              display: 'flex', gap: 12,
              overflowX: 'auto', paddingBottom: 12,
              scrollbarWidth: 'none',
              WebkitOverflowScrolling: 'touch',
            }}
          >
            {races.map(race => {
              const raceDate = new Date(race.date);
              const now = new Date();
              const isNext = nextRace?.round === race.round;
              const status: 'past' | 'next' | 'future' =
                isNext ? 'next' : raceDate < now ? 'past' : 'future';
              return <CalendarTile key={race.round} race={race} status={status} />;
            })}
          </div>
        )}
      </div>
    </section>
  );
}

const arrowBtn: React.CSSProperties = {
  background: 'transparent',
  border: '1px solid #ddd',
  borderRadius: 4,
  width: 28, height: 28,
  cursor: 'pointer',
  fontSize: 18, lineHeight: '26px',
  color: '#555',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  transition: 'border-color 0.2s, color 0.2s',
};

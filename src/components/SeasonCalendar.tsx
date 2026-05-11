import { useRef } from 'react';
import type { Race, SelectedRace } from '../types';
import { formatDateRange, COUNTRY_FLAGS, COUNTRY_CODES } from '../utils';
import { useIsMobile } from '../hooks/useBreakpoint';

interface Props {
  races: Race[];
  nextRace: Race | null;
  loading: boolean;
  onSelectRace: (race: SelectedRace) => void;
}

type TileStatus = 'past' | 'next' | 'future';

function CalendarTile({
  race, status, isMobile, onSelect,
}: {
  race: Race;
  status: TileStatus;
  isMobile: boolean;
  onSelect: () => void;
}) {
  const flag = COUNTRY_FLAGS[race.Circuit.Location.country]
    ?? COUNTRY_FLAGS[race.raceName.split(' ')[0]]
    ?? '🏁';
  const code = COUNTRY_CODES[race.Circuit.Location.country]
    ?? race.Circuit.Location.country.slice(0, 3).toUpperCase();
  const dateRange = formatDateRange(race);

  const isNext = status === 'next';
  const isPast = status === 'past';
  const w = isMobile ? (isNext ? 124 : 110) : (isNext ? 150 : 128);

  return (
    <div
      onClick={isPast ? onSelect : undefined}
      style={{
        position: 'relative',
        minWidth: w, width: w,
        flexShrink: 0,
        background: isNext ? '#15151e' : '#ffffff',
        border: isNext
          ? '1px solid rgba(232,0,45,0.4)'
          : isPast ? '1px solid #e0e0da' : '1px solid #e8e8e0',
        borderRadius: 8,
        padding: isMobile ? '12px 10px' : '14px 14px 12px',
        opacity: isPast ? 0.55 : 1,
        cursor: isPast ? 'pointer' : 'default',
        boxShadow: isNext
          ? '0 4px 24px rgba(232,0,45,0.15)'
          : isPast ? '0 1px 4px rgba(0,0,0,0.04)' : '0 1px 4px rgba(0,0,0,0.05)',
        transform: isNext ? 'scale(1.04)' : 'scale(1)',
        scrollSnapAlign: 'center',
        WebkitTapHighlightColor: 'transparent',
        touchAction: 'manipulation',
        transition: 'opacity 0.15s, transform 0.15s',
        display: 'flex', flexDirection: 'column',
      }}
      onMouseEnter={e => { if (isPast) (e.currentTarget as HTMLElement).style.opacity = '0.8'; }}
      onMouseLeave={e => { if (isPast) (e.currentTarget as HTMLElement).style.opacity = '0.55'; }}
    >
      {/* NEXT badge */}
      {isNext && (
        <div style={{
          position: 'absolute', top: -1, left: -1,
          background: '#e8002d', color: '#fff',
          fontSize: isMobile ? 8 : 9, fontWeight: 700, letterSpacing: 1.2,
          padding: '2px 8px', borderRadius: '7px 0 4px 0',
        }}>NEXT</div>
      )}

      {/* Round label */}
      <div style={{
        fontSize: isMobile ? 9 : 10, fontWeight: 700, letterSpacing: 2,
        color: isNext ? 'rgba(255,255,255,0.35)' : '#bbb',
        marginBottom: 6, marginTop: isNext ? 8 : 0,
      }}>
        R{race.round.padStart(2, '0')}
      </div>

      <div style={{ fontSize: isMobile ? 18 : 22, marginBottom: 3 }}>{flag}</div>

      <div style={{
        fontSize: isMobile ? 18 : 20, fontWeight: 900,
        color: isNext ? '#ffffff' : '#15151e',
        letterSpacing: -0.5, lineHeight: 1,
      }}>
        {code}
      </div>

      <div style={{
        fontSize: 10, fontWeight: 600, marginTop: 3,
        color: isNext ? 'rgba(255,255,255,0.7)' : '#444',
      }}>
        {race.Circuit.Location.locality}
      </div>

      <div style={{
        fontSize: isMobile ? 9 : 10, marginTop: 4,
        color: isNext ? 'rgba(255,255,255,0.4)' : '#888',
        letterSpacing: 0.3,
      }}>
        {dateRange}
      </div>

      {/* RESULTS label for past races */}
      {isPast && (
        <div style={{
          marginTop: 6,
          fontSize: 8, fontWeight: 700,
          letterSpacing: 1, color: '#e8002d',
          textTransform: 'uppercase',
        }}>
          RESULTS →
        </div>
      )}
    </div>
  );
}

export default function SeasonCalendar({ races, nextRace, loading, onSelectRace }: Props) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();

  const scroll = (dir: 'left' | 'right') => {
    scrollRef.current?.scrollBy({ left: dir === 'right' ? 320 : -320, behavior: 'smooth' });
  };

  const px = isMobile ? 16 : 32;
  const py = isMobile ? 28 : 56;

  const handleSelect = (race: Race) => {
    onSelectRace({
      season: race.season,
      round: race.round,
      raceName: race.raceName,
      circuitName: race.Circuit.circuitName,
      locality: race.Circuit.Location.locality,
      country: race.Circuit.Location.country,
      date: race.date,
    });
  };

  return (
    <section id="calendar" style={{ background: '#f5f5f0', padding: `${py}px 0 ${isMobile ? 24 : 48}px` }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: `0 ${px}px` }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: isMobile ? 16 : 28 }}>
          <h2 className="mixed-heading">
            Season <span className="serif-red">Calendar</span>
          </h2>
          {!isMobile && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: 2, color: '#888' }}>
                {races.length} ROUNDS
              </span>
              <button onClick={() => scroll('left')} style={arrowBtn}>‹</button>
              <button onClick={() => scroll('right')} style={arrowBtn}>›</button>
            </div>
          )}
          {isMobile && (
            <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: 1.5, color: '#bbb' }}>
              {races.length} ROUNDS
            </span>
          )}
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
              marginLeft: isMobile ? -16 : 0,
              marginRight: isMobile ? -16 : 0,
              paddingLeft: isMobile ? 16 : 0,
              paddingRight: isMobile ? 16 : 0,
              alignItems: 'flex-end', // bottom-align so RESULTS label lines up
            } as React.CSSProperties}
          >
            {races.map(race => {
              const raceDate = new Date(race.date);
              const isNext = nextRace?.round === race.round;
              const status: TileStatus =
                isNext ? 'next' : raceDate < new Date() ? 'past' : 'future';
              return (
                <CalendarTile
                  key={race.round}
                  race={race}
                  status={status}
                  isMobile={isMobile}
                  onSelect={() => handleSelect(race)}
                />
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}

const arrowBtn: React.CSSProperties = {
  background: 'transparent', border: '1px solid #ddd', borderRadius: 4,
  width: 28, height: 28, cursor: 'pointer', fontSize: 18, lineHeight: '26px',
  color: '#555', display: 'flex', alignItems: 'center', justifyContent: 'center',
};

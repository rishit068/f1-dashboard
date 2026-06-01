import type { Race } from '../types';
import { useCountdown } from '../hooks/useCountdown';
import { useIsMobile } from '../hooks/useBreakpoint';
import { formatDateRange, getRaceName, COUNTRY_CODES, padTwo } from '../utils';
import FlipDigit from './FlipDigit';

interface Props {
  race: Race | null;
  loading: boolean;
  round?: number;
  total: number;
}

const STAT_BOX_STYLE: React.CSSProperties = {
  // Glass stat box — see .glass utility in index.css
  background: 'rgba(255,255,255,0.07)',
  backdropFilter: 'blur(16px)',
  WebkitBackdropFilter: 'blur(16px)',
  border: '1px solid rgba(255,255,255,0.08)',
  boxShadow: '0 8px 32px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.10)',
  borderRadius: 12,
  padding: '14px 16px',
  minWidth: 140,
  flexShrink: 0,
  position: 'relative',
  overflow: 'hidden',
};

function SkeletonHero({ isMobile }: { isMobile: boolean }) {
  const navH = isMobile ? 48 : 52;
  return (
    <section style={{ background: '#15151e', paddingTop: navH, minHeight: isMobile ? '92vh' : '100vh' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: isMobile ? '32px 16px' : '64px 32px', display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: isMobile ? 28 : 80 }}>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="skeleton" style={{ height: 22, width: 160 }} />
          <div className="skeleton" style={{ height: isMobile ? 56 : 80, width: '75%' }} />
          <div className="skeleton" style={{ height: 16, width: '60%' }} />
          <div style={{ display: 'flex', gap: 10, overflowX: 'auto' }}>
            {[1,2,3].map(i => <div key={i} className="skeleton" style={{ height: 56, minWidth: 140 }} />)}
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, alignItems: 'center' }}>
          <div className="skeleton" style={{ height: 16, width: 110 }} />
          <div style={{ display: 'flex', gap: isMobile ? 8 : 12 }}>
            {[1,2,3,4].map(i => <div key={i} className="skeleton" style={{ height: isMobile ? 72 : 88, width: isMobile ? 68 : 80 }} />)}
          </div>
        </div>
      </div>
    </section>
  );
}

export default function Hero({ race, loading, total }: Props) {
  const isMobile = useIsMobile();
  const raceDateTime = race ? `${race.date}T${race.time ?? '12:00:00Z'}` : null;
  const countdown = useCountdown(raceDateTime);

  if (loading) return <SkeletonHero isMobile={isMobile} />;
  if (!race) return null;

  const { city, gp } = getRaceName(race);
  const countryCode = COUNTRY_CODES[race.Circuit.Location.country] ?? race.Circuit.Location.country.slice(0,3).toUpperCase();
  const dateRange = formatDateRange(race);
  const qualDate = race.Qualifying?.date ?? race.date;

  const nameFontSize = isMobile ? 'clamp(36px, 11vw, 48px)' : 'clamp(52px, 7vw, 80px)';
  const navH = isMobile ? 48 : 52;

  const countdownRow = (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <span style={{ fontSize: 9, color: '#e8002d' }}>●</span>
        <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: 2.5, color: 'rgba(255,255,255,0.45)', textTransform: 'uppercase' }}>
          Lights Out In
        </span>
      </div>
      <div style={{ display: 'flex', gap: isMobile ? 8 : 12, width: isMobile ? '100%' : 'auto' }}>
        {[
          { v: countdown.days,  l: 'Days' },
          { v: countdown.hours, l: 'Hours' },
          { v: countdown.mins,  l: 'Mins' },
          { v: countdown.secs,  l: 'Secs' },
        ].map(({ v, l }) =>
          isMobile ? (
            <MiniFlip key={l} value={v} label={l} />
          ) : (
            <FlipDigit key={l} value={v} label={l} />
          )
        )}
      </div>
      <div style={{ color: 'rgba(255,255,255,0.25)', fontSize: 9, letterSpacing: 1.5 }}>
        ALL TIMES IN IST (UTC+5:30)
      </div>
    </div>
  );

  return (
    <section id="next" style={{
      // Translucent dark gradient — lets background orbs glow through
      background: 'linear-gradient(180deg, rgba(15,15,25,0.55) 0%, rgba(4,6,13,0.35) 100%)',
      paddingTop: navH,
      minHeight: isMobile ? 'auto' : '100vh',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Diagonal accent — desktop only */}
      {!isMobile && (
        <>
          <div style={{ position: 'absolute', top: 0, right: 0, width: 220, height: 220, background: 'linear-gradient(135deg, transparent 60%, rgba(232,0,45,0.12) 100%)', pointerEvents: 'none' }} />
          <div style={{ position: 'absolute', top: 0, right: 0, width: 3, height: 180, background: 'linear-gradient(to bottom, #e8002d, transparent)', transform: 'rotate(30deg) translateX(-60px)', pointerEvents: 'none' }} />
        </>
      )}

      <div style={{
        maxWidth: 1200, margin: '0 auto',
        padding: isMobile ? '28px 16px 32px' : '64px 32px 48px',
        display: 'flex',
        flexDirection: isMobile ? 'column' : 'row',
        gap: isMobile ? 28 : 80,
        flexWrap: 'wrap',
        justifyContent: isMobile ? 'flex-start' : 'space-between',
        alignItems: isMobile ? 'stretch' : 'flex-start',
      }}>

        {/* ── Left / Top column ─────────────────────────────────────────────── */}
        <div style={{ flex: '1 1 360px', display: 'flex', flexDirection: 'column', gap: isMobile ? 14 : 20 }}>

          {/* Badge row — frosted red glass pill */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              background: 'rgba(255,24,1,0.10)',
              backdropFilter: 'blur(10px)',
              WebkitBackdropFilter: 'blur(10px)',
              border: '1px solid rgba(255,24,1,0.25)',
              boxShadow: '0 4px 12px rgba(255,24,1,0.10), inset 0 1px 0 rgba(255,24,1,0.15)',
              borderRadius: 20, padding: '5px 14px',
              display: 'flex', alignItems: 'center', gap: 6,
            } as React.CSSProperties}>
              <span style={{ fontSize: 8, color: '#e8002d' }}>●</span>
              <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: 2, color: '#e8002d' }}>
                ROUND {race.round} · UP NEXT
              </span>
            </div>
            <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: 2, color: '#555' }}>{countryCode}</span>
          </div>

          {/* Race name */}
          <div>
            <div style={{ fontSize: nameFontSize, fontWeight: 900, color: '#ffffff', lineHeight: 1, letterSpacing: -1 }}>
              {city}
            </div>
            <div style={{ fontSize: nameFontSize, fontFamily: 'Georgia, serif', fontStyle: 'italic', color: '#e8002d', lineHeight: 1.05, letterSpacing: -0.5 }}>
              {gp}
            </div>
          </div>

          {/* Circuit */}
          <div>
            <div style={{ color: 'rgba(255,255,255,0.75)', fontSize: isMobile ? 13 : 14, fontWeight: 600 }}>
              {race.Circuit.circuitName}
            </div>
            <div style={{ color: '#888', fontSize: 11, marginTop: 2 }}>
              {race.Circuit.Location.locality} · {race.Circuit.Location.country}
            </div>
          </div>

          {/* Round / laps info */}
          <div style={{ color: 'rgba(255,255,255,0.35)', fontSize: isMobile ? 10 : 11, letterSpacing: 0.3 }}>
            Round {race.round} of {total} · 57 laps · 308.326 km
          </div>

          {/* Stat boxes — horizontal scroll on mobile */}
          <div style={{
            display: 'flex', gap: 10,
            overflowX: 'auto', paddingBottom: 4,
            scrollbarWidth: 'none',
            WebkitOverflowScrolling: 'touch' as React.CSSProperties['WebkitOverflowScrolling'],
            marginRight: isMobile ? -16 : 0,
            paddingRight: isMobile ? 16 : 0,
          } as React.CSSProperties}>
            <div style={STAT_BOX_STYLE}>
              <StatBoxTopLine />
              <div className="label label-white" style={{ marginBottom: 6 }}>Lap Record</div>
              <div style={{ color: '#fff', fontSize: 16, fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>1:29.708</div>
            </div>
            <div style={STAT_BOX_STYLE}>
              <StatBoxTopLine />
              <div className="label label-white" style={{ marginBottom: 6 }}>Qualifying</div>
              <div style={{ color: '#fff', fontSize: 13, fontWeight: 600 }}>
                {new Date(qualDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
              </div>
            </div>
            <div style={STAT_BOX_STYLE}>
              <StatBoxTopLine />
              <div className="label label-white" style={{ marginBottom: 6 }}>Race Date</div>
              <div style={{ color: '#fff', fontSize: 13, fontWeight: 600 }}>{dateRange}</div>
            </div>
          </div>
        </div>

        {/* ── Right / Bottom — countdown ─────────────────────────────────────── */}
        <div style={{
          flex: isMobile ? '0 0 auto' : '0 0 auto',
          paddingTop: isMobile ? 0 : 24,
          width: isMobile ? '100%' : 'auto',
        }}>
          {countdownRow}
        </div>
      </div>
    </section>
  );
}

/* Top-edge highlight line for glass cards (subtle horizontal gradient). */
function StatBoxTopLine() {
  return (
    <span
      aria-hidden="true"
      style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: 1,
        background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.15), transparent)',
        pointerEvents: 'none',
      }}
    />
  );
}

/* Compact flip tile for mobile — gradient-border glass */
function MiniFlip({ value, label }: { value: number; label: string }) {
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
      <div className="glass-gradient-border" style={{
        borderRadius: 14, width: '100%',
        padding: '14px 4px', textAlign: 'center',
        position: 'relative',
      }}>
        <span style={{
          fontSize: 32, fontWeight: 900, color: '#fff',
          fontVariantNumeric: 'tabular-nums', lineHeight: 1,
          textShadow: '0 0 20px rgba(0,212,255,0.2)',
        }}>
          {padTwo(value)}
        </span>
      </div>
      <span style={{ fontSize: 8, fontWeight: 700, letterSpacing: 2, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase' }}>
        {label}
      </span>
    </div>
  );
}

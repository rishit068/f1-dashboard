import type { Race } from '../types';
import { useCountdown } from '../hooks/useCountdown';
import { formatDateRange, getRaceName, COUNTRY_CODES } from '../utils';
import FlipDigit from './FlipDigit';

interface Props {
  race: Race | null;
  loading: boolean;
  round?: number;
  total: number;
}

const STAT_BOX_STYLE: React.CSSProperties = {
  background: 'rgba(255,255,255,0.04)',
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: 6,
  padding: '10px 16px',
  minWidth: 130,
};

function SkeletonHero() {
  return (
    <section style={{ background: '#15151e', paddingTop: 52, minHeight: '100vh' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '64px 32px', display: 'flex', gap: 80 }}>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div className="skeleton" style={{ height: 24, width: 180 }} />
          <div className="skeleton" style={{ height: 80, width: 320 }} />
          <div className="skeleton" style={{ height: 20, width: 260 }} />
          <div style={{ display: 'flex', gap: 12 }}>
            {[1,2,3].map(i=><div key={i} className="skeleton" style={{ height: 60, width: 130 }} />)}
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24, alignItems: 'center' }}>
          <div className="skeleton" style={{ height: 18, width: 120 }} />
          <div style={{ display: 'flex', gap: 12 }}>
            {[1,2,3,4].map(i=><div key={i} className="skeleton" style={{ height: 90, width: 80 }} />)}
          </div>
        </div>
      </div>
    </section>
  );
}

export default function Hero({ race, loading, total }: Props) {
  const raceDateTime = race ? `${race.date}T${race.time ?? '12:00:00Z'}` : null;
  const countdown = useCountdown(raceDateTime);

  if (loading) return <SkeletonHero />;
  if (!race) return null;

  const { city, gp } = getRaceName(race);
  const countryCode = COUNTRY_CODES[race.Circuit.Location.country] ?? race.Circuit.Location.country.slice(0,3).toUpperCase();
  const dateRange = formatDateRange(race);
  const laps = '57';   // static default; real data not in Ergast
  const dist = '308.326 km';

  const qualDate = race.Qualifying?.date ?? race.date;

  return (
    <section id="hero" style={{
      background: '#15151e',
      paddingTop: 52,
      minHeight: '100vh',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Diagonal red accent — top-right */}
      <div style={{
        position: 'absolute', top: 0, right: 0,
        width: 220, height: 220,
        background: 'linear-gradient(135deg, transparent 60%, rgba(232,0,45,0.12) 100%)',
        pointerEvents: 'none',
      }} />
      <div style={{
        position: 'absolute', top: 0, right: 0,
        width: 3, height: 180,
        background: 'linear-gradient(to bottom, #e8002d, transparent)',
        transform: 'rotate(30deg) translateX(-60px)',
        pointerEvents: 'none',
      }} />

      <div style={{
        maxWidth: 1200, margin: '0 auto',
        padding: '64px 32px 48px',
        display: 'flex',
        gap: 80,
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
      }}>

        {/* ── Left column ─────────────────────────────────────── */}
        <div style={{ flex: '1 1 400px', display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* ROUND badge */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              background: 'rgba(232,0,45,0.15)',
              border: '1px solid rgba(232,0,45,0.3)',
              borderRadius: 20, padding: '4px 14px',
              display: 'flex', alignItems: 'center', gap: 6,
            }}>
              <span style={{ fontSize: 8, color: '#e8002d' }}>●</span>
              <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: 2, color: '#e8002d' }}>
                ROUND {race.round} · UP NEXT
              </span>
            </div>
            <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: 2, color: '#555' }}>
              {countryCode}
            </span>
          </div>

          {/* Race name — massive */}
          <div>
            <div style={{
              fontSize: 'clamp(52px, 7vw, 80px)',
              fontWeight: 900,
              color: '#ffffff',
              lineHeight: 1,
              letterSpacing: -2,
            }}>
              {city}
            </div>
            <div style={{
              fontSize: 'clamp(52px, 7vw, 80px)',
              fontFamily: 'Georgia, serif',
              fontStyle: 'italic',
              color: '#e8002d',
              lineHeight: 1.05,
              letterSpacing: -1,
            }}>
              {gp}
            </div>
          </div>

          {/* Circuit info */}
          <div>
            <div style={{ color: 'rgba(255,255,255,0.75)', fontSize: 14, fontWeight: 600 }}>
              {race.Circuit.circuitName}
            </div>
            <div style={{ color: '#888', fontSize: 12, marginTop: 2 }}>
              {race.Circuit.Location.locality} · {race.Circuit.Location.country}
            </div>
          </div>

          {/* Round / laps / dist */}
          <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, letterSpacing: 0.5 }}>
            Round {race.round} of {total} · {laps} laps · {dist}
          </div>

          {/* Stat boxes */}
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 8 }}>
            <div style={STAT_BOX_STYLE}>
              <div className="label label-white" style={{ marginBottom: 6 }}>Lap Record</div>
              <div style={{ color: '#fff', fontSize: 18, fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>
                1:29.708
              </div>
            </div>
            <div style={STAT_BOX_STYLE}>
              <div className="label label-white" style={{ marginBottom: 6 }}>Qualifying</div>
              <div style={{ color: '#fff', fontSize: 14, fontWeight: 600 }}>
                {qualDate ? new Date(qualDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }) : '–'}
              </div>
            </div>
            <div style={STAT_BOX_STYLE}>
              <div className="label label-white" style={{ marginBottom: 6 }}>Race Date</div>
              <div style={{ color: '#fff', fontSize: 14, fontWeight: 600 }}>
                {dateRange}
              </div>
            </div>
          </div>
        </div>

        {/* ── Right column — countdown ──────────────────────── */}
        <div style={{
          flex: '0 0 auto',
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20,
          paddingTop: 24,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 9, color: '#e8002d' }}>●</span>
            <span style={{
              fontSize: 10, fontWeight: 700, letterSpacing: 2.5,
              color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase',
            }}>
              Lights Out In
            </span>
          </div>

          <div style={{ display: 'flex', gap: 12 }}>
            <FlipDigit value={countdown.days}  label="Days" />
            <FlipDigit value={countdown.hours} label="Hours" />
            <FlipDigit value={countdown.mins}  label="Mins" />
            <FlipDigit value={countdown.secs}  label="Secs" />
          </div>

          {/* Separator line */}
          <div style={{
            width: '100%', height: 1,
            background: 'linear-gradient(to right, transparent, rgba(232,0,45,0.4), transparent)',
            marginTop: 8,
          }} />

          <div style={{ textAlign: 'center' }}>
            <div style={{ color: 'rgba(255,255,255,0.35)', fontSize: 10, letterSpacing: 2 }}>
              ALL TIMES IN IST (UTC+5:30)
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

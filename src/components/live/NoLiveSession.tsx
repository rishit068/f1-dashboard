import type { Race } from '../../types';
import { useCountdown } from '../../hooks/useCountdown';
import { padTwo } from '../../utils';

interface Props {
  nextRace: Race | null;
}

function nextSessionDateTime(race: Race | null): { label: string; datetime: string } | null {
  if (!race) return null;
  const now = new Date();

  const sessions: Array<{ label: string; date: string; time?: string }> = [
    race.FirstPractice  ? { label: 'FP1',        ...race.FirstPractice  } : null,
    race.SecondPractice ? { label: 'FP2',        ...race.SecondPractice } : null,
    race.ThirdPractice  ? { label: 'FP3',        ...race.ThirdPractice  } : null,
    race.SprintQualifying ? { label: 'Sprint Quali', ...race.SprintQualifying } : null,
    race.Sprint         ? { label: 'Sprint',     ...race.Sprint         } : null,
    race.Qualifying     ? { label: 'Qualifying', ...race.Qualifying     } : null,
    { label: 'Race', date: race.date, time: race.time },
  ].filter(Boolean) as Array<{ label: string; date: string; time?: string }>;

  for (const s of sessions) {
    const dt = new Date(`${s.date}T${s.time ?? '12:00:00Z'}`);
    if (dt > now) return { label: s.label, datetime: dt.toISOString() };
  }
  return null;
}

function toIST(isoStr: string): string {
  return new Date(isoStr).toLocaleString('en-IN', {
    timeZone: 'Asia/Kolkata',
    weekday: 'short', day: '2-digit', month: 'short',
    hour: '2-digit', minute: '2-digit', hour12: false,
  }) + ' IST';
}

export default function NoLiveSession({ nextRace }: Props) {
  const nextSession = nextSessionDateTime(nextRace);
  const countdown = useCountdown(nextSession?.datetime ?? null);

  return (
    <section style={{
      background: '#f5f5f0',
      padding: '80px 32px',
      minHeight: 'calc(100vh - 52px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <div style={{ maxWidth: 600, width: '100%', textAlign: 'center' }}>

        {/* Icon */}
        <div style={{ fontSize: 56, marginBottom: 24 }}>🏁</div>

        {/* Heading */}
        <h2 style={{
          fontSize: 32, fontWeight: 700, color: '#15151e',
          marginBottom: 12, lineHeight: 1.2,
        }}>
          No{' '}
          <span style={{
            fontFamily: 'Georgia, serif',
            fontStyle: 'italic',
            color: '#e8002d',
            fontWeight: 400,
          }}>
            Live Session
          </span>
        </h2>

        <p style={{ color: '#767676', fontSize: 15, lineHeight: 1.7, marginBottom: 40 }}>
          The LIVE timing tower activates automatically when a race session begins.
        </p>

        {/* Next session card */}
        {nextRace && nextSession && (
          <div style={{
            background: '#15151e',
            borderRadius: 12,
            padding: '28px 32px',
            marginBottom: 20,
            border: '1px solid rgba(255,255,255,0.06)',
            textAlign: 'left',
          }}>
            <div style={{
              fontSize: 9, fontWeight: 800, letterSpacing: 2.5,
              color: 'rgba(255,255,255,0.35)', marginBottom: 12,
            }}>
              NEXT SESSION
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div>
                <div style={{ color: '#fff', fontSize: 18, fontWeight: 800 }}>
                  {nextSession.label}
                </div>
                <div style={{ color: '#888', fontSize: 13, marginTop: 4 }}>
                  {nextRace.raceName}
                </div>
                <div style={{ color: '#555', fontSize: 11, marginTop: 2 }}>
                  {toIST(nextSession.datetime)}
                </div>
              </div>

              {/* Mini countdown */}
              <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                {[
                  { v: countdown.days,  l: 'D' },
                  { v: countdown.hours, l: 'H' },
                  { v: countdown.mins,  l: 'M' },
                  { v: countdown.secs,  l: 'S' },
                ].map(({ v, l }) => (
                  <div key={l} style={{ textAlign: 'center' }}>
                    <div style={{
                      background: '#2a2a35', borderRadius: 6,
                      padding: '8px 10px', minWidth: 44,
                      fontSize: 22, fontWeight: 900, color: '#fff',
                      fontVariantNumeric: 'tabular-nums',
                    }}>
                      {padTwo(v)}
                    </div>
                    <div style={{ fontSize: 8, color: '#555', marginTop: 3, letterSpacing: 1 }}>{l}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Sessions schedule */}
            <SessionSchedule race={nextRace} />
          </div>
        )}

        <p style={{ color: '#aaa', fontSize: 11, letterSpacing: 0.5 }}>
          This page checks for live sessions every 30 seconds automatically.
        </p>
      </div>
    </section>
  );
}

function SessionSchedule({ race }: { race: Race }) {
  const items = [
    race.FirstPractice   ? { l: 'FP1',        ...race.FirstPractice   } : null,
    race.SecondPractice  ? { l: 'FP2',        ...race.SecondPractice  } : null,
    race.ThirdPractice   ? { l: 'FP3',        ...race.ThirdPractice   } : null,
    race.SprintQualifying ? { l: 'Sprint Q',  ...race.SprintQualifying } : null,
    race.Sprint          ? { l: 'Sprint',     ...race.Sprint          } : null,
    race.Qualifying      ? { l: 'Qualifying', ...race.Qualifying      } : null,
    { l: 'Race', date: race.date, time: race.time ?? '12:00:00Z' },
  ].filter(Boolean) as Array<{ l: string; date: string; time: string }>;

  return (
    <div style={{
      display: 'flex', gap: 8, flexWrap: 'wrap',
      borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 14,
    }}>
      {items.map(s => {
        const dt = new Date(`${s.date}T${s.time}`);
        const past = dt < new Date();
        return (
          <div key={s.l} style={{
            background: past ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.06)',
            borderRadius: 6, padding: '6px 10px',
            opacity: past ? 0.4 : 1,
          }}>
            <div style={{ fontSize: 8, fontWeight: 700, color: past ? '#555' : '#e8002d', letterSpacing: 1 }}>
              {s.l}
            </div>
            <div style={{ fontSize: 10, color: '#888', marginTop: 2 }}>
              {padTwo(dt.getDate())}{' '}
              {dt.toLocaleString('en-US', { month: 'short' }).toUpperCase()}
            </div>
          </div>
        );
      })}
    </div>
  );
}

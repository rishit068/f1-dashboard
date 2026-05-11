import type { DriverStanding } from '../types';
import { getTeamColor } from '../utils';

interface Props {
  driverStandings: DriverStanding[];
  loading: boolean;
  round: number;
}

const NEWS_STORIES = [
  {
    tag: 'HOT STORY',
    tagColor: '#e8002d',
    headline: 'Championship Battle Heats Up as Teams Prepare for European Swing',
    body: 'With the midpoint of the season approaching, championship contenders are shifting development focus to circuit-specific upgrades.',
  },
  {
    tag: 'TECHNICAL',
    tagColor: '#15151e',
    headline: 'New Floor Regulations Spark Aero Wars in the Paddock',
    body: 'Several teams arrived at the last race weekend with significant floor updates, reigniting the aerodynamic development race.',
  },
];

export default function PaddockIntel({ driverStandings, loading, round }: Props) {
  const leader = driverStandings[0];
  const teamColor = leader ? getTeamColor(leader.Constructors[0]?.constructorId ?? '') : '#888';

  return (
    <div style={{ flex: '1 1 0', minWidth: 0 }}>
      <h3 className="mixed-heading" style={{ fontSize: 22, marginBottom: 4 }}>
        Paddock <span className="serif-red">Intel</span>
      </h3>
      <div className="label" style={{ marginBottom: 20 }}>
        LAST RACE · LAST STANDING
      </div>

      {/* Points leader card */}
      {loading ? (
        <div className="skeleton-light" style={{ height: 80, borderRadius: 8, marginBottom: 20 }} />
      ) : leader ? (
        <div style={{
          background: '#15151e',
          borderRadius: 8,
          padding: '16px 20px',
          marginBottom: 20,
          position: 'relative',
          overflow: 'hidden',
        }}>
          {/* Team color top accent */}
          <div style={{
            position: 'absolute', top: 0, left: 0, right: 0, height: 3,
            background: teamColor,
          }} />

          <div style={{
            display: 'inline-block',
            background: 'rgba(232,0,45,0.2)', border: '1px solid rgba(232,0,45,0.4)',
            borderRadius: 12, padding: '2px 10px',
            fontSize: 9, fontWeight: 700, letterSpacing: 2, color: '#e8002d',
            marginBottom: 10,
          }}>
            FASTEST BY {round} ROUNDS
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: 16, fontWeight: 800, color: '#fff' }}>
                {leader.Driver.givenName} {leader.Driver.familyName}
              </div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>
                {leader.Constructors[0]?.name}
              </div>
            </div>
            <div style={{
              fontSize: 32, fontWeight: 900, color: '#fff',
              fontVariantNumeric: 'tabular-nums', lineHeight: 1,
            }}>
              {leader.points}
              <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', marginLeft: 4 }}>PTS</span>
            </div>
          </div>
        </div>
      ) : null}

      {/* News stories */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
        {NEWS_STORIES.map((story, idx) => (
          <div key={idx}>
            {idx > 0 && <div style={{ height: 1, background: '#f0f0ea', margin: '14px 0' }} />}
            <div style={{ padding: '4px 0' }}>
              {/* Tag */}
              <div style={{
                display: 'inline-block',
                background: story.tagColor,
                color: '#fff',
                fontSize: 8, fontWeight: 700, letterSpacing: 1.8,
                padding: '3px 10px', borderRadius: 3,
                marginBottom: 8,
              }}>
                {story.tag}
              </div>

              {/* Headline */}
              <div style={{
                fontSize: 13, fontWeight: 700, color: '#15151e',
                lineHeight: 1.4, marginBottom: 6,
              }}>
                {story.headline}
              </div>

              {/* Body */}
              <div style={{
                fontSize: 12, color: '#767676', lineHeight: 1.6,
              }}>
                {story.body}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

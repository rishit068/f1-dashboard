import { useState, useEffect } from 'react';
import type { DriverRaceResult, DriverSeasonStats } from '../types';

const ERGAST = 'https://api.jolpi.ca/ergast/f1';

// ── Raw Ergast shapes ─────────────────────────────────────────────────────────
interface RawResult {
  position: string;
  positionText: string;
  points: string;
  Driver: { driverId: string };
  grid: string;
  laps: string;
  status: string;
  Time?: { time: string };
  FastestLap?: { rank: string; Time?: { time: string } };
}
interface RawRace {
  round: string;
  raceName: string;
  Circuit: { circuitName: string; Location: { locality: string; country: string } };
  date: string;
  Results?: RawResult[];
}

// ── Module-level cache (survives re-renders, never re-fetches) ────────────────
let cache: Map<string, DriverSeasonStats> | null = null;
let pending: Array<(m: Map<string, DriverSeasonStats>) => void> = [];
let fetching = false;

function buildMap(races: RawRace[]): Map<string, DriverSeasonStats> {
  const map = new Map<string, DriverSeasonStats>();

  for (const race of races) {
    const round = parseInt(race.round, 10);
    for (const r of race.Results ?? []) {
      const id = r.Driver.driverId;
      const posText = r.positionText;
      const isFinished = /^\d+$/.test(posText);
      const pos: number | null = isFinished ? parseInt(posText, 10) : null;

      const entry: DriverRaceResult = {
        round,
        raceName: race.raceName,
        circuitName: race.Circuit.circuitName,
        locality: race.Circuit.Location.locality,
        country: race.Circuit.Location.country,
        date: race.date,
        position: pos,
        positionText: posText,
        status: r.status,
        grid: parseInt(r.grid, 10) || 0,
        laps: parseInt(r.laps, 10) || 0,
        points: parseFloat(r.points) || 0,
        gap: r.Time?.time ?? '',
        fastestLap: r.FastestLap?.rank === '1',
        fastestLapTime: r.FastestLap?.Time?.time ?? null,
      };

      if (!map.has(id)) {
        map.set(id, {
          totalPoints: 0, wins: 0, podiums: 0, fastestLaps: 0, dnfs: 0,
          completedRaces: 0, bestResult: null, pointsPerRace: 0,
          avgFinishPosition: 0, results: [],
        });
      }
      const st = map.get(id)!;
      st.results.push(entry);
      st.totalPoints += entry.points;
      st.completedRaces++;
      if (pos === 1) st.wins++;
      if (pos !== null && pos <= 3) st.podiums++;
      if (entry.fastestLap) st.fastestLaps++;
      if (pos === null) st.dnfs++;
      if (pos !== null && (st.bestResult === null || pos < st.bestResult)) st.bestResult = pos;
    }
  }

  for (const st of map.values()) {
    st.results.sort((a, b) => a.round - b.round);
    st.pointsPerRace = st.completedRaces > 0
      ? Math.round((st.totalPoints / st.completedRaces) * 10) / 10
      : 0;
    const fins = st.results.filter(r => r.position !== null);
    st.avgFinishPosition = fins.length > 0
      ? Math.round((fins.reduce((s, r) => s + r.position!, 0) / fins.length) * 10) / 10
      : 0;
  }

  return map;
}

export function useDriverSeasonResults(): {
  stats: Map<string, DriverSeasonStats> | null;
  loading: boolean;
} {
  const [stats, setStats] = useState<Map<string, DriverSeasonStats> | null>(cache);
  const [loading, setLoading] = useState(cache === null);

  useEffect(() => {
    if (cache) { setStats(cache); setLoading(false); return; }

    const onDone = (m: Map<string, DriverSeasonStats>) => {
      setStats(m); setLoading(false);
    };

    if (fetching) { pending.push(onDone); return; }

    fetching = true;
    fetch(`${ERGAST}/2026/results.json?limit=400`)
      .then(r => r.json())
      .then(data => {
        const races: RawRace[] = data?.MRData?.RaceTable?.Races ?? [];
        const map = buildMap(races);
        cache = map;
        onDone(map);
        for (const cb of pending) cb(map);
        pending = [];
      })
      .catch(() => setLoading(false))
      .finally(() => { fetching = false; });
  }, []);

  return { stats, loading };
}

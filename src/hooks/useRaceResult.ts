import { useState, useCallback, useRef } from 'react';
import type { RaceResult, RaceResultData } from '../types';
import { getTeamColorByName } from '../utils';

const ERGAST = 'https://api.jolpi.ca/ergast/f1';

// ── Parse status → FinishPosition ─────────────────────────────────────────────
function parsePosition(pos: string, status: string): RaceResult['position'] {
  const n = parseInt(pos, 10);
  if (!isNaN(n)) return n;
  const s = status.toUpperCase();
  if (s.includes('DSQ') || s.includes('DISQ')) return 'DSQ';
  if (s.includes('DNS') || s.includes('NOT STARTED')) return 'DNS';
  return 'DNF';
}

// ── Parse gap string ───────────────────────────────────────────────────────────
function parseGap(time: { time?: string } | undefined, status: string, pos: number): string {
  if (pos === 1) return '';
  if (time?.time) return `+${time.time}`;
  const s = status.toLowerCase();
  if (s.startsWith('+') || s.includes('lap')) return status;
  return status; // "Accident", "Engine", etc.
}

// ── Raw Ergast shapes ──────────────────────────────────────────────────────────
interface ErgastResult {
  position: string;
  number: string;
  Driver: { givenName: string; familyName: string; nationality: string; };
  Constructor: { name: string; };
  grid: string;
  laps: string;
  status: string;
  Time?: { time: string };
  FastestLap?: { rank: string; Time: { time: string } };
  points: string;
}

interface ErgastRace {
  raceName: string;
  Circuit: { circuitName: string; Location: { locality: string; country: string } };
  date: string;
  round: string;
  season: string;
  Results?: ErgastResult[];
}

// ── Module-level result cache (survives re-renders, cleared on page reload) ────
const resultCache = new Map<string, RaceResultData>();

export interface UseRaceResultReturn {
  data: RaceResultData | null;
  loading: boolean;
  error: string | null;
  fetch: (season: string, round: string) => void;
  retry: () => void;
}

export function useRaceResult(): UseRaceResultReturn {
  const [data, setData] = useState<RaceResultData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const lastKey = useRef<string | null>(null);

  const fetchResult = useCallback(async (season: string, round: string) => {
    const key = `${season}/${round}`;
    lastKey.current = key;

    // Cache hit — return immediately
    if (resultCache.has(key)) {
      setData(resultCache.get(key)!);
      setError(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    setData(null);

    try {
      const res = await fetch(`${ERGAST}/${season}/${round}/results.json`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();

      const race: ErgastRace = json?.MRData?.RaceTable?.Races?.[0];
      if (!race || !race.Results?.length) {
        setError('Results not available yet');
        setLoading(false);
        return;
      }

      // Find overall fastest lap
      let fastestLapDriver = '';
      let fastestLapTime = '';
      let maxLaps = 0;

      const results: RaceResult[] = race.Results.map(r => {
        const pos = parseInt(r.position, 10);
        const laps = parseInt(r.laps, 10);
        if (laps > maxLaps) maxLaps = laps;

        const hasFl = r.FastestLap?.rank === '1';
        if (hasFl) {
          fastestLapDriver = `${r.Driver.givenName} ${r.Driver.familyName}`;
          fastestLapTime = r.FastestLap?.Time.time ?? '';
        }

        return {
          position: parsePosition(r.position, r.status),
          driverNumber: r.number,
          fullName: `${r.Driver.givenName} ${r.Driver.familyName}`,
          givenName: r.Driver.givenName,
          familyName: r.Driver.familyName,
          nationality: r.Driver.nationality,
          team: r.Constructor.name,
          teamColor: getTeamColorByName(r.Constructor.name),
          grid: parseInt(r.grid, 10) || 0,
          laps,
          status: r.status,
          raceTime: pos === 1 ? (r.Time?.time ?? '') : '',
          gap: parseGap(r.Time, r.status, pos),
          points: parseFloat(r.points) || 0,
          fastestLap: hasFl,
          fastestLapTime: r.FastestLap?.Time.time ?? null,
          fastestLapRank: r.FastestLap?.rank ? parseInt(r.FastestLap.rank, 10) : null,
        };
      });

      const out: RaceResultData = {
        raceName: race.raceName,
        circuit: race.Circuit.circuitName,
        locality: race.Circuit.Location.locality,
        country: race.Circuit.Location.country,
        date: race.date,
        round: parseInt(race.round, 10),
        season: race.season,
        totalLaps: maxLaps,
        results,
        winnerTime: race.Results[0]?.Time?.time ?? '',
        fastestLapDriver,
        fastestLapTime,
      };

      resultCache.set(key, out);
      // Only apply if this is still the latest request
      if (lastKey.current === key) {
        setData(out);
        setLoading(false);
      }
    } catch (e) {
      if (lastKey.current === key) {
        setError('Failed to load results. Tap to retry.');
        setLoading(false);
      }
    }
  }, []);

  const retry = useCallback(() => {
    if (lastKey.current) {
      const [season, round] = lastKey.current.split('/');
      resultCache.delete(lastKey.current); // clear bad cache entry
      fetchResult(season, round);
    }
  }, [fetchResult]);

  return { data, loading, error, fetch: fetchResult, retry };
}

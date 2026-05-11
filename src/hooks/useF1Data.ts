import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import type {
  Race, DriverStanding, ConstructorStanding,
  OpenF1Session, OpenF1Position, OpenF1Interval, OpenF1Driver,
} from '../types';

const ERGAST = 'https://api.jolpi.ca/ergast/f1';
const OPENF1 = 'https://api.openf1.org/v1';

export interface F1Data {
  nextRace: Race | null;
  allRaces: Race[];
  driverStandings: DriverStanding[];
  constructorStandings: ConstructorStanding[];
  liveSession: OpenF1Session | null;
  livePositions: OpenF1Position[];
  liveIntervals: OpenF1Interval[];
  liveDrivers: OpenF1Driver[];
  loading: boolean;
  errors: string[];
  currentRound: number;
  totalRounds: number;
}

export function useF1Data(): F1Data {
  const [nextRace, setNextRace] = useState<Race | null>(null);
  const [allRaces, setAllRaces] = useState<Race[]>([]);
  const [driverStandings, setDriverStandings] = useState<DriverStanding[]>([]);
  const [constructorStandings, setConstructorStandings] = useState<ConstructorStanding[]>([]);
  const [liveSession, setLiveSession] = useState<OpenF1Session | null>(null);
  const [livePositions, setLivePositions] = useState<OpenF1Position[]>([]);
  const [liveIntervals, setLiveIntervals] = useState<OpenF1Interval[]>([]);
  const [liveDrivers, setLiveDrivers] = useState<OpenF1Driver[]>([]);
  const [loading, setLoading] = useState(true);
  const [errors, setErrors] = useState<string[]>([]);

  const addError = (msg: string) =>
    setErrors(prev => prev.includes(msg) ? prev : [...prev, msg]);

  // ── Static data (fetch once) ──────────────────────────────────────────────
  useEffect(() => {
    const fetchStatic = async () => {
      try {
        const [nextRes, allRes, driversRes, ctorsRes] = await Promise.allSettled([
          axios.get(`${ERGAST}/current/next.json`),
          axios.get(`${ERGAST}/current.json`),
          axios.get(`${ERGAST}/current/driverStandings.json`),
          axios.get(`${ERGAST}/current/constructorStandings.json`),
        ]);

        if (nextRes.status === 'fulfilled') {
          setNextRace(nextRes.value.data?.MRData?.RaceTable?.Races?.[0] ?? null);
        } else addError('Next race data unavailable');

        if (allRes.status === 'fulfilled') {
          setAllRaces(allRes.value.data?.MRData?.RaceTable?.Races ?? []);
        } else addError('Season calendar unavailable');

        if (driversRes.status === 'fulfilled') {
          const standings = driversRes.value.data?.MRData?.StandingsTable
            ?.StandingsLists?.[0]?.DriverStandings ?? [];
          setDriverStandings(standings);
        } else addError('Driver standings unavailable');

        if (ctorsRes.status === 'fulfilled') {
          const standings = ctorsRes.value.data?.MRData?.StandingsTable
            ?.StandingsLists?.[0]?.ConstructorStandings ?? [];
          setConstructorStandings(standings);
        } else addError('Constructor standings unavailable');

      } finally {
        setLoading(false);
      }
    };
    fetchStatic();
  }, []);

  // ── Live session detection & polling ─────────────────────────────────────
  const checkLive = useCallback(async () => {
    try {
      const now = new Date();
      const year = now.getFullYear();
      const res = await axios.get(`${OPENF1}/sessions?year=${year}&session_type=Race`);
      const sessions: OpenF1Session[] = res.data ?? [];
      const live = sessions.find(s => {
        const start = new Date(s.date_start);
        const end = new Date(s.date_end);
        return now >= start && now <= end;
      }) ?? null;
      setLiveSession(live);

      if (live) {
        const [posRes, intRes, drvRes] = await Promise.allSettled([
          axios.get(`${OPENF1}/position?session_key=${live.session_key}&date>${new Date(Date.now()-30000).toISOString()}`),
          axios.get(`${OPENF1}/intervals?session_key=${live.session_key}`),
          axios.get(`${OPENF1}/drivers?session_key=${live.session_key}`),
        ]);
        if (posRes.status === 'fulfilled') setLivePositions(posRes.value.data ?? []);
        if (intRes.status === 'fulfilled') setLiveIntervals(intRes.value.data ?? []);
        if (drvRes.status === 'fulfilled') setLiveDrivers(drvRes.value.data ?? []);
      }
    } catch {
      // silently ignore live polling errors
    }
  }, []);

  useEffect(() => {
    checkLive();
    const id = setInterval(checkLive, 8000);
    return () => clearInterval(id);
  }, [checkLive]);

  const currentRound = nextRace ? parseInt(nextRace.round, 10) - 1 : 0;
  const totalRounds = allRaces.length;

  return {
    nextRace, allRaces, driverStandings, constructorStandings,
    liveSession, livePositions, liveIntervals, liveDrivers,
    loading, errors, currentRound, totalRounds,
  };
}

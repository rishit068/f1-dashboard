import { useState, useEffect, useRef, useCallback } from 'react';
import type {
  LiveRaceState, LiveDriver, RaceControlMessage,
  RaceWeather, FastestLapEntry,
} from '../types';

const BASE = 'https://api.openf1.org/v1';
const POLL_MS = 4_000;

// ── Formatters ────────────────────────────────────────────────────────────────
function fmtLap(sec: number | null): string {
  if (!sec || sec <= 0) return '–';
  const m = Math.floor(sec / 60);
  const s = (sec % 60).toFixed(3).padStart(6, '0');
  return `${m}:${s}`;
}

function fmtGap(val: number | null | undefined): string {
  if (val == null || val <= 0) return 'LEADER';
  if (val > 90) return `+${Math.round(val / 90)} LAP`;
  return `+${val.toFixed(3)}s`;
}

function fmtInterval(val: number | null | undefined): string {
  if (val == null) return '–';
  if (val <= 0) return '–';
  return `+${val.toFixed(3)}s`;
}

// ── Raw OpenF1 shapes ─────────────────────────────────────────────────────────
interface RawDriver {
  driver_number: number;
  full_name: string;
  name_acronym: string;
  team_name: string;
  team_colour: string;
}
interface RawPos { driver_number: number; position: number; date: string; }
interface RawInterval { driver_number: number; gap_to_leader: number | null; interval: number | null; date: string; }
interface RawStint { driver_number: number; stint_number: number; compound: string; lap_start: number; lap_end: number | null; }
interface RawLap { driver_number: number; lap_number: number; lap_duration: number | null; date_start: string; }
interface RawCarData { driver_number: number; drs: number; speed: number; date: string; }
interface RawRC { date: string; message: string; flag: string; category: string; lap_number: number | null; }
interface RawWeather { track_temperature: number; air_temperature: number; humidity: number; rainfall: number; wind_speed: number; }

// ── Latest-per-driver reducer ─────────────────────────────────────────────────
function latestPerDriver<T extends { driver_number: number; date?: string }>(
  arr: T[]
): Map<number, T> {
  const m = new Map<number, T>();
  for (const item of arr) {
    const cur = m.get(item.driver_number);
    if (!cur || (item.date && cur.date && item.date > cur.date)) {
      m.set(item.driver_number, item);
    }
  }
  return m;
}

// ── Detect SC status from race control ───────────────────────────────────────
function detectSC(msgs: RaceControlMessage[]): LiveRaceState['safetyCarStatus'] {
  for (const m of msgs.slice(0, 10)) {
    const txt = m.message.toUpperCase();
    if (txt.includes('RED FLAG')) return 'RED_FLAG';
    if (txt.includes('VIRTUAL SAFETY CAR') || txt.includes('VSC')) return 'VIRTUAL_SC';
    if (txt.includes('SAFETY CAR') || txt.includes('DEPLOYED')) return 'SAFETY_CAR';
    if (txt.includes('TRACK CLEAR') || txt.includes('SAFETY CAR IN')) return 'NONE';
  }
  return 'NONE';
}

export function useLiveRaceData(
  sessionKey: number | null,
  isActive: boolean,
): LiveRaceState | null {
  const [state, setState] = useState<LiveRaceState | null>(null);
  const prevPositions = useRef<Map<number, number>>(new Map());
  const driversCache = useRef<Map<number, RawDriver>>(new Map());
  const stintCount = useRef<Map<number, number>>(new Map());
  const sessionInfoRef = useRef<{ name: string; circuit: string; totalLaps: number } | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  // Fetch drivers + session info once
  useEffect(() => {
    if (!sessionKey || !isActive) return;
    const ac = new AbortController();

    Promise.all([
      fetch(`${BASE}/drivers?session_key=${sessionKey}`, { signal: ac.signal })
        .then(r => r.json() as Promise<RawDriver[]>),
      fetch(`${BASE}/sessions?session_key=${sessionKey}`, { signal: ac.signal })
        .then(r => r.json() as Promise<Array<{ session_name: string; circuit_short_name?: string; location?: string; country_name?: string }>>),
    ]).then(([drivers, sessions]) => {
      for (const d of drivers) driversCache.current.set(d.driver_number, d);
      if (sessions[0]) {
        const s = sessions[0];
        sessionInfoRef.current = {
          name: s.session_name,
          circuit: s.circuit_short_name ?? s.location ?? s.country_name ?? 'Circuit',
          totalLaps: 57,
        };
      }
    }).catch(() => {});

    return () => ac.abort();
  }, [sessionKey, isActive]);

  const fetch4s = useCallback(async () => {
    if (!sessionKey || !isActive) return;
    if (abortRef.current) abortRef.current.abort();
    const ac = new AbortController();
    abortRef.current = ac;

    const since10s = new Date(Date.now() - 10_000).toISOString();
    const since1h  = new Date(Date.now() - 3_600_000).toISOString();
    const since2m  = new Date(Date.now() - 120_000).toISOString();

    try {
      const [posRes, intRes, stintRes, lapRes, carRes, rcRes, wxRes] = await Promise.allSettled([
        fetch(`${BASE}/position?session_key=${sessionKey}&date>${since10s}`, { signal: ac.signal }).then(r => r.json() as Promise<RawPos[]>),
        fetch(`${BASE}/intervals?session_key=${sessionKey}&date>${since10s}`, { signal: ac.signal }).then(r => r.json() as Promise<RawInterval[]>),
        fetch(`${BASE}/stints?session_key=${sessionKey}`, { signal: ac.signal }).then(r => r.json() as Promise<RawStint[]>),
        fetch(`${BASE}/laps?session_key=${sessionKey}`, { signal: ac.signal }).then(r => r.json() as Promise<RawLap[]>),
        fetch(`${BASE}/car_data?session_key=${sessionKey}&date>${since10s}&fields=driver_number,drs,speed,date`, { signal: ac.signal }).then(r => r.json() as Promise<RawCarData[]>),
        fetch(`${BASE}/race_control?session_key=${sessionKey}&date>${since1h}`, { signal: ac.signal }).then(r => r.json() as Promise<RawRC[]>),
        fetch(`${BASE}/weather?session_key=${sessionKey}&date>${since2m}`, { signal: ac.signal }).then(r => r.json() as Promise<RawWeather[]>),
      ]);

      const positions  = posRes.status === 'fulfilled'   ? posRes.value   : [];
      const intervals  = intRes.status === 'fulfilled'   ? intRes.value   : [];
      const stints     = stintRes.status === 'fulfilled' ? stintRes.value : [];
      const laps       = lapRes.status === 'fulfilled'   ? lapRes.value   : [];
      const carData    = carRes.status === 'fulfilled'   ? carRes.value   : [];
      const rcMsgs     = rcRes.status === 'fulfilled'    ? rcRes.value    : [];
      const weather    = wxRes.status === 'fulfilled'    ? wxRes.value    : [];

      // ── Process data ──────────────────────────────────────────────────────
      const latestPos  = latestPerDriver(positions);
      const latestInt  = latestPerDriver(intervals);
      const latestCar  = latestPerDriver(carData);

      // Latest stint per driver
      const latestStint = new Map<number, RawStint>();
      for (const s of stints) {
        const cur = latestStint.get(s.driver_number);
        if (!cur || s.stint_number > cur.stint_number) latestStint.set(s.driver_number, s);
      }

      // Pit count (number of stints - 1)
      const pitCounts = new Map<number, number>();
      const stintNums = new Map<number, number>();
      for (const s of stints) {
        const prev = stintNums.get(s.driver_number) ?? 0;
        if (s.stint_number > prev) stintNums.set(s.driver_number, s.stint_number);
      }
      for (const [dn, maxStint] of stintNums) pitCounts.set(dn, Math.max(0, maxStint - 1));

      // Latest lap per driver
      const latestLap = new Map<number, RawLap>();
      for (const l of laps) {
        const cur = latestLap.get(l.driver_number);
        if (!cur || l.lap_number > cur.lap_number) latestLap.set(l.driver_number, l);
      }

      // All completed laps (for fastest lap board)
      const validLaps = laps.filter(l => l.lap_duration && l.lap_duration > 0);
      const byTime = [...validLaps].sort((a, b) => (a.lap_duration ?? 999) - (b.lap_duration ?? 999));
      const top5Laps: FastestLapEntry[] = byTime.slice(0, 5).map(l => {
        const d = driversCache.current.get(l.driver_number);
        return {
          driverNumber: l.driver_number,
          lapTime: l.lap_duration!,
          lapNumber: l.lap_number,
          driverName: d?.name_acronym ?? `#${l.driver_number}`,
          teamColor: d?.team_colour ? `#${d.team_colour}` : '#888',
        };
      });
      const overallFastest = top5Laps[0] ?? null;

      // Personal bests per driver
      const personalBest = new Map<number, number>();
      for (const l of validLaps) {
        const cur = personalBest.get(l.driver_number);
        if (!cur || l.lap_duration! < cur) personalBest.set(l.driver_number, l.lap_duration!);
      }

      // Current lap of race (max lap number seen)
      let maxLap = 0;
      for (const l of laps) if (l.lap_number > maxLap) maxLap = l.lap_number;

      // ── Build drivers array ───────────────────────────────────────────────
      const allDriverNums = new Set([
        ...driversCache.current.keys(),
        ...latestPos.keys(),
      ]);

      const drivers: LiveDriver[] = [];
      for (const dn of allDriverNums) {
        const pos = latestPos.get(dn)?.position ?? 99;
        const prev = prevPositions.current.get(dn) ?? pos;
        const change: LiveDriver['positionChange'] =
          pos < prev ? 'gained' : pos > prev ? 'lost' : 'same';

        const intEntry = latestInt.get(dn);
        const gapNum = intEntry?.gap_to_leader;
        const intNum = intEntry?.interval;
        const carEntry = latestCar.get(dn);
        const stintEntry = latestStint.get(dn);
        const lapEntry = latestLap.get(dn);
        const rawDriver = driversCache.current.get(dn);
        const lapTime = lapEntry?.lap_duration ?? null;
        const isFastest = overallFastest?.driverNumber === dn &&
          lapTime != null && lapTime === overallFastest.lapTime;
        const pb = personalBest.get(dn);
        const isPersonalBest = pb != null && lapTime != null && lapTime === pb && !isFastest;

        drivers.push({
          driverNumber: dn,
          position: pos,
          previousPosition: prev,
          fullName: rawDriver?.full_name ?? `Driver ${dn}`,
          acronym: rawDriver?.name_acronym ?? `D${dn}`,
          teamName: rawDriver?.team_name ?? 'Unknown',
          teamColor: rawDriver?.team_colour ? `#${rawDriver.team_colour}` : '#888888',
          tireCompound: stintEntry?.compound ?? 'UNKNOWN',
          tireLaps: stintEntry
            ? (lapEntry?.lap_number ?? stintEntry.lap_start) - stintEntry.lap_start + 1
            : 0,
          currentLap: lapEntry?.lap_number ?? maxLap,
          gapToLeader: gapNum != null ? fmtGap(gapNum) : pos === 1 ? 'LEADER' : '–',
          interval: intNum != null ? fmtInterval(intNum) : '–',
          lastLapTime: lapTime,
          lastLapFormatted: fmtLap(lapTime),
          isFastestLap: isFastest,
          isPersonalBest: isPersonalBest,
          pitStops: pitCounts.get(dn) ?? 0,
          status: 'RACING',
          drsOpen: (carEntry?.drs ?? 0) === 12 || (carEntry?.drs ?? 0) === 14,
          positionChange: change,
        });
      }
      drivers.sort((a, b) => a.position - b.position);

      // Update prev positions ref
      for (const d of drivers) prevPositions.current.set(d.driverNumber, d.position);
      stintCount.current = stintNums;

      // ── Race control ──────────────────────────────────────────────────────
      const raceControl: RaceControlMessage[] = [...rcMsgs]
        .sort((a, b) => b.date.localeCompare(a.date))
        .slice(0, 15)
        .map(m => ({
          date: m.date,
          message: m.message,
          flag: m.flag ?? '',
          category: m.category ?? '',
          lapNumber: m.lap_number ?? null,
        }));

      const scStatus = detectSC(raceControl);

      // ── Weather ───────────────────────────────────────────────────────────
      const wx = weather[weather.length - 1];
      const weatherOut: RaceWeather | null = wx
        ? {
          trackTemp: wx.track_temperature,
          airTemp: wx.air_temperature,
          humidity: wx.humidity,
          rainfall: wx.rainfall,
          windSpeed: wx.wind_speed,
        }
        : null;

      const isStale = posRes.status !== 'fulfilled' && intRes.status !== 'fulfilled';

      setState({
        session: {
          name: sessionInfoRef.current?.name ?? 'Race',
          circuit: sessionInfoRef.current?.circuit ?? 'Circuit',
          totalLaps: sessionInfoRef.current?.totalLaps ?? 57,
          sessionKey,
        },
        drivers,
        raceControl,
        weather: weatherOut,
        currentLap: maxLap,
        fastestLap: overallFastest,
        fastestLapsBoard: top5Laps,
        safetyCarStatus: scStatus,
        lastUpdated: new Date(),
        isStale,
      });
    } catch (e: unknown) {
      if (e instanceof Error && e.name === 'AbortError') return;
      setState(prev => prev ? { ...prev, isStale: true } : null);
    }
  }, [sessionKey, isActive]);

  useEffect(() => {
    if (!sessionKey || !isActive) { setState(null); return; }
    fetch4s();
    const id = setInterval(fetch4s, POLL_MS);
    return () => {
      clearInterval(id);
      abortRef.current?.abort();
    };
  }, [sessionKey, isActive, fetch4s]);

  return state;
}

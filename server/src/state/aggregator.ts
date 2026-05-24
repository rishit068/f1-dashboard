import type {
  LiveRaceState, LiveDriver, RaceControlMessage,
  RaceWeather, FastestLapEntry, LiveSessionMeta, LivePhase,
} from '../types.js';

/**
 * Merges incoming SignalR topic updates into a single `LiveRaceState`.
 *
 * F1 sends data as a series of topic-keyed messages whose payloads can be
 * either full snapshots (on subscribe) or partial deltas (during streaming).
 * For most topics the payload is an object; deltas are deep-merged onto the
 * cached previous version.
 *
 * We keep the raw per-topic cache here as `raw` so we can recompute the
 * derived `LiveRaceState` on every change without losing context.
 */

// ─── Raw F1 SignalR topic shapes (only the fields we use) ────────────────────

interface RawSessionInfo {
  Meeting?: {
    Key?: number;
    Name?: string;
    OfficialName?: string;
    Number?: number;
    Country?: { Name?: string; Code?: string };
    Circuit?: { Key?: number; ShortName?: string };
  };
  Type?: string;
  Name?: string;
  StartDate?: string;
  EndDate?: string;
  GmtOffset?: string;
  Path?: string;
  Number?: number;
  Key?: number;
}

interface RawDriverList {
  [driverNumber: string]: {
    RacingNumber?: string;
    BroadcastName?: string;
    FullName?: string;
    Tla?: string;
    Line?: number;
    TeamName?: string;
    TeamColour?: string;
    FirstName?: string;
    LastName?: string;
    Reference?: string;
    HeadshotUrl?: string;
    CountryCode?: string;
  };
}

interface RawTimingDataLines {
  [driverNumber: string]: {
    Line?: number;
    Position?: string;            // "1", "2", …
    GapToLeader?: string;         // "+0.123", "+1 LAP", ""
    IntervalToPositionAhead?: { Value?: string; Catching?: boolean };
    NumberOfPitStops?: number;
    InPit?: boolean;
    PitOut?: boolean;
    Status?: number;
    Retired?: boolean;
    Stopped?: boolean;
    LastLapTime?: { Value?: string; Status?: number; Overall?: boolean; PersonalFastest?: boolean };
    BestLapTime?: { Value?: string; Lap?: number };
    Sectors?: Array<{ Value?: string; Status?: number; Stopped?: boolean }>;
  };
}

interface RawTimingData {
  Lines?: RawTimingDataLines;
  SessionPart?: number;
  CutOffTime?: string;
}

interface RawTimingStats {
  Lines?: {
    [driverNumber: string]: {
      PersonalBestLapTime?: { Value?: string; Lap?: number; Position?: number };
      BestSpeeds?: { I1?: { Value?: string }; I2?: { Value?: string }; FL?: { Value?: string }; ST?: { Value?: string } };
    };
  };
}

interface RawTimingAppData {
  Lines?: {
    [driverNumber: string]: {
      Stints?: Array<{
        TotalLaps?: number;
        Compound?: string;        // "SOFT" | "MEDIUM" | "HARD" | "INTERMEDIATE" | "WET"
        New?: string;             // "true" | "false"
        TyresNotChanged?: string;
        StartLaps?: number;
      }>;
    };
  };
}

interface RawWeatherData {
  AirTemp?: string;
  Humidity?: string;
  Pressure?: string;
  Rainfall?: string;
  TrackTemp?: string;
  WindDirection?: string;
  WindSpeed?: string;
}

interface RawTrackStatus {
  Status?: string;      // "1"=green "2"=yellow "4"=SC "5"=red "6"=VSC deployed "7"=VSC ending
  Message?: string;
}

interface RawSessionStatus {
  Status?: string;      // "Started" | "Aborted" | "Finished" | "Inactive"
}

interface RawLapCount {
  CurrentLap?: number;
  TotalLaps?: number;
}

interface RawRaceControlMessages {
  Messages?: Record<string, {
    Utc?: string;
    Lap?: number;
    Category?: string;
    Flag?: string;
    Scope?: string;
    Sector?: number;
    Message?: string;
  }>;
}

// ─── Aggregator ───────────────────────────────────────────────────────────────

export class StateAggregator {
  private raw: {
    SessionInfo:          RawSessionInfo | null;
    SessionStatus:        RawSessionStatus | null;
    DriverList:           RawDriverList;
    TimingData:           RawTimingData;
    TimingStats:          RawTimingStats;
    TimingAppData:        RawTimingAppData;
    WeatherData:          RawWeatherData | null;
    TrackStatus:          RawTrackStatus | null;
    LapCount:             RawLapCount | null;
    RaceControlMessages:  RawRaceControlMessages;
  } = {
    SessionInfo: null,
    SessionStatus: null,
    DriverList: {},
    TimingData: {},
    TimingStats: {},
    TimingAppData: {},
    WeatherData: null,
    TrackStatus: null,
    LapCount: null,
    RaceControlMessages: { Messages: {} },
  };

  /** Tracks previous positions so we can derive position-change indicator. */
  private prevPositions = new Map<number, number>();

  /** Set to true once we've received any session data. */
  private hasData = false;

  /** Apply a topic update — full snapshot or delta. */
  ingest(topic: string, data: unknown, isInitial: boolean): void {
    if (!data || typeof data !== 'object') return;
    this.hasData = true;

    switch (topic) {
      case 'SessionInfo':
        this.raw.SessionInfo = data as RawSessionInfo;
        break;
      case 'SessionStatus':
        this.raw.SessionStatus = isInitial
          ? (data as RawSessionStatus)
          : { ...this.raw.SessionStatus, ...(data as RawSessionStatus) };
        break;
      case 'DriverList':
        if (isInitial) this.raw.DriverList = data as RawDriverList;
        else deepMerge(this.raw.DriverList, data as RawDriverList);
        break;
      case 'TimingData':
        if (isInitial) this.raw.TimingData = data as RawTimingData;
        else deepMerge(this.raw.TimingData as Record<string, unknown>, data as Record<string, unknown>);
        break;
      case 'TimingStats':
        if (isInitial) this.raw.TimingStats = data as RawTimingStats;
        else deepMerge(this.raw.TimingStats as Record<string, unknown>, data as Record<string, unknown>);
        break;
      case 'TimingAppData':
        if (isInitial) this.raw.TimingAppData = data as RawTimingAppData;
        else deepMerge(this.raw.TimingAppData as Record<string, unknown>, data as Record<string, unknown>);
        break;
      case 'WeatherData':
        this.raw.WeatherData = isInitial
          ? (data as RawWeatherData)
          : { ...this.raw.WeatherData, ...(data as RawWeatherData) };
        break;
      case 'TrackStatus':
        this.raw.TrackStatus = isInitial
          ? (data as RawTrackStatus)
          : { ...this.raw.TrackStatus, ...(data as RawTrackStatus) };
        break;
      case 'LapCount':
        this.raw.LapCount = isInitial
          ? (data as RawLapCount)
          : { ...this.raw.LapCount, ...(data as RawLapCount) };
        break;
      case 'RaceControlMessages':
        if (isInitial) {
          this.raw.RaceControlMessages = data as RawRaceControlMessages;
        } else {
          const cur = this.raw.RaceControlMessages.Messages ?? {};
          const inc = (data as RawRaceControlMessages).Messages ?? {};
          this.raw.RaceControlMessages = { Messages: { ...cur, ...inc } };
        }
        break;
      default:
        // Ignore topics we don't need (CarData, Position, TopThree, etc.)
        break;
    }
  }

  hasAnyData(): boolean { return this.hasData; }

  /** Build a `LiveSessionMeta` object — null until SessionInfo has arrived. */
  sessionMeta(): LiveSessionMeta | null {
    const si = this.raw.SessionInfo;
    if (!si) return null;
    return {
      session_key:       si.Key ?? 0,
      session_name:      si.Name ?? '',
      session_type:      si.Type ?? '',
      date_start:        si.StartDate ?? '',
      date_end:          si.EndDate ?? '',
      year:              si.StartDate ? new Date(si.StartDate).getUTCFullYear() : new Date().getUTCFullYear(),
      meeting_key:       si.Meeting?.Key ?? 0,
      meeting_name:      si.Meeting?.OfficialName ?? si.Meeting?.Name,
      circuit_short_name: si.Meeting?.Circuit?.ShortName ?? '',
      country_name:      si.Meeting?.Country?.Name ?? '',
      location:          si.Meeting?.Name ?? '',
      total_laps:        this.raw.LapCount?.TotalLaps,
    };
  }

  /** Derive the live phase: LIVE / COMPLETE / NONE. */
  phase(): LivePhase {
    const st = this.raw.SessionStatus?.Status;
    if (!st) return 'NONE';
    if (st === 'Started') return 'LIVE';
    if (st === 'Finished' || st === 'Ends') return 'COMPLETE';
    if (st === 'Aborted') return 'COMPLETE';
    if (st === 'Inactive') return 'NONE';
    return 'NONE';
  }

  /** Materialise the full LiveRaceState from the current raw cache. */
  snapshot(): LiveRaceState | null {
    if (!this.hasData) return null;
    return {
      session:          this.buildSession(),
      drivers:          this.buildDrivers(),
      raceControl:      this.buildRaceControl(),
      weather:          this.buildWeather(),
      currentLap:       this.raw.LapCount?.CurrentLap ?? 0,
      fastestLap:       this.buildFastestLap(),
      fastestLapsBoard: this.buildFastestLapBoard(),
      safetyCarStatus:  this.buildSCStatus(),
      lastUpdated:      new Date().toISOString(),
      isStale:          false,
    };
  }

  // ─── Builders ────────────────────────────────────────────────────────────

  private buildSession(): LiveRaceState['session'] {
    const si = this.raw.SessionInfo;
    return {
      name:       si?.Name ?? 'Session',
      circuit:    si?.Meeting?.Circuit?.ShortName ?? si?.Meeting?.Name ?? 'Circuit',
      totalLaps:  this.raw.LapCount?.TotalLaps ?? 0,
      sessionKey: si?.Key ?? 0,
      round:      si?.Meeting?.Number != null ? String(si.Meeting.Number) : undefined,
    };
  }

  private buildDrivers(): LiveDriver[] {
    const drivers: LiveDriver[] = [];
    const timing = this.raw.TimingData.Lines ?? {};
    const stats  = this.raw.TimingStats.Lines ?? {};
    const apps   = this.raw.TimingAppData.Lines ?? {};

    // Union of driver numbers from DriverList + TimingData (timing wins for live)
    const allNums = new Set<string>([
      ...Object.keys(this.raw.DriverList),
      ...Object.keys(timing),
    ]);

    for (const numStr of allNums) {
      const dn  = parseInt(numStr, 10);
      if (!Number.isFinite(dn)) continue;
      const d   = this.raw.DriverList[numStr] ?? {};
      const t   = timing[numStr] ?? {};
      const s   = stats[numStr] ?? {};
      const a   = apps[numStr]  ?? {};

      const pos   = parseInt(t.Position ?? '0', 10) || 99;
      const prev  = this.prevPositions.get(dn) ?? pos;
      const change: LiveDriver['positionChange'] =
        pos < prev ? 'gained' : pos > prev ? 'lost' : 'same';

      const lastLapStr = t.LastLapTime?.Value ?? '';
      const lastLapSec = parseLapTime(lastLapStr);
      const pbLapStr   = s.PersonalBestLapTime?.Value ?? '';
      const pbLapSec   = parseLapTime(pbLapStr);

      // Current stint = last entry in Stints[]
      const stints   = a.Stints ?? [];
      const stint    = stints[stints.length - 1];
      const compound = (stint?.Compound ?? 'UNKNOWN').toUpperCase();
      const tireLaps = stint?.TotalLaps ?? 0;
      const pitStops = Math.max(0, stints.length - 1);

      let status: LiveDriver['status'] = 'RACING';
      if (t.Retired) status = 'DNF';
      else if (t.Stopped) status = 'DNF';
      else if (t.InPit) status = 'PIT_IN';
      else if (t.PitOut) status = 'PIT_OUT';

      drivers.push({
        driverNumber:     dn,
        position:         pos,
        previousPosition: prev,
        fullName:         d.FullName ?? d.BroadcastName ?? `Driver ${dn}`,
        acronym:          d.Tla ?? `D${dn}`,
        teamName:         d.TeamName ?? 'Unknown',
        teamColor:        d.TeamColour ? `#${d.TeamColour}` : '#888888',
        tireCompound:     normaliseCompound(compound),
        tireLaps,
        currentLap:       this.raw.LapCount?.CurrentLap ?? 0,
        gapToLeader:      formatGap(t.GapToLeader),
        interval:         formatInterval(t.IntervalToPositionAhead?.Value),
        lastLapTime:      lastLapSec,
        lastLapFormatted: lastLapStr || '–',
        isFastestLap:     !!t.LastLapTime?.Overall,
        isPersonalBest:   !!t.LastLapTime?.PersonalFastest && !t.LastLapTime?.Overall,
        pitStops,
        status,
        drsOpen:          false, // would need CarData topic for live DRS state
        positionChange:   change,
      });

      this.prevPositions.set(dn, pos);
      // Personal best tracking is implicit in F1's TimingStats — we just use it
      void pbLapSec;
    }

    return drivers.sort((a, b) => a.position - b.position);
  }

  private buildRaceControl(): RaceControlMessage[] {
    const messages = this.raw.RaceControlMessages.Messages ?? {};
    return Object.values(messages)
      .map(m => ({
        date:       m.Utc ?? '',
        message:    m.Message ?? '',
        flag:       m.Flag ?? '',
        category:   m.Category ?? '',
        lapNumber:  m.Lap ?? null,
      }))
      .sort((a, b) => b.date.localeCompare(a.date))
      .slice(0, 15);
  }

  private buildWeather(): RaceWeather | null {
    const w = this.raw.WeatherData;
    if (!w) return null;
    return {
      trackTemp: parseFloat(w.TrackTemp ?? '0') || 0,
      airTemp:   parseFloat(w.AirTemp ?? '0') || 0,
      humidity:  parseFloat(w.Humidity ?? '0') || 0,
      rainfall:  parseFloat(w.Rainfall ?? '0') || 0,
      windSpeed: parseFloat(w.WindSpeed ?? '0') || 0,
    };
  }

  private buildFastestLap(): FastestLapEntry | null {
    const stats   = this.raw.TimingStats.Lines ?? {};
    const drivers = this.raw.DriverList;
    let best: FastestLapEntry | null = null;
    for (const [numStr, s] of Object.entries(stats)) {
      const t = parseLapTime(s.PersonalBestLapTime?.Value);
      if (t == null) continue;
      if (best && t >= best.lapTime) continue;
      const dn = parseInt(numStr, 10);
      const d  = drivers[numStr] ?? {};
      best = {
        driverNumber: dn,
        lapTime:      t,
        lapNumber:    s.PersonalBestLapTime?.Lap ?? 0,
        driverName:   d.Tla ?? `D${dn}`,
        teamColor:    d.TeamColour ? `#${d.TeamColour}` : '#888',
      };
    }
    return best;
  }

  private buildFastestLapBoard(): FastestLapEntry[] {
    const stats   = this.raw.TimingStats.Lines ?? {};
    const drivers = this.raw.DriverList;
    const items: FastestLapEntry[] = [];
    for (const [numStr, s] of Object.entries(stats)) {
      const t = parseLapTime(s.PersonalBestLapTime?.Value);
      if (t == null) continue;
      const dn = parseInt(numStr, 10);
      const d  = drivers[numStr] ?? {};
      items.push({
        driverNumber: dn,
        lapTime:      t,
        lapNumber:    s.PersonalBestLapTime?.Lap ?? 0,
        driverName:   d.Tla ?? `D${dn}`,
        teamColor:    d.TeamColour ? `#${d.TeamColour}` : '#888',
      });
    }
    return items.sort((a, b) => a.lapTime - b.lapTime).slice(0, 5);
  }

  private buildSCStatus(): LiveRaceState['safetyCarStatus'] {
    const code = this.raw.TrackStatus?.Status;
    switch (code) {
      case '4': return 'SAFETY_CAR';
      case '5': return 'RED_FLAG';
      case '6': return 'VIRTUAL_SC';
      default:  return 'NONE';
    }
  }
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function parseLapTime(s: string | null | undefined): number | null {
  if (!s) return null;
  // Formats: "1:23.456", "23.456", or empty
  const parts = s.split(':');
  if (parts.length === 2) {
    const m = parseInt(parts[0]!, 10);
    const sec = parseFloat(parts[1]!);
    if (Number.isFinite(m) && Number.isFinite(sec)) return m * 60 + sec;
  }
  const flat = parseFloat(s);
  return Number.isFinite(flat) && flat > 0 ? flat : null;
}

function formatGap(raw: string | undefined): string {
  if (!raw) return '–';
  if (raw === '') return 'LEADER';
  if (raw.includes('LAP')) return raw.toUpperCase();
  return raw.startsWith('+') ? raw + 's' : `+${raw}s`;
}

function formatInterval(raw: string | undefined): string {
  if (!raw || raw === '') return '–';
  if (raw.includes('LAP')) return raw.toUpperCase();
  return raw.startsWith('+') ? raw + 's' : `+${raw}s`;
}

function normaliseCompound(c: string): string {
  switch (c.toUpperCase()) {
    case 'SOFT':         return 'SOFT';
    case 'MEDIUM':       return 'MEDIUM';
    case 'HARD':         return 'HARD';
    case 'INTERMEDIATE': return 'INTERMEDIATE';
    case 'WET':          return 'WET';
    default:             return 'UNKNOWN';
  }
}

/** Deep-merge `source` into `target` in place. Used for SignalR deltas. */
function deepMerge(target: Record<string, unknown>, source: Record<string, unknown>): void {
  for (const [k, v] of Object.entries(source)) {
    if (v && typeof v === 'object' && !Array.isArray(v)
        && target[k] && typeof target[k] === 'object' && !Array.isArray(target[k])) {
      deepMerge(target[k] as Record<string, unknown>, v as Record<string, unknown>);
    } else {
      target[k] = v;
    }
  }
}

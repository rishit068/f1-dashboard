// Shared types — mirror the frontend's LiveRaceState shape so the WebSocket
// payload can drop straight into the existing React components.

export interface LiveDriver {
  driverNumber: number;
  position: number;
  previousPosition: number;
  fullName: string;
  acronym: string;
  teamName: string;
  teamColor: string;          // "#RRGGBB"
  tireCompound: string;       // "SOFT" | "MEDIUM" | "HARD" | "INTER" | "WET" | "UNKNOWN"
  tireLaps: number;
  currentLap: number;
  gapToLeader: string;        // "+12.345s" | "LEADER" | "+1 LAP"
  interval: string;           // "+0.456s" | "–"
  lastLapTime: number | null; // seconds
  lastLapFormatted: string;   // "1:23.456" | "–"
  isFastestLap: boolean;
  isPersonalBest: boolean;
  pitStops: number;
  status: 'RACING' | 'PIT_IN' | 'PIT_OUT' | 'DNF' | 'DSQ';
  drsOpen: boolean;
  positionChange: 'gained' | 'lost' | 'same';
}

export interface RaceControlMessage {
  date: string;
  message: string;
  flag: string;
  category: string;
  lapNumber: number | null;
}

export interface RaceWeather {
  trackTemp: number;
  airTemp: number;
  humidity: number;
  rainfall: number;
  windSpeed: number;
}

export interface FastestLapEntry {
  driverNumber: number;
  lapTime: number;
  lapNumber: number;
  driverName: string;
  teamColor: string;
}

export interface LiveSessionMeta {
  session_key: number;
  session_name: string;     // "Practice 1" | "Qualifying" | "Sprint" | "Race" | ...
  session_type: string;
  date_start: string;       // ISO
  date_end: string;         // ISO
  year: number;
  meeting_key: number;
  meeting_name?: string;
  circuit_short_name: string;
  country_name: string;
  location: string;
  total_laps?: number;
}

export interface LiveRaceState {
  session: {
    name: string;
    circuit: string;
    totalLaps: number;
    sessionKey: number;
    round?: string;
  };
  drivers: LiveDriver[];
  raceControl: RaceControlMessage[];
  weather: RaceWeather | null;
  currentLap: number;
  fastestLap: FastestLapEntry | null;
  fastestLapsBoard: FastestLapEntry[];
  safetyCarStatus: 'NONE' | 'SAFETY_CAR' | 'VIRTUAL_SC' | 'RED_FLAG';
  lastUpdated: string;       // ISO (so JSON-serialisable)
  isStale: boolean;
}

export type LivePhase = 'LIVE' | 'COMPLETE' | 'NONE';

// ─── Wire protocol — what the WebSocket sends to frontend ────────────────────
// A single envelope so the client can dispatch on `type`. Keeping it simple.
export type ServerMessage =
  | { type: 'snapshot'; phase: LivePhase; session: LiveSessionMeta | null; state: LiveRaceState | null }
  | { type: 'state';    phase: LivePhase; session: LiveSessionMeta | null; state: LiveRaceState | null }
  | { type: 'phase';    phase: LivePhase; session: LiveSessionMeta | null }
  | { type: 'error';    message: string };

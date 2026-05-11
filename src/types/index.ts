export interface Race {
  season: string;
  round: string;
  raceName: string;
  Circuit: {
    circuitId: string;
    circuitName: string;
    Location: { locality: string; country: string };
  };
  date: string;
  time?: string;
  FirstPractice?: { date: string; time: string };
  SecondPractice?: { date: string; time: string };
  ThirdPractice?: { date: string; time: string };
  Qualifying?: { date: string; time: string };
  Sprint?: { date: string; time: string };
  SprintQualifying?: { date: string; time: string };
}

export interface DriverStanding {
  position: string;
  points: string;
  wins: string;
  Driver: {
    driverId: string;
    code: string;
    givenName: string;
    familyName: string;
    nationality: string;
  };
  Constructors: Array<{
    constructorId: string;
    name: string;
    nationality: string;
  }>;
}

export interface ConstructorStanding {
  position: string;
  points: string;
  wins: string;
  Constructor: {
    constructorId: string;
    name: string;
    nationality: string;
  };
}

export interface OpenF1Driver {
  driver_number: number;
  broadcast_name: string;
  full_name: string;
  name_acronym: string;
  team_name: string;
  team_colour: string;
  country_code: string;
  session_key: number;
}

export interface OpenF1Position {
  driver_number: number;
  position: number;
  date: string;
  session_key: number;
}

export interface OpenF1Interval {
  driver_number: number;
  gap_to_leader: number | null;
  interval: number | null;
  date: string;
  session_key: number;
}

export interface OpenF1Session {
  session_key: number;
  session_name: string;
  session_type: string;
  date_start: string;
  date_end: string;
  gmt_offset: string;
  year: number;
  circuit_short_name: string;
  country_name: string;
  location: string;
  meeting_key: number;
  circuit_key?: number;
  meeting_name?: string;
  total_laps?: number;
}

export interface CountdownTime {
  days: number;
  hours: number;
  mins: number;
  secs: number;
}

// ─── Live Race Types ──────────────────────────────────────────────────────────

export interface LiveDriver {
  driverNumber: number;
  position: number;
  previousPosition: number;
  fullName: string;
  acronym: string;
  teamName: string;
  teamColor: string;
  tireCompound: string;
  tireLaps: number;
  currentLap: number;
  gapToLeader: string;
  interval: string;
  lastLapTime: number | null;
  lastLapFormatted: string;
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
  lastUpdated: Date;
  isStale: boolean;
}

export type LivePhase = 'LIVE' | 'COMPLETE' | 'NONE';

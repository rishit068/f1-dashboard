// ─── Session type helpers ─────────────────────────────────────────────────────
// One source of truth for how a live session should be labelled and coloured
// across the LIVE header, RaceTower heading, StickyNav button, and BottomTabBar.
//
// OpenF1 session_name values seen in production:
//   "Practice 1" · "Practice 2" · "Practice 3"
//   "Sprint Shootout" · "Sprint Qualifying" · "Qualifying"
//   "Sprint" · "Race"
//
// We classify by lowercase substring matching so unexpected names fall back to
// a generic "session" rather than failing the live-detection check.

export type SessionKind =
  | 'practice'
  | 'qualifying'
  | 'sprint'
  | 'race'
  | 'unknown';

export interface SessionLike {
  session_name?: string;
  session_type?: string;
}

const PRACTICE_RE  = /practice|free practice|fp\d/i;
const QUALI_RE     = /qualif|shootout/i;
const SPRINT_RE    = /sprint/i; // Sprint without "qualifying/shootout" qualifier
const RACE_RE      = /\brace\b/i;

export function sessionKind(s: SessionLike | null | undefined): SessionKind {
  if (!s) return 'unknown';
  const name = (s.session_name ?? '').toLowerCase();
  const type = (s.session_type ?? '').toLowerCase();
  const joined = `${name} ${type}`.trim();

  if (PRACTICE_RE.test(joined)) return 'practice';
  // Qualifying (including Sprint Qualifying / Sprint Shootout) — check before Sprint
  if (QUALI_RE.test(joined))    return 'qualifying';
  // Plain "Sprint" only — Sprint Qualifying already caught above
  if (SPRINT_RE.test(joined) && !QUALI_RE.test(joined)) return 'sprint';
  if (RACE_RE.test(joined))     return 'race';
  return 'unknown';
}

/** Is this an F1 session worth showing live data for? */
export function isValidSession(s: SessionLike | null | undefined): boolean {
  return s != null && sessionKind(s) !== 'unknown'
    ? true
    // be inclusive — show unknown session types too, with a generic label
    : s != null;
}

/** True if `now` is within the session window (with +2h slack after end). */
export function isSessionLive(s: SessionLike & { date_start: string; date_end: string } | null | undefined): boolean {
  if (!s) return false;
  if (!isValidSession(s)) return false;
  const now   = Date.now();
  const start = new Date(s.date_start).getTime();
  const end   = new Date(s.date_end).getTime();
  return now >= start && now <= end + 2 * 60 * 60 * 1000;
}

// ─── Display strings ──────────────────────────────────────────────────────────

const NAME_MAP: Record<string, string> = {
  'Practice 1':        'FREE PRACTICE 1',
  'Practice 2':        'FREE PRACTICE 2',
  'Practice 3':        'FREE PRACTICE 3',
  'Qualifying':        'QUALIFYING',
  'Sprint Qualifying': 'SPRINT QUALIFYING',
  'Sprint Shootout':   'SPRINT QUALIFYING',
  'Sprint':            'SPRINT RACE',
  'Race':              'GRAND PRIX',
};

/** Long display name, e.g. "FREE PRACTICE 2" / "QUALIFYING" / "GRAND PRIX". */
export function getSessionDisplayName(s: SessionLike | null | undefined): string {
  const name = s?.session_name ?? '';
  return NAME_MAP[name] ?? (name ? name.toUpperCase() : 'SESSION');
}

/** Short nav label, e.g. "FP2" / "QUALI" / "SPRINT" / "RACE". */
export function getSessionShortLabel(s: SessionLike | null | undefined): string {
  const name = (s?.session_name ?? '').toLowerCase();
  if (/practice 1|fp1/.test(name)) return 'FP1';
  if (/practice 2|fp2/.test(name)) return 'FP2';
  if (/practice 3|fp3/.test(name)) return 'FP3';
  if (/sprint qualif|sprint shootout/.test(name)) return 'SQ';
  if (/qualif/.test(name))        return 'QUALI';
  if (/sprint/.test(name))        return 'SPRINT';
  if (/race/.test(name))          return 'RACE';
  return 'LIVE';
}

/** Heading word for the tower, e.g. "Practice" / "Qualifying" / "Sprint" / "Race". */
export function getTowerHeading(s: SessionLike | null | undefined): string {
  const k = sessionKind(s);
  if (k === 'practice')   return 'Practice';
  if (k === 'qualifying') return 'Qualifying';
  if (k === 'sprint')     return 'Sprint';
  if (k === 'race')       return 'Race';
  return 'Live';
}

// ─── Colour palette ───────────────────────────────────────────────────────────
// We use hex values directly here (matching the rest of the codebase's inline
// style approach) rather than CSS variables.

export interface SessionColors {
  primary: string; // solid badge fill, accent dot
  tint:    string; // 15% alpha for backgrounds
  border:  string; // 30-40% alpha for borders
}

export function getSessionColors(s: SessionLike | null | undefined): SessionColors {
  switch (sessionKind(s)) {
    case 'practice':
      return { primary: '#27B34A', tint: 'rgba(39,179,74,0.15)', border: 'rgba(39,179,74,0.35)' };
    case 'qualifying':
      return { primary: '#22D3EE', tint: 'rgba(34,211,238,0.15)', border: 'rgba(34,211,238,0.35)' };
    case 'sprint':
      return { primary: '#F59E0B', tint: 'rgba(245,158,11,0.15)', border: 'rgba(245,158,11,0.35)' };
    case 'race':
      return { primary: '#e8002d', tint: 'rgba(232,0,45,0.15)', border: 'rgba(232,0,45,0.35)' };
    default:
      return { primary: '#22D3EE', tint: 'rgba(34,211,238,0.15)', border: 'rgba(34,211,238,0.35)' };
  }
}

/** Emoji icon for the session type. */
export function getSessionIcon(s: SessionLike | null | undefined): string {
  switch (sessionKind(s)) {
    case 'practice':   return '🔧';
    case 'qualifying': return '⏱';
    case 'sprint':     return '⚡';
    case 'race':       return '🏁';
    default:           return '📡';
  }
}

// ─── Lap counter logic ────────────────────────────────────────────────────────

export interface LapDisplay {
  label: string;            // "LAP" or "SESSION"
  value: string;            // "12/57" or "PRACTICE"
  showProgress: boolean;    // whether to render the progress bar
  progress: number;         // 0..1, only meaningful if showProgress
}

export function getLapDisplay(
  s: SessionLike | null | undefined,
  currentLap: number,
  totalLaps: number,
): LapDisplay {
  const k = sessionKind(s);
  if (k === 'practice') {
    return { label: 'SESSION', value: 'PRACTICE',   showProgress: false, progress: 0 };
  }
  if (k === 'qualifying') {
    return { label: 'SESSION', value: 'QUALIFYING', showProgress: false, progress: 0 };
  }
  // Race or Sprint — show laps
  const safeTotal = totalLaps > 0 ? totalLaps : 1;
  return {
    label: 'LAP',
    value: `${currentLap}/${totalLaps || '?'}`,
    showProgress: totalLaps > 0,
    progress: Math.min(1, currentLap / safeTotal),
  };
}

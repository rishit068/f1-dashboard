import type { Race } from '../types';

export const TEAM_COLORS: Record<string, string> = {
  mercedes: '#27f4d2',
  ferrari: '#e8002d',
  mclaren: '#ff8000',
  red_bull: '#3671c6',
  aston_martin: '#229971',
  alpine: '#ff87bc',
  williams: '#64c4ff',
  sauber: '#52e252',
  haas: '#b6babd',
  rb: '#6692ff',
  kick_sauber: '#52e252',
  visa_cash_app_rb: '#6692ff',
};

// Name-based lookup for Ergast constructor names → team color
export const TEAM_NAME_COLORS: Record<string, string> = {
  'Mercedes':            '#27f4d2',
  'Ferrari':             '#e8002d',
  'McLaren':             '#ff8000',
  'Red Bull':            '#3671c6',
  'Aston Martin':        '#229971',
  'Alpine F1 Team':      '#ff87bc',
  'Alpine':              '#ff87bc',
  'Williams':            '#64c4ff',
  'Sauber':              '#52e252',
  'Kick Sauber':         '#52e252',
  'Haas F1 Team':        '#b6babd',
  'Haas':                '#b6babd',
  'RB F1 Team':          '#6692ff',
  'RB':                  '#6692ff',
  'AlphaTauri':          '#6692ff',
  'Racing Bulls':        '#6692ff',
  'Toro Rosso':          '#6692ff',
  'Force India':         '#ff87bc',
  'Renault':             '#ff87bc',
};

export function getTeamColorByName(teamName: string): string {
  return TEAM_NAME_COLORS[teamName] ?? '#888888';
}

export const COUNTRY_FLAGS: Record<string, string> = {
  Bahrain: '🇧🇭', Saudi: '🇸🇦', Australia: '🇦🇺', Japan: '🇯🇵',
  China: '🇨🇳', Miami: '🇺🇸', 'United States': '🇺🇸', 'Emilia Romagna': '🇮🇹',
  Monaco: '🇲🇨', Canada: '🇨🇦', Spain: '🇪🇸', Austria: '🇦🇹',
  'Great Britain': '🇬🇧', Hungary: '🇭🇺', Belgium: '🇧🇪',
  Netherlands: '🇳🇱', Italy: '🇮🇹', Azerbaijan: '🇦🇿',
  Singapore: '🇸🇬', Mexico: '🇲🇽', Brazil: '🇧🇷', 'Las Vegas': '🇺🇸',
  Qatar: '🇶🇦', 'Abu Dhabi': '🇦🇪', Portugal: '🇵🇹',
};

export const COUNTRY_CODES: Record<string, string> = {
  Bahrain: 'BHR', 'Saudi Arabia': 'KSA', Australia: 'AUS', Japan: 'JPN',
  China: 'CHN', 'United States': 'USA', 'Emilia Romagna': 'EMI',
  Monaco: 'MON', Canada: 'CAN', Spain: 'ESP', Austria: 'AUT',
  'Great Britain': 'GBR', Hungary: 'HUN', Belgium: 'BEL',
  Netherlands: 'NED', Italy: 'ITA', Azerbaijan: 'AZE',
  Singapore: 'SGP', Mexico: 'MEX', Brazil: 'BRA', 'Las Vegas': 'LVG',
  Qatar: 'QAT', 'Abu Dhabi': 'ABU',
};

export const NAT_FLAGS: Record<string, string> = {
  British: '🇬🇧', Dutch: '🇳🇱', Monégasque: '🇲🇨', Spanish: '🇪🇸',
  Australian: '🇦🇺', Mexican: '🇲🇽', German: '🇩🇪', Finnish: '🇫🇮',
  Canadian: '🇨🇦', Thai: '🇹🇭', Japanese: '🇯🇵', French: '🇫🇷',
  American: '🇺🇸', Danish: '🇩🇰', Chinese: '🇨🇳', Brazilian: '🇧🇷',
  Italian: '🇮🇹', Austrian: '🇦🇹', Belgian: '🇧🇪', Argentine: '🇦🇷',
  New: '🇳🇿', Swiss: '🇨🇭', Icelandic: '🇮🇸', Polish: '🇵🇱',
};

export function getTeamColor(constructorId: string): string {
  return TEAM_COLORS[constructorId] ?? '#888888';
}

export function formatDateRange(race: Race): string {
  const d = new Date(race.date);
  const start = race.FirstPractice ? new Date(race.FirstPractice.date) : d;
  const month = start.toLocaleString('en-US', { month: 'short' }).toUpperCase();
  const startDay = start.getDate();
  const endDay = d.getDate();
  return `${month} ${String(startDay).padStart(2, '0')}–${String(endDay).padStart(2, '0')}`;
}

export function toIST(utcDate: string): Date {
  const d = new Date(utcDate);
  return new Date(d.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
}

export function formatIST(date: Date): string {
  return date.toLocaleTimeString('en-IN', {
    hour: '2-digit', minute: '2-digit', second: '2-digit',
    hour12: false, timeZone: 'Asia/Kolkata',
  }) + ' IST';
}

export function getRaceName(race: Race): { city: string; gp: string } {
  const name = race.raceName;
  const gp = name.replace(' Grand Prix', '').trim();
  return { city: gp, gp: 'Grand Prix' };
}

export function padTwo(n: number): string {
  return String(n).padStart(2, '0');
}

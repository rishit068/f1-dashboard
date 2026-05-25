export interface CircuitImage {
  id: string;
  name: string;
  country: string;
  city: string;
  turns: number;
  length: string;
  lapRecord: string;
  lapRecordDriver: string;
  lapRecordYear: string;
  drsZones: number;
  /** Either a Wikimedia CDN thumbnail URL or a local /circuits/*.png path. */
  imageUrl: string;
  /**
   * Whether to apply the CSS invert filter that flips Wikipedia's
   * white-bg circuit maps to dark-on-dark. Defaults to true.
   * Set false for user-uploaded images that already have their own colours.
   */
  invertColors?: boolean;
}

// All URLs verified via the Wikimedia Commons API (action=query&prop=imageinfo).
// Format: https://upload.wikimedia.org/wikipedia/commons/thumb/{h1}/{h12}/{file}/{w}px-{file}.png
// The hash prefix (h1/h12) is the first 1 and 2 chars of the MD5 of the filename — sourced
// directly from the API so they are guaranteed correct.
const CDN = 'https://upload.wikimedia.org/wikipedia/commons/thumb';
const W   = '700';  // thumbnail width

function t(hash: string, file: string) {
  const [h1, h2] = [hash[0], hash];
  // For SVG files Wikimedia serves a rasterised PNG at the requested width:
  //   .../thumb/{h1}/{h12}/{file}/{W}px-{file}.png
  // For PNG files the pattern is the same.
  const suffix = file.toLowerCase().endsWith('.png') ? file : `${file}.png`;
  return `${CDN}/${h1}/${h2}/${encodeURIComponent(file)}/${W}px-${encodeURIComponent(suffix)}`;
}

const CIRCUITS: CircuitImage[] = [
  {
    id: 'albert_park',
    name: 'Albert Park Circuit',
    country: 'Australia', city: 'Melbourne',
    turns: 16, length: '5.278 km', lapRecord: '1:20.235',
    lapRecordDriver: 'Charles Leclerc', lapRecordYear: '2022', drsZones: 4,
    imageUrl: '/circuits/albert_park.avif',
    invertColors: false,
  },
  {
    id: 'shanghai',
    name: 'Shanghai International Circuit',
    country: 'China', city: 'Shanghai',
    turns: 16, length: '5.451 km', lapRecord: '1:32.238',
    lapRecordDriver: 'Michael Schumacher', lapRecordYear: '2004', drsZones: 2,
    imageUrl: '/circuits/shanghai.avif',
    invertColors: false,
  },
  {
    id: 'suzuka',
    name: 'Suzuka International Racing Course',
    country: 'Japan', city: 'Suzuka',
    turns: 18, length: '5.807 km', lapRecord: '1:30.983',
    lapRecordDriver: 'Lewis Hamilton', lapRecordYear: '2019', drsZones: 2,
    imageUrl: '/circuits/suzuka.avif',
    invertColors: false,
  },
  {
    id: 'bahrain',
    name: 'Bahrain International Circuit',
    country: 'Bahrain', city: 'Sakhir',
    turns: 15, length: '5.412 km', lapRecord: '1:31.447',
    lapRecordDriver: 'Pedro de la Rosa', lapRecordYear: '2005', drsZones: 3,
    imageUrl: t('29', 'Bahrain_International_Circuit--Grand_Prix_Layout.svg'),
  },
  {
    id: 'jeddah',
    name: 'Jeddah Corniche Circuit',
    country: 'Saudi Arabia', city: 'Jeddah',
    turns: 27, length: '6.174 km', lapRecord: '1:30.734',
    lapRecordDriver: 'Lewis Hamilton', lapRecordYear: '2021', drsZones: 3,
    imageUrl: t('4c', 'Jeddah_Street_Circuit_2021.svg'),
  },
  {
    id: 'miami',
    name: 'Miami International Autodrome',
    country: 'USA', city: 'Miami',
    turns: 19, length: '5.412 km', lapRecord: '1:29.708',
    lapRecordDriver: 'Max Verstappen', lapRecordYear: '2023', drsZones: 3,
    imageUrl: '/circuits/miami.avif',
    invertColors: false,
  },
  {
    id: 'imola',
    name: 'Autodromo Enzo e Dino Ferrari',
    country: 'Italy', city: 'Imola',
    turns: 19, length: '4.909 km', lapRecord: '1:15.484',
    lapRecordDriver: 'Rubens Barrichello', lapRecordYear: '2004', drsZones: 2,
    imageUrl: t('22', 'Imola_2009.svg'),
  },
  {
    id: 'monaco',
    name: 'Circuit de Monaco',
    country: 'Monaco', city: 'Monte Carlo',
    turns: 19, length: '3.337 km', lapRecord: '1:12.909',
    lapRecordDriver: 'Lewis Hamilton', lapRecordYear: '2021', drsZones: 1,
    imageUrl: '/circuits/monaco.avif',
    invertColors: false,
  },
  {
    id: 'catalunya',
    name: 'Circuit de Barcelona-Catalunya',
    country: 'Spain', city: 'Barcelona',
    turns: 16, length: '4.675 km', lapRecord: '1:16.330',
    lapRecordDriver: 'Max Verstappen', lapRecordYear: '2021', drsZones: 2,
    imageUrl: '/circuits/catalunya.avif',
    invertColors: false,
  },
  {
    id: 'villeneuve',
    name: 'Circuit Gilles Villeneuve',
    country: 'Canada', city: 'Montreal',
    turns: 14, length: '4.361 km', lapRecord: '1:13.078',
    lapRecordDriver: 'Valtteri Bottas', lapRecordYear: '2019', drsZones: 2,
    imageUrl: '/circuits/villeneuve.avif',
    invertColors: false,
  },
  {
    id: 'red_bull_ring',
    name: 'Red Bull Ring',
    country: 'Austria', city: 'Spielberg',
    turns: 10, length: '4.318 km', lapRecord: '1:05.619',
    lapRecordDriver: 'Carlos Sainz', lapRecordYear: '2020', drsZones: 3,
    imageUrl: '/circuits/red_bull_ring.avif',
    invertColors: false,
  },
  {
    id: 'silverstone',
    name: 'Silverstone Circuit',
    country: 'UK', city: 'Silverstone',
    turns: 18, length: '5.891 km', lapRecord: '1:27.097',
    lapRecordDriver: 'Max Verstappen', lapRecordYear: '2020', drsZones: 2,
    imageUrl: '/circuits/silverstone.avif',
    invertColors: false,
  },
  {
    id: 'spa',
    name: 'Circuit de Spa-Francorchamps',
    country: 'Belgium', city: 'Stavelot',
    turns: 19, length: '7.004 km', lapRecord: '1:46.286',
    lapRecordDriver: 'Valtteri Bottas', lapRecordYear: '2018', drsZones: 2,
    imageUrl: '/circuits/spa.avif',
    invertColors: false,
  },
  {
    id: 'hungaroring',
    name: 'Hungaroring',
    country: 'Hungary', city: 'Budapest',
    turns: 14, length: '4.381 km', lapRecord: '1:16.627',
    lapRecordDriver: 'Lewis Hamilton', lapRecordYear: '2020', drsZones: 1,
    imageUrl: '/circuits/hungaroring.avif',
    invertColors: false,
  },
  {
    id: 'zandvoort',
    name: 'Circuit Zandvoort',
    country: 'Netherlands', city: 'Zandvoort',
    turns: 14, length: '4.259 km', lapRecord: '1:11.097',
    lapRecordDriver: 'Lewis Hamilton', lapRecordYear: '2021', drsZones: 2,
    imageUrl: '/circuits/zandvoort.avif',
    invertColors: false,
  },
  {
    id: 'monza',
    name: 'Autodromo Nazionale di Monza',
    country: 'Italy', city: 'Monza',
    turns: 11, length: '5.793 km', lapRecord: '1:21.046',
    lapRecordDriver: 'Rubens Barrichello', lapRecordYear: '2004', drsZones: 2,
    imageUrl: '/circuits/monza.avif',
    invertColors: false,
  },
  {
    id: 'baku',
    name: 'Baku City Circuit',
    country: 'Azerbaijan', city: 'Baku',
    turns: 20, length: '6.003 km', lapRecord: '1:43.009',
    lapRecordDriver: 'Charles Leclerc', lapRecordYear: '2019', drsZones: 2,
    imageUrl: '/circuits/baku.avif',
    invertColors: false,
  },
  {
    id: 'marina_bay',
    name: 'Marina Bay Street Circuit',
    country: 'Singapore', city: 'Singapore',
    turns: 19, length: '4.940 km', lapRecord: '1:35.867',
    lapRecordDriver: 'Lewis Hamilton', lapRecordYear: '2023', drsZones: 3,
    imageUrl: '/circuits/marina_bay.avif',
    invertColors: false,
  },
  {
    id: 'americas',
    name: 'Circuit of the Americas',
    country: 'USA', city: 'Austin',
    turns: 20, length: '5.513 km', lapRecord: '1:36.169',
    lapRecordDriver: 'Charles Leclerc', lapRecordYear: '2019', drsZones: 2,
    imageUrl: '/circuits/americas.avif',
    invertColors: false,
  },
  {
    id: 'rodriguez',
    name: 'Autodromo Hermanos Rodriguez',
    country: 'Mexico', city: 'Mexico City',
    turns: 17, length: '4.304 km', lapRecord: '1:17.774',
    lapRecordDriver: 'Valtteri Bottas', lapRecordYear: '2021', drsZones: 3,
    imageUrl: '/circuits/rodriguez.avif',
    invertColors: false,
  },
  {
    id: 'interlagos',
    name: 'Autodromo Jose Carlos Pace',
    country: 'Brazil', city: 'Sao Paulo',
    turns: 15, length: '4.309 km', lapRecord: '1:10.540',
    lapRecordDriver: 'Valtteri Bottas', lapRecordYear: '2018', drsZones: 2,
    imageUrl: '/circuits/interlagos.avif',
    invertColors: false,
  },
  {
    id: 'las_vegas',
    name: 'Las Vegas Street Circuit',
    country: 'USA', city: 'Las Vegas',
    turns: 17, length: '6.201 km', lapRecord: '1:35.490',
    lapRecordDriver: 'Oscar Piastri', lapRecordYear: '2024', drsZones: 2,
    imageUrl: '/circuits/las_vegas.avif',
    invertColors: false,
  },
  {
    id: 'losail',
    name: 'Losail International Circuit',
    country: 'Qatar', city: 'Lusail',
    turns: 16, length: '5.380 km', lapRecord: '1:24.319',
    lapRecordDriver: 'Max Verstappen', lapRecordYear: '2023', drsZones: 2,
    imageUrl: '/circuits/losail.avif',
    invertColors: false,
  },
  {
    id: 'yas_marina',
    name: 'Yas Marina Circuit',
    country: 'UAE', city: 'Abu Dhabi',
    turns: 16, length: '5.281 km', lapRecord: '1:26.103',
    lapRecordDriver: 'Max Verstappen', lapRecordYear: '2021', drsZones: 2,
    imageUrl: '/circuits/yas_marina.avif',
    invertColors: false,
  },
  {
    id: 'madring',
    name: 'IFEMA Madrid Circuit',
    country: 'Spain', city: 'Madrid',
    turns: 22, length: '5.474 km', lapRecord: '—',
    lapRecordDriver: '—', lapRecordYear: '2026', drsZones: 3,
    imageUrl: '/circuits/madring.avif',
    invertColors: false,
  },
];

// Map from Ergast circuitId → our circuit id
const ERGAST_TO_CIRCUIT: Record<string, string> = {
  albert_park:   'albert_park',
  shanghai:      'shanghai',
  suzuka:        'suzuka',
  bahrain:       'bahrain',
  jeddah:        'jeddah',
  miami:         'miami',
  imola:         'imola',
  monaco:        'monaco',
  catalunya:     'catalunya',
  villeneuve:    'villeneuve',
  red_bull_ring: 'red_bull_ring',
  silverstone:   'silverstone',
  spa:           'spa',
  hungaroring:   'hungaroring',
  zandvoort:     'zandvoort',
  monza:         'monza',
  baku:          'baku',
  marina_bay:    'marina_bay',
  americas:      'americas',
  rodriguez:     'rodriguez',
  interlagos:    'interlagos',
  vegas:         'las_vegas',
  las_vegas:     'las_vegas',
  losail:        'losail',
  yas_marina:    'yas_marina',
  madring:       'madring',
  madrid:        'madring',
  ifema:         'madring',
};

const CIRCUIT_MAP = new Map<string, CircuitImage>(CIRCUITS.map(c => [c.id, c]));

export function getCircuitImage(ergastCircuitId: string): CircuitImage | null {
  const id = ERGAST_TO_CIRCUIT[ergastCircuitId];
  if (!id) return null;
  return CIRCUIT_MAP.get(id) ?? null;
}

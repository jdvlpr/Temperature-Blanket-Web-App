// Exports the promo video's blankets (promo/src/data/*.json) with the app's
// own code: Open-Meteo as the planner asks it, the temperature gauge's Auto
// ranges (getEvenlyDistributedRangeValuesWithEqualDayCount) and isValueInRange,
// so the motion graphics draw exactly the blanket the app shows.
//
// Run: pnpm vitest run --config scripts/promo/vitest.config.ts
// (a vitest file only so the app's .svelte.ts modules load; it's not a test)

import { writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import chroma from 'chroma-js';
import { it } from 'vitest';
import { preferences } from '#lib/storage/preferences.svelte.js';
import type { WeatherDay } from '#lib/types/weather-types.js';
import { stringToDate } from '#lib/utils/date-utils.js';
import { displayNumber } from '#lib/utils/number-utils.js';
import {
  getEvenlyDistributedRangeValuesWithEqualDayCount,
  isValueInRange,
} from '#lib/utils/range-utils.svelte.js';
import { celsiusToFahrenheit } from '#lib/utils/unit-utils.svelte.js';
import { execFileSync } from 'node:child_process';
import { yarn as specialDk } from '#lib/data/yarns/stylecraft/special-dk/yarn.js';
import { hexToOklab } from '#lib/features/image-palette/color-space.js';
import { MAX_IMAGE_DIMENSION } from '#lib/features/image-palette/decode.js';
import { createEngineCore } from '#lib/features/image-palette/engine-core.js';
import { orderAsGradient } from '#lib/features/image-palette/order.js';

const OUT = join(process.cwd(), 'promo/src/data');
const YEAR = { from: '2025-01-01', to: '2025-12-31' };
const UNITS = 'imperial' as const; // the hero is a US blanket, shown in °F

// The temperature gauge's defaults (temperature-gauge-state.svelte.ts)
const GAUGE = {
  prop: 'tmax' as const,
  direction: 'high-to-low' as const,
  roundIncrement: true,
  includeFrom: true,
  includeTo: false,
};

// Stylecraft Special DK, hottest first (high-to-low: range 0 is the hottest)
const HERO_PALETTE = [
  { hex: '#c82d23', name: 'Tomato 1723' },
  { hex: '#fa5438', name: 'Jaffa 1256' },
  { hex: '#fb8538', name: 'Clementine 1853' },
  { hex: '#faaa4b', name: 'Saffron 1081' },
  { hex: '#f9c748', name: 'Citron 1263' },
  { hex: '#b7d8a6', name: 'Spring Green 1316' },
  { hex: '#50bfb5', name: 'Aspen 1422' },
  { hex: '#7da6c7', name: 'Cloud Blue 1019' },
  { hex: '#296db5', name: 'Aster 1003' },
  { hex: '#083874', name: 'Lapis 1831' },
];

const HERO = {
  label: 'Minneapolis, Minnesota, United States',
  short: 'Minneapolis',
  lat: 44.97997,
  lng: -93.26384,
  timezone: 'America/Chicago',
};

// Generated blankets for the gallery wall (not real users' pages): real
// weather, colored with schemes the app offers
const WALL: {
  short: string;
  lat: number;
  lng: number;
  tz: string;
  scheme: string;
  colors: number;
}[] = [
  {
    short: 'Reykjavík',
    lat: 64.1466,
    lng: -21.9426,
    tz: 'Atlantic/Reykjavik',
    scheme: 'RdYlBu',
    colors: 8,
  },
  {
    short: 'Phoenix',
    lat: 33.4484,
    lng: -112.074,
    tz: 'America/Phoenix',
    scheme: 'YlOrRd',
    colors: 9,
  },
  {
    short: 'Sydney',
    lat: -33.8688,
    lng: 151.2093,
    tz: 'Australia/Sydney',
    scheme: 'Spectral',
    colors: 10,
  },
  {
    short: 'Tokyo',
    lat: 35.6762,
    lng: 139.6503,
    tz: 'Asia/Tokyo',
    scheme: 'PuOr',
    colors: 9,
  },
  {
    short: 'Oslo',
    lat: 59.9139,
    lng: 10.7522,
    tz: 'Europe/Oslo',
    scheme: 'BuPu',
    colors: 8,
  },
  {
    short: 'Cape Town',
    lat: -33.9249,
    lng: 18.4241,
    tz: 'Africa/Johannesburg',
    scheme: 'PiYG',
    colors: 10,
  },
  {
    short: 'Toronto',
    lat: 43.6532,
    lng: -79.3832,
    tz: 'America/Toronto',
    scheme: 'RdBu',
    colors: 12,
  },
  {
    short: 'Edinburgh',
    lat: 55.9533,
    lng: -3.1883,
    tz: 'Europe/London',
    scheme: 'GnBu',
    colors: 8,
  },
  {
    short: 'Buenos Aires',
    lat: -34.6037,
    lng: -58.3816,
    tz: 'America/Argentina/Buenos_Aires',
    scheme: 'RdYlGn',
    colors: 10,
  },
  {
    short: 'Denver',
    lat: 39.7392,
    lng: -104.9903,
    tz: 'America/Denver',
    scheme: 'Spectral',
    colors: 12,
  },
  {
    short: 'Seoul',
    lat: 37.5665,
    lng: 126.978,
    tz: 'Asia/Seoul',
    scheme: 'BrBG',
    colors: 10,
  },
];

// The planner's Open-Meteo request and day shape (weather-state.svelte.ts)
async function weatherFor(
  lat: number,
  lng: number,
  tz: string,
): Promise<WeatherDay[]> {
  const url =
    `https://archive-api.open-meteo.com/v1/archive?latitude=${lat}&longitude=${lng}` +
    `&start_date=${YEAR.from}&end_date=${YEAR.to}` +
    `&daily=temperature_2m_max,temperature_2m_min,rain_sum,snowfall_sum&timezone=${tz}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Open-Meteo ${res.status} for ${lat},${lng}`);
  const data = await res.json();
  const d = data?.daily;
  if (!d?.time?.length) throw new Error(`No weather for ${lat},${lng}`);
  const days = d.time.map((time: string, i: number) => {
    const tmax = d.temperature_2m_max[i];
    const tmin = d.temperature_2m_min[i];
    const tavg =
      tmin === null || tmax === null ? null : displayNumber((tmin + tmax) / 2);
    const pair = (n: number | null) => ({
      metric: n,
      imperial: celsiusToFahrenheit(n),
    });
    return {
      location: 0,
      date: stringToDate(time),
      tmax: pair(tmax),
      tmin: pair(tmin),
      tavg: pair(tavg),
      prcp: { metric: d.rain_sum[i], imperial: null },
      snow: { metric: d.snowfall_sum[i], imperial: null },
      dayt: { metric: null, imperial: null },
    } as unknown as WeatherDay;
  });
  // range-utils loops forever on no data; never hand it an empty year
  if (!days.some((x: WeatherDay) => x.tmax[UNITS] !== null))
    throw new Error(`Only missing values for ${lat},${lng}`);
  return days;
}

function photoPalette() {
  const image = join(process.cwd(), 'scripts/fixtures/sea-and-forest.jpg');
  const [w, h] = execFileSync('ffprobe', [
    '-v',
    'error',
    '-select_streams',
    'v:0',
    '-show_entries',
    'stream=width,height',
    '-of',
    'csv=p=0',
    image,
  ])
    .toString()
    .trim()
    .split(',')
    .map(Number);
  const scale = Math.min(1, MAX_IMAGE_DIMENSION / Math.max(w, h));
  const width = Math.max(1, Math.round(w * scale));
  const height = Math.max(1, Math.round(h * scale));
  const raw = execFileSync(
    'ffmpeg',
    [
      '-v',
      'error',
      '-i',
      image,
      '-vf',
      `scale=${width}:${height}`,
      '-f',
      'rawvideo',
      '-pix_fmt',
      'rgba',
      '-',
    ],
    { maxBuffer: 64 * 1024 * 1024 },
  );
  const engine = createEngineCore();
  engine.setImage({ data: new Uint8ClampedArray(raw), width, height });
  const colors = specialDk.colorways.flatMap((c) => c.colors);
  engine.setCandidates({
    labs: new Float32Array(colors.flatMap((c) => hexToOklab(c.hex))),
  });
  const picked = engine.autoPalette({
    count: 8,
    style: 'vivid',
    fixed: new Float32Array(0),
    exact: false,
  });
  const order = orderAsGradient(
    picked.map((p) => p.lab),
    { warmFirst: true },
  );
  return order.map((i) => {
    const p = picked[i];
    const c = colors[p.candidate];
    return { hex: c.hex, name: c.name, x: p.x, y: p.y };
  });
}

function blanket(days: WeatherDay[], colors: string[]) {
  const ranges = getEvenlyDistributedRangeValuesWithEqualDayCount({
    weatherData: days,
    numRanges: colors.length,
    prop: GAUGE.prop,
    gaugeDirection: GAUGE.direction,
    roundIncrement: GAUGE.roundIncrement,
    includeFrom: GAUGE.includeFrom,
    includeTo: GAUGE.includeTo,
  });
  const colorIndex = (value: number | null) =>
    ranges.findIndex((range) =>
      isValueInRange({
        value,
        range,
        direction: GAUGE.direction,
        includeFromValue: GAUGE.includeFrom,
        includeToValue: GAUGE.includeTo,
      }),
    );
  return {
    ranges,
    days: days.map((day) => {
      const date = (day.date as Date).toISOString().slice(0, 10);
      const tmax = day.tmax[UNITS];
      const tmin = day.tmin[UNITS];
      return { date, tmax, tmin, color: colorIndex(tmax) };
    }),
  };
}

it('exports the promo blankets', { timeout: 120_000 }, async () => {
  preferences.value.units = UNITS;
  mkdirSync(OUT, { recursive: true });

  const heroDays = await weatherFor(HERO.lat, HERO.lng, HERO.timezone);
  const hero = blanket(
    heroDays,
    HERO_PALETTE.map((c) => c.hex),
  );
  const highs = hero.days
    .map((d) => d.tmax)
    .filter((n): n is number => n !== null);
  const lows = hero.days
    .map((d) => d.tmin)
    .filter((n): n is number => n !== null);
  writeFileSync(
    join(OUT, 'hero.json'),
    JSON.stringify(
      {
        location: HERO,
        dates: YEAR,
        units: UNITS,
        source: 'Open-Meteo',
        gauge: { ...GAUGE, mode: 'auto', yarn: 'Stylecraft Special DK' },
        palette: HERO_PALETTE,
        stats: {
          highestHigh: Math.max(...highs),
          lowestHigh: Math.min(...highs),
          lowestLow: Math.min(...lows),
          missing: hero.days.filter((d) => d.color < 0).length,
        },
        ...hero,
      },
      null,
      1,
    ),
  );
  console.log(
    `hero: ${hero.days.length} days, highs ${Math.min(...highs)}…${Math.max(...highs)} °F, lows down to ${Math.min(...lows)} °F, uncolored ${hero.days.filter((d) => d.color < 0).length}`,
  );

  // Colors from a photo: the app's image-palette engine, Auto palette (Vivid) in
  // yarn mode against Special DK, sorted as a gradient warm first
  const photo = photoPalette();
  const photoBlanket = blanket(
    heroDays,
    photo.map((c) => c.hex),
  );
  writeFileSync(
    join(OUT, 'photo.json'),
    JSON.stringify(
      {
        image: 'sea-and-forest.jpg',
        palette: photo,
        ranges: photoBlanket.ranges,
        rows: photoBlanket.days.map((d) => d.color),
      },
      null,
      1,
    ),
  );
  console.log(
    'photo palette:',
    photo.map((c) => `${c.name} ${c.hex}`).join(', '),
  );

  const wall = [];
  for (const city of WALL) {
    const days = await weatherFor(city.lat, city.lng, city.tz);
    const colors = chroma.scale(city.scheme).colors(city.colors);
    const b = blanket(days, colors);
    wall.push({
      short: city.short,
      scheme: city.scheme,
      colors,
      rows: b.days.map((d) => d.color),
    });
    console.log(`${city.short}: ${b.days.length} days`);
  }
  writeFileSync(join(OUT, 'wall.json'), JSON.stringify(wall));
});

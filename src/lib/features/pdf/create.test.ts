// Builds whole PDFs from a made-up project, to catch anything that throws or
// overflows. Set PDF_OUT to a folder to keep the files and look at them.

import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { beforeAll, describe, expect, it, vi } from 'vitest';
import type { PdfSettings } from './options';

const palette = [
  {
    hex: '#7f1d1d',
    name: 'Brick',
    brandName: 'Lion Brand',
    yarnName: 'Basic Stitch',
  },
  {
    hex: '#f59e0b',
    name: 'Marigold Sunshine Extra Long Colorway Name',
    brandName: 'Cascade',
    yarnName: '220 Superwash Merino',
  },
  {
    hex: '#ffffff',
    name: 'White',
    brandName: 'Paintbox',
    yarnName: 'Simply DK',
  },
  { hex: '#fef9c3' },
  {
    hex: '#60a5fa',
    name: 'Đà Lạt Sky',
    brandName: 'Hobbii',
    yarnName: 'Rainbow Cotton 8/4',
  },
  { hex: '#1e3a8a', name: 'Navy' },
];
const temperatureRanges = [
  { from: 105, to: 92 },
  { from: 92, to: 79 },
  { from: 79, to: 66 },
  { from: 66, to: 40.5 },
  { from: 40.5, to: 0 },
  { from: 0, to: -15 },
];
const targets = [
  {
    id: 'tmax',
    label: 'High Temperature',
    gaugeLabel: 'High',
    pdfHeader: { metric: 'High (°C)', imperial: 'High (°F)' },
  },
  {
    id: 'tavg',
    label: 'Average Temperature',
    gaugeLabel: 'Average',
    pdfHeader: { metric: 'Avg (°C)', imperial: 'Avg (°F)' },
  },
  {
    id: 'tmin',
    label: 'Low Temperature',
    gaugeLabel: 'Low',
    pdfHeader: { metric: 'Low (°C)', imperial: 'Low (°F)' },
  },
];
const moonTarget = {
  id: 'moon',
  label: 'Moon Phase',
  gaugeLabel: 'Moon Phase',
  pdfHeader: { metric: 'Moon Phase', imperial: 'Moon Phase' },
};

const days = Array.from({ length: 70 }, (_, i) => {
  const t = 100 - i * 1.7;
  const pair = (n: number) => ({ metric: n, imperial: n });
  return {
    location: i < 40 ? 0 : 1,
    date: new Date(Date.UTC(2025, 0, 1 + i)),
    tmax: pair(Math.round(t)),
    tavg: pair(Math.round(t - 8)),
    tmin: pair(Math.round(t - 16)),
    prcp: pair(0),
    snow: pair(0),
    dayt: pair(600),
    moon: i % 8,
  };
});

vi.mock('$lib/state/gauges-state.svelte', () => {
  const temp = {
    id: 'temp',
    label: 'Temperature Gauge',
    unit: { type: 'temperature', label: { metric: '°C', imperial: '°F' } },
    colors: palette,
    ranges: temperatureRanges,
    rangeOptions: {
      direction: 'high-to-low',
      includeFromValue: true,
      includeToValue: false,
    },
    targets,
  };
  const moon = {
    id: 'moon',
    label: 'Moon Phase Gauge',
    unit: { type: 'category', label: { metric: '', imperial: '' } },
    colors: palette.slice(0, 4),
    ranges: [
      { label: 'New Moon' },
      { label: 'Waxing Crescent' },
      { label: 'Full Moon' },
      { label: 'Waning Gibbous' },
    ],
    targets: [moonTarget],
  };
  return {
    allGaugesAttributes: [{ targets }, { targets: [moonTarget] }],
    gauges: { allCreated: [temp, moon] },
    getTargetParentGaugeId: (id: string) => (id === 'moon' ? 'moon' : 'temp'),
  };
});

vi.mock('$lib/state/location-state.svelte', () => ({
  locations: {
    all: [
      {
        index: 0,
        label: 'Thành phố Hồ Chí Minh, Vietnam',
        from: '2025-01-01',
        to: '2025-02-09',
        source: 'Meteostat',
      },
      {
        index: 1,
        label: 'Llanfairpwllgwyngyll, Wales',
        from: '2025-02-10',
        to: '2025-03-11',
      },
    ],
    projectFilename: 'test',
    projectTitle: 'Test project',
  },
}));

vi.mock('$lib/state/weather-state.svelte', () => ({
  weather: {
    data: days,
    grouping: 'day',
    groupingHeading: 'Day',
    params: {
      tmax: days.map((d) => d.tmax.imperial),
      tavg: days.map((d) => d.tavg.imperial),
      tmin: days.map((d) => d.tmin.imperial),
    },
    source: { name: 'Open-Meteo' },
  },
}));

vi.mock('$lib/state/preview-state.svelte', () => ({
  previews: {
    active: null,
    extraColors: [
      { label: 'Border', color: palette[1] },
      { label: 'Accent', color: { hex: '#000000' } },
    ],
  },
}));

vi.mock('$lib/storage/preferences.svelte', () => ({
  preferences: { value: { units: 'imperial' } },
}));

vi.mock('$lib/utils/preview-utils.svelte', () => ({ svgToPNG: vi.fn() }));

vi.mock('$lib/utils/range-utils.svelte', () => ({
  getDaysInRange: ({ range }: { range: { from?: number } }) =>
    Array.from({ length: Math.abs(Math.round((range.from ?? 3) / 7)) }),
  getDaysPercent: (n: number) => Math.round((n / 70) * 1000) / 10,
}));

vi.mock('$lib/utils/color-utils', async (importOriginal) => {
  const actual =
    await importOriginal<typeof import('$lib/utils/color-utils')>();
  return {
    ...actual,
    getColorInfo: ({ value }: { value: number | null }) => {
      const index =
        value === null
          ? 0
          : Math.min(5, Math.max(0, Math.floor((105 - value) / 13)));
      return { hex: palette[index].hex, index };
    },
  };
});

beforeAll(() => {
  // The font, from the site's static files
  vi.stubGlobal('fetch', async (url: string) => {
    const file = readFileSync(join('static', url));
    return new Response(file);
  });
});

const base: PdfSettings = {
  layout: 'list',
  fill: false,
  showDaysInRange: true,
  hex: true,
  pageSize: 'letter',
  summary: true,
  additionalColors: true,
  weatherDataParams: ['tmax', 'tavg', 'tmin', 'moon'],
};

describe('createPdf', () => {
  const cases: [string, Partial<PdfSettings>][] = [
    ['list-letter', {}],
    ['grid-a4-fill', { layout: 'grid', fill: true, pageSize: 'a4' }],
    ['grid-letter', { layout: 'grid' }],
    [
      'list-a4-fill-nodays',
      { fill: true, pageSize: 'a4', showDaysInRange: false, hex: false },
    ],
  ];

  for (const [label, overrides] of cases) {
    it(`builds a PDF: ${label}`, { timeout: 30_000 }, async () => {
      const { createPdf } = await import('./create');
      const doc = await createPdf({
        settings: { ...base, ...overrides },
        gaugeIds: ['temp', 'moon'],
        name: 'Ho Chi Minh City 2025',
        download: false,
      });
      expect(doc.getNumberOfPages()).toBeGreaterThan(3);
      const out = process.env.PDF_OUT;
      if (out)
        writeFileSync(
          join(out, `${label}.pdf`),
          Buffer.from(doc.output('arraybuffer')),
        );
    });
  }
});

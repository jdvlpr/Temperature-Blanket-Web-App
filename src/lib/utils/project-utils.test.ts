import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import * as projectUtils from './project-utils.svelte';

// Mock dependencies
vi.mock('$lib/state', () => ({
  weather: {
    data: [],
    grouping: 'month',
    rawData: [],
  },
  locations: {
    projectTitle: 'Test Project',
    projectFilename: 'test-project',
    all: [],
  },
  gauges: {
    allCreated: [],
  },
  previews: {
    active: { wpTagId: 123 },
  },
  project: {
    url: { href: 'http://localhost' },
    gallery: { href: '', title: '' },
  },
  dialog: {
    trigger: vi.fn(),
  },
  toast: {
    elements: [],
  },
  allGaugesAttributes: [],
}));

// Mock preferences
vi.mock('$lib/storage/preferences.svelte', () => ({
  preferences: {
    value: { units: 'imperial' },
  },
}));

vi.mock('$lib/pdf/sections/gauges.svelte', () => ({
  default: { create: vi.fn() },
}));

vi.mock('$lib/pdf/sections/weather-data.svelte', () => ({
  default: { create: vi.fn() },
}));

// Mock utils that are used in project-utils
vi.mock('$lib/utils', async (importOriginal) => {
  const actual = await importOriginal<typeof import('$lib/utils')>();
  return {
    ...actual,
    colorsToCode: vi.fn(() => 'code'),
    colorsToYarnDetails: vi.fn(() => 'details'),
    convertTime: vi.fn((val) => val),
    dateToISO8601String: vi.fn((date) => '2024-01-01'),
    getWPGauge: vi.fn(() => ({})),
    getWeatherSourceDetails: vi.fn(() => []),
    missingDaysCount: vi.fn(() => 0),
  };
});

describe('project-utils', () => {
  describe('getProjectParametersFromURLHash', () => {
    it('should parse hash string into object', () => {
      const hash = 'param1=value1&param2=value2';
      const result = projectUtils.getProjectParametersFromURLHash(hash);
      expect(result).toEqual({
        param1: { key: 'param1', value: 'value1' },
        param2: { key: 'param2', value: 'value2' },
      });
    });

    it('should decode URI components', () => {
      const hash = 'param1=Hello%20World';
      const result = projectUtils.getProjectParametersFromURLHash(hash);
      expect(result.param1.value).toBe('Hello World');
    });
  });

  describe('getTitleFromLocationsMeta', () => {
    it('should return empty string if locations is null', () => {
      expect(projectUtils.getTitleFromLocationsMeta(null)).toBe('');
    });

    it('should format location title correctly', () => {
      const locations = JSON.stringify([
        {
          label: 'City, Country',
          from: '2024-01-01',
          to: '2024-12-31',
          latlong: '0,0',
        },
      ]);
      const result = projectUtils.getTitleFromLocationsMeta(locations);

      // Note: The function uses toLocaleDateString with UTC.
      // 2024-01-01 is parsed as UTC.
      // Expected output format depends on the locale running the test (default Node locale usually en-US)
      // "1/1/2024" or "2024-01-01".
      // Let's check for containment to be safe/resilient to locale.
      expect(result).toContain('City, Country');
      expect(result).toContain('from');
      expect(result).toContain('to');
    });

    it('should handle missing city name replacement', () => {
      const locations = JSON.stringify([
        {
          label: 'Region, , Country',
          from: '2024-01-01',
          to: '2024-12-31',
          latlong: '0,0',
        },
      ]);
      const result = projectUtils.getTitleFromLocationsMeta(locations);
      expect(result).toContain('Region, Country');
    });
  });
});

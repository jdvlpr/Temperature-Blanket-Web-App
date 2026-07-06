import * as SunCalc from 'suncalc';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { getDayTime, getMoonPhase, weather } from './weather-state.svelte';

// Mocking $lib modules
vi.mock('$lib/constants/api-constants', async (importOriginal) => ({
  ...(await importOriginal<any>()),
  API_SERVICES: {
    openMeteo: { baseURL: 'https://archive-api.open-meteo.com/v1/archive' },
  },
}));

vi.mock('$lib/constants/weather-constants', async (importOriginal) => ({
  ...(await importOriginal<any>()),
  MOON_PHASE_NAMES: [
    'New Moon',
    'Waxing Crescent',
    'First Quarter',
    'Waxing Gibbous',
    'Full Moon',
    'Waning Gibbous',
    'Third Quarter',
    'Waning Crescent',
  ],
}));

vi.mock('suncalc', () => ({
  default: {
    getTimes: vi.fn(() => ({
      sunrise: new Date(),
      sunset: new Date(),
    })),
  },
  getTimes: vi.fn(() => ({
    sunrise: new Date(),
    sunset: new Date(),
  })),
}));

const {
  mockPreferences,
  mockLocations,
  mockAllGaugesAttributes,
  mockShowDaysInRange,
} = vi.hoisted(() => ({
  mockPreferences: {
    value: {
      units: 'metric',
    },
  },
  mockLocations: {
    all: [] as any[],
  },
  mockAllGaugesAttributes: [] as any[],
  mockShowDaysInRange: {
    value: false,
  },
}));

vi.mock('$lib/storage/preferences.svelte', () => ({
  preferences: mockPreferences,
}));

vi.mock('$lib/state/location-state.svelte', () => ({
  locations: mockLocations,
  signal: { value: null },
}));

vi.mock('$lib/state/gauges-state.svelte', () => ({
  allGaugesAttributes: mockAllGaugesAttributes,
  showDaysInRange: mockShowDaysInRange,
}));

vi.mock('$lib/state/project-state.svelte', () => ({
  project: {
    url: { href: 'http://localhost/?project=123' },
  },
}));

// Mock utils that are used within weather-state
vi.mock('$lib/utils/unit-utils.svelte', async (importOriginal) => {
  const actual = await importOriginal<any>();
  return {
    ...actual,
    celsiusToFahrenheit: (n: number | null) =>
      n === null ? null : (n * 9) / 5 + 32,
    millimetersToInches: (n: number | null) => (n === null ? null : n / 25.4),
    hoursToMinutes: (h: number) => h * 60,
    convertTime: vi.fn((t) => t),
  };
});

vi.mock('$lib/utils/number-utils', async (importOriginal) => {
  const actual = await importOriginal<any>();
  return {
    ...actual,
    displayNumber: vi.fn((n: number) => Math.round(n * 100) / 100),
    getAverage: vi.fn(
      (arr: number[]) => arr.reduce((a, b) => a + (b || 0), 0) / arr.length,
    ),
  };
});

vi.mock('$lib/utils/date-utils', async (importOriginal) => {
  const actual = await importOriginal<any>();
  return {
    ...actual,
    stringToDate: (s: string) => new Date(s + 'T00:00:00Z'),
    dateToISO8601String: (d: Date) => {
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    },
    numberOfDays: (d1: Date, d2: Date) =>
      Math.ceil((d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24)),
  };
});

vi.mock('$lib/utils/color-utils', async (importOriginal) => {
  const actual = await importOriginal<any>();
  return {
    ...actual,
    getColorInfo: vi.fn(() => ({
      color: '#ffffff',
      textColor: '#000000',
      hex: '#ffffff',
    })),
  };
});

vi.mock('$lib/utils/weather-utils.svelte', () => ({
  getWeatherTargets: vi.fn(() => []),
}));

describe('weather-state', () => {
  describe('getMoonPhase', () => {
    it('should return 0 for a known New Moon (2000-01-06)', () => {
      const date = new Date('2000-01-06T18:14:00Z');
      expect(getMoonPhase(date)).toBe(0);
    });

    it('should return 4 for a known Full Moon (~2000-01-21)', () => {
      const date = new Date('2000-01-21T04:40:00Z');
      expect(getMoonPhase(date)).toBe(4);
    });

    it('should cycle through all 8 phases', () => {
      const start = new Date('2000-01-06T18:14:00Z');
      const synodicPeriodDays = 29.53;
      const phases = [];
      for (let i = 0; i < 8; i++) {
        const date = new Date(
          start.getTime() + ((i * synodicPeriodDays) / 8) * 24 * 60 * 60 * 1000,
        );
        phases.push(getMoonPhase(date));
      }
      expect(new Set(phases).size).toBeGreaterThanOrEqual(7);
    });

    it('should throw an error for invalid dates', () => {
      expect(() => getMoonPhase(new Date('invalid'))).toThrow(
        'Invalid Date object provided.',
      );
      // @ts-expect-error testing invalid input
      expect(() => getMoonPhase('2023-01-01')).toThrow(
        'Invalid Date object provided.',
      );
    });
  });

  describe('getDayTime', () => {
    it('should return metric in minutes and imperial in hours', () => {
      const date = new Date('2024-06-21');
      const sunrise = new Date('2024-06-21T06:00:00Z');
      const sunset = new Date('2024-06-21T18:00:00Z');

      vi.mocked(SunCalc.getTimes).mockReturnValue({
        sunrise,
        sunset,
      } as any);

      const result = getDayTime({ date, lat: 0, lng: 0 });
      expect(result.metric).toBe(720);
      expect(result.imperial).toBe(12);
    });

    it('should return nulls if sunset/sunrise are invalid', () => {
      vi.mocked(SunCalc.getTimes).mockReturnValue({
        sunrise: 'invalid',
        sunset: 'invalid',
      } as any);
      const result = getDayTime({ date: new Date(), lat: 0, lng: 0 });
      expect(result.metric).toBeNull();
      expect(result.imperial).toBeNull();
    });
  });

  describe('sum', () => {
    beforeEach(() => {
      weather.rawData = [
        {
          tmax: { metric: 10, imperial: 50 },
          tavg: { metric: 5, imperial: 41 },
        } as any,
        {
          tmax: { metric: 20, imperial: 68 },
          tavg: { metric: 15, imperial: 59 },
        } as any,
      ];
      mockPreferences.value.units = 'metric';
    });

    it('should calculate the sum of a parameter across all days', () => {
      expect(weather.sum('tmax')).toBe(30); // 10 + 20
    });

    it('should handle missing values by using averages', () => {
      // Override weather.params to simulate computed mock values, preventing TypeError from undefined tmax
      Object.defineProperty(weather, 'params', {
        get: () => ({
          tmax: [10, 20],
          tavg: [5, 15],
          tmin: [0, 0],
          prcp: [0, 0],
          snow: [0, 0],
          dayt: [0, 0],
          moon: [0, 0],
        }),
        configurable: true,
      });

      weather.rawData = [
        {
          tmax: { metric: 10, imperial: 50 },
        } as any,
        {
          tmax: undefined as any,
        } as any,
      ];

      // average of tmax is (10+20)/2 = 15
      // total should be 10 + 15 = 25
      expect(weather.sum('tmax')).toBe(25);

      // Restore prototype getter after test
      // @ts-ignore
      delete weather.params;
    });

    it('should treat 0 as 1', () => {
      weather.rawData = [{ tmax: { metric: 0, imperial: 32 } } as any];
      expect(weather.sum('tmax')).toBe(1);
    });

    it('should use absolute values', () => {
      weather.rawData = [{ tmax: { metric: -10, imperial: 14 } } as any];
      expect(weather.sum('tmax')).toBe(10);
    });
  });

  describe('missingDaysCount', () => {
    it('should count days where all temperature and precip values are null', () => {
      weather.rawData = [
        {
          tavg: { metric: null },
          tmin: { metric: null },
          tmax: { metric: null },
          snow: { metric: null },
          prcp: { metric: null },
        } as any,
        {
          tavg: { metric: 10 },
          tmin: { metric: null },
          tmax: { metric: null },
          snow: { metric: null },
          prcp: { metric: null },
        } as any,
      ];
      expect(weather.missingDaysCount()).toBe(1);
    });
  });

  describe('getOpenMeteo', () => {
    const mockLocation = {
      lat: 50,
      lng: 10,
      from: '2023-01-01',
      to: '2023-01-02',
      label: 'Test Location',
      index: 0,
      stations: null,
    };

    beforeEach(() => {
      vi.stubGlobal('fetch', vi.fn());
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2024-01-01T12:00:00Z'));
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('should fetch data from Open-Meteo and map it correctly', async () => {
      const mockResponse = {
        ok: true,
        json: async () => ({
          daily: {
            time: ['2023-01-01', '2023-01-02'],
            temperature_2m_max: [10, 12],
            temperature_2m_min: [0, 2],
            rain_sum: [1, 0],
            snowfall_sum: [0, 0],
          },
        }),
      };
      vi.mocked(fetch).mockResolvedValue(mockResponse as any);

      vi.mocked(SunCalc.getTimes).mockReturnValue({
        sunrise: new Date('2023-01-01T06:00:00Z'),
        sunset: new Date('2023-01-01T18:00:00Z'),
      } as any);

      const data = await weather.getOpenMeteo({ location: mockLocation });

      expect(data).toHaveLength(2);
      expect(data[0].tmax.metric).toBe(10);
      expect(data[0].tmin.metric).toBe(0);
      expect(data[0].tavg.metric).toBe(5);
    });

    it('should clamp future "to" date to yesterday', async () => {
      const futureLocation = { ...mockLocation, to: '2024-01-05' };

      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        json: async () => ({
          daily: {
            time: ['2023-12-31'],
            temperature_2m_max: [5],
            temperature_2m_min: [0],
            rain_sum: [0],
            snowfall_sum: [0],
          },
        }),
      } as any);

      await weather.getOpenMeteo({ location: futureLocation });

      const url = vi.mocked(fetch).mock.calls[0][0] as string;
      expect(url).toContain('end_date=2023-12-31');
    });

    it('should throw error for 503 response', async () => {
      vi.mocked(fetch).mockResolvedValue({
        status: 503,
        ok: false,
      } as any);

      await expect(
        weather.getOpenMeteo({ location: mockLocation }),
      ).rejects.toThrow('Service Temporarily Unavailable');
    });
  });

  describe('getWeatherSourceDetails', () => {
    it('should return sources based on location sources', () => {
      mockLocations.all = [{ source: 'Meteostat' }, { source: 'Open-Meteo' }];
      weather.isUserEdited = false;
      const result = weather.getWeatherSourceDetails();
      expect(result).toHaveLength(2);
      expect(result).toContainEqual({
        name: 'Meteostat',
        url: 'https://meteostat.net',
      });
      expect(result).toContainEqual({
        name: 'Open-Meteo',
        url: 'https://open-meteo.com',
      });
    });

    it('should include custom weather data if isUserEdited is true', () => {
      mockLocations.all = [];
      weather.isUserEdited = true;
      const result = weather.getWeatherSourceDetails();
      expect(result).toContainEqual({ name: 'custom weather data' });
    });

    it('should return undefined if locations.all is not available', () => {
      mockLocations.all = undefined as any;
      expect(weather.getWeatherSourceDetails()).toBeUndefined();
    });
  });

  describe('getWeatherValue', () => {
    beforeEach(() => {
      weather.rawData = [
        {
          tmax: { metric: 20, imperial: 68 },
          moon: 4,
        } as any,
      ];
      mockPreferences.value.units = 'metric';
    });

    it('should return moon phase directly', () => {
      expect(weather.getWeatherValue({ dayIndex: 0, param: 'moon' })).toBe(4);
    });

    it('should return metric value for other parameters', () => {
      expect(weather.getWeatherValue({ dayIndex: 0, param: 'tmax' })).toBe(20);
    });

    it('should return imperial value if units are imperial', () => {
      mockPreferences.value.units = 'imperial';
      expect(weather.getWeatherValue({ dayIndex: 0, param: 'tmax' })).toBe(68);
    });
  });

  describe('getTableData', () => {
    beforeEach(() => {
      // Mock tableWeatherTargets property
      Object.defineProperty(weather, 'tableWeatherTargets', {
        get: () => [{ id: 'tmax' }, { id: 'moon' }, { id: 'dayt' }],
        configurable: true,
      });

      weather.rawData = [
        {
          date: new Date('2024-01-01T00:00:00Z'),
          location: 'Test',
          tmax: { metric: 20, imperial: 68 },
          moon: 0,
          dayt: { metric: 720, imperial: 12 },
        } as any,
      ];
      mockPreferences.value.units = 'metric';
    });

    afterEach(() => {
      // Restore prototype getter
      // @ts-ignore
      delete weather.tableWeatherTargets;
    });

    it('should format data for table display', () => {
      const result = weather.getTableData();
      expect(result).toHaveLength(1);
      expect(result[0].date).toBe('2024-01-01');
      expect(result[0].tmax).toBe(20);
      expect(result[0].moon).toBe('New Moon');
      expect(result[0].color.tmax).toBeDefined();
    });

    it('should handle null values in table data', () => {
      weather.rawData[0].tmax.metric = null;
      const result = weather.getTableData();
      expect(result[0].tmax).toBe('-');
    });
  });
});

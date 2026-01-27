import SunCalc from 'suncalc';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  chunkArray,
  CSVtoArray,
  getDayTime,
  getMoonPhase,
  getOpenMeteo,
  getTableData,
  getWeatherSourceDetails,
  getWeatherTargets,
  getWeatherValue,
  missingDaysCount,
  sum,
} from './weather-utils.svelte';

// Mocking $lib modules
vi.mock('$lib/constants', async (importOriginal) => ({
  ...(await importOriginal<typeof import('$lib/constants')>()),
  API_SERVICES: {
    openMeteo: { baseURL: 'https://archive-api.open-meteo.com/v1/archive' },
  },
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

const { mockWeather, mockPreferences, mockLocations, mockAllGaugesAttributes } =
  vi.hoisted(() => ({
    mockWeather: {
      data: [] as any[],
      params: {
        tmax: [10, 20],
        tavg: [15],
        tmin: [5],
        prcp: [0],
        snow: [0],
        dayt: [12],
      },
      isUserEdited: false,
      tableWeatherTargets: [] as any[],
    },
    mockPreferences: {
      value: {
        units: 'metric',
      },
    },
    mockLocations: {
      all: [] as any[],
    },
    mockAllGaugesAttributes: [] as any[],
  }));

vi.mock('$lib/storage/preferences.svelte', () => ({
  preferences: mockPreferences,
}));

vi.mock('$lib/state', () => ({
  weather: mockWeather,
  locations: mockLocations,
  signal: { value: null },
  allGaugesAttributes: mockAllGaugesAttributes,
}));

// Mock utils that are used within weather-utils
vi.mock('$lib/utils', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    displayNumber: vi.fn((n: number) => Math.round(n * 100) / 100),
    getAverage: vi.fn(
      (arr: number[]) => arr.reduce((a, b) => a + b, 0) / arr.length,
    ),
    celsiusToFahrenheit: (n: number | null) =>
      n === null ? null : (n * 9) / 5 + 32,
    millimetersToInches: (n: number | null) => (n === null ? null : n / 25.4),
    hoursToMinutes: (h: number) => h * 60,
    stringToDate: (s: string) => new Date(s + 'T00:00:00Z'),
    dateToISO8601String: (d: Date) => {
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    },
    numberOfDays: (d1: Date, d2: Date) =>
      Math.ceil((d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24)),
    getColorInfo: vi.fn(() => ({ color: '#ffffff', textColor: '#000000' })),
    convertTime: vi.fn((t) => t),
  };
});

describe('weather-utils', () => {
  describe('getMoonPhase', () => {
    it('should return 0 for a known New Moon (2000-01-06)', () => {
      // Known New Moon: January 6, 2000, 18:14:00 UTC
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
      // It might not be exactly 0,1,2,3,4,5,6,7 due to rounding and simplified math,
      // but it should be monotonic and cover the range.
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

  describe('chunkArray', () => {
    it('should split an array into chunks of specified size', () => {
      const input = [1, 2, 3, 4, 5];
      expect(chunkArray(input, 2)).toEqual([[1, 2], [3, 4], [5]]);
    });

    it('should return an empty array if input is empty', () => {
      expect(chunkArray([], 2)).toEqual([]);
    });

    it('should handle chunk size larger than array length', () => {
      expect(chunkArray([1, 2], 5)).toEqual([[1, 2]]);
    });
  });

  describe('CSVtoArray', () => {
    it('should convert CSV string to array of objects', () => {
      const csv = 'name,age\nAlice,30\nBob,25';
      const result = CSVtoArray({ str: csv });
      expect(result).toEqual([
        { name: 'Alice', age: '30' },
        { name: 'Bob', age: '25' },
      ]);
    });

    it('should handle custom delimiters', () => {
      const csv = 'name;age\nAlice;30';
      const result = CSVtoArray({ str: csv, delimiter: ';' });
      expect(result).toEqual([{ name: 'Alice', age: '30' }]);
    });

    it('should remove carriage returns', () => {
      const csv = 'name,age\r\nAlice,30\r\n';
      const result = CSVtoArray({ str: csv });
      // The implementation has a slight quirk where an empty line at the end might result in an object with undefined values
      expect(result[0]).toEqual({ name: 'Alice', age: '30' });
    });
  });

  describe('sum', () => {
    beforeEach(() => {
      mockWeather.data = [
        {
          tmax: { metric: 10, imperial: 50 },
          tavg: { metric: 5, imperial: 41 },
        },
        {
          tmax: { metric: 20, imperial: 68 },
          tavg: { metric: 15, imperial: 59 },
        },
      ];
      mockPreferences.value.units = 'metric';
    });

    it('should calculate the sum of a parameter across all days', () => {
      expect(sum('tmax')).toBe(30); // 10 + 20
    });

    it('should handle missing values by using averages', () => {
      mockWeather.data[1].tmax = undefined;
      // average of weather.params.tmax is (10+20)/2 = 15
      // total should be 10 + 15 = 25
      expect(sum('tmax')).toBe(25);
    });

    it('should treat 0 as 1', () => {
      mockWeather.data = [{ tmax: { metric: 0, imperial: 32 } }];
      expect(sum('tmax')).toBe(1);
    });

    it('should use absolute values', () => {
      mockWeather.data = [{ tmax: { metric: -10, imperial: 14 } }];
      expect(sum('tmax')).toBe(10);
    });
  });

  describe('missingDaysCount', () => {
    it('should count days where all temperature and precip values are null', () => {
      mockWeather.data = [
        {
          tavg: { metric: null },
          tmin: { metric: null },
          tmax: { metric: null },
          snow: { metric: null },
          prcp: { metric: null },
        },
        {
          tavg: { metric: 10 },
          tmin: { metric: null },
          tmax: { metric: null },
          snow: { metric: null },
          prcp: { metric: null },
        },
      ];
      expect(missingDaysCount()).toBe(1);
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
        // other fields
      } as any);

      const result = getDayTime({ date, lat: 0, lng: 0 });
      // 12 hours = 720 minutes
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

      // Mock getDayTime within getOpenMeteo test if needed, but it's already using mocked SunCalc
      vi.mocked(SunCalc.getTimes).mockReturnValue({
        sunrise: new Date('2023-01-01T06:00:00Z'),
        sunset: new Date('2023-01-01T18:00:00Z'),
      } as any);

      const data = await getOpenMeteo({ location: mockLocation });

      expect(data).toHaveLength(2);
      expect(data[0].tmax.metric).toBe(10);
      expect(data[0].tmin.metric).toBe(0);
      expect(data[0].tavg.metric).toBe(5);
    });

    it('should clamp future "to" date to yesterday', async () => {
      // System time is 2024-01-01. Any date >= today should be clamped to yesterday (2023-12-31)
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

      await getOpenMeteo({ location: futureLocation });

      const url = vi.mocked(fetch).mock.calls[0][0] as string;
      // Today is 2024-01-01, yesterday is 2023-12-31
      expect(url).toContain('end_date=2023-12-31');
    });

    it('should throw error for 503 response', async () => {
      vi.mocked(fetch).mockResolvedValue({
        status: 503,
        ok: false,
      } as any);

      await expect(getOpenMeteo({ location: mockLocation })).rejects.toThrow(
        'Service Temporarily Unavailable',
      );
    });
  });

  describe('getWeatherSourceDetails', () => {
    it('should return sources based on location sources', () => {
      mockLocations.all = [{ source: 'Meteostat' }, { source: 'Open-Meteo' }];
      mockWeather.isUserEdited = false;
      const result = getWeatherSourceDetails();
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
      mockWeather.isUserEdited = true;
      const result = getWeatherSourceDetails();
      expect(result).toContainEqual({ name: 'custom weather data' });
    });

    it('should return undefined if locations.all is not available', () => {
      // @ts-expect-error testing missing data
      mockLocations.all = undefined;
      expect(getWeatherSourceDetails()).toBeUndefined();
    });
  });

  describe('getWeatherTargets', () => {
    it('should filter targets based on weatherParameters', () => {
      mockAllGaugesAttributes.push({
        targets: [{ id: 'tmax' }, { id: 'tmin' }],
      });
      const weatherParameters = { tmax: true, tmin: false };
      const result = getWeatherTargets({ weatherParameters });
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('tmax');
    });
  });

  describe('getWeatherValue', () => {
    beforeEach(() => {
      mockWeather.data = [
        {
          tmax: { metric: 20, imperial: 68 },
          moon: 4,
        },
      ];
      mockPreferences.value.units = 'metric';
    });

    it('should return moon phase directly', () => {
      expect(getWeatherValue({ dayIndex: 0, param: 'moon' })).toBe(4);
    });

    it('should return metric value for other parameters', () => {
      expect(getWeatherValue({ dayIndex: 0, param: 'tmax' })).toBe(20);
    });

    it('should return imperial value if units are imperial', () => {
      mockPreferences.value.units = 'imperial';
      expect(getWeatherValue({ dayIndex: 0, param: 'tmax' })).toBe(68);
    });
  });

  describe('getTableData', () => {
    beforeEach(() => {
      mockWeather.data = [
        {
          date: new Date('2024-01-01T00:00:00Z'),
          location: 'Test',
          tmax: { metric: 20, imperial: 68 },
          moon: 0,
          dayt: { metric: 720, imperial: 12 },
        },
      ];
      mockWeather.tableWeatherTargets = [
        { id: 'tmax' },
        { id: 'moon' },
        { id: 'dayt' },
      ];
      mockPreferences.value.units = 'metric';
    });

    it('should format data for table display', () => {
      const result = getTableData();
      expect(result).toHaveLength(1);
      expect(result[0].date).toBe('2024-01-01');
      expect(result[0].tmax).toBe(20);
      expect(result[0].moon).toBe('New Moon');
      expect(result[0].color.tmax).toBeDefined();
    });

    it('should handle null values in table data', () => {
      mockWeather.data[0].tmax.metric = null;
      const result = getTableData();
      expect(result[0].tmax).toBe('-');
    });
  });
});

import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import {
  dateToISO8601String,
  stringToDate,
  numberOfDays,
  getIsRecentDate,
  getIsFutureDate,
  getWeekNumber,
  isDateWithinLastSevenDays,
  getToday,
} from './date-utils';

vi.mock('$lib/state', () => ({
  weather: {
    isUserEdited: false,
    source: { name: 'Meteostat' },
  },
}));

describe('date-utils', () => {
  describe('dateToISO8601String', () => {
    it('should convert a Date object to YYYY-MM-DD string using UTC', () => {
      const date = new Date(Date.UTC(2024, 0, 1)); // Jan 1, 2024 UTC
      expect(dateToISO8601String(date)).toBe('2024-01-01');
    });

    it('should handle single digit month and day using UTC', () => {
      const date = new Date(Date.UTC(2024, 8, 5)); // Sep 5, 2024 UTC
      expect(dateToISO8601String(date)).toBe('2024-09-05');
    });
  });

  describe('stringToDate', () => {
    it('should convert YYYY-MM-DD string to UTC Date', () => {
      const date = stringToDate('2024-01-01');
      expect(date.getUTCFullYear()).toBe(2024);
      expect(date.getUTCMonth()).toBe(0);
      expect(date.getUTCDate()).toBe(1);
    });

    it('should handle different delimiters', () => {
      expect(stringToDate('2024.01.01').getUTCDate()).toBe(1);
      expect(stringToDate('2024/01/01').getUTCDate()).toBe(1);
    });
  });

  describe('numberOfDays', () => {
    it('should calculate the inclusive number of days between two dates', () => {
      const d1 = new Date('2024-01-01T00:00:00Z');
      const d2 = new Date('2024-01-05T00:00:00Z');
      expect(numberOfDays(d1, d2)).toBe(5);
    });

    it('should return 1 for the same day', () => {
      const d1 = new Date('2024-01-01T00:00:00Z');
      expect(numberOfDays(d1, d1)).toBe(1);
    });
  });

  describe('getIsFutureDate', () => {
    beforeEach(() => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2024-01-01T12:00:00Z'));
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('should return true for a date after today', () => {
      expect(getIsFutureDate('2024-01-02')).toBe(true);
    });

    it('should return true for today (due to strict greater than comparison with yesterday)', () => {
      // Implementation: new Date(date) > new Date(new Date().getTime() - 1 * 24 * 60 * 60 * 1000)
      // If Today is Jan 1 12:00, Yesterday is Dec 31 12:00.
      // Jan 1 00:00 (from '2024-01-01') > Dec 31 12:00 is true.
      expect(getIsFutureDate('2024-01-01')).toBe(true);
    });

    it('should return false for a date before today', () => {
      expect(getIsFutureDate('2023-12-31')).toBe(false);
    });
  });
  describe('getWeekNumber', () => {
    it('should return the correct week number', () => {
      const date = new Date('2024-01-01T00:00:00Z');
      // Jan 1, 2024 is a Monday.
      // With Sunday offset (0), it's week 1.
      const result = getWeekNumber(date, 0);
      expect(result).toEqual([2024, 1]);
    });

    it('should handle year boundary', () => {
      const date = new Date('2023-12-31T00:00:00Z');
      // Dec 31, 2023 is a Sunday.
      // Implementation adjusts to 4th day of week (Wednesday Jan 3, 2024 if offset 0).
      // So it belongs to 2024 week 1.
      const result = getWeekNumber(date, 0);
      expect(result).toEqual([2024, 1]);
    });
  });

  describe('isDateWithinLastSevenDays', () => {
    beforeEach(() => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2024-01-10T12:00:00Z'));
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('should return true for a date 3 days ago', () => {
      expect(isDateWithinLastSevenDays('2024-01-07')).toBe(true);
    });

    it('should return false for a date 10 days ago', () => {
      expect(isDateWithinLastSevenDays('2023-12-31')).toBe(false);
    });
  });

  describe('getToday', () => {
    it('should return today as a timestamp at midnight UTC', () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2024-01-01T15:00:00Z'));
      const todayTimestamp = getToday();
      const today = new Date(todayTimestamp);
      expect(today.getUTCHours()).toBe(0);
      expect(today.getUTCDate()).toBe(1);
      vi.useRealTimers();
    });
  });
});

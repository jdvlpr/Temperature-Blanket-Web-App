import { DEFAULT_SEASONS, SEASON_PRESETS } from '$lib/constants';
import { describe, expect, it, vi } from 'vitest';
import {
  formatDateRange,
  getSeasonForDate,
  isDateInRange,
  seasonsFromUrlHash,
  seasonsToUrlHash,
} from './seasons-utils.svelte';

// Mock state since it's imported in seasons-utils
vi.mock('$lib/state', () => ({
  localState: { value: { seasons: [] } },
  previews: { active: null },
}));

describe('seasons-utils', () => {
  describe('isDateInRange', () => {
    it('should return true for a date within a normal range', () => {
      const date = new Date('2024-04-15T00:00:00Z');
      expect(isDateInRange(date, '03-01', '05-31')).toBe(true);
    });

    it('should return false for a date outside a normal range', () => {
      const date = new Date('2024-06-15T00:00:00Z');
      expect(isDateInRange(date, '03-01', '05-31')).toBe(false);
    });

    it('should return true for a date within a year-wrap range (Winter)', () => {
      const date = new Date('2024-01-15T00:00:00Z');
      expect(isDateInRange(date, '12-01', '02-28')).toBe(true);

      const dateDec = new Date('2024-12-15T00:00:00Z');
      expect(isDateInRange(dateDec, '12-01', '02-28')).toBe(true);
    });

    it('should return false for a date outside a year-wrap range', () => {
      const date = new Date('2024-04-15T00:00:00Z');
      expect(isDateInRange(date, '12-01', '02-28')).toBe(false);
    });
  });

  describe('getSeasonForDate', () => {
    it('should return the correct season for a date', () => {
      const date = new Date('2024-04-15');
      const season = getSeasonForDate(date, DEFAULT_SEASONS);
      expect(season?.id).toBe('spring');
    });

    it('should return null if no season matches', () => {
      const date = new Date('2024-04-15');
      const season = getSeasonForDate(date, []);
      expect(season).toBeNull();
    });
  });

  describe('formatDateRange', () => {
    it('should format a date range correctly', () => {
      expect(formatDateRange('03-01', '05-31')).toBe('Mar 1 - May 31');
    });
  });

  describe('seasonsToUrlHash', () => {
    it('should return a preset index for standard presets', () => {
      const hash = seasonsToUrlHash(
        SEASON_PRESETS.northernMeteorological.seasons,
      );
      expect(hash).toBe('0');
    });

    it('should return a 32-char string for custom seasons', () => {
      const customSeasons = JSON.parse(JSON.stringify(DEFAULT_SEASONS));
      customSeasons[0].startDate = '03-02'; // change one date
      const hash = seasonsToUrlHash(customSeasons);
      expect(hash).toHaveLength(32);
      expect(hash.substring(0, 4)).toBe('0302');
    });
  });

  describe('seasonsFromUrlHash', () => {
    it('should return preset seasons for a valid index hash', () => {
      const seasons = seasonsFromUrlHash('0');
      expect(seasons).toHaveLength(4);
      expect(seasons?.[0].startDate).toBe(
        SEASON_PRESETS.northernMeteorological.seasons[0].startDate,
      );
    });

    it('should return custom seasons for a 32-char hash', () => {
      // 03010531 for spring, etc.
      const hash = '03010531060108310901113012010228';
      const seasons = seasonsFromUrlHash(hash);
      expect(seasons).toHaveLength(4);
      expect(seasons?.[0].startDate).toBe('03-01');
      expect(seasons?.[0].endDate).toBe('05-31');
    });

    it('should return null for invalid hash lengths', () => {
      expect(seasonsFromUrlHash('123')).toBeNull();
    });
  });
});

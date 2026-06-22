import { describe, expect, it, vi } from 'vitest';
import {
  chunkArray,
  CSVtoArray,
  getWeatherTargets,
} from './weather-utils.svelte';

const { mockAllGaugesAttributes } =
  vi.hoisted(() => ({
    mockAllGaugesAttributes: [] as any[],
  }));

vi.mock('$lib/state/gauges-state.svelte', () => ({
  allGaugesAttributes: mockAllGaugesAttributes,
}));

describe('weather-utils', () => {
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
      expect(result[0]).toEqual({ name: 'Alice', age: '30' });
    });
  });

  describe('getWeatherTargets', () => {
    it('should filter targets based on weatherParameters', () => {
      mockAllGaugesAttributes.length = 0; // Clear array
      mockAllGaugesAttributes.push({
        targets: [{ id: 'tmax' }, { id: 'tmin' }],
      });
      const weatherParameters = { tmax: true, tmin: false };
      const result = getWeatherTargets({ weatherParameters });
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('tmax');
    });
  });
});

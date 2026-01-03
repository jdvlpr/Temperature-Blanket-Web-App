import { describe, it, expect } from 'vitest';
import {
  getRandomNumber,
  getAverage,
  getMinOfThree,
  getAvgOfThree,
  getMaxOfThree,
  displayNumber,
  pickRandomFromArray,
  getMiddleValueOfArray,
} from './number-utils';

describe('number-utils', () => {
  describe('getRandomNumber', () => {
    it('should return a number between min and max inclusive', () => {
      const min = 1;
      const max = 10;
      for (let i = 0; i < 100; i++) {
        const result = getRandomNumber(min, max);
        expect(result).toBeGreaterThanOrEqual(min);
        expect(result).toBeLessThanOrEqual(max);
      }
    });

    it('should handle min equals max', () => {
      expect(getRandomNumber(5, 5)).toBe(5);
    });
  });

  describe('getAverage', () => {
    it('should calculate the average correctly', () => {
      const arr = [1, 2, 3, 4, 5];
      expect(getAverage(arr)).toBe(3);
    });

    it('should respect the decimals property', () => {
      const arr = [1, 1, 2]; // sum 4, avg 1.333...
      expect(getAverage(arr, { decimals: 1 })).toBe(1.3);
      expect(getAverage(arr, { decimals: 2 })).toBe(1.33);
    });
  });

  describe('getMinOfThree', () => {
    it('should return the minimum of three numbers', () => {
      expect(getMinOfThree(1, 2, 3)).toBe(1);
      expect(getMinOfThree(3, 2, 1)).toBe(1);
      expect(getMinOfThree(2, 1, 3)).toBe(1);
    });

    it('should handle null values', () => {
      expect(getMinOfThree(null, 5, 10)).toBe(null);
      expect(getMinOfThree(5, null, 10)).toBe(5); // If avg is null, but min is set, logic says: if avg==null && max!=null -> max>min?min
      // Logic trace: min=5, avg=null, max=10.
      // if (min === null) -> false
      // if (avg === null && max === null) -> false
      // if (avg === null && max !== null) -> return min > max ? max : min -> 5 > 10 ? 10 : 5 -> returns 5. Correct.
      expect(getMinOfThree(5, null, 10)).toBe(5);

      expect(getMinOfThree(5, 10, null)).toBe(5);
      // Logic trace: min=5, avg=10, max=null.
      // ...
      // if (avg !== null && max === null) -> return min > avg ? avg : min -> 5 > 10 ? 10 : 5 -> returns 5. Correct.

      expect(getMinOfThree(5, null, null)).toBe(5); // if avg==null && max==null -> min
    });
  });

  describe('getAvgOfThree', () => {
    it('should return the average/middle value appropriately', () => {
      // Logic seems to be "clamping" the average between min and max?
      // "getAverageOfThree" usually implies (a+b+c)/3, but the implementation is limiting 'avg' by min/max.
      // Let's verify the implementation intent from reading the code: "taking into account optional minimum and maximum values"

      // Case: avg is within min and max
      expect(getAvgOfThree(0, 5, 10)).toBe(5);

      // Case: avg is below min -> should be clamped to min?
      // min=5, avg=2, max=10.
      // nextLowest = min(5,10)=5. avg(2) < 5 -> returns 5. Correct.
      expect(getAvgOfThree(5, 2, 10)).toBe(5);

      // Case: avg is above max -> should be clamped to max?
      // min=0, avg=10, max=5.
      // nextHighest = max(0,5)=5. avg(10) > 5 -> returns 5. Correct.
      expect(getAvgOfThree(0, 10, 5)).toBe(5);
    });

    it('should handle nulls', () => {
      expect(getAvgOfThree(null, 5, null)).toBe(5);
      expect(getAvgOfThree(null, null, null)).toBe(null);
    });
  });

  describe('getMaxOfThree', () => {
    it('should return the maximum of three numbers', () => {
      expect(getMaxOfThree(1, 2, 3)).toBe(3);
      expect(getMaxOfThree(3, 1, 2)).toBe(3);
    });

    it('should handle nulls', () => {
      expect(getMaxOfThree(1, 2, null)).toBe(null); // Explicitly returns max if max is null
    });
  });

  describe('displayNumber', () => {
    it('should format number with correct decimals', () => {
      expect(displayNumber(1.23456, 2)).toBe(1.23);
      expect(displayNumber(1.23456, 1)).toBe(1.2);
      expect(displayNumber(1, 2)).toBe(1); // parseFloat removes trailing zeros if integer? No, toFixed(2) -> "1.00", parseFloat("1.00") -> 1. Correct.
    });

    it('should handle non-numbers gracefully', () => {
      expect(displayNumber('not a number' as any)).toBe(0);
      expect(displayNumber(NaN)).toBe(NaN); // typeof NaN is 'number', so it bypasses the "typeof number !== 'number'" check but parseFloat(NaN.toFixed()) -> "NaN"
      // Actually, the code says: if (typeof number !== 'number') ...
      // NaN is typeof 'number'.
      // number.toFixed on NaN returns "NaN". parseFloat("NaN") is NaN.
      expect(displayNumber(NaN)).toBeNaN();
    });
  });

  describe('pickRandomFromArray', () => {
    it('should pick an item from the array', () => {
      const arr = [1, 2, 3];
      const result = pickRandomFromArray({ array: arr });
      expect(arr).toContain(result);
    });

    it('should return undefined for empty array', () => {
      expect(pickRandomFromArray({ array: [] })).toBeUndefined();
    });
  });

  describe('getMiddleValueOfArray', () => {
    it('should return the middle value', () => {
      expect(getMiddleValueOfArray([1, 2, 3])).toBe(2);
      expect(getMiddleValueOfArray([1, 2, 3, 4, 5])).toBe(3);
    });

    it('should handle even length arrays (returns simpler logic)', () => {
      // Math.ceil((4-1)/2) = Math.ceil(1.5) = 2. Index 2 is the 3rd element.
      expect(getMiddleValueOfArray([1, 2, 3, 4])).toBe(3);
    });
  });
});

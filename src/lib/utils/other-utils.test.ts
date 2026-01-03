import { describe, expect, it } from 'vitest';
import { exists, upToDate, capitalizeFirstLetter } from './other-utils';

describe('other-utils', () => {
  describe('exists', () => {
    it('should return true for valid values', () => {
      expect(exists('hello')).toBe(true);
      expect(exists(123)).toBe(true);
      expect(exists(['a'])).toBe(true);
      expect(exists({ a: 1 })).toBe(true);
    });

    it('should return false for invalid values', () => {
      expect(exists(null)).toBe(false); // !!null is false
      expect(exists(undefined)).toBe(false);
      expect(exists('')).toBe(false);
      expect(exists([])).toBe(false); // [].length is 0
      expect(exists({})).toBe(false); // JSON.stringify({}) is '{}'
    });
  });

  describe('upToDate', () => {
    it('should return true if local version is greater than or equal to remote', () => {
      expect(upToDate('1.0.1', '1.0.0')).toBe(true);
      expect(upToDate('2.0.0', '1.0.0')).toBe(true);
      expect(upToDate('1.0.0', '1.0.0')).toBe(true);
    });

    it('should return false if local version is less than remote', () => {
      expect(upToDate('1.0.0', '1.0.1')).toBe(false);
      expect(upToDate('0.9.0', '1.0.0')).toBe(false);
    });

    it('should handle legacy versioning (before 2.0.0) padding logic', () => {
      // Logic: if rparts[0] <= 1, it pads with '0' to match lengths
      // local "1.74" vs remote "1.9"
      // lparts=["1","74","0"], rparts=["1","9","0"]
      // i=1: lString="74", rString="90" (padded 9 to 90 because 74 has length 2 and 9 has length 1)
      // 74 < 90 -> returns false because l < r
      expect(upToDate('1.74', '1.9')).toBe(false);

      // local "1.9" vs remote "1.74"
      // lString="90", rString="74" -> 90 > 74 -> true
      expect(upToDate('1.9', '1.74')).toBe(true);
    });

    it('should handle standard semver for version 2.0+', () => {
      // local "2.10.0" vs remote "2.2.0"
      // lparts=["2","10","0"], rparts=["2","2","0"]
      // i=1: lString="10", rString="2"
      // no padding because rparts[0] > 1 is false (wait, code: parseInt(rparts[0], 10) <= 1)
      // 2 <= 1 is false. So beforeMajorVersionTwo is false.
      // parseInt("10") = 10, parseInt("2") = 2.
      // 10 > 2 -> returns true.
      expect(upToDate('2.10.0', '2.2.0')).toBe(true);
    });
  });

  describe('capitalizeFirstLetter', () => {
    it('should capitalize the first letter', () => {
      expect(capitalizeFirstLetter('hello')).toBe('Hello');
      expect(capitalizeFirstLetter('world')).toBe('World');
    });

    it('should handle empty string', () => {
      // charAt(0) of empty string is empty string. toUpperCase() is empty string. slice(1) is empty string.
      expect(capitalizeFirstLetter('')).toBe('');
    });
  });
});

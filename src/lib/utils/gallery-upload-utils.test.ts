import { describe, expect, it } from 'vitest';
import { byteLength, getImageScaleForBudget } from './gallery-upload-utils';

describe('getImageScaleForBudget', () => {
  it('returns 1 when the image already fits', () => {
    expect(getImageScaleForBudget(1_000, 2_000)).toBe(1);
    expect(getImageScaleForBudget(2_000, 2_000)).toBe(1);
  });

  it('scales by the square root of the size ratio, with margin', () => {
    const scale = getImageScaleForBudget(4_000_000, 1_000_000);
    expect(scale).toBeCloseTo(0.5 * 0.9);
    // Scaling both dimensions shrinks the area (and roughly the bytes) below budget
    expect(4_000_000 * scale! ** 2).toBeLessThan(1_000_000);
  });

  it('returns null when there is no room for the image', () => {
    expect(getImageScaleForBudget(1_000, 0)).toBeNull();
    expect(getImageScaleForBudget(1_000, -500)).toBeNull();
  });

  it('returns null when the image would have to shrink too much', () => {
    expect(getImageScaleForBudget(10_000_000, 100_000)).toBeNull();
  });
});

describe('byteLength', () => {
  it('counts UTF-8 bytes, not characters', () => {
    expect(byteLength('abc')).toBe(3);
    expect(byteLength('é')).toBe(2);
  });
});

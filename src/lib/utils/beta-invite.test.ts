import { describe, expect, it } from 'vitest';
import { clampPercent, pickBucket, shouldShowBetaInvite } from './beta-invite';

describe('clampPercent', () => {
  it('keeps 0–100 and rounds', () => {
    expect(clampPercent(10)).toBe(10);
    expect(clampPercent('25')).toBe(25);
    expect(clampPercent(12.6)).toBe(13);
  });

  it('turns anything else into a bound or 0', () => {
    expect(clampPercent(-5)).toBe(0);
    expect(clampPercent(150)).toBe(100);
    expect(clampPercent(NaN)).toBe(0);
    expect(clampPercent('')).toBe(0);
    expect(clampPercent(undefined)).toBe(0);
    expect(clampPercent('abc')).toBe(0);
  });
});

describe('pickBucket', () => {
  it('is a whole number from 0 to 99', () => {
    expect(pickBucket(() => 0)).toBe(0);
    expect(pickBucket(() => 0.999999)).toBe(99);
    expect(pickBucket(() => 0.5)).toBe(50);
    expect(pickBucket(() => 1)).toBe(99);
  });
});

describe('shouldShowBetaInvite', () => {
  const show = (percent: number, bucket: number, dismissed = false) =>
    shouldShowBetaInvite({ percent, bucket, dismissed });

  it('never shows at 0%', () => {
    expect(show(0, 0)).toBe(false);
  });

  it('always shows at 100%', () => {
    expect(show(100, 0)).toBe(true);
    expect(show(100, 99)).toBe(true);
  });

  it('shows only buckets under the percentage', () => {
    expect(show(10, 9)).toBe(true);
    expect(show(10, 10)).toBe(false);
  });

  it('never shows once closed', () => {
    expect(show(100, 0, true)).toBe(false);
  });

  it('ignores a bucket that isn’t one', () => {
    expect(show(100, -1)).toBe(false);
    expect(show(100, 100)).toBe(false);
    expect(show(100, NaN)).toBe(false);
  });
});

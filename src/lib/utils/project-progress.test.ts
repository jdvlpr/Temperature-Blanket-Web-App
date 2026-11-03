import { describe, expect, it } from 'vitest';
import type { TISO8601DateString } from '#lib/types/weather-types.js';
import {
  madeThroughOf,
  nextDay,
  previousDay,
  progressOf,
  projectDates,
  shortDay,
  unmadeIndexes,
} from './project-progress.js';

const iso = (s: string) => s as TISO8601DateString;
const day = (s: string, location = 0) => ({
  date: new Date(`${s}T00:00:00Z`),
  location,
});
const range = (from: string, count: number, location = 0) =>
  Array.from({ length: count }, (_, i) =>
    day(
      new Date(Date.parse(`${from}T00:00:00Z`) + i * 86_400_000)
        .toISOString()
        .slice(0, 10),
      location,
    ),
  );

describe('progressOf', () => {
  const days = range('2026-01-01', 10);

  it('is nothing when not started', () => {
    expect(progressOf(days, null)).toEqual({
      made: 0,
      total: 10,
      percent: 0,
      finished: false,
    });
  });

  it('counts days through the date', () => {
    expect(progressOf(days, iso('2026-01-03'))).toMatchObject({
      made: 3,
      percent: 30,
      finished: false,
    });
  });

  it('is finished through the last day, or after it', () => {
    expect(progressOf(days, iso('2026-01-10')).finished).toBe(true);
    expect(progressOf(days, iso('2027-01-01')).percent).toBe(100);
  });

  it('rounds down, but never to 0 once a day is made', () => {
    const year = range('2026-01-01', 365);
    expect(progressOf(year, iso('2026-01-01')).percent).toBe(1);
    expect(progressOf(year, iso('2026-12-30')).percent).toBe(99);
  });

  it('covers every location up to the date', () => {
    const both = [...range('2026-01-01', 4, 0), ...range('2026-01-01', 4, 1)];
    expect(progressOf(both, iso('2026-01-02'))).toMatchObject({
      made: 4,
      total: 8,
      percent: 50,
    });
  });

  it('takes saved days, whose dates are strings', () => {
    expect(
      progressOf(
        [{ date: '2026-01-01' }, { date: '2026-01-02' }],
        iso('2026-01-01'),
      ).percent,
    ).toBe(50);
  });
});

describe('nextDay', () => {
  const dates = projectDates(range('2026-01-01', 3));
  it('starts at the first day', () =>
    expect(nextDay(dates, null)).toBe('2026-01-01'));
  it('is the next one', () =>
    expect(nextDay(dates, iso('2026-01-01'))).toBe('2026-01-02'));
  it('is none once finished', () =>
    expect(nextDay(dates, iso('2026-01-03'))).toBeNull());
});

describe('previousDay', () => {
  const dates = projectDates(range('2026-01-01', 3));
  it('is not started from the first day', () =>
    expect(previousDay(dates, iso('2026-01-01'))).toBeNull());
  it('is the one before', () =>
    expect(previousDay(dates, iso('2026-01-03'))).toBe('2026-01-02'));
  it('is none when not started', () =>
    expect(previousDay(dates, null)).toBeNull());
});

describe('unmadeIndexes', () => {
  it('by day', () => {
    const days = range('2026-01-01', 5);
    expect(unmadeIndexes(days, days, iso('2026-01-02'), 'day')).toEqual([
      2, 3, 4,
    ]);
    expect(unmadeIndexes(days, days, null, 'day')).toEqual([0, 1, 2, 3, 4]);
  });

  it('by week: a week is made once all its days are', () => {
    // Starts on a Thursday: a short first week, then a whole one, then two days
    const days = range('2026-01-01', 13);
    const weeks = [day('2026-01-01'), day('2026-01-04'), day('2026-01-11')];
    expect(unmadeIndexes(weeks, days, iso('2026-01-02'), 'week')).toEqual([
      0, 1, 2,
    ]);
    expect(unmadeIndexes(weeks, days, iso('2026-01-03'), 'week')).toEqual([
      1, 2,
    ]);
    expect(unmadeIndexes(weeks, days, iso('2026-01-10'), 'week')).toEqual([2]);
    expect(unmadeIndexes(weeks, days, iso('2026-01-13'), 'week')).toEqual([]);
  });
});

describe('madeThroughOf', () => {
  it('takes only days', () => {
    expect(madeThroughOf('2026-03-12')).toBe('2026-03-12');
    expect(madeThroughOf('Mar 12')).toBeNull();
    expect(madeThroughOf(null)).toBeNull();
  });
});

describe('shortDay', () => {
  it('leaves out this year', () =>
    expect(shortDay(iso('2026-03-12'), 2026)).not.toMatch(/2026/));
  it('says another year', () =>
    expect(shortDay(iso('2025-03-12'), 2026)).toMatch(/2025/));
});

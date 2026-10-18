import { describe, expect, it } from 'vitest';
import type {
  TISO8601DateString,
  WeatherDay,
} from '#lib/types/weather-types.js';
import {
  applyChanges,
  compareDays,
  daysFrom,
  earlyDaysIn,
  fetchedThroughNow,
  lastDayWithValues,
  mergeNewDays,
  newDaysRange,
  settledEarlyDays,
  updateDeclined,
  type DayKey,
} from './weather-days';

const v = (metric: number | null) => ({
  metric,
  imperial: metric === null ? null : metric * 2,
});

const day = (
  iso: string,
  tmax: number | null,
  { location = 0, prcp = tmax === null ? null : 0 } = {},
): WeatherDay => ({
  location,
  date: new Date(`${iso}T00:00:00Z`),
  tmax: v(tmax),
  tavg: v(tmax === null ? null : tmax - 5),
  tmin: v(tmax === null ? null : tmax - 10),
  prcp: v(prcp),
  snow: v(tmax === null ? null : 0),
  dayt: v(600),
  moon: 1,
});

const iso = (s: string) => s as TISO8601DateString;

describe('dates', () => {
  it('counts days with both ends included', () => {
    expect(daysFrom(iso('2026-01-01'), iso('2026-01-01'))).toBe(1);
    expect(daysFrom(iso('2026-02-27'), iso('2026-03-01'))).toBe(3);
    expect(daysFrom(iso('2026-01-02'), iso('2026-01-01'))).toBe(0);
  });
});

describe('lastDayWithValues', () => {
  it('skips the blanks left for days not yet in the past', () => {
    const days = [
      day('2026-01-01', 3),
      day('2026-01-02', 4),
      day('2026-01-03', null),
      day('2026-01-02', 9, { location: 1 }),
    ];
    expect(lastDayWithValues(days, 0)).toBe('2026-01-02');
    expect(lastDayWithValues(days, 1)).toBe('2026-01-02');
    expect(lastDayWithValues(days, 2)).toBeNull();
  });
});

describe('fetchedThroughNow', () => {
  it('ends at the To date, or the day before today', () => {
    const today = iso('2026-10-18');
    expect(
      fetchedThroughNow({
        to: iso('2026-12-31'),
        source: 'Open-Meteo',
        today,
        todayUTC: today,
      }),
    ).toBe('2026-10-17');
    expect(
      fetchedThroughNow({
        to: iso('2026-03-31'),
        source: 'Open-Meteo',
        today,
        todayUTC: today,
      }),
    ).toBe('2026-03-31');
  });

  it("ends a day sooner for Meteostat when UTC's today is behind", () => {
    expect(
      fetchedThroughNow({
        to: iso('2026-12-31'),
        source: 'Meteostat',
        today: iso('2026-10-18'),
        todayUTC: iso('2026-10-17'),
      }),
    ).toBe('2026-10-16');
  });
});

describe('newDaysRange', () => {
  const today = iso('2026-10-18');
  it('runs from the day after the last one got to yesterday', () => {
    expect(
      newDaysRange({
        from: iso('2026-01-01'),
        to: iso('2026-12-31'),
        fetchedThrough: iso('2026-10-14'),
        today,
      }),
    ).toEqual({ from: '2026-10-15', to: '2026-10-17', days: 3 });
  });

  it('is nothing once caught up or finished', () => {
    expect(
      newDaysRange({
        from: iso('2026-01-01'),
        to: iso('2026-12-31'),
        fetchedThrough: iso('2026-10-17'),
        today,
      }),
    ).toBeNull();
    expect(
      newDaysRange({
        from: iso('2025-01-01'),
        to: iso('2025-12-31'),
        fetchedThrough: iso('2025-12-31'),
        today,
      }),
    ).toBeNull();
  });

  it('is every day so far when none were got', () => {
    expect(
      newDaysRange({
        from: iso('2026-10-10'),
        to: iso('2026-12-31'),
        fetchedThrough: null,
        today,
      }),
    ).toEqual({ from: '2026-10-10', to: '2026-10-17', days: 8 });
  });
});

describe('mergeNewDays', () => {
  it('fills the blank days and adds the rest, in order', () => {
    const merged = mergeNewDays(
      [day('2026-01-01', 1), day('2026-01-02', null)],
      [day('2026-01-02', 2), day('2026-01-03', 3)],
    );
    expect(merged.map((d) => d.tmax.metric)).toEqual([1, 2, 3]);
  });
});

describe('compareDays', () => {
  const saved = [
    day('2026-01-01', 1),
    day('2026-01-02', 2),
    day('2026-01-03', null),
  ];
  const fetchedThrough = [iso('2026-01-02')];

  it('lists saved days whose values changed, not new ones', () => {
    const got = [
      day('2026-01-01', 1),
      day('2026-01-02', 5),
      day('2026-01-03', 7),
    ];
    const changes = compareDays({ saved, got, fetchedThrough });
    expect(changes).toHaveLength(1);
    expect(changes[0].key).toBe('0|2026-01-02');
    expect(changes[0].changes.map((c) => c.param)).toEqual([
      'tmax',
      'tavg',
      'tmin',
    ]);
  });

  it('lists a day the source no longer has as no data', () => {
    const changes = compareDays({
      saved,
      got: [day('2026-01-02', 2)],
      fetchedThrough,
    });
    expect(changes[0].key).toBe('0|2026-01-01');
    expect(changes[0].changes[0]).toEqual({
      param: 'tmax',
      saved: 1,
      got: null,
    });
  });

  it('compares only the chosen values', () => {
    const got = [day('2026-01-01', 1, { prcp: 4 }), day('2026-01-02', 2)];
    expect(
      compareDays({ saved, got, fetchedThrough, params: ['tmax'] }),
    ).toEqual([]);
    expect(compareDays({ saved, got, fetchedThrough })).toHaveLength(1);
  });

  it("doesn't ask again about a value kept over the same newer one", () => {
    const got = [day('2026-01-01', 1), day('2026-01-02', 5)];
    const first = compareDays({ saved, got, fetchedThrough });
    const declined = updateDeclined({}, first, new Set());
    expect(compareDays({ saved, got, fetchedThrough, declined })).toEqual([]);
    expect(
      compareDays({ saved, got, fetchedThrough, declined, askEveryTime: true }),
    ).toHaveLength(1);
    // Changed again: asked again
    const again = [day('2026-01-01', 1), day('2026-01-02', 6)];
    expect(
      compareDays({ saved, got: again, fetchedThrough, declined }),
    ).toHaveLength(1);
  });
});

describe('applyChanges', () => {
  it('uses every value of the chosen days, keeping daytime and moon', () => {
    const saved = [day('2026-01-01', 1), day('2026-01-02', 2)];
    const got = [day('2026-01-01', 8), day('2026-01-02', 9)];
    const result = applyChanges(saved, got, new Set<DayKey>(['0|2026-01-02']));
    expect(result.map((d) => d.tmax.metric)).toEqual([1, 9]);
    expect(result[1].tmax.imperial).toBe(18);
    expect(result[1].dayt).toEqual(saved[1].dayt);
  });

  it('forgets a used day’s kept values', () => {
    const changes = compareDays({
      saved: [day('2026-01-01', 1)],
      got: [day('2026-01-01', 2)],
      fetchedThrough: [iso('2026-01-01')],
    });
    const declined = updateDeclined({}, changes, new Set());
    expect(declined['0|2026-01-01']?.tmax).toBe(2);
    expect(
      updateDeclined(declined, changes, new Set<DayKey>(['0|2026-01-01'])),
    ).toEqual({});
  });
});

describe('early days', () => {
  const source = () => 'Open-Meteo' as const;
  it('marks days got within the source’s early days', () => {
    const early = earlyDaysIn(
      [day('2026-10-12', 1), day('2026-10-13', 1), day('2026-10-17', 1)],
      iso('2026-10-18'),
      source,
    );
    expect(Object.keys(early)).toEqual(['0|2026-10-13', '0|2026-10-17']);
  });

  it('says which have settled since', () => {
    const early = {
      '0|2026-10-13': iso('2026-10-18'),
      '0|2026-10-17': iso('2026-10-18'),
    } as const;
    expect(settledEarlyDays(early, iso('2026-10-19'), source)).toEqual([
      '0|2026-10-13',
    ]);
  });
});

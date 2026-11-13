// Months must come out the same in every timezone. East of UTC, dates built
// from local parts but read with getUTC* land a day early, so pin one.
process.env.TZ = 'Pacific/Auckland';

import { describe, expect, it } from 'vitest';
import { weatherMonthsData } from './preview-utils.svelte.js';
import type { WeatherDay } from '#lib/types/weather-types.js';

const day = (iso: string) =>
  ({
    date: new Date(`${iso}T00:00:00Z`),
    location: 0,
  }) as unknown as WeatherDay;

describe('weatherMonthsData east of UTC', () => {
  it('gives every month its full length and real first weekday', () => {
    const months = weatherMonthsData({
      weatherData: [day('2026-02-01'), day('2026-02-15'), day('2026-03-01')],
    });
    expect(
      months.map(({ year, month, days, start }) => ({
        year,
        month,
        days,
        start,
      })),
    ).toEqual([
      { year: 2026, month: 1, days: 28, start: 0 }, // Feb 2026 starts Sunday
      { year: 2026, month: 2, days: 31, start: 0 }, // Mar 2026 starts Sunday
    ]);
  });
});

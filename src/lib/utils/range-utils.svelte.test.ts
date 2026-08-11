// Copyright (c) 2024 - 2026, Thomas (https://github.com/jdvlpr)
//
// This file is part of Temperature-Blanket-Web-App.
//
// Temperature-Blanket-Web-App is free software: you can redistribute it and/or modify it
// under the terms of the GNU General Public License as published by the Free Software Foundation,
// either version 3 of the License, or (at your option) any later version.
//
// Temperature-Blanket-Web-App is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY;
// without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.
// See the GNU General Public License for more details.
//
// You should have received a copy of the GNU General Public License along with Temperature-Blanket-Web-App.
// If not, see <https://www.gnu.org/licenses/>.

import type { WeatherDay } from '$lib/types/weather-types';
import { describe, expect, it } from 'vitest';
import { getEvenlyDistributedRangeValuesWithEqualDayCount } from './range-utils.svelte';

function day(tmin: number, tmax: number): WeatherDay {
  const pair = (n: number) => ({ metric: n, imperial: n });
  return {
    location: 0,
    date: new Date('2026-01-01'),
    tavg: pair((tmin + tmax) / 2),
    tmin: pair(tmin),
    tmax: pair(tmax),
    prcp: pair(0),
    snow: pair(0),
    dayt: pair(0),
  } as WeatherDay;
}

describe('getEvenlyDistributedRangeValuesWithEqualDayCount', () => {
  // Regression: with no weather data `Math.max(...[])`/`Math.min(...[])` are ∓Infinity,
  // so `currentFrom`/`currentTo` both became -Infinity and the loop that nudges them
  // apart spun forever — hanging `pnpm build` during prerendering, because gauge state
  // is constructed at module-evaluation time.
  it('returns no ranges when there is no weather data, instead of hanging', () => {
    const ranges = getEvenlyDistributedRangeValuesWithEqualDayCount({
      weatherData: [],
      numRanges: 10,
      prop: 'tmax',
      gaugeDirection: 'high-to-low',
      roundIncrement: true,
      includeFrom: true,
      includeTo: false,
    });

    expect(ranges).toEqual([]);
  });

  it('returns no ranges when every day is missing the requested value', () => {
    const missing = { ...day(0, 10), tmax: { metric: null, imperial: null } };

    const ranges = getEvenlyDistributedRangeValuesWithEqualDayCount({
      weatherData: [missing as WeatherDay],
      numRanges: 4,
      prop: 'tmax',
      gaugeDirection: 'high-to-low',
      roundIncrement: true,
      includeFrom: true,
      includeTo: false,
    });

    expect(ranges).toEqual([]);
  });

  it('produces one finite, non-empty range per requested range for real data', () => {
    const weatherData = Array.from({ length: 30 }, (_, i) => day(i, i + 10));

    const ranges = getEvenlyDistributedRangeValuesWithEqualDayCount({
      weatherData,
      numRanges: 5,
      prop: 'tmax',
      gaugeDirection: 'high-to-low',
      roundIncrement: true,
      includeFrom: true,
      includeTo: false,
    });

    expect(ranges).toHaveLength(5);
    for (const range of ranges) {
      expect(Number.isFinite(range.from)).toBe(true);
      expect(Number.isFinite(range.to)).toBe(true);
      expect(range.from).not.toBe(range.to);
    }
  });

  it('terminates when there are more ranges than days of weather', () => {
    const weatherData = [day(0, 10), day(1, 11)];

    const ranges = getEvenlyDistributedRangeValuesWithEqualDayCount({
      weatherData,
      numRanges: 8,
      prop: 'tmax',
      gaugeDirection: 'high-to-low',
      roundIncrement: true,
      includeFrom: true,
      includeTo: false,
    });

    expect(ranges).toHaveLength(8);
  });
});

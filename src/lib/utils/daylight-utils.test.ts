import { describe, expect, it } from 'vitest';
import { daylightHours, solarNoonOf } from './daylight-utils.js';

// Weather days are dates at midnight UTC
const day = (iso: string) => new Date(`${iso}T00:00:00Z`);
const minutes = (hours: number | null) =>
  hours === null ? null : Math.round(hours * 60 * 10) / 10;

describe('solarNoonOf', () => {
  it('is noon UTC less the longitude, on the same date', () => {
    expect(solarNoonOf(day('2025-01-01'), 0).toISOString()).toBe(
      '2025-01-01T12:00:00.000Z',
    );
    expect(solarNoonOf(day('2025-01-01'), -150).toISOString()).toBe(
      '2025-01-01T22:00:00.000Z',
    );
    expect(solarNoonOf(day('2025-01-01'), 180).toISOString()).toBe(
      '2025-01-01T00:00:00.000Z',
    );
  });
});

// Unmocked: SunCalc 2.0.2 took midnight UTC as the day before from Greenwich
// westward. Expected values are each day's own (as SunCalc 2.0.0 gave them).
describe('daylightHours', () => {
  it.each([
    ['Anchorage', 61.218, -149.9, '2025-01-01', 340.4],
    ['Anchorage', 61.218, -149.9, '2025-03-20', 736.9],
    ['Honolulu', 21.3, -157.9, '2025-01-01', 652.2],
    ['London', 51.5, 0, '2025-03-20', 731.1],
    ['Chicago', 41.88, -87.63, '2025-03-20', 729.9],
    ['Sydney', -33.87, 151.2, '2025-01-01', 861.8],
    ['Auckland', -36.85, 174.8, '2025-03-20', 729.0],
  ])('%s on %s', (_, lat, lng, iso, expected) => {
    expect(minutes(daylightHours(day(iso), lat, lng))).toBe(expected);
  });

  it('is null when the sun never sets or rises', () => {
    expect(daylightHours(day('2025-06-21'), 80, 15)).toBeNull();
    expect(daylightHours(day('2025-12-21'), 80, 15)).toBeNull();
  });
});

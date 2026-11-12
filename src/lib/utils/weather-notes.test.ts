import { describe, expect, it } from 'vitest';
import { missingLines, noticeLabel } from './weather-notes';

const none = { tmin: 0, tavg: 0, tmax: 0, prcp: 0, snow: 0 };

describe('missingLines', () => {
  it('says nothing when nothing is missing', () => {
    expect(missingLines(none, 10)).toEqual([]);
  });

  it('joins every value missing on as many days into one line', () => {
    expect(
      missingLines({ tmin: 3, tavg: 3, tmax: 3, prcp: 3, snow: 3 }, 10),
    ).toEqual(['3 days are missing temperatures, rain and snow.']);
    expect(missingLines({ ...none, tmin: 3, tavg: 3, tmax: 3 }, 10)).toEqual([
      '3 days are missing temperatures.',
    ]);
  });

  it('gives each number of days its own line', () => {
    expect(
      missingLines({ tmin: 2, tavg: 0, tmax: 2, prcp: 5, snow: 1 }, 10),
    ).toEqual([
      '2 days are missing low and high temperatures.',
      '5 days are missing rain.',
      '1 day is missing snow.',
    ]);
  });

  it('says when no day has a value, in weeks too', () => {
    expect(
      missingLines({ ...none, tmax: 1, prcp: 4, snow: 4 }, 4, 'week'),
    ).toEqual([
      '1 week is missing high temperature.',
      'No weeks have rain or snow data.',
    ]);
  });
});

describe('noticeLabel', () => {
  it('names both, either alone', () => {
    expect(noticeLabel({ missing: 3, recent: 5 })).toBe(
      '3 days missing values · 5 recent days may still change',
    );
    expect(noticeLabel({ missing: 1, recent: 0, unit: 'week' })).toBe(
      '1 week missing values',
    );
    expect(noticeLabel({ missing: 0, recent: 1 })).toBe(
      '1 recent day may still change',
    );
  });
});

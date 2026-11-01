import { describe, expect, it } from 'vitest';
import type { WeatherDay } from '#lib/types/weather-types.js';
import {
  applyChanges,
  displayValue,
  fillGaps,
  normalizeDate,
  parseClipboard,
  parseInput,
  placePaste,
  readImportedRows,
  valueInBothUnits,
  type EditRow,
} from './weather-edits.js';

describe('parseInput', () => {
  it('reads a temperature in either units', () => {
    expect(parseInput('tmax', '20', 'metric')).toEqual({
      metric: 20,
      imperial: 68,
    });
    expect(parseInput('tmax', '68 °F', 'imperial')).toEqual({
      metric: 20,
      imperial: 68,
    });
  });

  it('reads a decimal comma', () => {
    expect(parseInput('prcp', '12,7', 'metric')).toEqual({
      metric: 12.7,
      imperial: 0.5,
    });
  });

  it('reads empty as missing and refuses what is not a number', () => {
    expect(parseInput('tmin', ' ', 'metric')).toEqual({
      metric: null,
      imperial: null,
    });
    expect(parseInput('tmin', '-', 'metric')).toEqual({
      metric: null,
      imperial: null,
    });
    expect(parseInput('tmin', 'warm', 'metric')).toBeNull();
    expect(parseInput('prcp', '-3', 'metric')).toBeNull();
  });

  it('reads daytime as hours:minutes or hours', () => {
    expect(parseInput('dayt', '08:12', 'metric')).toEqual({
      metric: 492,
      imperial: 8.2,
    });
    expect(parseInput('dayt', '10.5', 'imperial')).toEqual({
      metric: 630,
      imperial: 10.5,
    });
    expect(parseInput('dayt', '8:75', 'metric')).toBeNull();
    expect(parseInput('dayt', '25', 'metric')).toBeNull();
  });
});

describe('displayValue', () => {
  it('shows daytime as HH:MM in both units', () => {
    expect(displayValue('dayt', { metric: 492, imperial: 8.2 }, 'metric')).toBe(
      '08:12',
    );
    expect(
      displayValue('dayt', { metric: 491.99, imperial: null }, 'metric'),
    ).toBe('08:12');
  });

  it('shows a missing value as empty', () => {
    expect(
      displayValue('tmax', valueInBothUnits('tmax', null, 'metric'), 'metric'),
    ).toBe('');
  });
});

describe('parseClipboard', () => {
  it('splits a spreadsheet block by tabs', () => {
    expect(parseClipboard('1\t2\r\n3\t4\n')).toEqual([
      ['1', '2'],
      ['3', '4'],
    ]);
  });

  it('keeps a decimal comma as one value', () => {
    expect(parseClipboard('12,5')).toEqual([['12,5']]);
    expect(parseClipboard('1,2,3')).toEqual([['1', '2', '3']]);
  });
});

describe('normalizeDate', () => {
  it('pads and accepts slashes', () => {
    expect(normalizeDate('2026/3/9')).toBe('2026-03-09');
    expect(normalizeDate('March 9')).toBeNull();
  });
});

const rows: EditRow[] = [
  { date: '2026-01-01', location: 0 },
  { date: '2026-01-01', location: 1 },
  { date: '2026-01-02', location: 0 },
  { date: '2026-01-02', location: 1 },
];
const base = {
  rows,
  columns: 3,
  anchor: { row: 0, column: 1 },
  selection: {
    rows: [0, 0] as [number, number],
    columns: [1, 1] as [number, number],
  },
  locations: 2,
};

describe('placePaste', () => {
  it('fills from the anchor, leaving out what falls off the grid', () => {
    expect(
      placePaste(
        [
          ['1', '2', '3'],
          ['4', '5', '6'],
        ],
        base,
      ),
    ).toEqual([
      { row: 0, column: 1, text: '1' },
      { row: 0, column: 2, text: '2' },
      { row: 1, column: 1, text: '4' },
      { row: 1, column: 2, text: '5' },
    ]);
  });

  it('fills every selected cell with one value', () => {
    expect(
      placePaste([['7']], {
        ...base,
        selection: { rows: [0, 1], columns: [0, 1] },
      }),
    ).toHaveLength(4);
  });

  it('matches dated rows by date at the anchor location, skipping headings', () => {
    expect(
      placePaste(
        [
          ['Date', 'High'],
          ['2026-01-02', '9'],
          ['2025-12-31', '8'],
        ],
        { ...base, anchor: { row: 1, column: 0 } },
      ),
    ).toEqual([{ row: 3, column: 0, text: '9' }]);
  });

  it('reads a location index column with more than one location', () => {
    expect(
      placePaste([['2026-01-02', '0', '5']], {
        ...base,
        anchor: { row: 1, column: 0 },
      }),
    ).toEqual([{ row: 2, column: 0, text: '5' }]);
  });
});

describe('fillGaps', () => {
  it('draws a straight line across a gap and copies at the ends', () => {
    expect(fillGaps([null, 2, null, null, 8, null])).toEqual([
      2, 2, 4, 6, 8, 8,
    ]);
  });

  it('leaves a column with no values empty', () => {
    expect(fillGaps([null, null])).toEqual([null, null]);
  });
});

const day = (date: string, tmax: number | null): WeatherDay =>
  ({
    location: 0,
    date: new Date(date),
    tmax: { metric: tmax, imperial: tmax === null ? null : 32 },
  }) as unknown as WeatherDay;

describe('applyChanges', () => {
  it('puts changes in place and takes them back', () => {
    const days = [day('2026-01-01', 0)];
    const change = {
      index: 0,
      param: 'tmax' as const,
      before: { metric: 0, imperial: 32 },
      after: { metric: 10, imperial: 50 },
    };
    applyChanges(days, [change], 'after');
    expect(days[0].tmax).toEqual({ metric: 10, imperial: 50 });
    applyChanges(days, [change], 'before');
    expect(days[0].tmax).toEqual({ metric: 0, imperial: 32 });
  });
});

describe('readImportedRows', () => {
  it('reads values by date and location, with a message for each row it skips', () => {
    const { values, errors, matchedDays } = readImportedRows(
      [
        {
          Date: '2026-01-02',
          'Location Index': '1',
          'High Temperature (°F)': '50',
          'Daytime (h:m)': '09:30',
        },
        { Date: '2027-01-01', 'Location Index': '0' },
        { Date: '', 'Location Index': '0' },
        { Date: '2026-01-01', 'Location Index': '' },
        {},
      ],
      rows,
    );
    expect(values).toEqual([
      { row: 3, param: 'tmax', value: { metric: 10, imperial: 50 } },
      { row: 3, param: 'dayt', value: { metric: 570, imperial: 9.5 } },
    ]);
    expect(matchedDays).toBe(1);
    expect(errors).toEqual([
      "Row 3 not imported: Date out of this project's range. (2027-01-01)",
      'Row 4 not imported: Missing or invalid Date.',
      'Row 5 not imported: Missing or invalid Location Index.',
    ]);
  });
});

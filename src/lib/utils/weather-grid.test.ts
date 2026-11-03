import { describe, expect, it } from 'vitest';
import {
  applyFilters,
  atLeastLabel,
  chipsOf,
  colorChanges,
  colorChipLabel,
  colorLine,
  compareCells,
  dateRangeLabel,
  differenceText,
  inDateRange,
  rowForDate,
  sortRows,
  type GridFilter,
} from './weather-grid';

type Row = { date: string; high: number | null; made: boolean };

const rows: Row[] = [
  { date: '2026-01-01', high: 3, made: true },
  { date: '2026-01-02', high: null, made: true },
  { date: '2026-01-03', high: 7, made: false },
];

const filters: GridFilter<Row>[] = [
  { id: 'missing', label: 'Missing', matches: (r) => r.high === null, counted: true },
  { id: 'made', label: 'Made', matches: (r) => r.made, counted: true },
  { id: 'never', label: 'Never', matches: () => false, counted: true },
  {
    id: 'dates',
    label: 'Dates',
    matches: (r) => inDateRange(r.date, '2026-01-02', ''),
    available: true,
    setting: true,
  },
];

describe('chipsOf', () => {
  it('offers the filters that match a day, with counts', () => {
    const chips = chipsOf(rows, filters, new Set());
    expect(chips.map((c) => [c.id, c.count])).toEqual([
      ['missing', 1],
      ['made', 2],
      ['dates', 2],
    ]);
  });

  it('keeps a filter that is on though nothing matches', () => {
    const chips = chipsOf(rows, filters, new Set(['never']));
    expect(chips.find((c) => c.id === 'never')).toMatchObject({
      on: true,
      count: 0,
    });
  });

  it('offers a filter with a setting even when its count is 0', () => {
    const none = chipsOf(
      [],
      filters.filter((f) => f.id === 'dates'),
      new Set(),
    );
    expect(none.map((c) => c.id)).toEqual(['dates']);
  });
});

describe('applyFilters', () => {
  it('keeps every row with nothing on', () => {
    expect(applyFilters(rows, filters, new Set())).toHaveLength(3);
  });

  it('keeps the rows every filter that is on matches', () => {
    expect(
      applyFilters(rows, filters, new Set(['made', 'dates'])).map(
        (r) => r.date,
      ),
    ).toEqual(['2026-01-02']);
  });
});

describe('labels', () => {
  const oneYear = { first: '2026-01-01', last: '2026-12-31' };
  it('names a date range', () => {
    expect(dateRangeLabel('2026-01-01', '2026-03-31', oneYear)).toBe(
      'Jan 1 – Mar 31',
    );
    expect(dateRangeLabel('2026-01-01', '', oneYear)).toBe('From Jan 1');
    expect(dateRangeLabel('', '2026-03-31', oneYear)).toBe('Through Mar 31');
    expect(dateRangeLabel('2026-02-02', '2026-02-02', oneYear)).toBe('Feb 2');
  });

  it('adds years when the days span more than one', () => {
    expect(
      dateRangeLabel('2025-12-20', '2026-01-04', {
        first: '2025-12-01',
        last: '2026-02-01',
      }),
    ).toBe('Dec 20, 2025 – Jan 4, 2026');
  });

  it('names a change-size and a color chip', () => {
    expect(atLeastLabel('Temp changed', 1, '°C')).toBe('Temp changed ≥ 1°C');
    expect(atLeastLabel('Rain/snow changed', 0.04, 'in')).toBe(
      'Rain/snow changed ≥ 0.04 in',
    );
    expect(colorChipLabel('High', 2)).toBe('High · Color 3');
    expect(colorChipLabel(null, 0)).toBe('Color 1');
  });
});

describe('colorLine', () => {
  const color = (index: number) => ({ index, gaugeLength: 8 });
  it('says the color', () => {
    expect(colorLine(color(2))).toBe('Color 3');
    expect(colorLine('outside')).toBe('No color');
    expect(colorLine(null)).toBe('No color');
  });

  it('says how it changes', () => {
    expect(colorLine(color(2), color(1))).toBe('Color 2 → 3');
    expect(colorLine(color(2), color(2))).toBe('Color 3');
    expect(colorLine('outside', color(0))).toBe('Color 1 → none');
  });

  it('knows when a color changes', () => {
    expect(colorChanges(color(1), color(1))).toBe(false);
    expect(colorChanges(color(1), color(2))).toBe(true);
    expect(colorChanges('outside', null)).toBe(false);
  });
});

describe('differenceText', () => {
  it('is signed and as precise as the values', () => {
    expect(differenceText(11.9, 12.4)).toBe('+0.5');
    expect(differenceText(3, 1)).toBe('−2');
    expect(differenceText(3, 3)).toBe('');
    expect(differenceText(null, 3)).toBe('');
  });
});

describe('sorting', () => {
  it('puts missing values last either way', () => {
    const values = [3, null, 7, '-', 1];
    const sorted = (direction: 'ascending' | 'descending') =>
      [...values].sort((a, b) => compareCells(a, b, direction));
    expect(sorted('ascending')).toEqual([1, 3, 7, null, '-']);
    expect(sorted('descending')).toEqual([7, 3, 1, null, '-']);
  });

  it('sorts rows stably', () => {
    const list = [
      { id: 'a', v: 2 },
      { id: 'b', v: 1 },
      { id: 'c', v: 2 },
    ];
    expect(
      sortRows(list, (r) => r.v, 'descending').map((r) => r.id),
    ).toEqual(['a', 'c', 'b']);
    expect(sortRows(list, null, 'ascending')).toEqual(list);
  });

  it('compares times and dates as text', () => {
    expect(compareCells('09:30', '10:05')).toBeLessThan(0);
    expect(compareCells('2026-01-10', '2026-01-02')).toBeGreaterThan(0);
  });
});

describe('rowForDate', () => {
  const dates = ['2026-01-01', '2026-01-08', '2026-01-15'];
  it('finds the day, or the week it is in', () => {
    expect(rowForDate(dates, '2026-01-08')).toBe(1);
    expect(rowForDate(dates, '2026-01-10')).toBe(1);
    expect(rowForDate(dates, '2026-02-01')).toBe(2);
  });

  it('goes to the earliest before them all, and works in any order', () => {
    expect(rowForDate(dates, '2025-12-01')).toBe(0);
    expect(rowForDate([...dates].reverse(), '2026-01-10')).toBe(1);
    expect(rowForDate([], '2026-01-10')).toBe(-1);
  });
});

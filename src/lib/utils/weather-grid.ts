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

/**
 * The weather grid's pure logic (components/weather-grid/): filters as chips,
 * sorting, and the words under a value. Every weather table (the Weather
 * tab, a range's days, View All Changes, Edit Weather Data, the Daytime Rows
 * stitch table) uses these, so a filter has one name and one way of working
 * everywhere.
 */

// ***************
// Filters
// ***************

/** A filter a grid offers, as a chip */
export type GridFilter<Row> = {
  id: string;
  /** Its chip's words, with its setting when it has one ("Temp changed ≥ 1°C") */
  label: string;
  matches: (row: Row) => boolean;
  /** Whether it's offered though its count says nothing (one with a
   * setting: whether it could match any day); else when it matches one */
  available?: boolean;
  /** Its chip shows how many days it alone matches */
  counted?: boolean;
  /** It has a setting, changed in its chip's popover */
  setting?: boolean;
};

/** A filter, as GridToolbar shows it */
export type GridChip = {
  id: string;
  label: string;
  count: number;
  counted: boolean;
  setting: boolean;
  on: boolean;
};

/**
 * The chips to show: each filter that matches a day (or, with a setting,
 * could), and any that's on, with how many days it alone matches
 */
export function chipsOf<Row>(
  rows: readonly Row[],
  filters: readonly GridFilter<Row>[],
  on: ReadonlySet<string>,
): GridChip[] {
  return filters
    .map((filter) => {
      const count = rows.reduce((n, row) => n + +filter.matches(row), 0);
      return {
        id: filter.id,
        label: filter.label,
        count,
        counted: !!filter.counted,
        setting: !!filter.setting,
        on: on.has(filter.id),
        offered: filter.available ?? count > 0,
      };
    })
    .filter((chip) => chip.offered || chip.on)
    .map(({ offered: _offered, ...chip }) => chip);
}

/** The rows every filter that's on matches */
export function applyFilters<Row>(
  rows: readonly Row[],
  filters: readonly GridFilter<Row>[],
  on: ReadonlySet<string>,
): Row[] {
  const active = filters.filter((filter) => on.has(filter.id));
  if (!active.length) return [...rows];
  return rows.filter((row) => active.every((filter) => filter.matches(row)));
}

// ***************
// Filter words, the same in every table
// ***************

/** Chip names shared by the tables */
export const CHIP = {
  missing: 'Missing',
  made: 'Made',
  notMade: 'Not made',
  mayChange: 'May change',
  edited: 'Edited',
  kept: 'Kept',
  newColor: 'New color',
  settled: 'Now settled',
  wasMissing: 'Was missing',
  nowMissing: 'Now missing',
} as const;

const utcDate = (iso: string, options: Intl.DateTimeFormatOptions) =>
  new Date(`${iso}T00:00:00Z`).toLocaleDateString('en-US', {
    timeZone: 'UTC',
    ...options,
  });

/**
 * A date range chip's words: "Jan 1 – Mar 31", with years when the days
 * offered span more than one ("Dec 20, 2025 – Jan 4, 2026"); "From Jan 1" or
 * "Through Mar 31" with one end open, "Dates" with neither
 */
export function dateRangeLabel(
  from: string,
  to: string,
  span: { first: string; last: string },
): string {
  const years = span.first.slice(0, 4) !== span.last.slice(0, 4);
  const show = (iso: string) =>
    utcDate(iso, {
      month: 'short',
      day: 'numeric',
      ...(years && { year: 'numeric' }),
    });
  if (from && to)
    return from === to ? show(from) : `${show(from)} – ${show(to)}`;
  if (from) return `From ${show(from)}`;
  if (to) return `Through ${show(to)}`;
  return 'Dates';
}

/** Whether an ISO date is in a range whose ends may be open ('') */
export const inDateRange = (date: string, from: string, to: string) =>
  (!from || date >= from) && (!to || date <= to);

/** A change-size chip's words: "Temp changed ≥ 1°C" */
export const atLeastLabel = (name: string, amount: number, unit: string) =>
  `${name} ≥ ${amount}${unit.startsWith('°') ? '' : ' '}${unit}`;

/** A color chip's words: "High · Color 3", "Color 3" when it's any value */
export const colorChipLabel = (valueLabel: string | null, index: number) =>
  `${valueLabel ? `${valueLabel} · ` : ''}Color ${index + 1}`;

// ***************
// Under a value
// ***************

/** A value's color, as a grid shows it: a gauge's color (its place in the
 * gauge as `index`), `'outside'` for a value the gauge has but in none of
 * its ranges, or null with no gauge or no value */
export type GridColor<C = unknown> =
  (C & { index: number; gaugeLength: number | undefined }) | 'outside' | null;

/** The line under a value with Show Colors on: "Color 3", "Color 2 → 3"
 * when it changes, "No color" for none */
export function colorLine(now: GridColor, was?: GridColor): string {
  const name = (color: GridColor) =>
    color && color !== 'outside' ? `${color.index + 1}` : null;
  const nowName = name(now);
  if (was !== undefined) {
    const wasName = name(was);
    if (wasName !== nowName)
      return `Color ${wasName ?? 'none'} → ${nowName ?? 'none'}`;
  }
  return nowName ? `Color ${nowName}` : 'No color';
}

/** Whether a value's color changes */
export const colorChanges = (now: GridColor, was: GridColor) =>
  (now && now !== 'outside' ? now.index : null) !==
  (was && was !== 'outside' ? was.index : null);

/** How much a value changed, signed, as precise as the values: "+6.84", "−2" */
export function differenceText(from: number | null, to: number | null): string {
  if (from === null || to === null) return '';
  const places = Math.max(
    ...[from, to].map((n) => `${n}`.split('.')[1]?.length ?? 0),
  );
  const diff = +(to - from).toFixed(places);
  return diff ? `${diff > 0 ? '+' : '−'}${Math.abs(diff)}` : '';
}

// ***************
// Sorting
// ***************

export type SortDirection = 'ascending' | 'descending';

/**
 * Compares two cells' values for sorting: numbers (and ISO dates, as
 * strings) in order, missing ones (null, '', '-', '–', '—') always last
 * whichever way
 */
export function compareCells(
  a: number | string | null | undefined,
  b: number | string | null | undefined,
  direction: SortDirection = 'ascending',
): number {
  const missing = (v: unknown) =>
    v === null ||
    v === undefined ||
    v === '' ||
    v === '-' ||
    v === '–' ||
    v === '—';
  if (missing(a) && missing(b)) return 0;
  if (missing(a)) return 1;
  if (missing(b)) return -1;
  const order =
    typeof a === 'number' && typeof b === 'number'
      ? a - b
      : `${a}`.localeCompare(`${b}`, undefined, { numeric: true });
  return direction === 'ascending' ? order : -order;
}

/** Rows sorted by a value (a stable sort: equal ones keep their order) */
export function sortRows<Row>(
  rows: readonly Row[],
  valueOf: ((row: Row) => number | string | null | undefined) | null,
  direction: SortDirection,
): Row[] {
  if (!valueOf) return [...rows];
  return rows
    .map((row, index) => ({ row, index, value: valueOf(row) }))
    .sort(
      (a, b) => compareCells(a.value, b.value, direction) || a.index - b.index,
    )
    .map(({ row }) => row);
}

/**
 * The row to go to for a date (rows in any order): the first on it, else
 * the latest before it (a week's row starts on or before its days), else
 * the earliest; -1 with none
 */
export function rowForDate(dates: readonly string[], date: string): number {
  if (!dates.length || !date) return -1;
  const exact = dates.indexOf(date);
  if (exact >= 0) return exact;
  let before = -1;
  let earliest = 0;
  dates.forEach((d, i) => {
    if (d < date && (before < 0 || d > dates[before])) before = i;
    if (d < dates[earliest]) earliest = i;
  });
  return before >= 0 ? before : earliest;
}

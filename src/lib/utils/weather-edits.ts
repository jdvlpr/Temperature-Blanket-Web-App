// Copyright (c) 2026, Thomas (https://github.com/jdvlpr)
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

// Pure logic for Edit Weather Data (modals/EditWeather.svelte): reading what
// was typed or pasted into a value in both units, matching pasted blocks and
// CSV files to days, filling gaps, and the changes an Apply makes (kept by
// state/weather-edits.svelte.ts for Undo and Redo).

import { WEATHER_DATA_DECIMALS } from '#lib/constants/weather-constants.js';
import type { Unit, WeatherDay } from '#lib/types/weather-types.js';
import { displayNumber } from '#lib/utils/number-utils.js';

/** The values that can be edited (the moon phase is worked out from the date) */
export const EDITABLE_PARAMS = [
  'tmax',
  'tavg',
  'tmin',
  'prcp',
  'snow',
  'dayt',
] as const;
export type EditableParam = (typeof EDITABLE_PARAMS)[number];

/** A day's value in both units: daytime is minutes (metric) and hours (imperial) */
export type WeatherValue = { metric: number | null; imperial: number | null };

const KIND: Record<EditableParam, 'temperature' | 'height' | 'time'> = {
  tmax: 'temperature',
  tavg: 'temperature',
  tmin: 'temperature',
  prcp: 'height',
  snow: 'height',
  dayt: 'time',
};

const round = (value: number) => displayNumber(value, WEATHER_DATA_DECIMALS);

/** A value given in `units`, in both units */
export function valueInBothUnits(
  param: EditableParam,
  value: number | null,
  units: Unit,
): WeatherValue {
  if (value === null) return { metric: null, imperial: null };
  const kind = KIND[param];
  if (kind === 'time') {
    // Typed as hours either way
    return {
      metric: displayNumber(value * 60, 4),
      imperial: displayNumber(value, 4),
    };
  }
  if (units === 'metric') {
    const imperial =
      kind === 'temperature' ? (value * 9) / 5 + 32 : value / 25.4;
    return { metric: value, imperial: round(imperial) };
  }
  const metric = kind === 'temperature' ? (value - 32) * (5 / 9) : value * 25.4;
  return { metric: round(metric), imperial: value };
}

/** Hours, from daytime's minutes (metric) or hours (imperial) */
const hoursOf = (value: WeatherValue) =>
  value.imperial ?? (value.metric === null ? null : value.metric / 60);

/** A value as it's shown and typed: a number in `units`, daytime as HH:MM, '' when missing */
export function displayValue(
  param: EditableParam,
  value: WeatherValue,
  units: Unit,
): string {
  if (KIND[param] === 'time') {
    const hours = hoursOf(value);
    if (hours === null) return '';
    let whole = Math.floor(hours);
    let minutes = Math.round((hours - whole) * 60);
    if (minutes === 60) {
      whole += 1;
      minutes = 0;
    }
    return `${String(whole).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
  }
  const number = value[units];
  return number === null ? '' : String(number);
}

/** A number as shown, for arithmetic on the display value (daytime in hours) */
export function displayNumberOf(
  param: EditableParam,
  value: WeatherValue,
  units: Unit,
): number | null {
  return KIND[param] === 'time' ? hoursOf(value) : value[units];
}

/**
 * What was typed or pasted, in both units, or null when it can't be read.
 * Empty (or '-') is a missing value. Daytime takes 8:12 or 8.2 (hours).
 * A comma works as the decimal point (12,5), as some spreadsheets copy it.
 */
export function parseInput(
  param: EditableParam,
  text: string,
  units: Unit,
): WeatherValue | null {
  // A unit typed or copied after the number (20°C, 0.5 in, 8:12 h)
  const trimmed = text.trim().replace(/\s*(°\s*[cf]?|[cf]|mm|in|hr?s?)$/i, '');
  if (trimmed === '' || trimmed === '-' || trimmed === '—')
    return { metric: null, imperial: null };

  if (KIND[param] === 'time') {
    const time = trimmed.match(/^(\d{1,2}):(\d{1,2})$/);
    if (time) {
      const minutes = +time[2];
      if (minutes > 59) return null;
      const hours = +time[1] + minutes / 60;
      return hours > 24 ? null : valueInBothUnits(param, hours, units);
    }
  }

  const number = Number(trimmed.replace(/^(-?\d+),(\d+)$/, '$1.$2'));
  if (!Number.isFinite(number)) return null;
  if (KIND[param] === 'time' && (number < 0 || number > 24)) return null;
  if (KIND[param] === 'height' && number < 0) return null;
  return valueInBothUnits(param, number, units);
}

export const sameValue = (a: WeatherValue, b: WeatherValue) =>
  a.metric === b.metric && a.imperial === b.imperial;

/** Text from the clipboard as rows of cells: tab-separated (from a spreadsheet), else comma-separated */
export function parseClipboard(text: string): string[][] {
  const lines = text.replace(/\r\n?/g, '\n').split('\n');
  while (lines.length && lines[lines.length - 1].trim() === '') lines.pop();
  const separator = lines.some((line) => line.includes('\t')) ? '\t' : ',';
  // A single value with a decimal comma (12,5) is one cell, not two
  if (separator === ',' && lines.length === 1 && /^-?\d+,\d+$/.test(lines[0]))
    return [[lines[0]]];
  return lines.map((line) => line.split(separator).map((cell) => cell.trim()));
}

const DATE = /^(\d{4})[-/](\d{1,2})[-/](\d{1,2})$/;

/** YYYY-MM-DD from 2026-3-10 or 2026/03/10, or null */
export function normalizeDate(text: string): string | null {
  const match = text.trim().match(DATE);
  if (!match) return null;
  return `${match[1]}-${match[2].padStart(2, '0')}-${match[3].padStart(2, '0')}`;
}

/** A row of the grid, as the paste and CSV matching need it */
export type EditRow = { date: string; location: number };

/** A pasted value for a cell: the grid's row and column, and the text */
export type PastedCell = { row: number; column: number; text: string };

/**
 * Where each pasted cell goes. A block from a spreadsheet fills from the
 * selected cell (`anchor`) right and down. If its first column is dates, each
 * row goes to that day instead (at the anchor's location, or the location
 * index in the second column with more than one location), and the values
 * after the dates fill from the anchor's column. A first row of headings is
 * skipped. One value fills every selected cell (`selection`). Cells past the
 * grid's edges are left out.
 */
export function placePaste(
  block: string[][],
  {
    rows,
    columns,
    anchor,
    selection,
    locations,
  }: {
    rows: EditRow[];
    columns: number;
    anchor: { row: number; column: number };
    selection: { rows: [number, number]; columns: [number, number] };
    locations: number;
  },
): PastedCell[] {
  if (!block.length) return [];

  if (block.length === 1 && block[0].length === 1) {
    const cells: PastedCell[] = [];
    for (let row = selection.rows[0]; row <= selection.rows[1]; row++)
      for (
        let column = selection.columns[0];
        column <= selection.columns[1];
        column++
      )
        cells.push({ row, column, text: block[0][0] });
    return cells;
  }

  let lines = block;
  const isHeading = (line: string[]) =>
    line.every(
      (cell) =>
        cell === '' || (!normalizeDate(cell) && !Number.isFinite(Number(cell))),
    ) && line.some((cell) => /[a-zA-Z]/.test(cell));
  if (isHeading(lines[0])) lines = lines.slice(1);

  const byDate = lines.length > 0 && lines.every((l) => normalizeDate(l[0]));
  const cells: PastedCell[] = [];

  if (byDate) {
    const index = new Map(rows.map((r, i) => [`${r.location}|${r.date}`, i]));
    const anchorLocation = rows[anchor.row]?.location ?? 0;
    // With more than one location, a second column of whole numbers is the location index
    const hasLocation =
      locations > 1 &&
      lines.every(
        (line) => /^\d+$/.test(line[1] ?? '') && +line[1] < locations,
      );
    const skip = hasLocation ? 2 : 1;
    for (const line of lines) {
      const location = hasLocation ? +line[1] : anchorLocation;
      const row = index.get(`${location}|${normalizeDate(line[0])}`);
      if (row === undefined) continue;
      line.slice(skip).forEach((text, i) => {
        const column = anchor.column + i;
        if (column < columns) cells.push({ row, column, text });
      });
    }
    return cells;
  }

  lines.forEach((line, r) => {
    const row = anchor.row + r;
    if (row >= rows.length) return;
    line.forEach((text, c) => {
      const column = anchor.column + c;
      if (column < columns) cells.push({ row, column, text });
    });
  });
  return cells;
}

/**
 * Values for the missing days in `values` (a column of one location's days,
 * in order), each a straight line between the days on either side of its gap;
 * a gap at either end takes the nearest day's value. Null where there's
 * nothing to go by. Daytime fills in hours, the rest in the units shown.
 */
export function fillGaps(values: (number | null)[]): (number | null)[] {
  const known = values.flatMap((v, i) => (v === null ? [] : [i]));
  if (!known.length) return values.map(() => null);
  return values.map((value, i) => {
    if (value !== null) return value;
    const after = known.find((k) => k > i);
    const before = [...known].reverse().find((k) => k < i);
    if (before === undefined) return values[after!];
    if (after === undefined) return values[before];
    const a = values[before]!;
    const b = values[after]!;
    return round(a + ((b - a) * (i - before)) / (after - before));
  });
}

/** One value an Apply changed: the day's place in the weather, and before and after */
export type WeatherChange = {
  index: number;
  param: EditableParam;
  before: WeatherValue;
  after: WeatherValue;
};

/** Puts the changes' `after` values in place (or `before`, to take them back) */
export function applyChanges(
  days: WeatherDay[],
  changes: WeatherChange[],
  side: 'after' | 'before',
) {
  for (const change of changes) {
    const day = days[change.index];
    if (!day) continue;
    day[change.param].metric = change[side].metric;
    day[change.param].imperial = change[side].imperial;
  }
}

/** How many days a set of changes touches */
export const changedDays = (changes: { index: number }[]) =>
  new Set(changes.map((c) => c.index)).size;

/** The CSV headings Import reads, for each value and the units it's in */
export const CSV_HEADINGS: {
  param: EditableParam;
  heading: string;
  units: Unit;
}[] = [
  { param: 'tmax', heading: 'High Temperature (°F)', units: 'imperial' },
  { param: 'tmax', heading: 'High Temperature (°C)', units: 'metric' },
  { param: 'tavg', heading: 'Average Temperature (°F)', units: 'imperial' },
  { param: 'tavg', heading: 'Average Temperature (°C)', units: 'metric' },
  { param: 'tmin', heading: 'Low Temperature (°F)', units: 'imperial' },
  { param: 'tmin', heading: 'Low Temperature (°C)', units: 'metric' },
  { param: 'prcp', heading: 'Rain (in)', units: 'imperial' },
  { param: 'prcp', heading: 'Rain (mm)', units: 'metric' },
  { param: 'snow', heading: 'Snow (in)', units: 'imperial' },
  { param: 'snow', heading: 'Snow (mm)', units: 'metric' },
  { param: 'dayt', heading: 'Daytime (h:m)', units: 'metric' },
];

/** A value an imported file gives a day */
export type ImportedValue = {
  row: number;
  param: EditableParam;
  value: WeatherValue;
};

/**
 * The values in a CSV file (rows from CSVtoArray), by the grid's row, and a
 * message for each row that couldn't be used. Rows need a Date and Location
 * Index; an empty number cell is read as 0, as Import always has.
 */
export function readImportedRows(
  data: Record<string, string | undefined>[],
  rows: EditRow[],
): { values: ImportedValue[]; errors: string[]; matchedDays: number } {
  const index = new Map(rows.map((r, i) => [`${r.location}|${r.date}`, i]));
  const values: ImportedValue[] = [];
  const errors: string[] = [];
  let matchedDays = 0;

  data.forEach((line, i) => {
    // A file's last line is often empty
    if (Object.values(line).every((v) => v === undefined || v === '')) return;
    const date = normalizeDate(line['Date'] || line['date'] || '');
    const locationText =
      line['Location Index'] || line['location index'] || line['Location'];
    const location = parseInt(locationText ?? '', 10);
    const at = `Row ${i + 2} not imported`;
    if (!date) {
      errors.push(`${at}: Missing or invalid Date.`);
      return;
    }
    if (isNaN(location)) {
      errors.push(`${at}: Missing or invalid Location Index.`);
      return;
    }
    const row = index.get(`${location}|${date}`);
    if (row === undefined) {
      errors.push(`${at}: Date out of this project's range. (${date})`);
      return;
    }
    let matched = false;
    for (const { param, heading, units } of CSV_HEADINGS) {
      const text = line[heading];
      if (text === undefined) continue;
      if (param === 'dayt') {
        if (!text) continue;
        const value = parseInput('dayt', text, units);
        if (value) {
          values.push({ row, param, value });
          matched = true;
        }
        continue;
      }
      const number = +text;
      if (isNaN(number)) continue;
      values.push({
        row,
        param,
        value: valueInBothUnits(param, number, units),
      });
      matched = true;
    }
    if (matched) matchedDays++;
  });

  return { values, errors, matchedDays };
}

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

// How far someone has made their blanket: a date ("Made through Mar 12"),
// covering every location's days up to it. Pure, for the planner's progress
// line, the Update Weather Data dialog, My Library and Ravelry.

import type { TISO8601DateString } from '#lib/types/weather-types.js';
import { isoOf } from '#lib/utils/weather-days.js';

/** Kept with a saved project (and synced); never in its link */
export type StoredProgress = {
  /** The last day made (YYYY-MM-DD), or null: not started */
  madeThrough: TISO8601DateString | null;
  /** Show Progress in the preview: days not made yet dimmed */
  show?: boolean;
};

const ISO = /^\d{4}-\d{2}-\d{2}$/;

/** A stored value as a day, or null when it isn't one */
export const madeThroughOf = (value: unknown): TISO8601DateString | null =>
  typeof value === 'string' && ISO.test(value)
    ? (value as TISO8601DateString)
    : null;

/** A day's date as YYYY-MM-DD, whether a Date or already a string */
export const dayOf = (date: Date | string): TISO8601DateString =>
  typeof date === 'string'
    ? (date.slice(0, 10) as TISO8601DateString)
    : isoOf(date);

/** The project's days, each once, in order */
export const projectDates = (
  days: readonly { date: Date | string }[],
): TISO8601DateString[] => [...new Set(days.map((d) => dayOf(d.date)))].sort();

export type Progress = {
  /** Days made (a day for each location) */
  made: number;
  total: number;
  /** Rounded down, so 100 means every day is made, and 0 only none */
  percent: number;
  /** Made through the last day */
  finished: boolean;
};

/** How much of the project is made: its days through `madeThrough` of all of them */
export function progressOf(
  days: readonly { date: Date | string }[],
  madeThrough: TISO8601DateString | null,
): Progress {
  const total = days.length;
  const made = madeThrough
    ? days.filter((d) => dayOf(d.date) <= madeThrough).length
    : 0;
  let percent = total ? Math.floor((made * 100) / total) : 0;
  if (made > 0 && percent === 0) percent = 1;
  return { made, total, percent, finished: total > 0 && made === total };
}

/** The day after `madeThrough` among the project's days (+1 day): the first
 * one when not started, null once finished */
export function nextDay(
  dates: readonly TISO8601DateString[],
  madeThrough: TISO8601DateString | null,
): TISO8601DateString | null {
  if (!madeThrough) return dates[0] ?? null;
  return dates.find((date) => date > madeThrough) ?? null;
}

/** The day before `madeThrough` among the project's days (−1 day): null
 * (not started) from the first one */
export function previousDay(
  dates: readonly TISO8601DateString[],
  madeThrough: TISO8601DateString | null,
): TISO8601DateString | null {
  if (!madeThrough) return null;
  return dates.findLast((date) => date < madeThrough) ?? null;
}

/**
 * Each entry of the weather the preview draws (`data`: a day each, or a week
 * each when grouped by week): its last day among the project's own `days`.
 * A week is made once that day is.
 */
export function lastDays(
  data: readonly { date: Date | string }[],
  days: readonly { date: Date | string }[],
  grouping: 'day' | 'week',
): TISO8601DateString[] {
  if (grouping === 'day' || data.length === days.length)
    return data.map((day) => dayOf(day.date));
  // A week's last day: the last of the project's days before the next week starts
  const dates = projectDates(days);
  const starts = projectDates(data);
  const lastOf = new Map<string, TISO8601DateString>();
  let d = 0;
  starts.forEach((start, i) => {
    const next = starts[i + 1];
    let last: TISO8601DateString = start;
    while (d < dates.length && (!next || dates[d] < next)) {
      if (dates[d] >= start) last = dates[d];
      d++;
    }
    lastOf.set(start, last);
  });
  return data.map((week) => {
    const start = dayOf(week.date);
    return lastOf.get(start) ?? start;
  });
}

/**
 * The indexes into the weather the preview draws that aren't made yet. A
 * week is made once every one of its days is. `days` are the project's own days.
 */
export function unmadeIndexes(
  data: readonly { date: Date | string }[],
  days: readonly { date: Date | string }[],
  madeThrough: TISO8601DateString | null,
  grouping: 'day' | 'week',
): number[] {
  const indexes: number[] = [];
  lastDays(data, days, grouping).forEach((last, index) => {
    if (!madeThrough || last > madeThrough) indexes.push(index);
  });
  return indexes;
}

/** "Mar 12", with the year when it isn't this one's */
export function shortDay(
  iso: TISO8601DateString,
  thisYear = new Date().getFullYear(),
): string {
  const date = new Date(`${iso}T00:00:00Z`);
  return date.toLocaleDateString(undefined, {
    timeZone: 'UTC',
    month: 'short',
    day: 'numeric',
    ...(date.getUTCFullYear() !== thisYear && { year: 'numeric' }),
  });
}

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

// A saved project's weather days, and what a later search does to them: the
// days since it was last got are added without asking, and saved days only
// change when someone says so. Pure, so it's tested without the app's state.

import {
  METEOSTAT_DELAY_DAYS,
  OPEN_METEO_DELAY_DAYS,
} from '#lib/constants/weather-constants.js';
import type {
  TISO8601DateString,
  WeatherDay,
  WeatherSource,
} from '#lib/types/weather-types.js';

/** The values a search gets; daytime and the moon are worked out here */
export const COMPARED_PARAMS = [
  'tmax',
  'tavg',
  'tmin',
  'prcp',
  'snow',
] as const;
export type ComparedParam = (typeof COMPARED_PARAMS)[number];

/** A location's day: `<location index>|YYYY-MM-DD` */
export type DayKey = `${number}|${TISO8601DateString}`;

/** Newer values someone chose not to use, by day, in metric */
export type DeclinedValues = Record<
  DayKey,
  Partial<Record<ComparedParam, number | null>>
>;

/** Days got while their values were still early, and the day they were got */
export type EarlyDays = Record<DayKey, TISO8601DateString>;

/** What's kept with a saved project about its weather days */
export type StoredWeatherDays = {
  /** Each location's last day got (null: none yet) */
  fetchedThrough: (TISO8601DateString | null)[];
  /** The day each location's saved days were got, by a search of every day
   * (or the gallery page's update); missing for projects saved before */
  fetchedAt?: (TISO8601DateString | null)[];
  early: EarlyDays;
  declined: DeclinedValues;
};

/** Days after which each source's values stop changing */
export const SETTLE_DAYS: Record<WeatherSource, number> = {
  'Open-Meteo': OPEN_METEO_DELAY_DAYS,
  Meteostat: METEOSTAT_DELAY_DAYS,
};

const DAY_MS = 24 * 60 * 60 * 1000;

const isoToTime = (iso: TISO8601DateString) => Date.parse(`${iso}T00:00:00Z`);

export const isoOf = (date: Date): TISO8601DateString =>
  date.toISOString().slice(0, 10) as TISO8601DateString;

export const addDays = (iso: TISO8601DateString, days: number) =>
  isoOf(new Date(isoToTime(iso) + days * DAY_MS));

/** Today here, as YYYY-MM-DD */
export const localToday = (): TISO8601DateString => {
  const d = new Date();
  const pad = (n: number) => `${n}`.padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}` as TISO8601DateString;
};

/** Today in UTC, where Meteostat's days end */
export const utcToday = (): TISO8601DateString => isoOf(new Date());

/** Days from `from` to `to`, both included (0 when `to` comes first) */
export const daysFrom = (from: TISO8601DateString, to: TISO8601DateString) =>
  Math.max(0, Math.round((isoToTime(to) - isoToTime(from)) / DAY_MS) + 1);

const earlier = (a: TISO8601DateString, b: TISO8601DateString) =>
  a < b ? a : b;

export const dayKey = (day: Pick<WeatherDay, 'location' | 'date'>): DayKey =>
  `${day.location}|${isoOf(day.date)}`;

/** Whether a search got any value for the day (not a future day's blanks) */
export const hasValues = (day: WeatherDay) =>
  COMPARED_PARAMS.some((param) => day[param]?.metric != null);

/**
 * A location's last day with values: what was got, for projects saved before
 * that was kept. Searches fill days not in the past with blanks.
 */
export function lastDayWithValues(
  days: WeatherDay[],
  location: number,
): TISO8601DateString | null {
  let last: TISO8601DateString | null = null;
  for (const day of days) {
    if (day.location !== location || !hasValues(day)) continue;
    const iso = isoOf(day.date);
    if (!last || iso > last) last = iso;
  }
  return last;
}

/**
 * The last day a search just got for a location: its To date, or the day
 * before today if that's sooner. Meteostat's days end where today begins in
 * UTC (its server's), which can be a day sooner than here.
 */
export function fetchedThroughNow({
  to,
  source,
  today,
  todayUTC,
}: {
  to: TISO8601DateString;
  source: WeatherSource | undefined;
  today: TISO8601DateString;
  todayUTC: TISO8601DateString;
}): TISO8601DateString {
  let last = earlier(to, addDays(today, -1));
  if (source === 'Meteostat') last = earlier(last, addDays(todayUTC, -1));
  return last;
}

/**
 * The days a location can get now that it hasn't: from the day after its
 * last one got through its To date, up to the day before today.
 */
export function newDaysRange({
  from,
  to,
  fetchedThrough,
  today,
}: {
  from: TISO8601DateString;
  to: TISO8601DateString;
  fetchedThrough: TISO8601DateString | null;
  today: TISO8601DateString;
}): { from: TISO8601DateString; to: TISO8601DateString; days: number } | null {
  const start = fetchedThrough ? addDays(fetchedThrough, 1) : from;
  const first = start > from ? start : from;
  const last = earlier(to, addDays(today, -1));
  const days = daysFrom(first, last);
  return days ? { from: first, to: last, days } : null;
}

/** Sorted as searches leave them: by date, then by location */
export const sortDays = (days: WeatherDay[]) =>
  days.sort((a, b) => +a.date - +b.date || a.location - b.location);

/**
 * The saved days with the new ones in: a new day takes the place of the
 * blank one saved for it, or is added.
 */
export function mergeNewDays(
  saved: WeatherDay[],
  got: WeatherDay[],
): WeatherDay[] {
  const byKey = new Map(got.map((day) => [dayKey(day), day]));
  const merged = saved.map((day) => {
    const key = dayKey(day);
    const replacement = byKey.get(key);
    if (!replacement) return day;
    byKey.delete(key);
    return replacement;
  });
  return sortDays([...merged, ...byKey.values()]);
}

/** One value that differs: the saved one and the one just got (metric) */
export type ValueChange = {
  param: ComparedParam;
  saved: number | null;
  got: number | null;
};

/** A saved day whose values a search got differently */
export type DayChange = {
  key: DayKey;
  location: number;
  date: TISO8601DateString;
  changes: ValueChange[];
};

const same = (a: number | null, b: number | null) =>
  a === b || (a !== null && b !== null && Math.abs(a - b) < 1e-9);

/**
 * The saved days a new search of every day got differently, oldest first.
 * Only days already got (through each location's `fetchedThrough`) count;
 * later ones are new. A value someone chose to keep over the same newer one
 * isn't asked about again unless `askEveryTime`.
 */
export function compareDays({
  saved,
  got,
  fetchedThrough,
  params = COMPARED_PARAMS,
  declined = {},
  askEveryTime = false,
}: {
  saved: WeatherDay[];
  got: WeatherDay[];
  fetchedThrough: (TISO8601DateString | null)[];
  params?: readonly ComparedParam[];
  declined?: DeclinedValues;
  askEveryTime?: boolean;
}): DayChange[] {
  const byKey = new Map(got.map((day) => [dayKey(day), day]));
  const result: DayChange[] = [];
  for (const day of saved) {
    const date = isoOf(day.date);
    const through = fetchedThrough[day.location];
    if (!through || date > through) continue;
    const key = dayKey(day);
    const newer = byKey.get(key);
    const changes: ValueChange[] = [];
    for (const param of params) {
      const savedValue = day[param]?.metric ?? null;
      // A day the search no longer has comes back with no values
      const gotValue = newer?.[param]?.metric ?? null;
      if (same(savedValue, gotValue)) continue;
      const kept = declined[key];
      if (
        !askEveryTime &&
        kept &&
        param in kept &&
        same(kept[param] ?? null, gotValue)
      )
        continue;
      changes.push({ param, saved: savedValue, got: gotValue });
    }
    if (changes.length)
      result.push({ key, location: day.location, date, changes });
  }
  return result.sort((a, b) =>
    a.date === b.date ? a.location - b.location : a.date < b.date ? -1 : 1,
  );
}

/**
 * The saved days with the chosen changes used: a used day takes every value
 * the search got for it (both units), keeping its daytime and moon.
 */
export function applyChanges(
  saved: WeatherDay[],
  got: WeatherDay[],
  use: Set<DayKey>,
): WeatherDay[] {
  if (!use.size) return saved;
  const byKey = new Map(got.map((day) => [dayKey(day), day]));
  return saved.map((day) => {
    const key = dayKey(day);
    if (!use.has(key)) return day;
    const newer = byKey.get(key);
    const updated = { ...day };
    for (const param of COMPARED_PARAMS)
      updated[param] = newer
        ? { ...newer[param] }
        : { metric: null, imperial: null };
    return updated;
  });
}

/**
 * The newer values kept for later, after choosing: the ones not used are
 * remembered (so they aren't asked about again), and used days forget theirs.
 */
export function updateDeclined(
  declined: DeclinedValues,
  changes: DayChange[],
  use: Set<DayKey>,
): DeclinedValues {
  const next: DeclinedValues = { ...declined };
  for (const change of changes) {
    if (use.has(change.key)) {
      delete next[change.key];
      continue;
    }
    const kept = { ...next[change.key] };
    for (const { param, got } of change.changes) kept[param] = got;
    next[change.key] = kept;
  }
  return next;
}

/** Whether a day got on `gotOn` was still within its source's early days */
export const wasEarly = (
  date: TISO8601DateString,
  gotOn: TISO8601DateString,
  source: WeatherSource | undefined,
) => daysFrom(date, gotOn) <= SETTLE_DAYS[source ?? 'Meteostat'];

/** Whether an early day's values have settled by `today` */
export const hasSettled = (
  date: TISO8601DateString,
  today: TISO8601DateString,
  source: WeatherSource | undefined,
) => daysFrom(date, today) > SETTLE_DAYS[source ?? 'Meteostat'];

/** The early days among those just got, marked with the day they were got */
export function earlyDaysIn(
  got: WeatherDay[],
  today: TISO8601DateString,
  sourceOf: (location: number) => WeatherSource | undefined,
): EarlyDays {
  const early: EarlyDays = {};
  for (const day of got) {
    if (!hasValues(day)) continue;
    const date = isoOf(day.date);
    if (wasEarly(date, today, sourceOf(day.location)))
      early[dayKey(day)] = today;
  }
  return early;
}

/** Early days whose values have settled since, so a search may change them */
export function settledEarlyDays(
  early: EarlyDays,
  today: TISO8601DateString,
  sourceOf: (location: number) => WeatherSource | undefined,
): DayKey[] {
  return (Object.keys(early) as DayKey[]).filter((key) => {
    const [location, date] = key.split('|') as [string, TISO8601DateString];
    return hasSettled(date, today, sourceOf(Number(location)));
  });
}

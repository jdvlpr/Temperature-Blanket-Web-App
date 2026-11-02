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

import { gauges } from '#lib/state/gauges-state.svelte.js';
import { getColorInfo } from '#lib/utils/color-utils.js';
import { dialog } from '#lib/state/page-state.svelte.js';
import { previews } from '#lib/state/preview-state.svelte.js';
import { preferences } from '#lib/storage/preferences.svelte.js';
import type {
  TISO8601DateString,
  WeatherDay,
} from '#lib/types/weather-types.js';
import {
  COMPARED_PARAMS,
  compareDays,
  dayKey,
  keptBefore,
  type ComparedParam,
  type DayChange,
  type DayKey,
  type DeclinedValues,
  type EarlyDays,
} from '#lib/utils/weather-days.js';

/** What a search of every day again found, for choosing in SearchAgain.svelte */
export type SearchAgainResult = {
  /** The project's days before it */
  saved: WeatherDay[];
  /** Every day it got */
  got: WeatherDay[];
  fetchedThrough: (TISO8601DateString | null)[];
  /** The day each location's saved days were got, before it (null: not known) */
  fetchedAt: (TISO8601DateString | null)[];
  declined: DeclinedValues;
  /** The saved days that were early when got */
  early: EarlyDays;
  /** The days after the last ones got, added if chosen */
  newDays: WeatherDay[];
};

/** The changed saved days: every one (`all`), those not kept before
 * (`fresh`, what Update Past Days updates) and the kept ones' keys */
export type SearchAgainChanges = {
  all: DayChange[];
  fresh: DayChange[];
  kept: Set<DayKey>;
};

export function changesOf({
  saved,
  got,
  fetchedThrough,
  declined,
}: SearchAgainResult): SearchAgainChanges {
  const args = { saved, got, fetchedThrough, declined };
  const all = compareDays({ ...args, askEveryTime: true });
  const fresh = compareDays(args);
  return { all, fresh, kept: keptBefore(all, fresh) };
}

/** How many new days there are (a day for each location) */
export const newDayCount = ({ newDays }: SearchAgainResult) =>
  new Set(newDays.map(dayKey)).size;

/** The values the project shows: those its preview draws (a Rows preview
 * may draw only the high), else every one its gauges color */
export const projectParams = (): ComparedParam[] => {
  const targets =
    (previews.active?.targets as { id: string }[] | undefined) ??
    gauges.allCreated.flatMap((gauge) => gauge.targets);
  const used = new Set<string>(targets.map((t) => t.id));
  return COMPARED_PARAMS.filter((param) => used.has(param));
};

/** A value's color in the project's gauges now, or undefined when the
 * project doesn't show it (getColorInfo alone gives the Temperature gauge's for any
 * temperature, used or not) */
export const colorOf = (
  day: WeatherDay | undefined,
  param: ComparedParam,
  used: readonly ComparedParam[] = projectParams(),
) =>
  used.includes(param)
    ? getColorInfo({
        param,
        value: day?.[param]?.[preferences.value.units ?? 'metric'] ?? null,
      })
    : undefined;

/** Whether taking a changed day's new values changes any of its colors */
export const changesColor = (
  change: DayChange,
  saved: WeatherDay | undefined,
  got: WeatherDay | undefined,
  used: readonly ComparedParam[] = projectParams(),
) =>
  change.changes.some(
    ({ param }) =>
      colorOf(saved, param, used)?.index !== colorOf(got, param, used)?.index,
  );

/** Opens the dialog */
export async function openSearchAgain(result: SearchAgainResult) {
  const { default: SearchAgain } = await import('./SearchAgain.svelte');
  dialog.trigger({
    type: 'component',
    component: { ref: SearchAgain, props: { result } },
    options: { title: 'Update Weather Data', size: 'medium' },
  });
}

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
import { preferences } from '#lib/storage/preferences.svelte.js';
import type {
  TISO8601DateString,
  WeatherDay,
} from '#lib/types/weather-types.js';
import {
  COMPARED_PARAMS,
  compareDays,
  dayKey,
  type ComparedParam,
  type DayChange,
  type DeclinedValues,
} from '#lib/utils/weather-days.js';

/** What a search of every day again found, for choosing in SearchAgain.svelte */
export type SearchAgainResult = {
  /** The project's days before it (with new ones added) */
  saved: WeatherDay[];
  /** Every day it got */
  got: WeatherDay[];
  fetchedThrough: (TISO8601DateString | null)[];
  /** The day each location's saved days were got, before it (null: not known) */
  fetchedAt: (TISO8601DateString | null)[];
  declined: DeclinedValues;
  /** How many new days it added */
  added: number;
};

/** The values the project's gauges use */
export const gaugeParams = (): ComparedParam[] => {
  const used = new Set<string>(
    gauges.allCreated.flatMap((gauge) => gauge.targets.map((t) => t.id)),
  );
  return COMPARED_PARAMS.filter((param) => used.has(param));
};

/** A value's color in the project's gauges now: its range's index, or
 * undefined when no gauge colors it */
export const colorIndexOf = (
  day: WeatherDay | undefined,
  param: ComparedParam,
) =>
  getColorInfo({
    param,
    value: day?.[param]?.[preferences.value.units ?? 'metric'] ?? null,
  }).index;

/** Whether Search Again shows only days whose colors change (the default) */
export const onlyColorChanges = () =>
  preferences.value.weatherChanges?.show !== 'all';

/**
 * The changed saved days, as the Search Again preferences choose them: only
 * the values the gauges use, if so; days kept before only with `showKept`;
 * only the values that change a color with `colorsOnly`.
 */
export const changesFor = (
  {
    saved,
    got,
    fetchedThrough,
    declined,
  }: Pick<SearchAgainResult, 'saved' | 'got' | 'fetchedThrough' | 'declined'>,
  {
    showKept = false,
    colorsOnly = onlyColorChanges(),
  }: { showKept?: boolean; colorsOnly?: boolean } = {},
): DayChange[] => {
  const changes = compareDays({
    saved,
    got,
    fetchedThrough,
    declined,
    params:
      preferences.value.weatherChanges?.compare === 'gauges'
        ? gaugeParams()
        : COMPARED_PARAMS,
    askEveryTime: showKept,
  });
  if (!colorsOnly) return changes;
  const savedByKey = new Map(saved.map((day) => [dayKey(day), day]));
  const gotByKey = new Map(got.map((day) => [dayKey(day), day]));
  return changes.flatMap((change) => {
    const before = savedByKey.get(change.key);
    const after = gotByKey.get(change.key);
    const recolored = change.changes.filter(
      ({ param }) => colorIndexOf(before, param) !== colorIndexOf(after, param),
    );
    return recolored.length ? [{ ...change, changes: recolored }] : [];
  });
};

export async function openSearchAgain(result: SearchAgainResult) {
  const { default: SearchAgain } = await import('./SearchAgain.svelte');
  dialog.trigger({
    type: 'component',
    component: { ref: SearchAgain, props: { result } },
    options: { title: 'Search Again', size: 'medium' },
  });
}

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
import { dialog } from '#lib/state/page-state.svelte.js';
import { preferences } from '#lib/storage/preferences.svelte.js';
import type {
  TISO8601DateString,
  WeatherDay,
} from '#lib/types/weather-types.js';
import {
  COMPARED_PARAMS,
  compareDays,
  type ComparedParam,
  type DeclinedValues,
} from '#lib/utils/weather-days.js';

/** What a search of every day again found, for choosing in SearchAgain.svelte */
export type SearchAgainResult = {
  /** The project's days before it (with new ones added) */
  saved: WeatherDay[];
  /** Every day it got */
  got: WeatherDay[];
  fetchedThrough: (TISO8601DateString | null)[];
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

/** The changed saved days, as the Search Again preferences choose them */
export const changesFor = ({
  saved,
  got,
  fetchedThrough,
  declined,
}: Omit<SearchAgainResult, 'added'>) =>
  compareDays({
    saved,
    got,
    fetchedThrough,
    declined,
    params:
      preferences.value.weatherChanges?.compare === 'gauges'
        ? gaugeParams()
        : COMPARED_PARAMS,
    askEveryTime: preferences.value.weatherChanges?.ask === 'every',
  });

export async function openSearchAgain(result: SearchAgainResult) {
  const { default: SearchAgain } = await import('./SearchAgain.svelte');
  dialog.trigger({
    type: 'component',
    component: { ref: SearchAgain, props: { result } },
    options: { title: 'Search Again', size: 'medium' },
  });
}

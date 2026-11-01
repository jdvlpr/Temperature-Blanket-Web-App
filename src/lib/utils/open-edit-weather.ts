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

import { dialog } from '#lib/state/page-state.svelte.js';
import { weather } from '#lib/state/weather-state.svelte.js';
import { dateToISO8601String } from '#lib/utils/date-utils.js';
import type { EditableParam } from '#lib/utils/weather-edits.js';

/**
 * Opens Edit Weather Data (modals/EditWeather.svelte): on a day's value (from
 * the table: its date, location and value), or with Import File showing
 */
export async function openEditWeather({
  day,
  startWith,
}: {
  day?: { date: string; location: number; param: EditableParam };
  startWith?: 'import';
} = {}) {
  const { default: EditWeather } =
    await import('#lib/components/modals/EditWeather.svelte');
  const row = day
    ? weather.rawData.findIndex(
        (d) =>
          d.location === day.location &&
          dateToISO8601String(d.date) === day.date,
      )
    : -1;
  dialog.trigger({
    type: 'component',
    component: {
      ref: EditWeather,
      props: {
        start: day && row >= 0 ? { row, param: day.param } : undefined,
        startWith,
      },
    },
    options: { size: 'full', title: 'Edit Weather Data' },
  });
}

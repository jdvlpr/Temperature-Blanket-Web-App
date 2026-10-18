<!-- Copyright (c) 2024 - 2026, Thomas (https://github.com/jdvlpr)

This file is part of Temperature-Blanket-Web-App.

Temperature-Blanket-Web-App is free software: you can redistribute it and/or modify it
under the terms of the GNU General Public License as published by the Free Software Foundation,
either version 3 of the License, or (at your option) any later version.

Temperature-Blanket-Web-App is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY;
without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.
See the GNU General Public License for more details.

You should have received a copy of the GNU General Public License along with Temperature-Blanket-Web-App.
If not, see <https://www.gnu.org/licenses/>. -->

<!-- A day whose saved values were kept over newer ones Search Again got: both,
and the newer ones to use instead (with Undo) -->
<script lang="ts">
  import SaveAndCloseButtons from '#lib/components/modals/SaveAndCloseButtons.svelte';
  import { UNIT_LABELS } from '#lib/constants/weather-constants.js';
  import { dialog, toast } from '#lib/state/page-state.svelte.js';
  import { weather } from '#lib/state/weather-state.svelte.js';
  import { weatherDays } from '#lib/state/weather-days.svelte.js';
  import { projectChanged } from '#lib/storage/autosave.svelte.js';
  import { preferences } from '#lib/storage/preferences.svelte.js';
  import type { WeatherDay } from '#lib/types/weather-types.js';
  import {
    celsiusToFahrenheit,
    millimetersToInches,
  } from '#lib/utils/unit-utils.svelte.js';
  import {
    COMPARED_PARAMS,
    dayKey,
    type ComparedParam,
    type DayKey,
  } from '#lib/utils/weather-days.js';

  let {
    key,
    onchange,
  }: {
    key: DayKey;
    /** After the day's values change, e.g. to redraw the table */
    onchange?: () => void;
  } = $props();

  const LABELS: Record<ComparedParam, string> = {
    tmax: 'High',
    tavg: 'Average',
    tmin: 'Low',
    prcp: 'Rain',
    snow: 'Snow',
  };

  const units = $derived(preferences.value.units ?? 'metric');
  const kept = $derived(weatherDays.declined[key] ?? {});
  const day = $derived(weather.rawData.find((d) => dayKey(d) === key));
  const params = $derived(COMPARED_PARAMS.filter((p) => p in kept));

  const unitOf = (param: ComparedParam) =>
    param === 'prcp' || param === 'snow'
      ? ` ${UNIT_LABELS.height[units]}`
      : UNIT_LABELS.temperature[units];

  const show = (value: number | null, param: ComparedParam) =>
    value === null ? 'no data' : `${value}${unitOf(param)}`;

  // The newer value in the units shown
  const newer = (param: ComparedParam) => {
    const metric = kept[param] ?? null;
    if (metric === null || units === 'metric') return metric;
    return param === 'prcp' || param === 'snow'
      ? millimetersToInches(metric)
      : celsiusToFahrenheit(metric);
  };

  const both = (metric: number | null, param: ComparedParam) => ({
    metric,
    imperial:
      metric === null
        ? null
        : param === 'prcp' || param === 'snow'
          ? millimetersToInches(metric)
          : celsiusToFahrenheit(metric),
  });

  function setDay(values: Partial<Pick<WeatherDay, ComparedParam>>) {
    weather.updateRawData(
      weather.rawData.map((d) => (dayKey(d) === key ? { ...d, ...values } : d)),
    );
  }

  function useNewer() {
    if (!day) return;
    const before = $state.snapshot(day) as WeatherDay;
    const declinedBefore = $state.snapshot(kept);
    const values: Partial<Pick<WeatherDay, ComparedParam>> = {};
    for (const param of params)
      values[param] = both(kept[param] ?? null, param);
    setDay(values);
    const { [key]: _, ...rest } = weatherDays.declined;
    weatherDays.declined = rest;
    projectChanged({ weather: true });
    onchange?.();
    dialog.close();
    toast.trigger({
      category: 'success',
      message: 'Using the new values.',
      action: {
        label: 'Undo',
        response: () => {
          const restored: Partial<Pick<WeatherDay, ComparedParam>> = {};
          for (const param of params) restored[param] = before[param];
          setDay(restored);
          weatherDays.declined = {
            ...weatherDays.declined,
            [key]: declinedBefore,
          };
          projectChanged({ weather: true });
          onchange?.();
        },
      },
    });
  }
</script>

<div class="flex flex-col gap-4 px-2 pt-2 text-left">
  <p>
    You kept your saved values for this day when Search Again got different
    ones.
  </p>
  <table class="w-fit text-left text-sm [&_td]:pr-4 [&_th]:pr-4">
    <thead>
      <tr>
        <td></td>
        <th scope="col">Saved</th>
        <th scope="col">New</th>
      </tr>
    </thead>
    <tbody>
      {#each params as param (param)}
        <tr>
          <th scope="row" class="font-normal opacity-70">{LABELS[param]}</th>
          <td>{show(day?.[param]?.[units] ?? null, param)}</td>
          <td>{show(newer(param), param)}</td>
        </tr>
      {/each}
    </tbody>
  </table>
  <SaveAndCloseButtons
    onSave={useNewer}
    onClose={() => dialog.close()}
    saveText="Use New Values"
    disabled={!day || !params.length}
  />
</div>

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

<script lang="ts">
  import Spinner from '#lib/components/Spinner.svelte';
  import WeatherChart from '#lib/components/WeatherChart.svelte';
  import WeatherItem from '#lib/components/WeatherItem.svelte';
  import WeatherNavigator from '#lib/components/WeatherNavigator.svelte';
  import HelpIcon from '#lib/components/buttons/HelpIcon.svelte';
  import WeatherNotes, {
    readWeatherNotes,
  } from '#lib/components/modals/WeatherNotes.svelte';
  import { UNIT_LABELS } from '#lib/constants/weather-constants.js';
  import { dialog } from '#lib/state/page-state.svelte.js';
  import { gauges } from '#lib/state/gauges-state.svelte.js';
  import { locations } from '#lib/state/location-state.svelte.js';
  import { weather } from '#lib/state/weather-state.svelte.js';
  import { preferences } from '#lib/storage/preferences.svelte.js';
  import { convertTime } from '#lib/utils/unit-utils.svelte.js';
  import { displayNumber, getAverage } from '#lib/utils/number-utils.js';
  import { pluralize } from '#lib/utils/string-utils.js';
  import { noticeLabel } from '#lib/utils/weather-notes.js';
  import { TriangleAlertIcon } from '@lucide/svelte';
  import { onMount } from 'svelte';
  import WeatherToolbar from '#lib/components/WeatherToolbar.svelte';

  /** The chart's lines, in its colors (--tmax…, src/css/main.css) */
  let graph = $state<HTMLDivElement>();
  let defaultWeatherSourceCopy = $state<string>();
  let wasDefaultWeatherSourceChanged = $state(false);
  let showWeatherChart = $state(true);
  let isAnyWeatherSourceDifferentFromDefault: boolean;
  onMount(() => {
    isAnyWeatherSourceDifferentFromDefault = !locations.all?.some(
      (n) => n.source === weather.source.name,
    );

    defaultWeatherSourceCopy = weather.source.name;
    if (isAnyWeatherSourceDifferentFromDefault) {
      if (locations.all?.every((n) => n.source === 'Meteostat')) {
        weather.source.name = 'Meteostat';
        wasDefaultWeatherSourceChanged = true;
      } else if (locations.all?.every((n) => n.source === 'Open-Meteo')) {
        weather.source.name = 'Open-Meteo';
        wasDefaultWeatherSourceChanged = true;
      }
    }
  });

  let tMinDay = $derived(
    weather.data
      .map((day, index) => {
        return { ...day, index };
      })
      .filter((day) => day.tmin[preferences.value.units ?? 'metric'] !== null)
      .reduce((prev, curr) =>
        (prev.tmin[preferences.value.units ?? 'metric'] ?? Infinity) <
        (curr.tmin[preferences.value.units ?? 'metric'] ?? Infinity)
          ? prev
          : curr,
      ) || null,
  );
  let tMaxDay = $derived(
    weather.data
      .map((day, index) => {
        return { ...day, index };
      })
      .filter((day) => day.tmax[preferences.value.units ?? 'metric'] !== null)
      .reduce((prev, curr) =>
        (prev.tmax[preferences.value.units ?? 'metric'] ?? -Infinity) >
        (curr.tmax[preferences.value.units ?? 'metric'] ?? -Infinity)
          ? prev
          : curr,
      ) || null,
  );
  const notes = $derived(readWeatherNotes());

  function openNotes() {
    dialog.trigger({
      type: 'component',
      component: { ref: WeatherNotes },
      options: { title: 'About This Weather', size: 'small' },
    });
  }
</script>

<!-- Centered, like the rest of the planner; rows that scroll sideways are
centered as blocks so their first items never clip -->
<div class="flex w-full flex-col items-center gap-2">
  <WeatherToolbar />

  <!-- Weekly: when it starts and how long it is (Weeks Start On is in the
  Grouping menu) -->
  {#if weather.grouping === 'week'}
    <p class="w-full max-w-screen-md text-center text-sm">
      {#if weather.groupedByWeek?.length}
        Weekly: starts {weather.groupedByWeek[0].date.toLocaleDateString(
          undefined,
          {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            timeZone: 'UTC',
          },
        )} · {weather.groupedByWeek.length}
        {pluralize('week', weather.groupedByWeek.length)}, which can make a
        shorter project.
      {:else}
        Weekly grouping can make a shorter project.
      {/if}
      <HelpIcon topic="grouping-weather-data" />
    </p>
  {/if}

  {#if wasDefaultWeatherSourceChanged}
    <p class="w-full text-center text-sm">
      No weather data was available from the default source ({defaultWeatherSourceCopy}),
      so another source was used ({weather.source.name}) and the Weather Source
      setting was automatically updated.
    </p>
  {/if}

  {#if notes.missing || notes.recentDates.length}
    <button
      type="button"
      class="btn hover:preset-tonal-surface text-warning-800-200 h-auto max-w-full text-left text-sm whitespace-normal"
      onclick={openNotes}
    >
      <TriangleAlertIcon />
      {noticeLabel({
        missing: notes.missing,
        recent: notes.recentDates.length,
        unit: notes.unit,
      })}
    </button>
  {/if}

  <div
    class="relative flex max-w-full snap-x items-start justify-start gap-x-2 overflow-auto pb-2"
  >
    {#if weather.table.showParameters.tmax}
      <div class="snap-start">
        <WeatherItem
          id="tmax"
          icon="↑"
          label="Highest Temperature"
          value={Math.max(
            ...(weather.params.tmax?.filter((n) => n !== null) as number[]),
          )}
          units={UNIT_LABELS.temperature[preferences.value.units ?? 'metric']}
        >
          {#snippet date()}
            <p class="text-xs">
              {#if weather.grouping === 'week'}Week of{/if}
              {tMaxDay?.date.toLocaleDateString(undefined, {
                timeZone: 'UTC',
              })}
            </p>
          {/snippet}
        </WeatherItem>
      </div>
    {/if}

    {#if weather.table.showParameters.tavg}
      <div class="snap-center">
        <WeatherItem
          id="tavg"
          icon="~"
          label="Average Temperature"
          value={getAverage(
            weather.params.tavg?.filter((n) => n !== null) as number[],
          )}
          units={UNIT_LABELS.temperature[preferences.value.units ?? 'metric']}
        />
      </div>
    {/if}

    {#if weather.table.showParameters.tmin}
      <div class="snap-center">
        <WeatherItem
          id="tmin"
          icon="↓"
          label="Lowest Temperature"
          value={Math.min(
            ...(weather.params.tmin?.filter((n) => n !== null) as number[]),
          )}
          units={UNIT_LABELS.temperature[preferences.value.units ?? 'metric']}
        >
          {#snippet date()}
            <p class="text-xs">
              {#if weather.grouping === 'week'}Week of{/if}
              {tMinDay?.date.toLocaleDateString(undefined, {
                timeZone: 'UTC',
              })}
            </p>
          {/snippet}
        </WeatherItem>
      </div>
    {/if}

    {#if weather.table.showParameters.prcp}
      <div class="snap-center">
        <WeatherItem
          id="prcp"
          icon="∴"
          label="Total Rainfall"
          value={weather.params.prcp?.every((n) => n === null)
            ? '-'
            : displayNumber(
                weather.params.prcp
                  ?.filter((n) => n !== null)
                  ?.reduce((partialSum: number, a: any) => partialSum + a, 0) ??
                  0,
              )}
          units={UNIT_LABELS.height[preferences.value.units ?? 'metric']}
        />
      </div>
    {/if}

    {#if weather.table.showParameters.snow}
      <div class="snap-center">
        <WeatherItem
          id="snow"
          icon="∗"
          label={locations.all?.every((n) => n.source === 'Meteostat')
            ? 'Highest Snow Depth'
            : 'Total SnowFall'}
          value={weather.params.snow?.every((n) => n === null)
            ? '-'
            : locations.all?.every((n) => n.source === 'Meteostat')
              ? Math.max(
                  ...(weather.params.snow?.filter(
                    (n) => n !== null,
                  ) as number[]),
                )
              : displayNumber(
                  weather.params.snow
                    ?.filter((n) => n !== null)
                    ?.reduce(
                      (partialSum: number, a: any) => partialSum + a,
                      0,
                    ) ?? 0,
                )}
          units={UNIT_LABELS.height[preferences.value.units ?? 'metric']}
        >
          {#snippet button()}
            <div class="my-2 text-sm">
              {#if locations.all.some((n) => n.source === 'Meteostat') && locations.all.some((n) => n.source === 'Open-Meteo')}
                <HelpIcon
                  topic="mixed-snow-parameters"
                  title="Read About Mixed Snow Parameters"
                >
                  {#snippet text()}
                    <span class="link">Error: Mixed Parameters</span>
                  {/snippet}
                </HelpIcon>
              {/if}
            </div>
          {/snippet}
        </WeatherItem>
      </div>
    {/if}

    {#if weather.table.showParameters.dayt}
      <div class="snap-center">
        <WeatherItem
          id="dayt"
          icon="☼"
          label="Average Daytime"
          value={convertTime(
            getAverage(
              weather.params.dayt?.filter((n) => n !== null) as number[],
              { decimals: 6 },
            ),
          )}
        />
      </div>
    {/if}
  </div>
</div>

<div bind:this={graph} class="w-full scroll-m-[60px]">
  {#if showWeatherChart}
    {#if weather.data.length}
      {#key preferences.value.units}
        <WeatherChart />
      {/key}
    {/if}
  {:else}
    <div class="my-36"><Spinner /></div>
  {/if}
</div>

<div class="mt-2">
  {#if weather.data.length}
    {#if !gauges.activeGauge?.calculating}
      <WeatherNavigator />
    {/if}
  {/if}
</div>

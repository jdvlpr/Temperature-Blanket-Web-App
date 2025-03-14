<!-- Copyright (c) 2024, Thomas (https://github.com/jdvlpr)

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
  import Spinner from '$lib/components/Spinner.svelte';
  import WeatherChart from '$lib/components/WeatherChart.svelte';
  import WeatherItem from '$lib/components/WeatherItem.svelte';
  import WeatherNavigator from '$lib/components/WeatherNavigator.svelte';
  import HelpIcon from '$lib/components/buttons/HelpIcon.svelte';
  import ToggleWeatherData from '$lib/components/buttons/ToggleWeatherData.svelte';
  import ChooseWeatherSource from '$lib/components/modals/ChooseWeatherSource.svelte';
  import {
    DAYS_OF_THE_WEEK,
    METEOSTAT_DELAY_DAYS,
    MONTHS,
    OPEN_METEO_DELAY_DAYS,
    UNIT_LABELS,
  } from '$lib/constants';
  import { gauges, localState, locations, modal, weather } from '$lib/state';
  import {
    convertTime,
    createWeeksProperty,
    displayNumber,
    getAverage,
    isDateWithinLastSevenDays,
    pluralize,
  } from '$lib/utils';
  import { TriangleAlertIcon, WrenchIcon } from '@lucide/svelte';
  import { Accordion } from '@skeletonlabs/skeleton-svelte';
  import { onMount } from 'svelte';
  import UnitChanger from './UnitChanger.svelte';
  import WeatherGrouping from './WeatherGrouping.svelte';

  let graph = $state();
  let defaultWeatherSourceCopy = $state();
  let wasDefaultWeatherSourceChanged = $state(false);
  let showWeatherChart = $state(true);
  let warningAccordionState = $state([]);
  let missingWeatherAccordionState = $state([]);
  let isAnyWeatherSourceDifferentFromDefault;
  onMount(() => {
    isAnyWeatherSourceDifferentFromDefault = !locations.all?.some(
      (n) => n.source === weather.defaultSource,
    );

    defaultWeatherSourceCopy = weather.defaultSource;
    if (isAnyWeatherSourceDifferentFromDefault) {
      if (locations.all?.every((n) => n.source === 'Meteostat')) {
        weather.defaultSource = 'Meteostat';
        wasDefaultWeatherSourceChanged = true;
      } else if (locations.all?.every((n) => n.source === 'Open-Meteo')) {
        weather.defaultSource = 'Open-Meteo';
        wasDefaultWeatherSourceChanged = true;
      }
    }
  });

  function getMissingDataMerged(missingData) {
    let _countsofTMinTAvgTMax = [...missingData];
    _countsofTMinTAvgTMax.length = 3;
    const areAllTempsTheSame = _countsofTMinTAvgTMax.every(
      (item) => item.count === _countsofTMinTAvgTMax[0].count,
    );
    if (areAllTempsTheSame) {
      return [
        {
          count: missingTmin.length,
          label: 'low, average, and high',
          type: 'temperature',
        },
        {
          count: missingPrcp.length,
          label: 'rain',
          type: 'height',
        },
        {
          count: missingSnow.length,
          label: 'snow',
          type: 'height',
        },
      ];
    } else return missingData;
  }

  let missingTmin = $derived(weather.params.tmin.filter((n) => n === null));
  let missingTavg = $derived(weather.params.tavg.filter((n) => n === null));
  let missingTmax = $derived(weather.params.tmax.filter((n) => n === null));
  let missingPrcp = $derived(weather.params.prcp.filter((n) => n === null));
  let missingSnow = $derived(weather.params.snow.filter((n) => n === null));
  let missingData = $derived([
    {
      count: missingTmin.length,
      label: 'low',
      type: 'temperature',
    },
    {
      count: missingTavg.length,
      label: 'average',
      type: 'temperature',
    },
    {
      count: missingTmax.length,
      label: 'high',
      type: 'temperature',
    },
    { count: missingPrcp.length, label: 'rain', type: 'height' },
    { count: missingSnow.length, label: 'snow', type: 'height' },
  ]);
  let isDataMissing = $derived(
    !!missingTmin.length || !!missingTavg.length || !!missingTmax.length,
  );
  let tMinDay = $derived(
    weather.data
      .map((day, index) => {
        return { ...day, index };
      })
      .filter((day) => day.tmin[localState.value.units] !== null)
      .reduce((prev, curr) =>
        prev.tmin[localState.value.units] < curr.tmin[localState.value.units]
          ? prev
          : curr,
      ) || null,
  );
  let tMaxDay = $derived(
    weather.data
      .map((day, index) => {
        return { ...day, index };
      })
      .filter((day) => day.tmax[localState.value.units] !== null)
      .reduce((prev, curr) =>
        prev.tmax[localState.value.units] > curr.tmax[localState.value.units]
          ? prev
          : curr,
      ) || null,
  );
  let missingDataMerged = $derived(getMissingDataMerged(missingData));

  let projectHasRecentWeatherData = $derived(
    weather.data?.some((date) => {
      return isDateWithinLastSevenDays(date?.date);
    }),
  );
  let data = $derived(
    createWeeksProperty({
      weatherData: weather.rawData,
      dowOffset: weather.monthGroupingStartDay,
    }),
  );
</script>

<div class="mt-2 flex w-full flex-col items-center justify-center gap-2">
  <div class="flex w-full flex-wrap items-center justify-center gap-x-4">
    <div class="my-4 flex flex-wrap items-center justify-center gap-4">
      <UnitChanger />

      <WeatherGrouping />
    </div>

    {#if weather.grouping === 'week'}
      <div
        class="rounded-container bg-surface-100 dark:bg-surface-900 mb-4 flex w-full max-w-screen-md flex-col items-start justify-start gap-2 p-2 text-left"
      >
        <p class="">
          Weekly weather grouping makes for a shorter project. <a
            href="/documentation/#grouping-weather-data"
            target="_blank"
            class="link"
            rel="noopener noreferrer">Read more details.</a
          >
          {#if weather.goupedByWeek}
            Your project starts on {DAYS_OF_THE_WEEK.filter(
              (n) => n.value === weather.goupedByWeek[0].date.getDay(),
            )[0].label},
            {MONTHS.filter(
              (n) => n.value - 1 === weather.goupedByWeek[0].date.getMonth(),
            )[0]?.name}
            {weather.goupedByWeek[0].date.getDate()},
            {weather.goupedByWeek[0].date.getFullYear()}. It spans {weather
              .goupedByWeek.length}
            {pluralize('week', weather.goupedByWeek.length)}.
          {/if}
        </p>
        <label class="label mx-auto flex flex-col">
          <span>Weeks Start On</span>
          <select
            class="select mx-auto w-fit"
            bind:value={weather.monthGroupingStartDay}
            id="weather-weeks-start-week-on"
          >
            {#each DAYS_OF_THE_WEEK as { value, label }}
              <option {value}>{label}</option>
            {/each}
          </select>
        </label>
      </div>
    {/if}

    <button
      class="btn hover:preset-tonal w-fit"
      onclick={async () => {
        modal.trigger({
          type: 'component',
          component: { ref: ChooseWeatherSource },
        });
      }}
    >
      <WrenchIcon />
      <span class="text-left whitespace-pre-wrap"
        >Weather Source: {weather.isUserEdited
          ? 'Custom'
          : weather.defaultSource}</span
      >
    </button>
  </div>

  {#if wasDefaultWeatherSourceChanged}
    <p class="w-full text-sm">
      No weather data was available from the default source ({defaultWeatherSourceCopy}),
      so another source was used ({weather.defaultSource}) and the Weather
      Source setting was automatically updated.
    </p>
  {/if}

  {#if projectHasRecentWeatherData}
    <div class="w-fit max-w-(--breakpoint-sm) text-left text-sm">
      <Accordion
        value={warningAccordionState}
        onValueChange={(e) => (warningAccordionState = e.value)}
        collapsible
        rounded="rounded-container"
        classes="bg-warning-500/20"
      >
        <Accordion.Item value="warning">
          {#snippet lead()}
            <TriangleAlertIcon />
          {/snippet}
          {#snippet control()}
            Weather within the past {weather.defaultSource === 'Open-Meteo'
              ? OPEN_METEO_DELAY_DAYS
              : weather.defaultSource === 'Meteostat'
                ? METEOSTAT_DELAY_DAYS
                : 'few'} days may be revised as new data comes in.
          {/snippet}
          {#snippet panel()}
            Weather data comes from <a
              href="https://open-meteo.com/"
              target="_blank"
              class="link">Open-Meteo</a
            >
            or
            <a href="https://meteostat.net" target="_blank" class="link"
              >Meteostat</a
            >, and for some locations their weather models may take up to a week
            to incorporate the latest information. Sometimes even older weather
            data is updated. Consider working at least {weather.defaultSource ===
            'Open-Meteo'
              ? OPEN_METEO_DELAY_DAYS
              : weather.defaultSource === 'Meteostat'
                ? METEOSTAT_DELAY_DAYS
                : 'a few'} days behind to account for possible changes. Sorry for
            any inconvenience.
          {/snippet}
        </Accordion.Item>
      </Accordion>
    </div>
  {/if}

  <div
    class="from-surface-600 to-surface-950 dark:from-surface-50 dark:to-surface-100 flex flex-wrap items-start justify-center gap-x-2 bg-linear-to-tr box-decoration-clone bg-clip-text text-transparent dark:text-transparent"
  >
    {#if weather.table.showParameters.tmax}
      <WeatherItem
        id="tmax"
        icon="↑"
        label="Highest Temperature"
        value={Math.max(...weather.params.tmax?.filter((n) => n !== null))}
        units={UNIT_LABELS.temperature[localState.value.units]}
      >
        {#snippet date()}
          <p class="text-xs">
            {#if weather.grouping === 'week'}Week of{/if}
            {tMaxDay?.date.toLocaleDateString()}
          </p>
        {/snippet}
      </WeatherItem>
    {/if}

    {#if weather.table.showParameters.tavg}
      <WeatherItem
        id="tavg"
        icon="~"
        label="Average Temperature"
        value={getAverage(weather.params.tavg?.filter((n) => n !== null))}
        units={UNIT_LABELS.temperature[localState.value.units]}
      />
    {/if}

    {#if weather.table.showParameters.tmin}
      <WeatherItem
        id="tmin"
        icon="↓"
        label="Lowest Temperature"
        value={Math.min(...weather.params.tmin?.filter((n) => n !== null))}
        units={UNIT_LABELS.temperature[localState.value.units]}
      >
        {#snippet date()}
          <p class="text-xs">
            {#if weather.grouping === 'week'}Week of{/if}
            {tMinDay?.date.toLocaleDateString()}
          </p>
        {/snippet}
      </WeatherItem>
    {/if}

    {#if weather.table.showParameters.prcp}
      <WeatherItem
        id="prcp"
        icon="∴"
        label="Total Rainfall"
        value={weather.params.prcp?.every((n) => n === null)
          ? '-'
          : displayNumber(
              weather.params.prcp
                ?.filter((n) => n !== null)
                ?.reduce((partialSum, a) => partialSum + a, 0),
            )}
        units={UNIT_LABELS.height[localState.value.units]}
      />
    {/if}

    {#if weather.table.showParameters.snow}
      <WeatherItem
        id="snow"
        icon="∗"
        label={locations.all?.every((n) => n.source === 'Meteostat')
          ? 'Highest Snow Depth'
          : 'Total SnowFall'}
        value={weather.params.snow?.every((n) => n === null)
          ? '-'
          : locations.all?.every((n) => n.source === 'Meteostat')
            ? Math.max(...weather.params.snow?.filter((n) => n !== null))
            : displayNumber(
                weather.params.snow
                  ?.filter((n) => n !== null)
                  ?.reduce((partialSum, a) => partialSum + a, 0),
              )}
        units={UNIT_LABELS.height[localState.value.units]}
      >
        {#snippet button()}
          <div class="my-2 text-sm">
            {#if locations.all.some((n) => n.source === 'Meteostat') && locations.all.some((n) => n.source === 'Open-Meteo')}
              <HelpIcon
                href="/documentation/#mixed-snow-parameters"
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
    {/if}

    {#if weather.table.showParameters.dayt}
      <WeatherItem
        id="dayt"
        icon="☼"
        label="Average Daytime"
        value={convertTime(
          getAverage(
            weather.params.dayt?.filter((n) => n !== null),
            { decimals: 6 },
          ),
        )}
      />
    {/if}
  </div>
</div>

<div bind:this={graph} class="w-full scroll-m-[60px]">
  {#if showWeatherChart}
    {#if weather.data.length}
      {#key localState.value.units}
        <WeatherChart />
      {/key}
    {/if}
  {:else}
    <div class="my-36"><Spinner /></div>
  {/if}
</div>

<div class="flex w-full flex-col items-center justify-center gap-4">
  <div class="flex flex-wrap items-center justify-center">
    <ToggleWeatherData
      view={weather.table.showParameters.tmax}
      onclick={() => {
        weather.table.showParameters.tmax = !weather.table.showParameters.tmax;
      }}
    >
      <span class="border-b-2 border-(--tmax)">High Temps</span>
    </ToggleWeatherData>

    <ToggleWeatherData
      view={weather.table.showParameters.tavg}
      onclick={() => {
        weather.table.showParameters.tavg = !weather.table.showParameters.tavg;
      }}
    >
      <span class="border-b-2 border-(--tavg)">Average Temps</span>
    </ToggleWeatherData>

    <ToggleWeatherData
      view={weather.table.showParameters.tmin}
      onclick={() => {
        weather.table.showParameters.tmin = !weather.table.showParameters.tmin;
      }}
    >
      <span class="border-b-2 border-(--tmin)">Low Temps</span>
    </ToggleWeatherData>

    <ToggleWeatherData
      view={weather.table.showParameters.prcp}
      onclick={() => {
        weather.table.showParameters.prcp = !weather.table.showParameters.prcp;
      }}
    >
      <span class="border-b-2 border-(--prcp)">Rain</span>
    </ToggleWeatherData>
    <ToggleWeatherData
      view={weather.table.showParameters.snow}
      onclick={() => {
        weather.table.showParameters.snow = !weather.table.showParameters.snow;
      }}
    >
      <span class="border-b-2 border-(--snow)">Snow</span>
    </ToggleWeatherData>
    <ToggleWeatherData
      view={weather.table.showParameters.dayt}
      onclick={() => {
        weather.table.showParameters.dayt = !weather.table.showParameters.dayt;
      }}
    >
      <span class="border-b-2 border-(--dayt)">Daytime</span>
    </ToggleWeatherData>
  </div>

  {#if isDataMissing}
    <div
      class="variant-outline-surface rounded-container flex w-fit max-w-(--breakpoint-sm) flex-col items-center justify-center gap-2 text-left text-sm"
    >
      <Accordion
        value={missingWeatherAccordionState}
        onValueChange={(e) => (missingWeatherAccordionState = e.value)}
        collapsible
        rounded="rounded-container"
        classes="preset-filled-surface-100-900"
      >
        <Accordion.Item value="missing">
          {#snippet lead()}
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="size-6"
              viewBox="0 0 24 24"
              ><path
                fill="currentColor"
                d="M21.86 12.5A4.313 4.313 0 0 0 19 11c0-1.95-.68-3.6-2.04-4.96C15.6 4.68 13.95 4 12 4c-1.58 0-3 .47-4.25 1.43s-2.08 2.19-2.5 3.72c-1.25.28-2.29.93-3.08 1.95S1 13.28 1 14.58c0 1.51.54 2.8 1.61 3.85C3.69 19.5 5 20 6.5 20h12c1.25 0 2.31-.44 3.19-1.31c.87-.88 1.31-1.94 1.31-3.19c0-1.15-.38-2.15-1.14-3m-1.59 4.77c-.48.49-1.07.73-1.77.73h-12c-.97 0-1.79-.34-2.47-1C3.34 16.29 3 15.47 3 14.5s.34-1.79 1.03-2.47C4.71 11.34 5.53 11 6.5 11H7c0-1.38.5-2.56 1.46-3.54C9.44 6.5 10.62 6 12 6s2.56.5 3.54 1.46C16.5 8.44 17 9.62 17 11v2h1.5c.7 0 1.29.24 1.77.73S21 14.8 21 15.5s-.24 1.29-.73 1.77M11 15h2v2h-2zm3.43-6.32c.54.45.81 1.07.81 1.82c0 .5-.15.91-.44 1.32c-.3.39-.67.68-1.13.93c-.26.16-.43.32-.52.51A1.7 1.7 0 0 0 13 14h-2c0-.55.11-.92.3-1.18c.2-.26.55-.57 1.07-.91c.26-.16.47-.35.63-.59c.15-.23.23-.51.23-.82c0-.32-.09-.56-.27-.74c-.18-.2-.46-.29-.76-.29c-.27 0-.49.08-.7.23c-.15.15-.25.38-.25.69H9.28c-.05-.75.22-1.39.78-1.8C10.6 8.2 11.31 8 12.2 8c.94 0 1.69.23 2.23.68"
              /></svg
            >
          {/snippet}
          {#snippet control()}
            There's some missing data
          {/snippet}
          {#snippet panel()}
            {#each missingDataMerged as { count, type, label }}
              {#if count && count < weather.data?.length}
                {count}
                {pluralize(weather.grouping, count)} with missing {label}
                {pluralize(type, count)}.
              {:else if count && count === weather.data?.length}
                No days have {label}
                {type} data.
              {/if}
            {/each}
            <div class="mt-2 flex flex-col gap-2">
              <div>
                <p class="">
                  If you want, here are some ways you can try to fix missing
                  data:
                </p>
                <div class="ml-4 flex flex-col">
                  <p>
                    - Search for a different location or dates. Use only dates
                    that are in the past.
                  </p>
                  <p>
                    - Choose a different
                    <button
                      class="link"
                      onclick={() => {
                        modal.trigger({
                          type: 'component',
                          component: {
                            ref: ChooseWeatherSource,
                          },
                        });
                      }}>Weather Source</button
                    >.
                  </p>
                  <p>- Edit the table below to fill in missing values.</p>
                </div>
              </div>
              <p class="">
                You can also continue using the Project Planner, but some
                features may not be as useful—especially if there's a lot of
                missing weather data.
              </p>
            </div>
          {/snippet}
        </Accordion.Item>
      </Accordion>
    </div>
  {/if}
</div>

<div class="mt-2">
  {#if weather.data.length}
    {#if !gauges.activeGauge?.calculating}
      <WeatherNavigator />
    {/if}
  {/if}
</div>

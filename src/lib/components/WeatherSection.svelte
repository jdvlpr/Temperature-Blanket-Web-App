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
  import { gauges, localState, locations, dialog, weather } from '$lib/state';
  import {
    convertTime,
    displayNumber,
    getAverage,
    isDateWithinLastSevenDays,
    pluralize,
  } from '$lib/utils';
  import {
    ChevronDownIcon,
    CloudAlert,
    TriangleAlertIcon,
  } from '@lucide/svelte';
  import { Accordion, Popover, Portal } from '@skeletonlabs/skeleton-svelte';
  import { onMount } from 'svelte';
  import { slide } from 'svelte/transition';
  import UnitChanger from './UnitChanger.svelte';
  import WeatherGrouping from './WeatherGrouping.svelte';
  import WeatherSourceButton from './buttons/WeatherSourceButton.svelte';
  import WeatherDescription from './WeatherDescription.svelte';

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

  function getMissingDataMerged(missingData: any[]) {
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
</script>

<div class="mt-2 flex w-full flex-col items-center justify-center gap-2">
  <div class="flex w-full flex-wrap items-center justify-center gap-x-4">
    <div class="my-4 flex flex-wrap items-center justify-center gap-4">
      <WeatherSourceButton />

      <UnitChanger />

      <WeatherGrouping />
    </div>

    {#if weather.grouping === 'week'}
      <div
        class="rounded-container bg-surface-100 dark:bg-surface-900 mb-4 flex w-full max-w-screen-md flex-col items-start justify-start gap-2 p-2 text-left"
      >
        <p class="">
          Weekly weather grouping can result in a shorter project. <a
            href="/documentation/#grouping-weather-data"
            target="_blank"
            class="link"
            rel="noopener noreferrer">Read more details.</a
          >
          {#if weather.groupedByWeek}
            Your project starts on {DAYS_OF_THE_WEEK.filter(
              (n) => n.value === weather.groupedByWeek[0].date.getUTCDay(),
            )[0].label},
            {MONTHS.filter(
              (n) =>
                n.value - 1 === weather.groupedByWeek[0].date.getUTCMonth(),
            )[0]?.name}
            {weather.groupedByWeek[0].date.getUTCDate()},
            {weather.groupedByWeek[0].date.getUTCFullYear()}. It spans {weather
              .groupedByWeek.length}
            {pluralize('week', weather.groupedByWeek.length)}.
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
  </div>

  {#if wasDefaultWeatherSourceChanged}
    <p class="w-full text-sm">
      No weather data was available from the default source ({defaultWeatherSourceCopy}),
      so another source was used ({weather.source.name}) and the Weather Source
      setting was automatically updated.
    </p>
  {/if}

  {#if projectHasRecentWeatherData}
    <div class="w-fit max-w-(--breakpoint-sm) text-left text-sm">
      <Popover>
        <Popover.Trigger
          class="btn hover:preset-tonal text-warning-800-200 text-left text-sm whitespace-pre-wrap"
        >
          <TriangleAlertIcon size="18" />
          <p>
            Weather within the past {weather.source.name === 'Open-Meteo'
              ? OPEN_METEO_DELAY_DAYS
              : weather.source.name === 'Meteostat'
                ? METEOSTAT_DELAY_DAYS
                : 'few'} days may be revised as new data comes in.
          </p>
        </Popover.Trigger>
        <Portal>
          <Popover.Positioner>
            <Popover.Content
              class="card bg-surface-200-800 z-49 w-[90vw] max-w-screen-md p-4 shadow-xl"
            >
              {#snippet element(attributes)}
                {#if !attributes.hidden}
                  <div {...attributes} transition:slide={{ duration: 150 }}>
                    <Popover.Description>
                      Weather data comes from <a
                        href="https://open-meteo.com/"
                        target="_blank"
                        class="link">Open-Meteo</a
                      >
                      or
                      <a
                        href="https://meteostat.net"
                        target="_blank"
                        class="link">Meteostat</a
                      >, and for some locations their weather models may take up
                      to a week to incorporate the latest information. Sometimes
                      even older weather data is updated. Consider working at
                      least {weather.source.name === 'Open-Meteo'
                        ? OPEN_METEO_DELAY_DAYS
                        : weather.source.name === 'Meteostat'
                          ? METEOSTAT_DELAY_DAYS
                          : 'a few'} days behind to account for possible changes.
                      Sorry for any inconvenience.
                    </Popover.Description>

                    <Popover.Arrow
                      style="--arrow-size: calc(var(--spacing) * 4); --arrow-background: var(--color-surface-200-800);"
                    >
                      <Popover.ArrowTip />
                    </Popover.Arrow>
                  </div>
                {/if}
              {/snippet}
            </Popover.Content>
          </Popover.Positioner>
        </Portal>
      </Popover>
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
        value={Math.max(
          ...(weather.params.tmax?.filter((n) => n !== null) as number[]),
        )}
        units={UNIT_LABELS.temperature[localState.value.units]}
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
    {/if}

    {#if weather.table.showParameters.tavg}
      <WeatherItem
        id="tavg"
        icon="~"
        label="Average Temperature"
        value={getAverage(
          weather.params.tavg?.filter((n) => n !== null) as number[],
        )}
        units={UNIT_LABELS.temperature[localState.value.units]}
      />
    {/if}

    {#if weather.table.showParameters.tmin}
      <WeatherItem
        id="tmin"
        icon="↓"
        label="Lowest Temperature"
        value={Math.min(
          ...(weather.params.tmin?.filter((n) => n !== null) as number[]),
        )}
        units={UNIT_LABELS.temperature[localState.value.units]}
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
                ?.reduce((partialSum: number, a: any) => partialSum + a, 0),
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
            ? Math.max(
                ...(weather.params.snow?.filter((n) => n !== null) as number[]),
              )
            : displayNumber(
                weather.params.snow
                  ?.filter((n) => n !== null)
                  ?.reduce((partialSum: number, a: any) => partialSum + a, 0),
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
            weather.params.dayt?.filter((n) => n !== null) as number[],
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

    <ToggleWeatherData
      view={weather.table.showParameters.moon}
      onclick={() => {
        weather.table.showParameters.moon = !weather.table.showParameters.moon;
      }}
    >
      <span class="border-b-2 border-(--moon)">Moon Phase </span>
    </ToggleWeatherData>
  </div>

  {#if isDataMissing}
    <div
      class="variant-outline-surface rounded-container flex w-fit max-w-(--breakpoint-sm) flex-col items-center justify-center gap-2 text-left text-sm"
    >
      <Popover>
        <Popover.Trigger
          class="btn hover:preset-tonal text-warning-800-200 text-left text-sm whitespace-pre-wrap"
        >
          <CloudAlert size="18" />
          There's some missing data
        </Popover.Trigger>
        <Portal>
          <Popover.Positioner>
            <Popover.Content
              class="card bg-surface-200-800 z-49 w-[90vw] max-w-screen-md p-4 shadow-xl"
            >
              {#snippet element(attributes)}
                {#if !attributes.hidden}
                  <div {...attributes} transition:slide={{ duration: 150 }}>
                    <Popover.Description>
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
                            If you want, here are some ways you can try to fix
                            missing data:
                          </p>
                          <div class="ml-4 flex flex-col">
                            <p>
                              - Search for a different location or dates. Use
                              only dates that are in the past.
                            </p>
                            <p>
                              - Choose a different
                              <button
                                class="link"
                                onclick={() => {
                                  dialog.trigger({
                                    type: 'component',
                                    component: {
                                      ref: ChooseWeatherSource,
                                    },
                                  });
                                }}>Weather Source</button
                              >.
                            </p>
                            <p>
                              - Edit the table below to fill in missing values.
                            </p>
                          </div>
                        </div>
                        <p class="">
                          You can also continue using the Project Planner, but
                          some features may not be as useful—especially if
                          there's a lot of missing weather data.
                        </p>
                      </div>
                    </Popover.Description>
                    <Popover.Arrow
                      style="--arrow-size: calc(var(--spacing) * 4); --arrow-background: var(--color-surface-200-800);"
                    >
                      <Popover.ArrowTip />
                    </Popover.Arrow>
                  </div>
                {/if}
              {/snippet}
            </Popover.Content>
          </Popover.Positioner>
        </Portal>
      </Popover>
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

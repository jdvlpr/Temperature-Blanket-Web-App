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
  import { browser } from '$app/environment';
  import Spinner from '$lib/components/Spinner.svelte';
  import UnitChanger from '$lib/components/UnitChanger.svelte';
  import WeatherChart, {
    weatherChart,
  } from '$lib/components/WeatherChart.svelte';
  import WeatherGrouping from '$lib/components/WeatherGrouping.svelte';
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
  import {
    activeWeatherElementIndex,
    dayt,
    defaultWeatherSource,
    isCustomWeather,
    locations,
    modal,
    prcp,
    showNavigationSideBar,
    snow,
    tavg,
    tmax,
    tmin,
    units,
    weather,
    weatherGroupedByWeek,
    weatherGrouping,
    weatherMonthGroupingStartDay,
    weatherParametersInView,
    weatherUngrouped,
  } from '$lib/stores';
  import {
    convertTime,
    createWeeksProperty,
    delay,
    displayNumber,
    getAverage,
    isDateWithinLastSevenDays,
    pluralize,
  } from '$lib/utils';
  import { Accordion, AccordionItem } from '@skeletonlabs/skeleton';
  import { onDestroy, onMount } from 'svelte';

  let graph;
  let isAnyWeatherSourceDifferentFromDefault;
  let defaultWeatherSourceCopy;
  let wasDefaultWeatherSourceChanged = false;
  let showWeatherChart = true;
  let windowWidth;

  let debounceTimer;
  const debounce = (callback, time) => {
    if (!browser) return;
    window.clearTimeout(debounceTimer);
    debounceTimer = window.setTimeout(callback, time);
  };

  onMount(() => {
    isAnyWeatherSourceDifferentFromDefault = !$locations?.some(
      (n) => n.source === $defaultWeatherSource,
    );

    defaultWeatherSourceCopy = $defaultWeatherSource;
    if (isAnyWeatherSourceDifferentFromDefault) {
      if ($locations?.every((n) => n.source === 'Meteostat')) {
        $defaultWeatherSource = 'Meteostat';
        wasDefaultWeatherSourceChanged = true;
      } else if ($locations?.every((n) => n.source === 'Open-Meteo')) {
        $defaultWeatherSource = 'Open-Meteo';
        wasDefaultWeatherSourceChanged = true;
      }
    }

    windowWidth = window.innerWidth;

    window.addEventListener('resize', updateShowWeatherChart, {
      passive: true,
    });
  });

  onDestroy(() => {
    if (!browser) return;
    window.removeEventListener('resize', updateShowWeatherChart);
  });

  $: if ($activeWeatherElementIndex) triggerHover($activeWeatherElementIndex);

  $: missingTmin = $tmin.filter((n) => n === null);
  $: missingTavg = $tavg.filter((n) => n === null);
  $: missingTmax = $tmax.filter((n) => n === null);
  $: missingPrcp = $prcp.filter((n) => n === null);
  $: missingSnow = $snow.filter((n) => n === null);
  $: missingData = [
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
  ];

  $: isDataMissing =
    !!missingTmin.length || !!missingTavg.length || !!missingTmax.length;

  $: tMinDay = $weather
    ? $weather
        .map((day, index) => {
          return { ...day, index };
        })
        .filter((day) => day.tmin[$units] !== null)
        .reduce((prev, curr) =>
          prev.tmin[$units] < curr.tmin[$units] ? prev : curr,
        )
    : null;

  $: tMaxDay = $weather
    ? $weather
        .map((day, index) => {
          return { ...day, index };
        })
        .filter((day) => day.tmax[$units] !== null)
        .reduce((prev, curr) =>
          prev.tmax[$units] > curr.tmax[$units] ? prev : curr,
        )
    : null;

  $: missingDataMerged = getMissingDataMerged(missingData);

  $: $showNavigationSideBar, forceUpdateShowWeatherChart();

  $: projectHasRecentWeatherData = $weather?.some((date) => {
    return isDateWithinLastSevenDays(date?.date);
  });

  $: data = createWeeksProperty({
    weatherData: $weatherUngrouped,
    dowOffset: $weatherMonthGroupingStartDay,
  });
  $: length = [...new Set(data?.map((day) => day.weekId))].length;

  async function updateShowWeatherChart() {
    debounce(async () => {
      // I think sometimes on scroll this would trigger a window width change
      // So check if the window actually resized
      if (window.innerWidth === windowWidth) return;
      showWeatherChart = false;
      // Delay in order to let the navigation bar finish it's animation.
      await delay(400);
      showWeatherChart = true;
      windowWidth = window.innerWidth;
    }, 450);
  }

  async function forceUpdateShowWeatherChart() {
    debounce(async () => {
      showWeatherChart = false;
      // Delay in order to let the navigation bar finish it's animation.
      await delay(400);
      showWeatherChart = true;
      windowWidth = window.innerWidth;
    }, 450);
  }

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

  function triggerHover(index) {
    const datasets = $weatherChart._metasets
      .filter((item) => item.hidden !== true)
      .map((item) => {
        return {
          datasetIndex: item.index,
          index,
        };
      });

    $weatherChart.setActiveElements(datasets);
    $activeWeatherElementIndex = index;
    $weatherChart.update();
  }
</script>

<div class="flex flex-col gap-4 justify-center w-full items-center mt-4">
  <div class="flex flex-wrap gap-4 items-start justify-center w-full">
    <UnitChanger />

    <WeatherGrouping />

    <button
      class="btn bg-secondary-hover-token w-fit"
      on:click={() => {
        modal.state.trigger({
          type: 'component',
          component: {
            ref: ChooseWeatherSource,
          },
        });
      }}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        stroke-width="1.5"
        stroke="currentColor"
        class="w-6 h-6"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          d="M10.343 3.94c.09-.542.56-.94 1.11-.94h1.093c.55 0 1.02.398 1.11.94l.149.894c.07.424.384.764.78.93.398.164.855.142 1.205-.108l.737-.527a1.125 1.125 0 011.45.12l.773.774c.39.389.44 1.002.12 1.45l-.527.737c-.25.35-.272.806-.107 1.204.165.397.505.71.93.78l.893.15c.543.09.94.56.94 1.109v1.094c0 .55-.397 1.02-.94 1.11l-.893.149c-.425.07-.765.383-.93.78-.165.398-.143.854.107 1.204l.527.738c.32.447.269 1.06-.12 1.45l-.774.773a1.125 1.125 0 01-1.449.12l-.738-.527c-.35-.25-.806-.272-1.203-.107-.397.165-.71.505-.781.929l-.149.894c-.09.542-.56.94-1.11.94h-1.094c-.55 0-1.019-.398-1.11-.94l-.148-.894c-.071-.424-.384-.764-.781-.93-.398-.164-.854-.142-1.204.108l-.738.527c-.447.32-1.06.269-1.45-.12l-.773-.774a1.125 1.125 0 01-.12-1.45l.527-.737c.25-.35.273-.806.108-1.204-.165-.397-.505-.71-.93-.78l-.894-.15c-.542-.09-.94-.56-.94-1.109v-1.094c0-.55.398-1.02.94-1.11l.894-.149c.424-.07.765-.383.93-.78.165-.398.143-.854-.107-1.204l-.527-.738a1.125 1.125 0 01.12-1.45l.773-.773a1.125 1.125 0 011.45-.12l.737.527c.35.25.807.272 1.204.107.397-.165.71-.505.78-.929l.15-.894z"
        />
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
        />
      </svg>

      <span class="whitespace-pre-wrap text-left"
        >Weather Source: {$isCustomWeather
          ? 'Custom'
          : $defaultWeatherSource}</span
      >
    </button>
  </div>

  {#if wasDefaultWeatherSourceChanged}
    <p class="text-sm w-full">
      No weather data was available from the default source ({defaultWeatherSourceCopy}),
      so another source was used ({$defaultWeatherSource}) and the Weather
      Source setting was automatically updated.
    </p>
  {/if}

  {#if $weatherGrouping === 'week'}
    <div
      class="rounded-container-token flex flex-col gap-2 items-center justify-center w-full"
    >
      <p class="text-sm">
        Weekly weather grouping makes for a shorter project. <a
          href="/documentation/#grouping-weather-data"
          target="_blank"
          class="link"
          rel="noopener noreferrer">Read more details.</a
        >
        {#if $weatherGroupedByWeek}
          Your project starts on {DAYS_OF_THE_WEEK.filter(
            (n) => n.value === $weatherGroupedByWeek[0].date.getDay(),
          )[0].label},
          {MONTHS.filter(
            (n) => n.value - 1 === $weatherGroupedByWeek[0].date.getMonth(),
          )[0]?.name}
          {$weatherGroupedByWeek[0].date.getDate()},
          {$weatherGroupedByWeek[0].date.getFullYear()}. It spans {length}
          {pluralize('week', length)}.
        {/if}
      </p>
      <label class="label flex-col flex">
        <span>Weeks Start On</span>
        <select
          class="select w-fit"
          bind:value={$weatherMonthGroupingStartDay}
          id="weather-weeks-start-week-on"
        >
          {#each DAYS_OF_THE_WEEK as { value, label }}
            <option {value}>{label}</option>
          {/each}
        </select>
      </label>
    </div>
  {/if}

  {#if projectHasRecentWeatherData}
    <div
      class="variant-ghost-warning rounded-container-token text-token text-left w-fit max-w-screen-sm text-sm"
    >
      <Accordion>
        <AccordionItem>
          <svelte:fragment slot="lead">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke-width="1.5"
              stroke="currentColor"
              class="size-6"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z"
              />
            </svg>
          </svelte:fragment>
          <svelte:fragment slot="summary">
            Weather within the past {$defaultWeatherSource === 'Open-Meteo'
              ? OPEN_METEO_DELAY_DAYS
              : $defaultWeatherSource === 'Meteostat'
                ? METEOSTAT_DELAY_DAYS
                : 'few'} days may be revised as new data comes in.
          </svelte:fragment>
          <svelte:fragment slot="content">
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
            data is updated. Consider working at least {$defaultWeatherSource ===
            'Open-Meteo'
              ? OPEN_METEO_DELAY_DAYS
              : $defaultWeatherSource === 'Meteostat'
                ? METEOSTAT_DELAY_DAYS
                : 'a few'} days behind to account for possible changes. Sorry for
            any inconvenience.
          </svelte:fragment>
        </AccordionItem>
      </Accordion>
    </div>
  {/if}

  <div class="flex flex-wrap gap-x-2 items-start justify-center">
    {#if $weatherParametersInView.tmax}
      <WeatherItem
        id="tmax"
        icon="&uarr;"
        label="Highest Temperature"
        value={Math.max(...$tmax?.filter((n) => n !== null))}
        units={UNIT_LABELS.temperature[$units]}
      >
        <div slot="button">
          <button
            class="btn text-sm bg-secondary-hover-token"
            title="Go to Date"
            on:click={(e) => {
              e.stopPropagation();
              triggerHover(tMaxDay.index);
              graph.scrollIntoView({
                behavior: 'smooth',
                block: 'start',
              });
            }}
          >
            {#if $weatherGrouping === 'week'}Week of{/if}
            {tMaxDay?.date.toLocaleDateString()}
          </button>
        </div>
      </WeatherItem>
    {/if}

    {#if $weatherParametersInView.tavg}
      <WeatherItem
        id="tavg"
        icon="~"
        label="Average Temperature"
        value={getAverage($tavg?.filter((n) => n !== null))}
        units={UNIT_LABELS.temperature[$units]}
      />
    {/if}

    {#if $weatherParametersInView.tmin}
      <WeatherItem
        id="tmin"
        icon="&darr;"
        label="Lowest Temperature"
        value={Math.min(...$tmin?.filter((n) => n !== null))}
        units={UNIT_LABELS.temperature[$units]}
      >
        <div slot="button">
          <button
            class="btn text-sm bg-secondary-hover-token"
            title="Go to Date"
            on:click={(e) => {
              e.stopPropagation();
              triggerHover(tMinDay.index);
              graph.scrollIntoView({
                behavior: 'smooth',
                block: 'start',
              });
            }}
          >
            {#if $weatherGrouping === 'week'}Week of{/if}
            {tMinDay?.date.toLocaleDateString()}
          </button>
        </div>
      </WeatherItem>
    {/if}

    {#if $weatherParametersInView.prcp}
      <WeatherItem
        id="prcp"
        icon="∴"
        label="Total Rainfall"
        value={$prcp?.every((n) => n === null)
          ? '-'
          : displayNumber(
              $prcp
                ?.filter((n) => n !== null)
                ?.reduce((partialSum, a) => partialSum + a, 0),
            )}
        units={UNIT_LABELS.height[$units]}
      />
    {/if}

    {#if $weatherParametersInView.snow}
      <WeatherItem
        id="snow"
        icon="∗"
        label={$locations?.every((n) => n.source === 'Meteostat')
          ? 'Highest Snow Depth'
          : 'Total SnowFall'}
        value={$snow?.every((n) => n === null)
          ? '-'
          : $locations?.every((n) => n.source === 'Meteostat')
            ? Math.max(...$snow?.filter((n) => n !== null))
            : displayNumber(
                $snow
                  ?.filter((n) => n !== null)
                  ?.reduce((partialSum, a) => partialSum + a, 0),
              )}
        units={UNIT_LABELS.height[$units]}
      >
        <div slot="button" class="my-2 text-sm">
          {#if $locations.some((n) => n.source === 'Meteostat') && $locations.some((n) => n.source === 'Open-Meteo')}
            <HelpIcon
              href="/documentation/#mixed-snow-parameters"
              title="Read About Mixed Snow Parameters"
            >
              <span slot="text" class="link">Error: Mixed Parameters</span>
            </HelpIcon>
          {/if}
        </div>
      </WeatherItem>
    {/if}

    {#if $weatherParametersInView.dayt}
      <WeatherItem
        id="dayt"
        icon="☼"
        label="Average Daytime"
        value={convertTime(
          getAverage(
            $dayt?.filter((n) => n !== null),
            { decimals: 6 },
          ),
        )}
      />
    {/if}
  </div>
</div>

<div bind:this={graph} class="scroll-m-[60px] w-full">
  {#if showWeatherChart}
    {#key $weather}
      {#key $units}
        <WeatherChart />
      {/key}
    {/key}
  {:else}
    <div class="my-36"><Spinner /></div>
  {/if}
</div>

<div class="flex flex-col justify-center w-full items-center gap-4">
  <div class="flex flex-wrap justify-center items-center">
    <ToggleWeatherData
      view={$weatherParametersInView.tmax}
      on:click={() => {
        $weatherParametersInView.tmax = !$weatherParametersInView.tmax;
        $weatherParametersInView = $weatherParametersInView;
      }}
    >
      <span class="border-b-2 border-tmax">High Temps</span>
    </ToggleWeatherData>

    <ToggleWeatherData
      view={$weatherParametersInView.tavg}
      on:click={() => {
        $weatherParametersInView.tavg = !$weatherParametersInView.tavg;
        $weatherParametersInView = $weatherParametersInView;
      }}
    >
      <span class="border-b-2 border-tavg">Average Temps</span>
    </ToggleWeatherData>

    <ToggleWeatherData
      view={$weatherParametersInView.tmin}
      on:click={() => {
        $weatherParametersInView.tmin = !$weatherParametersInView.tmin;
        $weatherParametersInView = $weatherParametersInView;
      }}
    >
      <span class="border-b-2 border-tmin">Low Temps</span>
    </ToggleWeatherData>

    <ToggleWeatherData
      view={$weatherParametersInView.prcp}
      on:click={() => {
        $weatherParametersInView.prcp = !$weatherParametersInView.prcp;
        $weatherParametersInView = $weatherParametersInView;
      }}
    >
      <span class="border-b-2 border-prcp">Rain</span>
    </ToggleWeatherData>
    <ToggleWeatherData
      view={$weatherParametersInView.snow}
      on:click={() => {
        $weatherParametersInView.snow = !$weatherParametersInView.snow;
        $weatherParametersInView = $weatherParametersInView;
      }}
    >
      <span class="border-b-2 border-snow">Snow</span>
    </ToggleWeatherData>
    <ToggleWeatherData
      view={$weatherParametersInView.dayt}
      on:click={() => {
        $weatherParametersInView.dayt = !$weatherParametersInView.dayt;
        $weatherParametersInView = $weatherParametersInView;
      }}
    >
      <span class="border-b-2 border-dayt">Daytime</span>
    </ToggleWeatherData>
  </div>

  {#if isDataMissing}
    <div
      class="variant-outline-surface rounded-container-token text-token flex flex-col gap-2 justify-center items-center text-left w-fit max-w-screen-sm text-sm"
    >
      <Accordion>
        <AccordionItem>
          <svelte:fragment slot="lead"
            ><svg
              xmlns="http://www.w3.org/2000/svg"
              class="size-6"
              viewBox="0 0 24 24"
              ><path
                fill="currentColor"
                d="M21.86 12.5A4.313 4.313 0 0 0 19 11c0-1.95-.68-3.6-2.04-4.96C15.6 4.68 13.95 4 12 4c-1.58 0-3 .47-4.25 1.43s-2.08 2.19-2.5 3.72c-1.25.28-2.29.93-3.08 1.95S1 13.28 1 14.58c0 1.51.54 2.8 1.61 3.85C3.69 19.5 5 20 6.5 20h12c1.25 0 2.31-.44 3.19-1.31c.87-.88 1.31-1.94 1.31-3.19c0-1.15-.38-2.15-1.14-3m-1.59 4.77c-.48.49-1.07.73-1.77.73h-12c-.97 0-1.79-.34-2.47-1C3.34 16.29 3 15.47 3 14.5s.34-1.79 1.03-2.47C4.71 11.34 5.53 11 6.5 11H7c0-1.38.5-2.56 1.46-3.54C9.44 6.5 10.62 6 12 6s2.56.5 3.54 1.46C16.5 8.44 17 9.62 17 11v2h1.5c.7 0 1.29.24 1.77.73S21 14.8 21 15.5s-.24 1.29-.73 1.77M11 15h2v2h-2zm3.43-6.32c.54.45.81 1.07.81 1.82c0 .5-.15.91-.44 1.32c-.3.39-.67.68-1.13.93c-.26.16-.43.32-.52.51A1.7 1.7 0 0 0 13 14h-2c0-.55.11-.92.3-1.18c.2-.26.55-.57 1.07-.91c.26-.16.47-.35.63-.59c.15-.23.23-.51.23-.82c0-.32-.09-.56-.27-.74c-.18-.2-.46-.29-.76-.29c-.27 0-.49.08-.7.23c-.15.15-.25.38-.25.69H9.28c-.05-.75.22-1.39.78-1.8C10.6 8.2 11.31 8 12.2 8c.94 0 1.69.23 2.23.68"
              /></svg
            ></svelte:fragment
          >
          <svelte:fragment slot="summary"
            >There's some missing data</svelte:fragment
          >
          <svelte:fragment slot="content">
            {#each missingDataMerged as { count, type, label }}
              {#if count && count < $weather?.length}
                {count}
                {pluralize($weatherGrouping, count)} with missing {label}
                {pluralize(type, count)}.&nbsp;
              {:else if count && count === $weather?.length}
                No days have {label}
                {type} data.
              {/if}
            {/each}
            <div class="flex flex-col gap-2 mt-2">
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
                      on:click={() => {
                        modal.state.trigger({
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
          </svelte:fragment>
        </AccordionItem>
      </Accordion>
    </div>
  {/if}
</div>

<div class="mt-2">
  {#if $weather}
    <WeatherNavigator data={$weather ? $weather : []} />
  {/if}
</div>

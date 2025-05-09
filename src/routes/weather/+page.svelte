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

<script module>
  class WeatherState {
    hour = $state('24');
    weatherLocations = $state([]);
    activeLocationID = $state(null);
    weatherDataElement = $state(null);
  }

  export const weatherState = new WeatherState();
</script>

<script lang="ts">
  import { browser } from '$app/environment';
  import { page } from '$app/state';
  import { PUBLIC_BASE_URL } from '$env/static/public';
  import AppLogo from '$lib/components/AppLogo.svelte';
  import AppShell from '$lib/components/AppShell.svelte';
  import Footer from '$lib/components/Footer.svelte';
  import Share from '$lib/components/Share.svelte';
  import Spinner from '$lib/components/Spinner.svelte';
  import UnitChanger from '$lib/components/UnitChanger.svelte';
  import {
    localState,
    locations,
    modal,
    project,
    showNavigationSideBar,
  } from '$lib/state';
  import {
    delay,
    getWeatherCodeDetails,
    setUnitsFromNavigator,
  } from '$lib/utils';
  import { ListIcon, PlusIcon, SettingsIcon } from '@lucide/svelte';
  import { onDestroy, onMount, tick } from 'svelte';
  import { fade } from 'svelte/transition';
  import Chart from './Chart.svelte';
  import { fetchData } from './GetWeather.svelte';
  import Location from './Location.svelte';
  import Menu from './Menu.svelte';
  import Symbols from './Symbols.svelte';

  let showChart = $state(true);

  let shareableURL = $state(page.url.href);

  let mounted = $state(true);

  let windowWidth;

  let debounceTimer;
  const debounce = (callback, time) => {
    if (!browser) return;
    window.clearTimeout(debounceTimer);
    debounceTimer = window.setTimeout(callback, time);
  };

  function getShareableURL({ id, units, hourFormat }) {
    if (!id || !units || !hourFormat) return; // prevents from running durring mount, I think ?
    page.url.searchParams.set('id', id);
    page.url.searchParams.set('h', hourFormat === '12' ? '0' : '1');
    page.url.searchParams.set('u', units === 'metric' ? 'm' : 'i');
    shareableURL = page.url.href;
  }

  async function updateShowChart() {
    debounce(async () => {
      // I think sometimes on scroll this would trigger a window width change
      // So check if the window actually resized
      if (window.innerWidth === windowWidth) return;
      showChart = false;
      // Delay in order to let the navigation bar finish it's animation.
      await delay(400);
      showChart = true;
      windowWidth = window.innerWidth;
    }, 450);
  }

  async function forceUpdateShowChart() {
    debounce(async () => {
      showChart = false;
      await delay(400); // Delay in order to let the navigation bar finish it's animation.
      showChart = true;
      windowWidth = window.innerWidth;
    }, 450);
  }

  function getCurrentTime({ weatherData, hourFormat }) {
    if (!browser || !weatherData) return;
    const locale = navigator.languages
      ? navigator.languages[0]
      : navigator.language;
    const date = new Date(weatherData?.current_weather.time).toLocaleDateString(
      locale,
      {
        dateStyle: 'short',
      },
    );
    const time = new Date(weatherData?.current_weather.time).toLocaleTimeString(
      locale,
      {
        timeStyle: 'short',
        hour12: hourFormat === '12' ? true : false,
      },
    );

    return date + ' ' + time;
  }

  // function to calculate local time
  // in a different city
  // given the city’s UTC offset
  function timezoneOffsetToLocalDate(offset) {
    // create Date object for current location
    let d = new Date();

    // convert to msec
    // add local time zone offset
    // get UTC time in msec
    let utc = d.getTime() + d.getTimezoneOffset() * 60000;

    // create new Date object for different city
    // using supplied offset
    let nd = new Date(utc + 3600000 * offset);

    // return time as a string
    return nd;
  }

  let weatherData = $derived(
    weatherState.weatherLocations?.find(
      (item) => item.id === weatherState.activeLocationID,
    )?.data || null,
  );

  let hourlyData = $derived(
    weatherData?.hourly.time.map((item, index) => {
      const date = new Date(item);

      const tzItemOffsetHr = weatherData.utc_offset_seconds / 60 / 60;

      const localDateInTimeZone = timezoneOffsetToLocalDate(tzItemOffsetHr);

      const isNow =
        date.getUTCFullYear() === localDateInTimeZone.getUTCFullYear() &&
        date.getUTCDate() === localDateInTimeZone.getUTCDate() &&
        date.getUTCHours() === localDateInTimeZone.getUTCHours();

      return {
        isNow,
        time: item,
        apparent_temperature: weatherData?.hourly.apparent_temperature[index],
        cloudcover: weatherData?.hourly.cloudcover[index],
        is_day: weatherData?.hourly.is_day[index],
        precipitation_probability:
          weatherData?.hourly.precipitation_probability[index],
        temperature_2m: weatherData?.hourly.temperature_2m[index],
        weathercode: weatherData?.hourly.weathercode[index],
      };
    }),
  );

  let dailyWeatherData = $derived(
    weatherData?.daily.time.map((item, index) => {
      return {
        time: item,
        temperature_2m_max: weatherData?.daily.temperature_2m_max[index],
        temperature_2m_min: weatherData?.daily.temperature_2m_min[index],
        precipitation_probability_max:
          weatherData?.daily.precipitation_probability_max[index],
        weathercode: weatherData?.daily.weathercode[index],
      };
    }),
  );

  let hourlyForcastData = $derived(
    hourlyData?.slice(
      hourlyData.map((item) => item.isNow).indexOf(true),
      hourlyData.map((item) => item.isNow).indexOf(true) + 24,
    ),
  );

  let currentTime = $derived(
    getCurrentTime({
      weatherData: weatherData,
      hourFormat: weatherState.hour,
    }),
  );

  // Update the weather chart when the sidebar is closed or opened
  $effect(() => {
    showNavigationSideBar.value;
    forceUpdateShowChart();
  });

  $effect(() => {
    weatherState.activeLocationID;
    localState.value.units;
    weatherState.hour;
    getShareableURL({
      id: weatherState.activeLocationID,
      units: localState.value.units,
      hourFormat: weatherState.hour,
    });
  });

  $effect(async () => {
    localStorage.setItem('[/weather]units', localState.value.units);
    if (
      weatherState.weatherLocations?.some(
        (item) => item.units !== localState.value.units,
      )
    )
      await fetchData();
  });

  onMount(async () => {
    // units
    const paramUnits = page.url.searchParams.get('u');
    if (paramUnits === 'i') localState.value.units = 'imperial';
    else if (paramUnits === 'm') localState.value.units = 'metric';
    else if (localStorage.getItem('[/weather]units'))
      localState.value.units = localStorage.getItem('[/weather]units');
    else setUnitsFromNavigator();

    // hour12
    const hourFormat = page.url.searchParams.get('h');
    if (hourFormat === '0') weatherState.hour = '12';
    else if (hourFormat === '1') weatherState.hour = '24';
    else if (localStorage.getItem('[/weather]hour_format'))
      weatherState.hour = localStorage.getItem('[/weather]hour_format');
    else weatherState.hour = localState.value.units === 'metric' ? '24' : '12';

    // saved weather locations
    if (localStorage.getItem('[/weather]locations')) {
      weatherState.weatherLocations = JSON.parse(
        localStorage.getItem('[/weather]locations'),
      ).map((item) => {
        return { ...item, id: +item.id };
      });

      weatherState.activeLocationID =
        weatherState.weatherLocations[0]?.id || null;

      if (weatherState.activeLocationID) await fetchData();
    }

    if (
      !weatherState.activeLocationID &&
      locations.all.length > 0 &&
      locations.all[0].id
    ) {
      weatherState.weatherLocations.push({
        id: $state.snapshot(locations.all[0].id),
        elevation: $state.snapshot(locations.all[0].elevation),
        label: $state.snapshot(locations.all[0].label),
        lat: $state.snapshot(locations.all[0].lat),
        lng: $state.snapshot(locations.all[0].lng),
        result: $state.snapshot(locations.all[0].result),
      });
      weatherState.activeLocationID = $state.snapshot(locations.all[0].id);
    }

    windowWidth = window.innerWidth;
    window.addEventListener('resize', updateShowChart, { passive: true });

    mounted = false;
    tick().then(() => {
      mounted = true;
    });
  });

  $effect(() => {
    localStorage.setItem('[/weather]hour_format', weatherState.hour);
  });

  $effect(() => {
    localStorage.setItem(
      '[/weather]locations',
      JSON.stringify(
        weatherState.weatherLocations.filter((value) => value.saved === true),
      ),
    );
  });

  onDestroy(() => {
    if (!browser) return;
    window.removeEventListener('resize', updateShowChart);
  });
</script>

<svelte:head>
  <title>Weather Forecast</title>
  <meta
    name="description"
    content="Hourly and daily temperature and precipitation data from Open-Meteo."
  />

  <meta property="og:title" content="Weather Forecast" />
  <meta
    property="og:description"
    content="Hourly and daily temperature and precipitation data from Open-Meteo."
  />
  <meta property="og:url" content="{PUBLIC_BASE_URL}/weather" />
  <meta property="og:type" content="website" />
  <meta
    property="og:image"
    content="{PUBLIC_BASE_URL}/images/temperature-blanket-og-image-5.0.0.jpg"
  />
  <meta property="og:image:width" content="1200" />
  <meta property="og:image:height" content="630" />
</svelte:head>

<Symbols />

<AppShell pageName="Weather Forecast">
  {#snippet stickyHeader()}
    <div class="hidden lg:inline-flex"><AppLogo /></div>

    <div class="hidden lg:flex">
      {#if mounted}
        <UnitChanger />
      {/if}
    </div>

    <div class="flex flex-wrap items-center gap-2">
      <Share href={shareableURL} />

      <button
        aria-label="Open Settings"
        class="btn-icon hover:preset-tonal"
        title="Open Settings"
        onclick={() =>
          modal.trigger({
            type: 'component',
            component: {
              ref: Menu,
              props: {
                page: 'settings',
              },
            },
          })}
      >
        <SettingsIcon />
      </button>
      {#if weatherState.weatherLocations.filter((item) => item?.saved).length}
        <button
          aria-label="Open Locations"
          class="btn-icon hover:preset-tonal"
          title="Open Locations"
          onclick={() =>
            modal.trigger({
              type: 'component',
              component: {
                ref: Menu,
                props: {
                  page: 'locations',
                },
              },
            })}
        >
          <ListIcon />
        </button>
      {/if}
    </div>
  {/snippet}

  {#snippet main()}
    <main class="m-auto mb-8 max-w-(--breakpoint-xl) text-center" in:fade>
      <div class="max-lg:px-2">
        <Location />
      </div>

      {#if weatherData && !project.status.loading}
        <div
          class="max-w-full pb-4 max-lg:px-2"
          id="weather-data"
          bind:this={weatherState.weatherDataElement}
        >
          {#key project.status.loading || weatherState.activeLocationID}
            <div class:opacity-50={project.status.loading} in:fade>
              <div
                class="mx-auto mb-4 flex w-fit flex-col items-center gap-2 p-2"
              >
                <div class="flex flex-col items-center justify-center gap-2">
                  {#if !weatherState.weatherLocations.find((item) => item.id === weatherState.activeLocationID)?.saved}
                    <button
                      in:fade
                      class="btn hover:preset-tonal"
                      title="Add to Locations"
                      onclick={async () => {
                        weatherState.weatherLocations.map((item) => {
                          if (item.id === weatherState.activeLocationID)
                            item.saved = true;
                          return item;
                        });
                        page.url.searchParams.set(
                          'id',
                          weatherState.activeLocationID,
                        );
                        page.url.searchParams.set(
                          'h',
                          weatherState.hour === '12' ? '0' : '1',
                        );
                        page.url.searchParams.set(
                          'u',
                          localState.value.units === 'metric' ? 'm' : 'i',
                        );
                      }}
                    >
                      <PlusIcon />
                      Add
                    </button>
                  {:else if weatherState.weatherLocations.filter((item) => item?.saved)?.length}
                    <button
                      in:fade
                      class="btn hover:preset-tonal"
                      onclick={() =>
                        modal.trigger({
                          type: 'component',
                          component: {
                            ref: Menu,
                            props: {
                              page: 'locations',
                            },
                          },
                        })}
                      ><ListIcon />
                      Locations</button
                    >
                  {/if}
                </div>
                <p class="font-bold md:text-xl">
                  {@html weatherState.weatherLocations.find(
                    (item) => item.id === weatherState.activeLocationID,
                  ).result}
                </p>

                <p>
                  {currentTime}
                </p>
                <div class="flex items-center justify-center gap-0">
                  {@html getWeatherCodeDetails({
                    weathercode: weatherData.current_weather.weathercode,
                    is_day: weatherData.current_weather.is_day,
                    precipitation_probability: hourlyData?.find(
                      (item) => item.isNow === true,
                    )?.precipitation_probability,
                  }).description}
                  {@html getWeatherCodeDetails({
                    weathercode: weatherData.current_weather.weathercode,
                    is_day: weatherData.current_weather.is_day,
                    precipitation_probability: hourlyData?.find(
                      (item) => item.isNow === true,
                    )?.precipitation_probability,
                  }).icon}
                </div>
                <p class="flex items-start justify-center text-8xl font-bold">
                  {weatherData.current_weather.temperature}°
                </p>
                <p class="text-xl">
                  Feels Like {hourlyData?.find((item) => item.isNow === true)
                    ?.apparent_temperature}°
                </p>
                <div class="flex justify-center gap-2 text-xl">
                  <p class="">
                    <span class="" style="color: rgb(248, 113, 113);">↑</span>
                    {dailyWeatherData[0].temperature_2m_max}°
                  </p>
                  <p class="">
                    <span class=" " style="color: rgb(56, 189, 248);">↓</span>
                    {dailyWeatherData[0].temperature_2m_min}°
                  </p>
                </div>
              </div>
              <div
                class="rounded-container bg-surface-50 dark:bg-surface-950 my-4 inline-grid p-2 shadow"
              >
                <p class="flex items-center justify-center gap-1 text-sm">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke-width="1.5"
                    stroke="currentColor"
                    class="h-5 w-5"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  Hourly Forcast
                </p>

                {#if showChart}
                  {#key weatherState.hour}
                    <div class="max-w-[90vw]">
                      <Chart data={hourlyForcastData} />
                    </div>
                  {/key}
                {:else}
                  <div class="my-28">
                    <Spinner />
                  </div>
                {/if}
                <div
                  class="relative mx-auto mt-4 flex w-full snap-x snap-mandatory items-start gap-4 overflow-x-auto pb-4 md:gap-8"
                >
                  {#each hourlyForcastData as { isNow, time, apparent_temperature, cloudcover, is_day, temperature_2m, precipitation_probability, weathercode }}
                    {@const details = getWeatherCodeDetails({
                      weathercode,
                      is_day,
                      precipitation_probability,
                    })}
                    <div
                      class="flex min-h-[100px] shrink-0 snap-start flex-col items-center justify-between gap-1"
                    >
                      <p class="text-sm">
                        {isNow
                          ? 'Now'
                          : new Date(time).toLocaleTimeString(
                              navigator.language,
                              {
                                timeStyle: 'short',
                                hour12:
                                  weatherState.hour === '12' ? true : false,
                              },
                            )}
                      </p>
                      <p class="max-w-[100px] text-sm">
                        {details.description}
                      </p>
                      <div
                        class="flex flex-col items-center justify-between"
                        title={details.description}
                      >
                        {@html details.icon}
                      </div>
                      <p>
                        <span class="text-xl">{temperature_2m}°</span>
                      </p>
                    </div>
                  {/each}
                </div>
              </div>
              <div class="mt-4">
                <p class="flex items-center justify-center gap-1 text-sm">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke-width="1.5"
                    stroke="currentColor"
                    class="h-5 w-5"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5m-9-6h.008v.008H12v-.008zM12 15h.008v.008H12V15zm0 2.25h.008v.008H12v-.008zM9.75 15h.008v.008H9.75V15zm0 2.25h.008v.008H9.75v-.008zM7.5 15h.008v.008H7.5V15zm0 2.25h.008v.008H7.5v-.008zm6.75-4.5h.008v.008h-.008v-.008zm0 2.25h.008v.008h-.008V15zm0 2.25h.008v.008h-.008v-.008zm2.25-4.5h.008v.008H16.5v-.008zm0 2.25h.008v.008H16.5V15z"
                    />
                  </svg>
                  Daily Forecast
                </p>
                <div
                  class="relative mx-auto mt-4 flex w-full flex-col items-start justify-center gap-2"
                >
                  {#each dailyWeatherData as { time, temperature_2m_max, temperature_2m_min, precipitation_probability_max, weathercode }, index}
                    {@const date = new Date(time).toLocaleString(
                      window.navigator.language,
                      {
                        weekday: 'short',
                      },
                    )}
                    {@const details = getWeatherCodeDetails({
                      weathercode,
                      precipitation_probability: precipitation_probability_max,
                    })}
                    <div
                      class="rounded-container bg-surface-50 dark:bg-surface-950 mx-auto grid w-full flex-1 grid-cols-3 items-center gap-2 p-2 shadow"
                    >
                      <p class="">
                        {index === 0 ? 'Today' : date}
                      </p>
                      <div
                        class="flex flex-wrap items-center justify-start gap-1"
                      >
                        <p class="hidden text-left sm:inline-block">
                          {details.description}
                        </p>
                        <div
                          class="flex items-center justify-between gap-1"
                          title={details.description}
                        >
                          {@html details.icon}
                        </div>
                      </div>
                      <div
                        class="flex flex-wrap items-center justify-start gap-2 text-xl"
                      >
                        <p class="">
                          <span class="" style="color: rgb(248, 113, 113);"
                            >↑</span
                          >
                          {temperature_2m_max}°
                        </p>
                        <p class="">
                          <span class=" " style="color: rgb(56, 189, 248);"
                            >↓</span
                          >
                          {temperature_2m_min}°
                        </p>
                      </div>
                    </div>
                  {/each}
                </div>
              </div>
            </div>
          {/key}
        </div>
      {/if}
    </main>
  {/snippet}

  {#snippet footer()}
    <Footer subtleBackground={true}>
      {#snippet sources()}
        <div class="text-sm">
          <p>
            Weather data from
            <a
              href="https://www.open-meteo.com"
              rel="noopener noreferrer"
              class="link"
              target="_blank">Open-Meteo</a
            >
            is licenced under
            <a
              href="https://creativecommons.org/licenses/by/4.0/"
              target="_blank"
              class="link"
              rel="noreferrer noopener"
              >Attribution 4.0 International (CC BY 4.0)</a
            >. Location data is from
            <a
              href="https://www.geonames.org/"
              target="_blank"
              rel="noopener noreferrer"
              class="link">Geonames</a
            >
            licensed under
            <a
              href="https://creativecommons.org/licenses/by/2.0/"
              target="_blank"
              rel="noopener noreferrer"
              class="link">CC BY 2.0</a
            >.
          </p>
        </div>
      {/snippet}
    </Footer>
  {/snippet}
</AppShell>

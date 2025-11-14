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

<script>
  import UnitChanger from '$lib/components/UnitChanger.svelte';
  import { modal } from '$lib/state';
  import { getWeatherCodeDetails } from '$lib/utils';
  import { Trash2Icon } from '@lucide/svelte';
  import { SegmentedControl } from '@skeletonlabs/skeleton-svelte';
  import { weatherState } from './+page.svelte';
  import { fetchData } from './GetWeather.svelte';
  import { weatherLocationState } from './Location.svelte';

  /**
   * @typedef {Object} Props
   * @property {string} [page]
   */

  /** @type {Props} */
  let { page = 'settings' } = $props();

  let savedWeatherLocations = $derived(
    weatherState.weatherLocations.filter((item) => item.saved),
  );
</script>

<div class="p-4 text-left">
  {#if page === 'locations'}
    <div class="mt-4">
      <h2 class="mb-2 text-xl font-bold">Locations</h2>
      <div class="flex flex-col gap-2">
        {#each savedWeatherLocations as { id, data, label }}
          <div
            role="button"
            tabindex="0"
            data-active={id === weatherState.activeLocationID}
            class="bg-surface-200 dark:bg-surface-800 rounded-container data-[active=true]:bg-primary-200-800 mx-auto flex w-full max-w-(--breakpoint-lg) flex-1 items-start justify-center gap-2 p-2 shadow-sm"
            title="View this Location"
            onclick={async () => {
              weatherState.activeLocationID = id;
              await fetchData();
              weatherLocationState.validId = true;
              modal.close();
            }}
            onkeydown={async (e) => {
              if (e.key === 'Enter') {
                weatherState.activeLocationID = id;
                await fetchData();
                weatherLocationState.validId = true;
                modal.close();
              }
            }}
          >
            <div class="flex flex-col items-start justify-start gap-1">
              <p class="text-4xl">
                {data?.current_weather.temperature}°
              </p>
              <p class="text-xs">
                {new Date(data?.current_weather.time).toLocaleTimeString(
                  navigator.language,
                  {
                    timeStyle: 'short',
                    hour12: weatherState.hour === '12' ? true : false,
                  },
                )}
              </p>
            </div>

            <div
              class="flex flex-1 basis-1/2 flex-col items-start justify-start text-left sm:flex-wrap"
            >
              <p class="font-bold">
                {@html label.slice(0, label.split(',', 2).join(',').length)}
              </p>
              <div class="flex flex-wrap items-center justify-center gap-x-1">
                <p>
                  {@html getWeatherCodeDetails({
                    weathercode: data?.current_weather.weathercode,
                    is_day: data?.current_weather.is_day,
                  }).description}
                </p>
                <p>
                  {@html getWeatherCodeDetails({
                    weathercode: data?.current_weather.weathercode,
                    is_day: data?.current_weather.is_day,
                  }).icon}
                </p>
              </div>
            </div>
            <button
              aria-label="Remove from Locations"
              class="btn-icon hover:preset-tonal"
              title="Remove from Locations"
              onclick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                weatherState.weatherLocations.map((item) => {
                  if (item.id === id) item.saved = false;
                  return item;
                });
                // const _weatherForecastData = weatherState.weatherLocations.filter((item) => item.id !== id);
                // weatherState.weatherLocations = _weatherForecastData;

                if (id === weatherState.activeLocationID)
                  weatherState.activeLocationID =
                    weatherState.weatherLocations.find((item) => item.saved)
                      ?.id || null;

                if (
                  !weatherState.weatherLocations.filter((item) => item?.saved)
                    ?.length
                )
                  modal.close();
              }}
            >
              <Trash2Icon />
            </button>
          </div>
        {/each}
      </div>
    </div>
  {/if}
  {#if page === 'settings'}
    <div class="mt-4 w-full">
      <h2 class="mb-2 text-xl font-bold">Settings</h2>
      <div
        class="bg-surface-50 dark:bg-surface-950 flex w-fit flex-col justify-center gap-2 rounded p-2"
      >
        <div><UnitChanger /></div>
        <div
          class="rounded-container flex flex-wrap items-center justify-center gap-4 p-2"
        >
          <div class="flex flex-wrap items-center justify-center gap-2">
            <SegmentedControl
              value={weatherState.hour}
              onValueChange={(e) => {
                weatherState.hour = e.value;
              }}
            >
              <SegmentedControl.Control
                class="bg-surface-100 dark:bg-surface-900 rounded-container flex-wrap gap-y-2 border-none shadow-sm"
              >
                <SegmentedControl.Indicator />
                <SegmentedControl.Item value="12">
                  <SegmentedControl.ItemText>12hr</SegmentedControl.ItemText>
                  <SegmentedControl.ItemHiddenInput />
                </SegmentedControl.Item>
                <SegmentedControl.Item value="24">
                  <SegmentedControl.ItemText>24hr</SegmentedControl.ItemText>
                  <SegmentedControl.ItemHiddenInput />
                </SegmentedControl.Item>
              </SegmentedControl.Control>
            </SegmentedControl>
            <p class="text-sm">
              {new Date().toLocaleTimeString(navigator.language, {
                timeStyle: 'short',
                hour12: weatherState.hour === '12' ? true : false,
              })}
            </p>
          </div>
        </div>
      </div>
    </div>
  {/if}
</div>

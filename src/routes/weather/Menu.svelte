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
  import ChoiceMenu from '$lib/components/buttons/ChoiceMenu.svelte';
  import UnitMenu from '$lib/components/buttons/UnitMenu.svelte';
  import { dialog } from '$lib/state/page-state.svelte';
  import { getWeatherCodeDetails } from '$lib/utils/weather-forecast-utils';
  import { ClockIcon, Trash2Icon } from '@lucide/svelte';
  import { weatherState } from './+page.svelte';
  import { fetchData } from './GetWeather.svelte';
  import { weatherLocationState } from './Location.svelte';

  let savedWeatherLocations = $derived(
    weatherState.weatherLocations.filter((item) => item.saved),
  );

  // Each option shows the time now, so the difference is visible
  const hourOptions = (['12', '24'] as const).map((hour) => ({
    value: hour,
    label: `${hour}hr`,
    details: new Date().toLocaleTimeString(navigator.language, {
      timeStyle: 'short',
      hour12: hour === '12',
    }),
  }));
</script>

<div class="flex w-full flex-col gap-6 px-4 pt-2 pb-4 text-left sm:w-xl">
  {#if savedWeatherLocations.length}
    <section class="flex flex-col gap-2" aria-labelledby="weather-locations">
      <h3 id="weather-locations" class="px-2 text-sm font-bold opacity-70">
        Locations
      </h3>
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
              dialog.close();
            }}
            onkeydown={async (e) => {
              if (e.key === 'Enter') {
                weatherState.activeLocationID = id;
                await fetchData();
                weatherLocationState.validId = true;
                dialog.close();
              }
            }}
          >
            <div class="flex flex-col items-start justify-start gap-1">
              <p class="text-4xl">
                {data?.current_weather.temperature}°
              </p>
              <p class="text-xs">
                {new Date(data?.current_weather.time ?? 0).toLocaleTimeString(
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
                {@html (label ?? '').slice(
                  0,
                  (label ?? '').split(',', 2).join(',').length,
                )}
              </p>
              <div class="flex flex-wrap items-center justify-center gap-x-1">
                <p>
                  {@html getWeatherCodeDetails({
                    weathercode: data?.current_weather.weathercode ?? null,
                    is_day: data?.current_weather.is_day ?? null,
                  }).description}
                </p>
                <p>
                  {@html getWeatherCodeDetails({
                    weathercode: data?.current_weather.weathercode ?? null,
                    is_day: data?.current_weather.is_day ?? null,
                  }).icon}
                </p>
              </div>
            </div>
            <button
              aria-label="Remove from Locations"
              class="btn-icon hover:preset-tonal-surface"
              title="Remove from Locations"
              onclick={(e) => {
                e.stopPropagation();
                if (e.cancelable) e.preventDefault();
                weatherState.weatherLocations.map((item) => {
                  if (item.id === id) item.saved = false;
                  return item;
                });

                if (id === weatherState.activeLocationID)
                  weatherState.activeLocationID =
                    weatherState.weatherLocations.find((item) => item.saved)
                      ?.id || null;
              }}
            >
              <Trash2Icon />
            </button>
          </div>
        {/each}
      </div>
    </section>
  {/if}
  <section class="flex flex-col gap-2" aria-labelledby="weather-settings">
    <h3 id="weather-settings" class="px-2 text-sm font-bold opacity-70">
      Settings
    </h3>
    <div
      class="bg-surface-100 dark:bg-surface-900 rounded-container flex flex-wrap items-center gap-2 border border-gray-300 p-4 dark:border-gray-700"
    >
      <UnitMenu />
      <ChoiceMenu
        options={hourOptions}
        value={weatherState.hour}
        onchange={(hour) => (weatherState.hour = hour)}
        label="Time"
        icon={ClockIcon}
      />
    </div>
  </section>
</div>

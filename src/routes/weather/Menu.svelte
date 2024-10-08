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
  import CloseButton from '$lib/components/modals/CloseButton.svelte';
  import { getWeatherCodeDetails } from '$lib/utils';
  import { RadioGroup, RadioItem } from '@skeletonlabs/skeleton';
  import { getContext } from 'svelte';
  import { activeLocationID, hour, locations } from './+page.svelte';
  import { fetchData } from './GetWeather.svelte';
  import { validId } from './Location.svelte';

  export let page = 'settings';

  const { close } = getContext('simple-modal');

  $: savedWeatherLocations = $locations.filter((item) => item.saved);
</script>

<CloseButton onClose={close} />

<div class="w-full block sm:w-fit" />

<div class="p-2 sm:p-4">
  <div class="m-2 text-left">
    {#if page === 'locations'}
      <div class="mt-4">
        <h2 class="mb-2 text-xl font-bold">Locations</h2>
        <div class="flex flex-col gap-2">
          {#each savedWeatherLocations as { id, data, label }}
            <button
              data-active={id === $activeLocationID}
              class="flex-1 w-full justify-center flex items-start gap-2 bg-surface-200-700-token rounded-container-token p-2 shadow max-w-screen-lg mx-auto data-[active=true]:bg-primary-200-700-token"
              title="View this Location"
              on:click={async () => {
                $activeLocationID = id;
                await fetchData();
                $validId = true;
                close();
              }}
            >
              <div class="flex flex-col gap-1 items-start justify-start">
                <p class="font-sans_light text-4xl">
                  {data?.current_weather.temperature}°
                </p>
                <p class="text-xs">
                  {new Date(data?.current_weather.time).toLocaleTimeString(
                    navigator.language,
                    {
                      timeStyle: 'short',
                      hour12: $hour === '12' ? true : false,
                    },
                  )}
                </p>
              </div>

              <div
                class="flex flex-col sm:flex-wrap text-left items-start justify-start flex-1 basis-1/2"
              >
                <p class="font-bold">
                  {@html label.slice(0, label.split(',', 2).join(',').length)}
                </p>
                <div class="flex flex-wrap gap-x-1 items-center justify-center">
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
                class="btn-icon bg-secondary-hover-token"
                title="Remove from Locations"
                on:click={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  $locations.map((item) => {
                    if (item.id === id) item.saved = false;
                    return item;
                  });
                  $locations = $locations;
                  // const _weatherForecastData = $locations.filter((item) => item.id !== id);
                  // $locations = _weatherForecastData;

                  if (id === $activeLocationID)
                    $activeLocationID =
                      $locations.find((item) => item.saved)?.id || null;

                  if (!$locations.filter((item) => item?.saved)?.length)
                    close();
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
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </button>
          {/each}
        </div>
      </div>
    {/if}
    {#if page === 'settings'}
      <div class="mt-4 w-full">
        <h2 class="mb-2 text-xl font-bold">Settings</h2>
        <div class="flex flex-col justify-center gap-x-2 gap-y-4 w-fit py-2">
          <!-- <ThemeSwitcher showText={true} /> -->
          <div><UnitChanger /></div>
          <div
            class="flex flex-wrap items-center justify-center gap-4 p-2 bg-surface-100-800-token rounded-container-token"
          >
            <div class="flex flex-wrap items-center justify-center gap-2">
              <RadioGroup
                class="flex-wrap gap-y-2"
                active="bg-secondary-active-token"
              >
                <RadioItem
                  bind:group={$hour}
                  name="hour-format-12"
                  value="12"
                  title="Set hour format to 12">12hr</RadioItem
                >
                <RadioItem
                  bind:group={$hour}
                  name="hour-format-24"
                  value="24"
                  title="Set hour format to 24">24hr</RadioItem
                >
              </RadioGroup>
              <p class="text-sm">
                {new Date().toLocaleTimeString(navigator.language, {
                  timeStyle: 'short',
                  hour12: $hour === '12' ? true : false,
                })}
              </p>
            </div>
          </div>
        </div>
      </div>
    {/if}
  </div>
</div>

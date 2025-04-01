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
  import { version } from '$app/environment';
  import Location from '$lib/components/Location.svelte';
  import Tooltip from '$lib/components/Tooltip.svelte';
  import { MAXIMUM_LOCATIONS } from '$lib/constants';
  import {
    locations,
    project,
    wasProjectLoadedFromURL,
    weather,
  } from '$lib/state';
  import { pluralize } from '$lib/utils';
  import {
    CircleCheckBigIcon,
    CirclePlusIcon,
    TriangleAlertIcon,
  } from '@lucide/svelte';
  import SearchForWeather from './buttons/SearchForWeather.svelte';
  import WeatherSourceButton from './buttons/WeatherSourceButton.svelte';
</script>

<div class="mx-auto mt-2 max-w-(--breakpoint-md)">
  {#if weather.isFromLocalStorage && weather.data}
    <p
      class="flex w-full flex-wrap items-center justify-center gap-1 text-center text-sm"
    >
      <CircleCheckBigIcon class=" size-4" />
      Loaded project and {#if weather.isUserEdited}custom weather{:else}weather{/if}
      data
    </p>
  {:else if wasProjectLoadedFromURL.value}
    <p
      class="flex w-full flex-wrap items-center justify-center gap-1 text-center text-sm"
    >
      <CircleCheckBigIcon class=" size-4" />
      Loaded project
    </p>
  {/if}

  {#if !!weather.isUserEdited}
    <div class="my-4 flex flex-col items-center gap-2">
      {#each locations.all as location}
        <p class="flex flex-wrap items-center justify-center gap-x-1">
          <span class="font-bold">{@html location.result}</span>
          <span>
            {new Date(location.from).toLocaleDateString()} to {new Date(
              location.to,
            ).toLocaleDateString()}
          </span>
          <Tooltip>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke-width="1.5"
              stroke="currentColor"
              class="h-6 w-6"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z"
              />
            </svg>
            {#snippet tooltip()}
              <span>
                To edit location details, reload weather data or <a
                  href={`/?project=${new Date().getTime()?.toString()}&v=${version}#${project.url.hash.substring(
                    0,
                    project.url.hash.indexOf('l='),
                  )}${project.url.hash.substring(project.url.hash.indexOf('temp'))}`}
                  class="cursor-pointer underline"
                  target="_blank"
                  rel="noreferrer">open a new project</a
                >.
              </span>
            {/snippet}
          </Tooltip>
        </p>
      {/each}
      <p class="w-full text-sm italic">
        {locations.totalDays} Total {pluralize('Day', locations.totalDays)}
      </p>
    </div>
  {/if}

  <div
    class:hidden={!!weather.isUserEdited}
    class="divide-surface-300 dark:divide-surface-600 divide-y divide-solid"
  >
    {#each locations.all, index}
      <Location location={locations.all[index]} {index} />
    {/each}
  </div>

  <div
    class="mb-4 flex w-full flex-col gap-2"
    class:border-t={locations.all.length > 1}
    class:border-surface-300={locations.all.length > 1}
    class:dark:border-surface-600={locations.all.length > 1}
    class:pt-4={locations.all.length > 1}
  >
    {#if locations.allValid && locations.totalDays === 1}
      <!-- The range calculation functionality expects there to be more than one day of weather data.
     So if there's only one day of weather data the color ranges will have some NaN values. 
     This notice discourages users from using only one day of weather data. -->
      <p class="rounded-container bg-warning-500/20 my-2 p-2 text-sm">
        <TriangleAlertIcon class="inline size-4" />
        For the best results, include multiple days in your project; otherwise, some
        features may not work as expected.
      </p>
    {/if}

    <div class="flex w-full flex-col items-center gap-4">
      <SearchForWeather />
    </div>

    {#if locations.all.length > 1 && locations.totalDays && locations.allValid && !weather.isUserEdited}
      <p class="w-full text-sm italic">
        {locations.totalDays} Total {pluralize('Day', locations.totalDays)}
      </p>
    {/if}
  </div>
</div>

<div
  class="rounded-container bg-surface-100 dark:bg-surface-900 mx-auto mt-4 mb-2 flex max-w-(--breakpoint-md) flex-wrap justify-center gap-2 px-4 py-2 shadow-inner lg:mb-4"
>
  {#if locations.all.length < MAXIMUM_LOCATIONS}
    <button
      class={['btn hover:preset-tonal', weather.isUserEdited && 'hidden']}
      id="add-location-button"
      disabled={project.status.loading}
      onclick={() => locations.add()}
      title="Add a New Location"
    >
      <CirclePlusIcon /> Add Location
    </button>
  {:else}
    <p class={['py-2 text-sm', weather.isUserEdited && 'hidden']}>
      You've added the maximum allowed number of locations
    </p>
  {/if}

  <WeatherSourceButton />
</div>

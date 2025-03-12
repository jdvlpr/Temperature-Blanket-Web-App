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
  import ChooseWeatherSource from '$lib/components/modals/ChooseWeatherSource.svelte';
  import Tooltip from '$lib/components/Tooltip.svelte';
  import { MAXIMUM_LOCATIONS } from '$lib/constants';
  import {
    locations,
    modal,
    project,
    wasProjectLoadedFromURL,
    weather,
  } from '$lib/state';
  import { pluralize } from '$lib/utils';
  import { slide } from 'svelte/transition';
  import SearchForWeather from './buttons/SearchForWeather.svelte';
  import { CirclePlusIcon, WrenchIcon } from '@lucide/svelte';
</script>

<div class="mt-2 max-w-(--breakpoint-md) mx-auto">
  {#if weather.isFromLocalStorage && weather.data}
    <p
      class="text-sm flex flex-wrap gap-1 items-center justify-center w-full text-center"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 20 20"
        fill="currentColor"
        class="w-5 h-5"
      >
        <path
          fill-rule="evenodd"
          d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z"
          clip-rule="evenodd"
        />
      </svg>
      Loaded project and {#if weather.isUserEdited}custom weather{:else}weather{/if}
      data
    </p>
  {:else if wasProjectLoadedFromURL.value}
    <p
      class="text-sm flex flex-wrap gap-1 items-center justify-center w-full text-center"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 20 20"
        fill="currentColor"
        class="w-5 h-5"
      >
        <path
          fill-rule="evenodd"
          d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z"
          clip-rule="evenodd"
        />
      </svg>
      Loaded project
    </p>
  {/if}

  {#if !!weather.isUserEdited}
    <div class="flex flex-col gap-2 my-4 items-center">
      {#each locations.all as location}
        <p class="flex flex-wrap gap-x-1 items-center justify-center">
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
              class="w-6 h-6"
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
                  class="underline cursor-pointer"
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
    class="divide-y divide-solid divide-surface-300 dark:divide-surface-600"
  >
    {#each locations.all, index}
      <Location location={locations.all[index]} {index} />
    {/each}
  </div>

  <div
    class="flex flex-col gap-2 mb-4 w-full"
    class:border-t={locations.all.length > 1}
    class:border-surface-300={locations.all.length > 1}
    class:dark:border-surface-600={locations.all.length > 1}
    class:pt-4={locations.all.length > 1}
  >
    {#if locations.allValid && locations.totalDays === 1}
      <!-- The range calculation functionality expects there to be more than one day of weather data.
     So if there's only one day of weather data the color ranges will have some NaN values. 
     This notice discourages users from using only one day of weather data. -->
      <p
        class="text-sm my-2 p-2 rounded-container preset-tonal-warning border border-warning-500"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          stroke-width="1.5"
          stroke="currentColor"
          class="w-4 h-4 inline"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z"
          />
        </svg>
        For the best results, include multiple days in your project; otherwise, some
        features may not work as expected.
      </p>
    {/if}

    <div class="flex flex-col items-center gap-4 w-full">
      <SearchForWeather />
    </div>

    {#if locations.all.length > 1 && locations.totalDays && locations.allValid && !weather.isUserEdited}
      <p class="w-full text-sm italic">
        {locations.totalDays} Total {pluralize('Day', locations.totalDays)}
      </p>
    {/if}
  </div>
</div>

{#if locations.allValid}
  <div
    class="flex flex-wrap gap-2 justify-center mt-4 mb-2 lg:mb-4 px-4 py-2 shadow-inner rounded-container bg-surface-100 dark:bg-surface-900 max-w-(--breakpoint-md) mx-auto"
    transition:slide
  >
    <div class:hidden={!locations.allValid || weather.isUserEdited}>
      {#if locations.all.length < MAXIMUM_LOCATIONS}
        <button
          class="btn hover:preset-tonal"
          id="add-location-button"
          disabled={project.status.loading}
          onclick={() => locations.add()}
          title="Add a New Location"
        >
          <CirclePlusIcon /> Add Location
        </button>
      {:else}
        <p>You've added the maximum allowed number of locations</p>
      {/if}
    </div>

    <button
      class="btn hover:preset-tonal text-left"
      disabled={project.status.loading}
      onclick={() => {
        modal.trigger({
          type: 'component',
          component: { ref: ChooseWeatherSource },
        });
      }}
    >
      <WrenchIcon />
      <span class="whitespace-pre-wrap"
        >Weather Source: {weather.isUserEdited
          ? 'Custom'
          : weather.defaultSource}</span
      >
    </button>
  </div>
{/if}

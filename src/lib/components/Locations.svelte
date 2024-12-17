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
    createdGauges,
    defaultWeatherSource,
    isCustomWeather,
    isProjectLoading,
    liveProjectURLHash,
    locations,
    modal,
    valid,
    wasProjectLoadedFromURL,
    wasWeatherLoadedFromLocalStorage,
    weather,
    weatherUngrouped,
  } from '$lib/stores';
  import type { Location as LocationType } from '$lib/types';
  import { numberOfDays, pluralize } from '$lib/utils';
  import { slide } from 'svelte/transition';
  import SearchForWeather from './buttons/SearchForWeather.svelte';

  $: invalid = !$valid;

  $: totalDays = getTotalDays($locations);
  $: disabled = invalid || $isProjectLoading;

  function addLocation() {
    if ($weatherUngrouped) $weatherUngrouped = null;
    $locations = $locations.concat({ index: $locations.length });
  }

  function getTotalDays(_locations: LocationType[]) {
    const arrayOfDayCount = _locations.map((n) => {
      if (!n.from || !n.to) return null;
      const from = new Date(n.from.replace(/-/g, '/'));
      const to = new Date(n.to.replace(/-/g, '/'));
      if (!from || !to) return null;
      return numberOfDays(from, to);
    });
    const sum = arrayOfDayCount.reduce((accumulator, value) => {
      return accumulator + value;
    }, 0);
    return sum;
  }
</script>

<div class="mt-4 max-w-screen-md mx-auto">
  {#if $wasWeatherLoadedFromLocalStorage && $weather}
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
      Loaded project and {#if $isCustomWeather}custom weather{:else}weather{/if}
      data
    </p>
  {:else if $wasProjectLoadedFromURL}
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

  {#if !!$isCustomWeather}
    <div class="flex flex-col gap-2 my-4 items-center">
      {#each $locations as location (location.index)}
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
            <span slot="tooltip">
              To edit location details, reload weather data or <a
                href={`/?project=${new Date().getTime()?.toString()}&v=${version}#${$liveProjectURLHash.substring(
                  0,
                  $liveProjectURLHash.indexOf('l='),
                )}${$liveProjectURLHash.substring($liveProjectURLHash.indexOf($createdGauges[0].id))}`}
                class="underline cursor-pointer"
                target="_blank"
                rel="noreferrer">open a new project</a
              >.
            </span>
          </Tooltip>
        </p>
      {/each}
      <p class="w-full text-sm italic">
        {totalDays} Total {pluralize('Day', totalDays)}
      </p>
    </div>
  {/if}

  <div
    class:hidden={!!$isCustomWeather}
    class="divide-y divide-solid divide-surface-300 dark:divide-surface-600"
  >
    {#each $locations as location, index (location.index)}
      <Location {index} />
    {/each}
  </div>

  <div
    class="flex flex-col gap-2 mb-4 w-full"
    class:border-t={$locations.length > 1}
    class:border-surface-300={$locations.length > 1}
    class:dark:border-surface-600={$locations.length > 1}
    class:pt-4={$locations.length > 1}
  >
    {#if $valid && totalDays === 1}
      <!-- The range calculation functionality expects there to be more than one day of weather data.
     So if there's only one day of weather data the color ranges will have some NaN values. 
     This notice discourages users from using only one day of weather data. -->
      <p class="text-sm my-2 p-2 rounded-container-token variant-ghost-warning">
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
      <SearchForWeather bind:disabled />
    </div>

    {#if $locations?.length > 1 && totalDays && $valid && !$isCustomWeather}
      <p class="w-full text-sm italic">
        {totalDays} Total {pluralize('Day', totalDays)}
      </p>
    {/if}
  </div>
</div>

{#if $valid}
  <div
    class="flex flex-wrap gap-2 justify-center mt-4 mb-2 lg:mb-4 px-4 py-2 shadow-inner rounded-container-token variant-soft-surface max-w-screen-md mx-auto"
    transition:slide
  >
    <div class:hidden={!$valid || $isCustomWeather}>
      {#if $locations?.length < MAXIMUM_LOCATIONS}
        <button
          class="btn bg-secondary-hover-token gap-2"
          id="add-location-button"
          disabled={$isProjectLoading}
          on:click={addLocation}
          title="Add a New Location"
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
              d="M12 9v6m3-3H9m12 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
            />
          </svg>
          Add Location
        </button>
      {:else}
        <p>You've added the maximum allowed number of locations</p>
      {/if}
    </div>

    <button
      class="btn bg-secondary-hover-token text-left"
      disabled={$isProjectLoading}
      on:click={() => {
        modal.state.trigger({
          type: 'component',
          component: { ref: ChooseWeatherSource },
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
      <span class="whitespace-pre-wrap"
        >Weather Source: {$isCustomWeather
          ? 'Custom'
          : $defaultWeatherSource}</span
      >
    </button>
  </div>
{/if}

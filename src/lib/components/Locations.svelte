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
  import { version } from '$app/env';
  import Location from '#lib/components/Location.svelte';
  import { MAXIMUM_LOCATIONS } from '#lib/constants/location-constants.js';
  import { locations } from '#lib/state/location-state.svelte.js';
  import { project, type LoadedFrom } from '#lib/state/project-state.svelte.js';
  import { weather } from '#lib/state/weather-state.svelte.js';
  import { weatherSearch } from '#lib/state/weather-search.svelte.js';
  import { weatherDays } from '#lib/state/weather-days.svelte.js';
  import HelpIcon from '#lib/components/buttons/HelpIcon.svelte';
  import { stringToDate } from '#lib/utils/date-utils.js';
  import type { TISO8601DateString } from '#lib/types/weather-types.js';
  import { pluralize } from '#lib/utils/string-utils.js';
  import {
    CircleCheckBigIcon,
    CirclePlusIcon,
    ExternalLinkIcon,
    TriangleAlertIcon,
  } from '@lucide/svelte';
  import SearchForWeather from './buttons/SearchForWeather.svelte';

  const loading = $derived(locations.allValid && project.status.loading);
  // The words before a link to its gallery page, when its weather is from one
  const LOADED_LABELS: Record<LoadedFrom, string> = {
    saved: 'Loaded saved project',
    'saved-custom': 'Loaded saved project with custom weather',
    link: 'Loaded project from link',
    gallery: 'Loaded project from',
  };

  const validLoadedProject = $derived(
    (weather.wasLoadedFromStorage && !!weather.data.length) ||
      project.status.wasLoaded,
  );
</script>

<div class="mx-auto mt-2 max-w-(--breakpoint-md)">
  {#if loading}
    <p class="h-auto animate-pulse text-sm">Loading project...</p>
  {:else if validLoadedProject}
    <p
      class="flex w-full flex-wrap items-center justify-center gap-1 text-center text-sm"
    >
      <CircleCheckBigIcon class="icon-sm text-success-900-100" />
      <span data-testid="loaded-from"
        >{LOADED_LABELS[project.status.loadedFrom ?? 'saved']}
        {#if project.status.loadedFrom === 'gallery'}
          {#if project.status.galleryPostId}
            <a
              class="link inline-flex items-center gap-1"
              href={`/gallery/${project.status.galleryPostId}`}
              target="_blank"
              rel="noreferrer"
              >gallery page<ExternalLinkIcon class="icon-sm" /><span
                class="sr-only">(opens in a new tab)</span
              ></a
            >
          {:else}
            gallery page
          {/if}
        {/if}</span
      >
      <HelpIcon topic="project-includes">
        {#snippet text()}
          <span>About</span>
        {/snippet}
      </HelpIcon>
    </p>
  {/if}

  <!-- Days got while their values were early, which have settled since -->
  {#if !loading && weatherDays.settledEarly.length}
    {@const count = weatherDays.settledEarly.length}
    <p
      class="mt-1 flex w-full flex-wrap items-center justify-center gap-x-1 text-center text-sm"
      data-testid="early-days-settled"
    >
      Your last {count === 1 ? 'day was' : `${count} days were`} early data, which
      may have changed since.
      <button
        type="button"
        class="anchor"
        onclick={() => weatherSearch.start({ mode: 'again' })}
        >Search Again</button
      >
    </p>
  {/if}

  {#if weather.isUserEdited}
    <div class="my-4 flex flex-col items-center gap-2">
      {#each locations.all as location}
        <p class="flex flex-wrap items-center justify-center gap-x-1">
          <span class="font-bold">{@html location.result}</span>
          <span>
            {location.from
              ? stringToDate(
                  location.from as TISO8601DateString,
                ).toLocaleDateString(undefined, {
                  timeZone: 'UTC',
                })
              : ''} to {location.to
              ? stringToDate(
                  location.to as TISO8601DateString,
                ).toLocaleDateString(undefined, {
                  timeZone: 'UTC',
                })
              : ''}
          </span>

          <span class="p-2 text-sm">
            To edit location details, reload weather data below or <a
              href={`/?project=${new Date().getTime()?.toString()}&v=${version}#${project.url.hash.substring(
                0,
                project.url.hash.indexOf('l='),
              )}${project.url.hash.substring(project.url.hash.indexOf('temp'))}`}
              class="cursor-pointer underline"
              target="_blank"
              rel="noreferrer"
              >open a new project <ExternalLinkIcon
                class="relative -top-[2px] inline size-3"
              /></a
            >.
          </span>
        </p>
      {/each}
      <p class="w-full text-sm">
        {locations.totalDays} Total {pluralize('Day', locations.totalDays)}
      </p>
    </div>
  {/if}

  <div
    class:hidden={weather.isUserEdited}
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
        <TriangleAlertIcon class="icon-sm inline" />
        For the best results, include multiple days in your project; otherwise, some
        features may not work as expected.
      </p>
    {/if}

    <div class="flex w-full flex-col items-center gap-2">
      <SearchForWeather />
    </div>

    {#if locations.all.length > 1 && locations.totalDays && locations.allValid && !weather.isUserEdited}
      <p class="w-full text-sm">
        {locations.totalDays} Total {pluralize('Day', locations.totalDays)}
      </p>
    {/if}
  </div>
</div>

<div
  class="rounded-base bg-surface-100 dark:bg-surface-900 mx-auto mt-4 mb-2 flex max-w-(--breakpoint-md) flex-wrap justify-center gap-2 px-4 py-2 shadow-inner lg:mb-4"
>
  {#if locations.all.length < MAXIMUM_LOCATIONS}
    <button
      class={[
        'btn hover:preset-tonal-surface',
        weather.isUserEdited && 'hidden',
      ]}
      disabled={project.status.loading}
      onclick={() => {
        // Clear now-stale weather data before adding the new location.
        if (weather.rawData.length > 0) weather.setRawData([]);
        locations.add();
      }}
      title="Add a New Location"
    >
      <CirclePlusIcon /> Add Location
    </button>
  {:else}
    <p class={['py-2 text-sm', weather.isUserEdited && 'hidden']}>
      You've added the maximum allowed number of locations
    </p>
  {/if}
</div>

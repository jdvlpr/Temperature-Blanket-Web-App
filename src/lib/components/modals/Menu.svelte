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
  import LocalProjects from '$lib/components/LocalProjects.svelte';
  import UnitChanger from '$lib/components/UnitChanger.svelte';
  import YarnSources from '$lib/components/YarnSources.svelte';
  import { DAYS_OF_THE_WEEK, MONTHS } from '$lib/constants';
  import { dialog, locations, project, weather } from '$lib/state';
  import { pluralize } from '$lib/utils';
  import { BookmarkIcon, PlusIcon } from '@lucide/svelte';
  import WeatherGrouping from '../WeatherGrouping.svelte';
  import DownloadExportButton from '../buttons/DownloadExportButton.svelte';
  import SendToGalleryButton from '../buttons/SendToGalleryButton.svelte';
  import WeatherSourceButton from '../buttons/WeatherSourceButton.svelte';
  import SaveProjectModal from './SaveProjectModal.svelte';
</script>

<div class="w-full p-4">
  <h2 class="mb-2 text-xl font-bold">Project</h2>
  <div class="my-4 flex w-full flex-col gap-2">
    <div class=" flex flex-wrap gap-2">
      <button
        class="btn bg-primary-50-950 border-primary-500 hover:preset-tonal-primary w-fit border"
        onclick={() => {
          dialog.trigger({
            type: 'component',
            component: { ref: SaveProjectModal },
          });
        }}
        title="Save Project"
      >
        <BookmarkIcon />
        Save
      </button>
      <a
        href="/"
        target="_blank"
        class="btn hover:preset-tonal-surface w-fit"
        title="New Project"
      >
        <PlusIcon />
        New
      </a>
    </div>

    {#if weather.data.length}
      <DownloadExportButton />

      <SendToGalleryButton />

      {#if project.gallery.href && project.gallery.title && project.gallery.title === locations.projectTitle}
        <div class="flex w-full flex-col justify-center gap-1">
          <p>View this project's gallery page:</p>
          <p>
            <a
              href={project.gallery.href}
              target="_blank"
              class="btn hover:preset-tonal-surface w-fit whitespace-pre-wrap underline"
              rel="noreferrer">{project.gallery.title}</a
            >
          </p>
        </div>
      {/if}
    {/if}
  </div>

  <h2 class="mt-8 mb-2 scroll-mt-[12px] text-xl font-bold">Settings</h2>

  <div class="my-4 flex w-full flex-col items-start gap-4">
    <UnitChanger />

    {#if weather.data.length}
      <WeatherGrouping />

      {#if weather.grouping === 'week'}
        <div
          class="rounded-container bg-surface-100 dark:bg-surface-900 flex w-full flex-col items-start justify-start gap-2 p-2"
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
          <label class="label flex flex-col">
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
    {/if}

    <WeatherSourceButton />
  </div>

  <LocalProjects />

  <h2 class="mt-8 mb-2 text-xl font-bold">Data Sources</h2>
  <div class=" flex w-full flex-col items-start gap-2 text-sm">
    <p class="text-surface-700-300">
      Location data is from <a
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
      >. Weather data from
      <a
        href="https://meteostat.net/"
        target="_blank"
        rel="noopener noreferrer"
        class="link">Meteostat</a
      >
      is licensed under
      <a
        href="https://creativecommons.org/licenses/by-nc/4.0/"
        target="_blank"
        rel="noopener noreferrer"
        class="link">CC BY-NC 4.0</a
      >, with raw data provided by
      <a
        href="https://www.noaa.gov/"
        target="_blank"
        rel="noopener noreferrer"
        class="link">NOAA</a
      >,
      <a
        href="https://www.dwd.de/"
        target="_blank"
        rel="noopener noreferrer"
        class="link">DWD</a
      >
      and
      <a
        href="https://dev.meteostat.net/docs/sources.html"
        target="_blank"
        rel="noopener noreferrer"
        class="link">others</a
      >. Weather data from
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
        rel="noreferrer noopener">Attribution 4.0 International (CC BY 4.0)</a
      >, and includes data from the
      <a
        href="https://cds.climate.copernicus.eu/cdsapp#!/dataset/reanalysis-era5-land?tab=overview"
        rel="noopener noreferrer"
        target="_blank"
        class="link">Copernicus Program</a
      >. Daytime length calculations are by
      <a
        href="https://github.com/mourner/suncalc"
        target="_blank"
        class="link"
        rel="noopener noreferrer">SunCalc</a
      >
      licensed under
      <a
        href="https://choosealicense.com/licenses/bsd-2-clause/"
        target="_blank"
        rel="noopener noreferrer"
        class="link">BSD 2</a
      >. Default color schemes are based on
      <a
        href="https://ColorBrewer2.org"
        target="_blank"
        rel="noopener noreferrer"
        class="link">ColorBrewer2.org</a
      >
      by Cynthia A. Brewer, Geography, Pennsylvania State University, licenced under
      <a
        href="https://www.apache.org/licenses/LICENSE-2.0"
        target="_blank"
        rel="noopener noreferrer"
        class="link">Apache 2</a
      >. Country flag icons are made by
      <a
        href="https://www.freakflagsprite.com/"
        target="_blank"
        class="link"
        rel="noopener noreferrer">Michael P. Cohen.</a
      >
      <a
        href="https://www.apache.org/licenses/LICENSE-2.0"
        target="_blank"
        rel="noopener noreferrer"
        class="link">Apache 2</a
      >.
    </p>
    <YarnSources />
  </div>
</div>

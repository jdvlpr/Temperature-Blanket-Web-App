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
  let pages = $state({
    download: false,
    main: false,
    save: false,
  });
</script>

<script lang="ts">
  import { browser } from '$app/environment';
  import { replaceState } from '$app/navigation';
  import LocalProjects from '$lib/components/LocalProjects.svelte';
  import ProjectDetails from '$lib/components/ProjectDetails.svelte';
  import UnitChanger from '$lib/components/UnitChanger.svelte';
  import YarnSources from '$lib/components/YarnSources.svelte';
  import KeyboardShortcuts from '$lib/components/modals/KeyboardShortcuts.svelte';
  import { DAYS_OF_THE_WEEK, MONTHS } from '$lib/constants';
  import { dialog, previews, project, toast, weather } from '$lib/state';
  import {
    delay,
    downloadPDF,
    downloadPreviewPNG,
    downloadWeatherCSV,
    pluralize,
    setProjectInStorage,
    getSavedProjectMetaByHref,
  } from '$lib/utils';
  import {
    CircleCheckBigIcon,
    ClipboardCopyIcon,
    DownloadIcon,
    KeyboardIcon,
    SaveIcon,
    SquarePlusIcon,
  } from '@lucide/svelte';
  import { onMount } from 'svelte';
  import WeatherGrouping from '../WeatherGrouping.svelte';
  import WeatherSourceButton from '../buttons/WeatherSourceButton.svelte';
  interface Props {
    page?: string;
    highlight?: string;
  }
  
  let { page = 'main', highlight }: Props = $props();
  
  let currentSavedProject = $state(null);

  let weatherSettingsElement: HTMLElement | null = $state(null);

  async function goTo(page) {
    let _pages = $state.snapshot(pages);
    for (const key in pages) {
      _pages[key] = page === key;
    }

    await delay(100); // on mobile it wasn't working without a delay...

    pages = _pages;

    if (page === 'save') saveProject({ copy: false });
  }

  onMount(async () => {
    if (page) goTo(page);

    if (highlight === 'weather-settings') {
      await delay(200);
      weatherSettingsElement?.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });
    }
  });

  async function saveProject({ copy = true }) {
    // Copy window url to clipboard
    if (copy) {
      try {
        window.navigator.clipboard.writeText(project.url.href);
        toast.trigger({
          message: 'Copied',
          category: 'success',
        });
      } catch {
        toast.trigger({
          message: 'Unable to copy to your clipboard',
          category: 'error',
        });
      }
    }

    const newURL = new URL(project.url.href);
    replaceState(newURL, '');

    try {
      await setProjectInStorage();
      currentSavedProject = await getSavedProjectMetaByHref(project.url.href);
      project.status.saved = true;
    } catch (e) {
      currentSavedProject = null;
      project.status.saved = false;
      project.status.error = {
        code: 1,
        message: 'Unable to save project to storage',
      };
      console.warn("Can't save project", { e });
    }
  }
</script>

<div class="p-4">
  {#if !pages.main}
    <button
      aria-label="Go To Main Menu"
      class="btn-icon hover:preset-tonal"
      onclick={() => goTo('main')}
      title="Go To Main Menu"
    >
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
          d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18"
        />
      </svg>
    </button>
  {/if}

  {#if pages.main}
    <div>
      <h2 class="mb-2 text-xl font-bold">Project</h2>
      <div class="my-4 flex w-full flex-col gap-2">
        <a
          href="/"
          target="_blank"
          class="btn hover:preset-tonal w-fit"
          title="New Project"
        >
          <SquarePlusIcon />
          New
        </a>

        <button
          class="btn hover:preset-tonal w-fit"
          onclick={() => {
            goTo('save');
          }}
          title="Save Project"
        >
          <SaveIcon />
          Save
        </button>

        {#if weather.data.length}
          <button
            class="btn hover:preset-tonal w-fit"
            onclick={() => goTo('download')}
            disabled={!weather.data.length}
            title="Open Download Menu"
          >
            <DownloadIcon />
            Download
          </button>
        {/if}
      </div>

      <h2
        class="mt-8 mb-2 scroll-mt-[12px] text-xl font-bold"
        bind:this={weatherSettingsElement}
      >
        Weather Settings
      </h2>

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
                    (n) =>
                      n.value === weather.groupedByWeek[0].date.getUTCDay(),
                  )[0].label},
                  {MONTHS.filter(
                    (n) =>
                      n.value - 1 ===
                      weather.groupedByWeek[0].date.getUTCMonth(),
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

      <h2 class="mt-8 mb-2 text-xl font-bold">Page</h2>
      <button
        class="btn hover:preset-tonal w-fit"
        onclick={() => {
          dialog.trigger({
            type: 'component',
            component: { ref: KeyboardShortcuts },
          });
        }}
        title="View Keyboard Shortcuts"
      >
        <KeyboardIcon />
        <span class="text-left whitespace-pre-wrap">Keyboard Shortcuts</span>
      </button>

      <h2 class="mt-8 mb-2 text-xl font-bold">Sources</h2>
      <div class="flex w-full flex-col items-start gap-2 text-sm">
        <p>
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
            rel="noreferrer noopener"
            >Attribution 4.0 International (CC BY 4.0)</a
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
          by Cynthia A. Brewer, Geography, Pennsylvania State University, licenced
          under
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
  {/if}

  {#if pages.download}
    <div class="mb-4">
      <h2 class="my-2 text-lg font-bold">Download</h2>
      <div class="flex flex-col items-start gap-2 text-left">
        <button
          class="btn hover:preset-tonal"
          onclick={downloadPDF}
          title="Download PDF File"
        >
          <DownloadIcon />
          Gauges and Weather Data (PDF)
        </button>
        <button
          class="btn hover:preset-tonal"
          onclick={downloadWeatherCSV}
          title="Download CSV File"
        >
          <DownloadIcon />
          Weather Data (CSV)</button
        >

        {#if previews.active?.previewComponent}
          <button
            class="btn hover:preset-tonal h-auto"
            title="Download PNG File"
            onclick={() => {
              downloadPreviewPNG(
                previews.active.width,
                previews.active.height,
                previews.active.svg,
              );
            }}
          >
            <span class="m-auto h-auto w-[50px]">
              <previews.active.previewComponent />
            </span>

            Preview Image (PNG)
          </button>
        {/if}
      </div>
    </div>
  {/if}

  {#if pages.save}
    <div class="mb-4 flex flex-col items-start justify-center gap-2">
      <h2 class="my-2 text-lg font-bold">Save</h2>
      {#if browser && typeof window.localStorage !== 'undefined' && weather.data.length}
        {#if project.status.saved}
          <p
            class="preset-filled-success-100-900 rounded-container inline-flex w-full items-center justify-start gap-2 p-2"
          >
            <CircleCheckBigIcon style="size-4" />
            Project and {#if weather.isUserEdited}custom weather{:else}weather{/if}
            data saved to this web browser
          </p>
        {:else if project.status.error.code === 1}
          <div class="text-warning-500 flex flex-col gap-2">
            <p>It looks like there was a problem saving your project to this browser, but it can still be accessed using the URL below.</p>
              
            <p>The storage space in this browser for saved projects might be full. If you have other saved projects, you can remove some and try to save this one again.</p>
          </div>
        {/if}

        <p class="">
          To access this project from any web browser, use the URL below:
        </p>

        <button
          class="btn preset-filled inline-flex w-fit flex-wrap items-center gap-2"
          onclick={() => {
            saveProject({ copy: true });
          }}
        >
          <ClipboardCopyIcon />
          Copy Project URL
        </button>

        <p
          class="card bg-primary-50 dark:bg-primary-950 basis-full p-4 break-all select-all text-sm"
        >
          {project.url.href}
        </p>

        {#if currentSavedProject && currentSavedProject?.meta}
          <div class="w-full">
            <ProjectDetails project={currentSavedProject.meta} canRemove={false} />
          </div>
        {/if}

        <button
          class="btn hover:preset-tonal"
          onclick={() => {
            goTo('download');
          }}
        >
          <DownloadIcon class="relative -top-[2px] mr-1 inline" />
          <span class="link">Download this project</span></button
        >
      {:else}
        <p>To save a project, you first need to get weather data.</p>
      {/if}
    </div>
  {/if}
</div>

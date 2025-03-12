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
  import ChooseWeatherSource from '$lib/components/modals/ChooseWeatherSource.svelte';
  import KeyboardShortcuts from '$lib/components/modals/KeyboardShortcuts.svelte';
  import { DAYS_OF_THE_WEEK, ICONS, MONTHS } from '$lib/constants';
  import { modal, previews, project, toast, weather } from '$lib/state';
  import {
    delay,
    downloadPDF,
    downloadPreviewPNG,
    downloadWeatherCSV,
    pluralize,
    setLocalStorageProject,
  } from '$lib/utils';
  import { onMount } from 'svelte';
  import WeatherGrouping from '../WeatherGrouping.svelte';
  import { KeyboardIcon, SaveIcon } from '@lucide/svelte';

  interface Props {
    page?: string;
    highlight?: string;
  }

  let { page = 'main', highlight }: Props = $props();

  let copiedMessage = $state('');

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

  function saveProject({ copy = true }) {
    // Copy window url to clipboard
    if (copy) {
      try {
        window.navigator.clipboard.writeText(project.url.href);
        copiedMessage = `<span class="inline-flex items-center gap-1">
						<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="w-5 h-5">
			<path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clip-rule="evenodd" />
			</svg>Copied to your clipboard</span>`;
      } catch {
        copiedMessage = 'Unable to copy project URL.';
      }
    } else {
      copiedMessage = '';
    }

    try {
      const newURL = new URL(project.url.href);
      replaceState(newURL, '');
      setLocalStorageProject();
      currentSavedProject = JSON.parse(localStorage.getItem('projects'))?.find(
        (_project) => _project.href === project.url.href,
      );
      project.status.saved = true;
    } catch (e) {
      currentSavedProject = null;
      console.log("Can't save project", { e });
    }
  }

  $effect(() => {
    if (copiedMessage !== '') {
      toast.trigger({
        message: copiedMessage,
        background: 'preset-filled-success-100-900',
      });
      copiedMessage = '';
    }
  });
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
        class="w-6 h-6"
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
      <div class="flex flex-col gap-2 w-full my-4">
        <button
          class="btn hover:preset-tonal w-fit gap-2"
          onclick={() => {
            goTo('save');
            copiedMessage = '';
          }}
          title="Save Project"
        >
          <SaveIcon />
          Save
        </button>

        {#if weather.data.length}
          <button
            class="btn hover:preset-tonal w-fit gap-2"
            onclick={() => goTo('download')}
            disabled={!weather.data.length}
            title="Open Download Menu"
          >
            {@html ICONS.download}
            Download
          </button>
        {/if}

        <button
          class="btn hover:preset-tonal w-fit gap-2"
          onclick={() => {
            modal.trigger({
              type: 'component',
              component: { ref: KeyboardShortcuts },
            });
          }}
          title="View Keyboard Shortcuts"
        >
          <KeyboardIcon />
          <span class="whitespace-pre-wrap text-left"
            >View Keyboard Shortcuts</span
          >
        </button>
      </div>

      <h2
        class="mb-2 mt-8 text-xl font-bold scroll-mt-[12px]"
        bind:this={weatherSettingsElement}
      >
        Weather Settings
      </h2>

      <div class="flex flex-col items-start gap-4 w-full my-4">
        <UnitChanger />

        {#if weather.data.length}
          <WeatherGrouping />

          {#if weather.grouping === 'week'}
            <div
              class="rounded-container flex flex-col gap-2 items-start justify-start w-full bg-surface-100 dark:bg-surface-900 p-2"
            >
              <p class="">
                Weekly weather grouping makes for a shorter project. <a
                  href="/documentation/#grouping-weather-data"
                  target="_blank"
                  class="link"
                  rel="noopener noreferrer">Read more details.</a
                >
                {#if weather.goupedByWeek}
                  Your project starts on {DAYS_OF_THE_WEEK.filter(
                    (n) => n.value === weather.goupedByWeek[0].date.getDay(),
                  )[0].label},
                  {MONTHS.filter(
                    (n) =>
                      n.value - 1 === weather.goupedByWeek[0].date.getMonth(),
                  )[0]?.name}
                  {weather.goupedByWeek[0].date.getDate()},
                  {weather.goupedByWeek[0].date.getFullYear()}. It spans {length}
                  {pluralize('week', length)}.
                {/if}
              </p>
              <label class="label flex-col flex">
                <span>Weeks Start On</span>
                <select
                  class="select w-fit mx-auto"
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

        <button
          class="btn hover:preset-tonal w-fit gap-1"
          onclick={async () => {
            modal.trigger({
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
          <span class="whitespace-pre-wrap text-left"
            >Weather Source: {weather.isUserEdited
              ? 'Custom'
              : weather.defaultSource}</span
          >
        </button>
      </div>

      <LocalProjects />

      <h2 class="mb-2 mt-8 text-xl font-bold">Sources</h2>
      <div class="flex flex-col items-start gap-2 w-full text-sm">
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
      <div class="flex flex-col gap-2 items-start text-left">
        <button
          class="btn hover:preset-tonal gap-2"
          onclick={downloadPDF}
          title="Download PDF File"
        >
          {@html ICONS.download}
          Gauges and Weather Data (PDF)
        </button>
        <button
          class="btn hover:preset-tonal gap-2"
          onclick={downloadWeatherCSV}
          title="Download CSV File"
        >
          {@html ICONS.download}
          Weather Data (CSV)</button
        >

        {#if previews.active?.previewComponent}
          <button
            class="btn hover:preset-tonal gap-2 h-auto"
            title="Download PNG File"
            onclick={() => {
              downloadPreviewPNG(
                previews.active.width,
                previews.active.height,
                previews.active.svg,
              );
            }}
          >
            <span class="w-[50px] m-auto h-auto">
              <previews.active.previewComponent />
            </span>

            Preview Image (PNG)
          </button>
        {/if}
      </div>
    </div>
  {/if}

  {#if pages.save}
    <div class="">
      <h2 class="my-2 text-lg font-bold">Save</h2>
      {#if browser && typeof window.localStorage !== 'undefined' && weather.data.length}
        <p class="my-2 inline-flex justify-start items-center gap-2 w-full">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
            class="w-5 h-5 shrink-0"
          >
            <path
              fill-rule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z"
              clip-rule="evenodd"
            />
          </svg>
          Project and {#if weather.isUserEdited}custom weather{:else}weather{/if}
          data saved to this browser
        </p>
        {#if currentSavedProject}
          <div class="">
            <ProjectDetails project={currentSavedProject} canRemove={false} />
          </div>
        {/if}
      {/if}
      <p class="text-sm mt-4 mb-2">Project URL</p>
      <p
        class="select-all break-all card bg-primary-50 dark:bg-primary-950 p-4 basis-full"
      >
        {project.url.href}
      </p>
      <div class="inline-flex flex-wrap my-2 gap-2 items-center">
        <button
          class="btn hover:preset-tonal gap-1"
          onclick={() => {
            saveProject({ copy: true });
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
              d="M8.25 7.5V6.108c0-1.135.845-2.098 1.976-2.192.373-.03.748-.057 1.123-.08M15.75 18H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08M15.75 18.75v-1.875a3.375 3.375 0 00-3.375-3.375h-1.5a1.125 1.125 0 01-1.125-1.125v-1.5A3.375 3.375 0 006.375 7.5H5.25m11.9-3.664A2.251 2.251 0 0015 2.25h-1.5a2.251 2.251 0 00-2.15 1.586m5.8 0c.065.21.1.433.1.664v.75h-6V4.5c0-.231.035-.454.1-.664M6.75 7.5H4.875c-.621 0-1.125.504-1.125 1.125v12c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V16.5a9 9 0 00-9-9z"
            />
          </svg>
          Copy URL
        </button>
      </div>
      <p class="mt-2">
        This is your project's web address. To open your project again, paste
        this URL into your browser's address bar. Save the web address so you
        can access your project later.
      </p>
    </div>
  {/if}
</div>

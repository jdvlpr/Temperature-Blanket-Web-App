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
  import { browser, version } from '$app/environment';
  import { PUBLIC_BASE_URL, PUBLIC_SITE_TITLE } from '$env/static/public';
  import AppLogo from '$lib/components/AppLogo.svelte';
  import AppShell from '$lib/components/AppShell.svelte';
  import Gauges from '$lib/components/Gauges.svelte';
  import Locations from '$lib/components/Locations.svelte';
  import Navigation from '$lib/components/Navigation.svelte';
  import Previews from '$lib/components/Previews.svelte';
  import Tooltip from '$lib/components/Tooltip.svelte';
  import WeatherSection from '$lib/components/WeatherSection.svelte';
  import DonateButton from '$lib/components/buttons/DonateButton.svelte';
  import SectionNavigationButtons from '$lib/components/buttons/SectionNavigationButtons.svelte';
  import ChooseWeatherSource from '$lib/components/modals/ChooseWeatherSource.svelte';
  import GettingStarted from '$lib/components/modals/GettingStarted.svelte';
  import LegacyNotification from '$lib/components/modals/LegacyNotification.svelte';
  import Menu from '$lib/components/modals/Menu.svelte';
  import { ICONS } from '$lib/constants';
  import {
    locations,
    modal,
    pageSections,
    project,
    toast,
    wasProjectLoadedFromURL,
    weather,
  } from '$lib/state';
  import {
    checkForProjectInLocalStorage,
    loadFromHistory,
    setProjectSettings,
    setUnitsFromNavigator,
    updateHistory,
    upToDate,
  } from '$lib/utils';
  import { onMount, untrack } from 'svelte';

  let debounceTimer: number;

  const debounce = (callback: TimerHandler, time: number) => {
    if (!browser) return;
    window.clearTimeout(debounceTimer);
    debounceTimer = window.setTimeout(callback, time);
  };

  onMount(async () => {
    const hasProjectURLParam = new URL(window.location.href).searchParams.has(
      'project',
    );

    if (hasProjectURLParam) {
      // Load a project from the URL
      await loadProjectFromURL();
    } else {
      // Setup up a new project
      // Load the default units based on window.navigator
      setUnitsFromNavigator();
    }

    project.status.loading = false;
  });

  async function loadProjectFromURL() {
    // Check if the project needs to show a legacy notification
    // Use this to display warnings about backwards compatibility if the project is incompatible
    if (!upToDate(project.loaded.version, '0.98'))
      modal.trigger({
        type: 'component',
        component: { ref: LegacyNotification, props: { v: 'v0.98' } },
      });

    await setProjectSettings();

    await checkForProjectInLocalStorage();

    wasProjectLoadedFromURL.value = true;
  }

  $effect(() => {
    if (project.url.hash) debounce(() => updateHistory(), 300);
  });

  $effect(() => {
    project.history.updateMessage;
    if (project.history.updateMessage !== '') {
      untrack(() => {
        toast.trigger({
          message: project.history.updateMessage,
          background: 'preset-filled-success-100-900',
        });
      });
    }
  });
</script>

<svelte:window
  onbeforeunload={(event) => {
    const url = new URL(project.url.href);
    if (
      project.status.saved ||
      !url.searchParams.has('project') ||
      project.history.length === 0
    )
      return;
    event.preventDefault();
    event.returnValue = 'Unsaved Project';
  }}
/>

<svelte:head>
  <title
    >Weather History Visualization for Crochet and Knitting Projects | {PUBLIC_SITE_TITLE}</title
  >
  <meta
    name="description"
    content="Weather Data + Art! Visualize your city's historical climate data, create color gauges, and preview your pattern for your crochet or knitting temperature project. Save the information as PDF, CSV, or PNG files."
  />
  <meta
    property="og:title"
    content="Weather History Visualization for Crochet and Knitting Projects | {PUBLIC_SITE_TITLE}"
  />
  <meta
    property="og:description"
    content="Weather Data + Art! Visualize your city's historical climate data, create color gauges, and preview your pattern for your crochet or knitting temperature project. Save the information as PDF, CSV, or PNG files."
  />
  <meta property="og:url" content={PUBLIC_BASE_URL} />
  <meta property="og:type" content="website" />
  <meta
    property="og:image"
    content="{PUBLIC_BASE_URL}/images/temperature-blanket-og-image-5.0.0.jpg"
  />
  <meta property="og:image:width" content="1200" />
  <meta property="og:image:height" content="630" />
</svelte:head>

{#snippet gettingStarted()}
  <button
    aria-label="Getting Started Guide"
    onclick={() =>
      modal.trigger({
        type: 'component',
        component: { ref: GettingStarted },
      })}
    class="btn bg-secondary-200 dark:bg-secondary-800 gap-2"
  >
    <svg xmlns="http://www.w3.org/2000/svg" class="size-6" viewBox="0 0 24 24"
      ><path
        fill="currentColor"
        d="M20 11h3v2h-3zM1 11h3v2H1zM13 1v3h-2V1zM4.92 3.5l2.13 2.14l-1.42 1.41L3.5 4.93zm12.03 2.13l2.12-2.13l1.43 1.43l-2.13 2.12zM12 6a6 6 0 0 1 6 6c0 2.22-1.21 4.16-3 5.2V19a1 1 0 0 1-1 1h-4a1 1 0 0 1-1-1v-1.8c-1.79-1.04-3-2.98-3-5.2a6 6 0 0 1 6-6m2 15v1a1 1 0 0 1-1 1h-2a1 1 0 0 1-1-1v-1zm-3-3h2v-2.13c1.73-.44 3-2.01 3-3.87a4 4 0 0 0-4-4a4 4 0 0 0-4 4c0 1.86 1.27 3.43 3 3.87z"
      /></svg
    >
    Getting Started
  </button>
{/snippet}

<AppShell pageName="">
  {#snippet stickyHeader()}
    <div class="hidden lg:inline-flex">
      <AppLogo />
    </div>

    <div class="flex gap-2 flex-1 justify-between sm:justify-end">
      {#if weather.data.length && locations.allValid}
        <div class="hidden lg:inline-flex">
          <Tooltip
            classNames="btn hover:preset-tonal gap-1"
            title="Save Project [Cmd]+[s] or [Ctrl]+[s]"
            onclick={() =>
              modal.trigger({
                type: 'component',
                component: { ref: Menu, props: { page: 'save' } },
              })}
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
                d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z"
              />
            </svg>

            <span class="max-[700px]:hidden min-[700px]:inline-block text-sm"
              >Save</span
            >
            {#snippet tooltip()}
              <p>Save your project in this browser and as a URL.</p>
            {/snippet}
          </Tooltip>
        </div>
      {/if}

      {#if weather.data.length}
        <div class="mx-auto sm:mx-0">
          <button
            aria-label="Undo"
            class="btn hover:preset-tonal gap-1"
            title="Undo [Cmd ⌘]+[z] or [Ctrl]+[z]"
            id="undo"
            disabled={!weather.data.length ||
              project.history.isFirst ||
              project.history.isUpdating}
            onclick={() => {
              loadFromHistory({
                action: 'Undo',
              });
            }}
          >
            {@html ICONS.arrowUturnLeft}
            <span class="text-sm max-[740px]:hidden min-[740px]:inline-block"
              >Undo</span
            >
          </button>

          <button
            aria-label="Redo"
            class="btn hover:preset-tonal gap-1"
            id="redo"
            title="Redo [Cmd ⌘]+[Shift ⇧]+[z] or [Ctrl]+[Shift ⇧]+[Z]"
            disabled={!weather.data.length ||
              project.history.isLast ||
              project.history.isUpdating}
            onclick={() => {
              loadFromHistory({
                action: 'Redo',
              });
            }}
          >
            {@html ICONS.arrowUturnRight}
            <span class="text-sm max-[740px]:hidden min-[740px]:inline-block"
              >Redo</span
            >
          </button>
        </div>
      {/if}
    </div>

    <Tooltip
      classNames="btn-icon hover:preset-tonal"
      minWidth="265px"
      title="Help"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        stroke-width="1.5"
        stroke="currentColor"
        class="w-6 h-6 shrink-0"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z"
        />
      </svg>
      {#snippet tooltip()}
        <div
          class="p-2 flex flex-col gap-4"
          aria-orientation="vertical"
          aria-label="Help Menu"
          tabindex="-1"
        >
          {@render gettingStarted()}

          <p>
            <a
              href="/blog/what-is-a-temperature-blanket"
              class="link"
              rel="noreferrer"
            >
              What's a Temperature Blanket?</a
            >
          </p>

          <p>
            <a
              href="/faq"
              rel="noopener noreferrer"
              title="View Frequently Asked Questions"
              class="link"
            >
              Frequently Asked Questions</a
            >
          </p>

          <p>
            <a href="/changelog" rel="noreferrer" class="link"
              >Changelog - What's New?</a
            >
          </p>

          <p>
            <a href="/documentation" rel="noreferrer" class="link"
              >Documentation</a
            >
          </p>

          <div class="flex items-center gap-2">
            <div class="grow border-t border-surface-300-700"></div>

            <p class="shrink text-xs">
              Version {version}
            </p>
            <div class="grow border-t border-surface-300-700"></div>
          </div>
        </div>
      {/snippet}
    </Tooltip>

    <button
      aria-label="menu"
      class="btn-icon hover:preset-tonal"
      onclick={() =>
        modal.trigger({
          type: 'component',
          component: {
            ref: Menu,
            props: { page: 'main' },
          },
          options: { showCloseButton: true },
        })}
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
          d="M12 6.75a.75.75 0 110-1.5.75.75 0 010 1.5zM12 12.75a.75.75 0 110-1.5.75.75 0 010 1.5zM12 18.75a.75.75 0 110-1.5.75.75 0 010 1.5z"
        />
      </svg>
    </button>
  {/snippet}

  {#snippet main()}
    <main
      class="text-center mx-auto max-md:min-h-[calc(100svh-116px)] md:min-h-[calc(100svh-108px)] lg:min-h-[calc(100svh-125px)] p-2"
    >
      <div
        id="page-section-location"
        class="scroll-mt-[76px] pb-12 max-w-(--breakpoint-md) mx-auto"
        class:hidden={pageSections.items[1].active === false}
      >
        <div class="px-2 py-4 w-full">
          <div class="flex flex-col gap-2">
            <h2 class="h1 text-gradient mb-0">Weather Data + Art</h2>
            <p>
              Get historical weather data, choose yarn colors, and visualize
              your crochet or knitting project.
            </p>

            <div
              class="flex flex-col gap-x-4 gap-y-2 text-sm space-around justify-center items-center"
              data-sveltekit-preload-data="hover"
            >
              <a
                href="/blog/what-is-a-temperature-blanket"
                class="link whitespace-pre-wrap"
                rel="noreferrer"
              >
                What's a Temperature Blanket?</a
              >
            </div>
          </div>
        </div>

        <div
          class="md:shadow-lg md:bg-surface-50 dark:bg-surface-950 md:rounded-container md:p-4 mb-2"
        >
          <Locations />
        </div>

        {#if weather.data.length}
          <SectionNavigationButtons thisSectionIndex={1} />
        {/if}
      </div>

      {#if weather.data.length}
        <div
          id="page-section-weather-data"
          class="scroll-mt-[76px] w-full"
          class:hidden={pageSections.items[2].active === false}
        >
          <WeatherSection />
          {#if weather.data.length}
            <SectionNavigationButtons thisSectionIndex={2} />
            {#if !weather.isUserEdited}
              <p class="max-lg:mx-2 text-center text-sm my-4">
                Weather data from <button
                  class="underline"
                  onclick={() => {
                    modal.trigger({
                      type: 'component',
                      component: { ref: ChooseWeatherSource },
                    });
                  }}>{weather.defaultSource}</button
                >.
              </p>
            {/if}
          {/if}
        </div>

        <div
          id="page-section-gauges"
          class="scroll-mt-[76px] w-full"
          class:hidden={pageSections.items[3].active === false}
        >
          {#key project.history.length}
            <Gauges />
          {/key}
          {#if weather.data.length}
            <SectionNavigationButtons thisSectionIndex={3} />
            <p class="max-lg:mx-2 text-center text-sm my-4">
              Real yarn colors will look different than what's on the screen.
              Any trademarked yarn or colorway details are owned by their
              respective companies.
            </p>
          {/if}
        </div>

        <div
          id="page-section-preview"
          class="scroll-mt-[76px] w-full"
          class:hidden={pageSections.items[4].active === false}
        >
          <div class="max-w-(--breakpoint-sm) mx-auto">
            <p class="mb-2">
              Is this web app worth a cup of coffee to you? Your support enables
              ongoing development, keeps the site ad-free, and helps make this
              service available to craftspeople all around the world. Thanks!
            </p>
            <DonateButton />
          </div>

          {#key weather.grouping}
            <Previews />
          {/key}
          {#if weather.data.length}
            <SectionNavigationButtons thisSectionIndex={4} />
          {/if}
          <p class="text-sm max-lg:mx-2 text-center my-4">
            Real projects will look different than the preview. Patterns not
            provided.
          </p>
        </div>
      {/if}
    </main>
  {/snippet}

  {#snippet footer()}
    <Navigation />
  {/snippet}
</AppShell>

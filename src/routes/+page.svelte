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
  import Card from '$lib/components/Card.svelte';
  import Gauges from '$lib/components/Gauges.svelte';
  import Locations from '$lib/components/Locations.svelte';
  import Navigation from '$lib/components/Navigation.svelte';
  import Previews from '$lib/components/Previews.svelte';
  import SectionDetails from '$lib/components/SectionDetails.svelte';
  import Tooltip from '$lib/components/Tooltip.svelte';
  import WeatherSection from '$lib/components/WeatherSection.svelte';
  import DonateButton from '$lib/components/buttons/DonateButton.svelte';
  import SectionNavigationButtons from '$lib/components/buttons/SectionNavigationButtons.svelte';
  import GettingStarted from '$lib/components/modals/GettingStarted.svelte';
  import LegacyNotification from '$lib/components/modals/LegacyNotification.svelte';
  import Menu from '$lib/components/modals/Menu.svelte';
  import { ICONS, LOADED_APP_VERSION } from '$lib/constants';
  import {
    gaugesState,
    history,
    historyChangeMessage,
    isDesktop,
    isHistoryUpdating,
    isProjectLoading,
    isProjectSaved,
    liveProjectURLHash,
    modal,
    openDrawerGettingStarted,
    pageSections,
    pinAllSections,
    projectStatus,
    valid,
    wasProjectLoadedFromURL,
    weather,
    weatherGrouping,
  } from '$lib/stores';
  import {
    checkForProjectInLocalStorage,
    handleKeyDown,
    loadFromHistory,
    setProjectSettings,
    setUnitsFromNavigator,
    updateHistory,
    upToDate,
  } from '$lib/utils';
  import { getToastStore } from '@skeletonlabs/skeleton';
  import { onDestroy, onMount } from 'svelte';
  import { fade } from 'svelte/transition';
  import { Drawer } from 'vaul-svelte';

  let debounceTimer: number;

  const debounce = (callback: TimerHandler, time: number) => {
    if (!browser) return;
    window.clearTimeout(debounceTimer);
    debounceTimer = window.setTimeout(callback, time);
  };

  const toastStore = getToastStore();

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

      // If there's no gauge yet, add the default Temperature Gauge
      if ($gaugesState.created?.length === 0) {
        gaugesState.addCreated('temp');
      }
    }

    // Listen for keyboard events to handle keyboard shortcuts
    window.addEventListener('keydown', handleKeyDown, { passive: true });

    $isProjectLoading = false;
  });

  onDestroy(() => {
    if (!browser) return;
    window.removeEventListener('keydown', handleKeyDown);
  });

  async function loadProjectFromURL() {
    // Check if the project needs to show a legacy notification
    // Use this to display warnings about backwards compatibility if the project is incompatible
    if (!upToDate(LOADED_APP_VERSION, '0.98'))
      modal.state.trigger({
        type: 'component',
        component: { ref: LegacyNotification, props: { v: 'v0.98' } },
      });

    await setProjectSettings();

    await checkForProjectInLocalStorage();

    $wasProjectLoadedFromURL = true;
  }

  $: if ($liveProjectURLHash) debounce(() => updateHistory(), 300);

  $: if ($historyChangeMessage !== '') {
    toastStore.trigger({
      message: $historyChangeMessage,
      background: 'bg-success-300 text-black',
    });
  }
</script>

<svelte:window
  on:beforeunload={(event) => {
    const url = new URL($projectStatus.liveURL);
    if (
      $isProjectSaved ||
      !url.searchParams.has('project') ||
      $history.length === 0
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
    content="{PUBLIC_BASE_URL}/images/temperature-blanket-og-image-1.748.jpg"
  />
  <meta property="og:image:width" content="1200" />
  <meta property="og:image:height" content="630" />
</svelte:head>

<AppShell pageName="">
  <svelte:fragment slot="stickyHeader">
    <div
      class="hidden lg:inline-flex mx-auto absolute translate-x-1/2 right-1/2"
    >
      <AppLogo />
    </div>

    <div class="flex gap-2 flex-1 justify-between sm:justify-end">
      {#if $weather && $valid}
        <div class="hidden lg:inline-flex">
          <Tooltip
            class="btn bg-secondary-hover-token"
            title="Save Project [Cmd]+[s] or [Ctrl]+[s]"
            onclick={() =>
              modal.state.trigger({
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
            <p slot="tooltip">
              Save your project in this browser and as a URL.
            </p>
          </Tooltip>
        </div>
      {/if}

      {#if !!$weather}
        <div class="mx-auto sm:mx-0">
          <button
            class="btn bg-secondary-hover-token"
            title="Undo [Cmd ⌘]+[z] or [Ctrl]+[z]"
            id="undo"
            disabled={!$weather || $history.first || $isHistoryUpdating}
            onclick={() => {
              loadFromHistory({
                action: 'undo',
              });
            }}
          >
            {@html ICONS.arrowUturnLeft}
            <span class="text-sm max-[740px]:hidden min-[740px]:inline-block"
              >Undo</span
            >
          </button>

          <button
            class="btn bg-secondary-hover-token"
            id="redo"
            title="Redo [Cmd ⌘]+[Shift ⇧]+[z] or [Ctrl]+[Shift ⇧]+[Z]"
            disabled={!$weather || $history.last || $isHistoryUpdating}
            onclick={() => {
              loadFromHistory({
                action: 'redo',
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
      class="btn-icon bg-secondary-hover-token"
      minWidth="265px"
      title="Help"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        stroke-width="1.5"
        stroke="currentColor"
        class="w-6 h-6 flex-shrink-0"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z"
        />
      </svg>
      <div
        slot="tooltip"
        class="p-2 flex flex-col gap-4"
        aria-orientation="vertical"
        aria-labelledby="menu-button"
        tabindex="-1"
      >
        <button
          class="btn variant-filled-secondary gap-1 items-center"
          onclick={() =>
            modal.state.trigger({
              type: 'component',
              component: { ref: GettingStarted },
            })}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            class="size-6 relative bottom-[2px]"
            viewBox="0 0 24 24"
            ><path
              fill="currentColor"
              d="M20 11h3v2h-3zM1 11h3v2H1zM13 1v3h-2V1zM4.92 3.5l2.13 2.14l-1.42 1.41L3.5 4.93zm12.03 2.13l2.12-2.13l1.43 1.43l-2.13 2.12zM12 6a6 6 0 0 1 6 6c0 2.22-1.21 4.16-3 5.2V19a1 1 0 0 1-1 1h-4a1 1 0 0 1-1-1v-1.8c-1.79-1.04-3-2.98-3-5.2a6 6 0 0 1 6-6m2 15v1a1 1 0 0 1-1 1h-2a1 1 0 0 1-1-1v-1zm-3-3h2v-2.13c1.73-.44 3-2.01 3-3.87a4 4 0 0 0-4-4a4 4 0 0 0-4 4c0 1.86 1.27 3.43 3 3.87z"
            /></svg
          >

          Getting Started</button
        >
        <!-- <div class="flex-grow border-t border-surface-300-600-token"></div> -->

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
          <a
            href="/blog/2024-02-09-how-to-plan-a-temperature-blanket"
            rel="noopener noreferrer"
            title="View Frequently Asked Questions"
            class="link"
          >
            How to Plan a Temperature Blanket</a
          >
        </p>

        <p>
          <a href="/documentation" rel="noreferrer" class="link"
            >Documentation</a
          >
        </p>

        <p>
          <a href="/changelog" rel="noreferrer" class="link"
            >Changelog - What's New?</a
          >
        </p>

        <div class="flex items-center gap-2">
          <div class="flex-grow border-t border-surface-300-600-token"></div>

          <p class="flex-shrink text-xs">
            Version {version}
          </p>
          <div class="flex-grow border-t border-surface-300-600-token"></div>
        </div>
      </div>
    </Tooltip>

    <button
      aria-label="Open Menu"
      class="btn-icon bg-secondary-hover-token"
      title="Open Menu [.]"
      onclick={() =>
        modal.state.trigger({
          type: 'component',
          component: { ref: Menu, props: { page: 'main' } },
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
  </svelte:fragment>
  <svelte:fragment slot="main">
    <main
      class="text-center mx-auto max-md:min-h-[calc(100svh-123px)] md:min-h-[calc(100svh-115px)] lg:min-h-[calc(100svh-131px)]"
    >
      <div
        id="page-section-location"
        class="scroll-mt-[58px]"
        class:hidden={$pageSections[1].active === false}
      >
        <div class="lg:rounded-container-token overflow-hidden lg:mb-4">
          <div
            class="flex flex-wrap justify-center items-center p-4 text-center bg-cover bg-no-repeat bg-center"
            style="background-image:url('/images/layout/tb-cover-image-winter-trees-sunset.webp');"
          >
            <div
              class="max-w-screen-md w-full rounded-container-token bg-surface-50/85 dark:bg-surface-900/85 shadow px-4 py-4 inline-flex flex-col justify-center items-center gap-4"
            >
              <div class="flex flex-col gap-2">
                <h2 class="font-light text-lg uppercase tracking-widest">
                  Weather Data + Art
                </h2>
                <p class="">
                  Get historical weather data, choose yarn colors, and visualize
                  your crochet or knitting project.
                </p>

                <div
                  class="flex flex-col gap-x-4 gap-y-2 text-sm space-around justify-center items-center"
                  data-sveltekit-preload-data="hover"
                >
                  {#if isDesktop.current}
                    <button
                      class="btn variant-filled-secondary gap-1 items-center"
                      onclick={() =>
                        modal.state.trigger({
                          type: 'component',
                          component: { ref: GettingStarted },
                        })}
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        class="size-5 relative bottom-[2px]"
                        viewBox="0 0 24 24"
                        ><path
                          fill="currentColor"
                          d="M20 11h3v2h-3zM1 11h3v2H1zM13 1v3h-2V1zM4.92 3.5l2.13 2.14l-1.42 1.41L3.5 4.93zm12.03 2.13l2.12-2.13l1.43 1.43l-2.13 2.12zM12 6a6 6 0 0 1 6 6c0 2.22-1.21 4.16-3 5.2V19a1 1 0 0 1-1 1h-4a1 1 0 0 1-1-1v-1.8c-1.79-1.04-3-2.98-3-5.2a6 6 0 0 1 6-6m2 15v1a1 1 0 0 1-1 1h-2a1 1 0 0 1-1-1v-1zm-3-3h2v-2.13c1.73-.44 3-2.01 3-3.87a4 4 0 0 0-4-4a4 4 0 0 0-4 4c0 1.86 1.27 3.43 3 3.87z"
                        /></svg
                      >

                      Getting Started</button
                    >
                  {/if}
                  <Drawer.Root bind:open={$openDrawerGettingStarted}>
                    {#if !isDesktop.current}
                      <Drawer.Trigger
                        onclick={() => ($openDrawerGettingStarted = true)}
                      >
                        <button
                          class="btn variant-filled-secondary gap-1 items-center"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            class="size-6 relative bottom-[2px]"
                            viewBox="0 0 24 24"
                            ><path
                              fill="currentColor"
                              d="M20 11h3v2h-3zM1 11h3v2H1zM13 1v3h-2V1zM4.92 3.5l2.13 2.14l-1.42 1.41L3.5 4.93zm12.03 2.13l2.12-2.13l1.43 1.43l-2.13 2.12zM12 6a6 6 0 0 1 6 6c0 2.22-1.21 4.16-3 5.2V19a1 1 0 0 1-1 1h-4a1 1 0 0 1-1-1v-1.8c-1.79-1.04-3-2.98-3-5.2a6 6 0 0 1 6-6m2 15v1a1 1 0 0 1-1 1h-2a1 1 0 0 1-1-1v-1zm-3-3h2v-2.13c1.73-.44 3-2.01 3-3.87a4 4 0 0 0-4-4a4 4 0 0 0-4 4c0 1.86 1.27 3.43 3 3.87z"
                            /></svg
                          >

                          Getting Started</button
                        >
                      </Drawer.Trigger>
                    {/if}
                    <Drawer.Portal>
                      <Drawer.Overlay class="fixed inset-0 bg-black/40 z-40" />
                      <Drawer.Content
                        class="bg-surface-50-900-token text-token flex flex-col rounded-tl-container-token rounded-tr-container-token mt-24 fixed bottom-0 left-0 right-0 z-50"
                      >
                        <div
                          class="rounded-tl-container-token rounded-tr-container-token overflow-auto"
                        >
                          <div
                            class="mx-auto mt-4 w-12 h-1.5 flex-shrink-0 rounded-full mb-4 bg-surface-900-50-token"
                          ></div>
                          <div class="mx-auto text-center">
                            <GettingStarted />
                          </div>
                        </div>
                      </Drawer.Content>
                    </Drawer.Portal>
                  </Drawer.Root>
                  <a
                    href="/blog/what-is-a-temperature-blanket"
                    class="link whitespace-pre-wrap mt-2"
                    rel="noreferrer"
                  >
                    What is a Temperature Blanket?</a
                  >
                  <!-- <a href="/gallery" class="btn variant-soft-surface text-token">View the Project Gallery</a> -->
                </div>
              </div>
            </div>
          </div>
        </div>
        <Card>
          <SectionDetails slot="header" sectionIndex={1} />
          <Locations slot="content" />
        </Card>
        {#if !$pinAllSections && $weather}
          <SectionNavigationButtons thisSectionIndex={1} />
        {/if}
      </div>

      {#if $weather}
        <div
          id="page-section-weather-data"
          class="lg:my-4 scroll-mt-[58px] w-full"
          in:fade
          class:hidden={$pageSections[2].active === false}
        >
          <Card>
            <SectionDetails slot="header" sectionIndex={2} />
            <div class="max-w-[90vw] mx-auto" slot="content">
              <WeatherSection />
            </div>
          </Card>
          {#if !$pinAllSections && $weather}
            <SectionNavigationButtons thisSectionIndex={2} />
          {/if}
        </div>

        <div
          id="page-section-gauges"
          class="lg:my-4 scroll-mt-[58px] w-full"
          in:fade
          class:hidden={$pageSections[3].active === false}
        >
          <Card>
            <SectionDetails slot="header" sectionIndex={3} />

            <Gauges slot="content" />
          </Card>
          {#if !$pinAllSections && $weather}
            <SectionNavigationButtons thisSectionIndex={3} />
          {/if}
          <p class="max-lg:mx-2 text-center text-sm my-4">
            Real yarn colors will look different than what's on the screen. Any
            trademarked yarn or colorway details are owned by their respective
            companies.
          </p>
          {#if $pinAllSections && $weather}
            <div class="flex-grow border-t border-surface-300-600-token"></div>
          {/if}
        </div>

        <div
          id="page-section-preview"
          in:fade
          class="lg:my-4 scroll-mt-[58px] w-full"
          class:hidden={$pageSections[4].active === false}
        >
          <Card>
            <SectionDetails sectionIndex={4} slot="header" />

            <div slot="content">
              <div class="p-4 my-2">
                <p class="max-w-screen-md mx-auto mb-2">
                  Is this web app worth a cup of coffee to you? Your support
                  enables ongoing development, keeps the site ad-free, and helps
                  make this service available to craftspeople all around the
                  world. Thanks!
                </p>
                <DonateButton />
              </div>

              {#key $weatherGrouping}
                <Previews />
              {/key}
            </div>
          </Card>
          {#if !$pinAllSections && $weather}
            <SectionNavigationButtons thisSectionIndex={4} />
          {/if}
          <p class="text-sm max-lg:mx-2 text-center my-4">
            Real projects will look different than the preview. Patterns not
            provided.
          </p>
        </div>
      {/if}
    </main>
  </svelte:fragment>

  <svelte:fragment slot="footer">
    <Navigation />
  </svelte:fragment>
</AppShell>

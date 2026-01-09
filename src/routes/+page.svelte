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
  import { browser } from '$app/environment';
  import { PUBLIC_BASE_URL, PUBLIC_SITE_TITLE } from '$env/static/public';
  import AppLogo from '$lib/components/AppLogo.svelte';
  import AppShell from '$lib/components/AppShell.svelte';
  import Gauges from '$lib/components/Gauges.svelte';
  import Locations from '$lib/components/Locations.svelte';
  import Navigation from '$lib/components/Navigation.svelte';
  import Previews from '$lib/components/Previews.svelte';
  import WeatherSection from '$lib/components/WeatherSection.svelte';
  import DonateButton from '$lib/components/buttons/DonateButton.svelte';
  import SectionNavigationButtons from '$lib/components/buttons/SectionNavigationButtons.svelte';
  import ChooseWeatherSource from '$lib/components/modals/ChooseWeatherSource.svelte';
  import GettingStarted from '$lib/components/modals/GettingStarted.svelte';
  import LegacyNotification from '$lib/components/modals/LegacyNotification.svelte';
  import Menu from '$lib/components/modals/Menu.svelte';
  import {
    dialog,
    locations,
    pageSections,
    project,
    wasProjectLoadedFromURL,
    weather,
  } from '$lib/state';
  import { checkForProjectInStorage } from '$lib/storage/storage-utils.svelte';
  import { safeSlide } from '$lib/features/transitions/safeSlide';
  import {
    loadFromHistory,
    setProjectSettings,
    setUnitsFromNavigator,
    updateHistory,
    upToDate,
  } from '$lib/utils';
  import {
    BadgeQuestionMarkIcon,
    EllipsisVerticalIcon,
    LightbulbIcon,
    RedoIcon,
    SaveIcon,
    UndoIcon,
  } from '@lucide/svelte';
  import { Popover, Portal } from '@skeletonlabs/skeleton-svelte';
  import { onMount } from 'svelte';

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
      dialog.trigger({
        type: 'component',
        component: { ref: LegacyNotification, props: { v: 'v0.98' } },
      });

    await setProjectSettings();

    await checkForProjectInStorage();
    if (locations.allValid) wasProjectLoadedFromURL.value = true;
  }

  $effect(() => {
    if (project.url.hash) debounce(() => updateHistory(), 300);
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
    onclick={() => {
      dialog.trigger({
        type: 'component',
        component: { ref: GettingStarted },
      });
    }}
    class="btn preset-filled-secondary-500 text-surface-contrast-500 gap-2"
  >
    <LightbulbIcon />
    Getting Started
  </button>
{/snippet}

<AppShell pageName="">
  {#snippet stickyHeader()}
    <div class="hidden lg:inline-flex">
      <AppLogo />
    </div>
    <div class="flex flex-1 justify-between gap-2 sm:justify-end">
      {#if weather.data.length && locations.allValid}
        <div class="hidden lg:inline-flex">
          <button
            class="btn hover:preset-tonal"
            title="Save your project in this browser and as a URL."
            onclick={() =>
              dialog.trigger({
                type: 'component',
                component: { ref: Menu, props: { page: 'save' } },
              })}
          >
            <SaveIcon />

            <span class="max-[700px]:hidden min-[700px]:inline-block">
              Save
            </span>
          </button>
        </div>
      {/if}

      {#if weather.data.length}
        <div class="mx-auto sm:mx-0">
          <button
            aria-label="Undo"
            class="btn hover:preset-tonal"
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
            <UndoIcon />
            <span class="max-[740px]:hidden min-[740px]:inline-block">Undo</span
            >
          </button>

          <button
            aria-label="Redo"
            class="btn hover:preset-tonal"
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
            <RedoIcon />
            <span class=" max-[740px]:hidden min-[740px]:inline-block"
              >Redo</span
            >
          </button>
        </div>
      {/if}
    </div>

    <Popover>
      <Popover.Trigger
        class="btn hover:preset-tonal"
        aria-label="About"
        title="About"
      >
        <BadgeQuestionMarkIcon />
        <span class="hidden sm:inline-block">About</span>
      </Popover.Trigger>
      <Portal>
        <Popover.Positioner>
          <Popover.Content
            class="card bg-surface-200-800 z-49 w-72 max-w-(--breakpoint-sm) p-2 shadow-xl"
          >
            {#snippet element(attributes)}
              {#if !attributes.hidden}
                <div {...attributes} transition:safeSlide>
                  <Popover.Description>
                    <div
                      class="flex flex-col gap-4 p-2"
                      aria-orientation="vertical"
                      aria-label="Help Menu"
                    >
                      {@render gettingStarted()}

                      <p>
                        <a
                          href="/faq"
                          title="View Frequently Asked Questions"
                          class="link"
                        >
                          Frequently Asked Questions</a
                        >
                      </p>

                      <p>
                        <a href="/changelog" class="link">What's New?</a>
                      </p>

                      <p>
                        <a href="/documentation" class="link">Documentation</a>
                      </p>
                    </div>
                  </Popover.Description>
                  <Popover.Arrow
                    style="--arrow-size: calc(var(--spacing) * 4); --arrow-background: var(--color-surface-200-800);"
                  >
                    <Popover.ArrowTip />
                  </Popover.Arrow>
                </div>
              {/if}
            {/snippet}
          </Popover.Content>
        </Popover.Positioner>
      </Portal>
    </Popover>

    <button
      aria-label="Project Options"
      title="Project Options"
      class="max-sm:btn-icon sm:btn hover:preset-tonal"
      onclick={() =>
        dialog.trigger({
          type: 'component',
          component: {
            ref: Menu,
            props: { page: 'main' },
          },
          options: { showCloseButton: true },
        })}
    >
      <EllipsisVerticalIcon />
      <span class="hidden sm:inline-block">Project</span>
    </button>
  {/snippet}

  {#snippet main()}
    <main
      class="mx-auto p-2 text-center max-md:min-h-[calc(100svh-112px)] md:min-h-[calc(100svh-104px)] lg:min-h-[calc(100svh-120px)]"
    >
      <div
        id="page-section-location"
        class="mx-auto max-w-(--breakpoint-md) scroll-mt-[76px] pb-12"
        class:hidden={pageSections.items[1].active === false}
      >
        <div class="w-full px-2 py-4">
          <div class="flex flex-col gap-2">
            <h2 class="h1 text-gradient mb-0">Weather Data + Art</h2>
            <p>
              Get historical weather data, choose yarn colors, and visualize
              your crochet or knitting project.
            </p>

            <div
              class="space-around flex flex-col items-center justify-center gap-x-4 gap-y-2 text-sm"
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
          class="md:bg-surface-50 dark:md:bg-surface-950 md:rounded-container mb-2 md:p-4 md:shadow-lg"
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
          class="w-full scroll-mt-[76px]"
          class:hidden={pageSections.items[2].active === false}
        >
          <WeatherSection />
          {#if weather.data.length}
            <SectionNavigationButtons thisSectionIndex={2} />
            {#if !weather.isUserEdited}
              <p class="my-4 text-center text-sm max-lg:mx-2">
                Weather data from <button
                  class="underline"
                  onclick={() => {
                    dialog.trigger({
                      type: 'component',
                      component: { ref: ChooseWeatherSource },
                    });
                  }}>{weather.source.name}</button
                >.
              </p>
            {/if}
          {/if}
        </div>

        <div
          id="page-section-gauges"
          class="w-full scroll-mt-[76px]"
          class:hidden={pageSections.items[3].active === false}
        >
          {#key project.history.length}
            <Gauges />
          {/key}
          {#if weather.data.length}
            <SectionNavigationButtons thisSectionIndex={3} />
            <p class="my-4 text-center text-sm max-lg:mx-2">
              Real yarn colors will look different than what's on the screen.
              Any trademarked yarn or colorway details are owned by their
              respective companies.
            </p>
          {/if}
        </div>

        <div
          id="page-section-preview"
          class="w-full scroll-mt-[76px]"
          class:hidden={pageSections.items[4].active === false}
        >
          <div class="mx-auto max-w-screen-md">
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

          <SectionNavigationButtons thisSectionIndex={4} />

          <p class="my-4 text-center text-sm max-lg:mx-2">
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

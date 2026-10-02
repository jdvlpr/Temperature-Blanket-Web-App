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
  import { browser } from '$app/environment';
  import { beforeNavigate } from '$app/navigation';
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
  import LegacyNotification from '$lib/components/modals/LegacyNotification.svelte';
  import ProjectMenuButton from '$lib/components/buttons/ProjectMenuButton.svelte';
  import SaveButton from '$lib/components/buttons/SaveButton.svelte';
  import ProjectTitle from '$lib/components/ProjectTitle.svelte';
  import { locations } from '$lib/state/location-state.svelte';
  import {
    dialog,
    isDesktop,
    pageSections,
    toast,
  } from '$lib/state/page-state.svelte';
  import { project } from '$lib/state/project-state.svelte';
  import { weather } from '$lib/state/weather-state.svelte';
  import {
    autosave,
    changedElsewhereMessage,
    saveCopy,
    saveNow,
  } from '$lib/storage/autosave.svelte';
  import { ProjectStorage } from '$lib/storage/projects.svelte';
  import { takeJustTrashed } from '$lib/storage/trash';
  import {
    loadFromHistory,
    updateHistory,
  } from '$lib/utils/history-utils.svelte';
  import { loadProjectFromURL } from '$lib/utils/load-project-utils.svelte';
  import { upToDate } from '$lib/utils/other-utils';
  import { setUnitsFromNavigator } from '$lib/utils/unit-utils.svelte';
  import { RedoIcon, UndoIcon } from '@lucide/svelte';
  import { onMount, untrack } from 'svelte';

  let debounceTimer: number;

  const debounce = (callback: TimerHandler, time: number) => {
    if (!browser) return;
    window.clearTimeout(debounceTimer);
    debounceTimer = window.setTimeout(callback, time);
  };

  async function loadProject() {
    // Check if the project needs to show a legacy notification
    // Use this to display warnings about backwards compatibility if the project is incompatible
    if (!upToDate(project.onLoaded.version, '0.98'))
      dialog.trigger({
        type: 'component',
        component: { ref: LegacyNotification, props: { v: 'v0.98' } },
      });

    if (project.onLoaded.isProject) await ProjectStorage.load();

    await loadProjectFromURL();

    if (locations.allValid) project.status.wasLoaded = true;
  }

  // Leaving for another page of the site: a change waiting to save saves now
  beforeNavigate(() => void saveNow());

  // Another tab or device changed the open project: say so once, since
  // changes here stop saving rather than overwrite it
  $effect(() => {
    if (autosave.state !== 'conflict') return;
    untrack(() =>
      toast.trigger({
        message: `${changedElsewhereMessage()} Save them as a copy, or reload to get the latest version.`,
        category: 'warning',
        autohide: false,
        action: {
          label: 'Save a copy',
          response: async () => {
            await saveCopy();
            toast.trigger({
              message: 'Saved a copy. You’re now working on the copy.',
              category: 'success',
            });
          },
        },
      }),
    );
  });

  $effect(() => {
    const hash = project.url.hash;
    const loading = project.status.loading;
    // Skip mid-restore: loadProjectFromURL changes project.url.hash across
    // several awaited steps, so this could otherwise debounce on an
    // intermediate (e.g. preview-less) hash and push it to history.
    if (hash && !loading) debounce(() => updateHistory(), 300);
  });

  // Started over after moving a project to the Trash: offer to put it back
  function showUndoTrash() {
    const trashed = takeJustTrashed();
    if (!trashed) return;
    toast.trigger({
      message: `Moved ${trashed.label} to the Trash`,
      category: 'success',
      action: {
        label: 'Undo',
        response: async () => {
          try {
            await ProjectStorage.restoreFromTrash(trashed.id);
            window.location.assign(trashed.href);
          } catch {
            toast.trigger({
              message: 'Unable to restore the project',
              category: 'error',
            });
          }
        },
      },
    });
  }

  onMount(async () => {
    const isProject = new URL(window.location.href).searchParams.has('project');

    if (isProject) {
      // Load a project from the URL
      await loadProject();
    } else {
      // Setup up a new project
      // Load the default units based on window.navigator
      setUnitsFromNavigator();
      showUndoTrash();
    }

    project.status.loading = false;
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

<AppShell pageName="">
  {#snippet stickyHeader()}
    <div class="hidden shrink-0 lg:inline-flex">
      <AppLogo />
    </div>
    <div class="flex min-w-0 flex-1 justify-between gap-2 sm:justify-end">
      {#if weather.data.length}
        <!-- The project's name and whether it's saved, in the space wider
        screens have spare -->
        {#if isDesktop.current}
          <div class="flex min-w-0 flex-1 items-center gap-0.5 lg:ml-2">
            <ProjectTitle />
          </div>
        {/if}
        <!-- One row: icon buttons on smaller screens, never wrapping -->
        <div class="mx-auto flex shrink-0 gap-2 sm:mx-0">
          <button
            aria-label="Undo"
            class="max-md:btn-icon md:btn hover:preset-tonal-surface"
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
            <span class="inline-block max-md:hidden">Undo</span>
          </button>

          <button
            aria-label="Redo"
            class="max-md:btn-icon md:btn hover:preset-tonal-surface"
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
            <span class="inline-block max-md:hidden">Redo</span>
          </button>

          {#if !isDesktop.current}
            <SaveButton />
          {/if}
        </div>
      {/if}
    </div>

    <ProjectMenuButton />
  {/snippet}

  {#snippet main()}
    <main class="mx-auto pb-18 text-center" id="main-page">
      <div
        id="page-section-location"
        class="mx-auto max-w-(--breakpoint-md) scroll-mt-[76px]"
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
          class="md:bg-surface-50 dark:md:bg-surface-950 md:rounded-container md:card-border mx-auto mb-2 px-2 md:p-4 md:shadow-lg"
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
              <p class="my-4 px-2 text-center text-sm">
                Weather data from <button
                  class="underline"
                  onclick={() => {
                    dialog.trigger({
                      type: 'component',
                      component: { ref: ChooseWeatherSource },
                      options: {
                        size: 'small',
                      },
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
            <p class="my-4 px-2 text-center text-sm">
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
          <div class="mx-auto max-w-screen-md px-2">
            <p class="my-2">
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

          <p class="my-4 px-2 text-center text-sm">
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

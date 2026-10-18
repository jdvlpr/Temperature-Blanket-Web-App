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

<!-- The Project menu, about the open project only, in the same shape as the
Yarn page's Palette menu: a card with its name and save state; Download; its
Share rows; its gauges' Palettes; the Project itself (New, Open…, Duplicate,
Move to Trash); a line of help links. New Project and what Open chooses open
here, in its place, asking first when that would lose changes (leaveFor). A
side panel on large screens (see openProjectMenu); dialogs opened from here
open in the panel, with a Back button to it. -->

<script lang="ts">
  import {
    BTN_PRIMARY,
    PANEL_ROW,
    SMALL_LINK,
    SMALL_LINKS,
  } from '#lib/constants/class-constants.js';
  import { resolve } from '$app/paths';
  import { page } from '$app/state';
  import { backHereOnClick, signInHref } from '#lib/accounts/redirect.js';
  import { account } from '#lib/accounts/summary.svelte.js';
  import PaletteStrip from '#lib/components/PaletteStrip.svelte';
  import PanelGroup from '#lib/components/PanelGroup.svelte';
  import RenameProject from '#lib/components/RenameProject.svelte';
  import SaveStatus from '#lib/components/SaveStatus.svelte';
  import { locations } from '#lib/state/location-state.svelte.js';
  import { gauges } from '#lib/state/gauges-state.svelte.js';
  import { dialog, toast } from '#lib/state/page-state.svelte.js';
  import { project } from '#lib/state/project-state.svelte.js';
  import { weather } from '#lib/state/weather-state.svelte.js';
  import { weatherDays } from '#lib/state/weather-days.svelte.js';
  import {
    weatherSearch,
    type SearchMode,
  } from '#lib/state/weather-search.svelte.js';
  import { WEATHER_ACTIONS } from '#lib/utils/weather-actions.js';
  import { pluralize } from '#lib/utils/string-utils.js';
  import {
    addOpenProjectToAccount,
    autosave,
    changedElsewhereMessage,
    saveCopy,
    storedItem,
    trashOpenProject,
  } from '#lib/storage/autosave.svelte.js';
  import {
    savedProjects,
    type StoredProjectIndexItem,
  } from '#lib/storage/projects.svelte.js';
  import { rememberJustTrashed, TRASH_DAYS } from '#lib/storage/trash.js';
  import { saveProject } from '#lib/utils/save-project.svelte.js';
  import {
    BookmarkIcon,
    CalendarPlusIcon,
    ChevronRightIcon,
    CloudAlertIcon,
    CopyPlusIcon,
    DownloadIcon,
    ExternalLinkIcon,
    FolderOpenIcon,
    LoaderCircleIcon,
    LogInIcon,
    MonitorIcon,
    MonitorXIcon,
    PlusIcon,
    RefreshCwIcon,
    Trash2Icon,
    TriangleAlertIcon,
  } from '@lucide/svelte';
  import { loadShareState } from '#lib/accounts/share-rows.js';
  import ShareRows from '#lib/components/ShareRows.svelte';
  import { projectShareRows } from '#lib/utils/project-share.js';
  import { onMount } from 'svelte';
  import { confirmTrashProject } from '#lib/utils/confirm-trash.js';
  import { openHere } from '#lib/utils/leave-project.js';
  import ExportOptions from './ExportOptions.svelte';
  import { openProjectScreen } from './open-project.js';
  import { openGaugePalette } from './gauge-palette.js';
  import GettingStarted from './GettingStarted.svelte';
  import KeyboardShortcuts from './KeyboardShortcuts.svelte';

  const ROW = PANEL_ROW;
  const LINK_ICON = 'icon-sm inline opacity-60';

  const hasWeather = $derived(weather.data.length > 0);
  const hasProject = $derived(hasWeather && locations.allValid);
  const signedIn = $derived(
    __ACCOUNTS_ENABLED__ && Boolean(account.summary?.id),
  );
  const problem = $derived(
    autosave.on &&
      (autosave.state === 'conflict' || autosave.state === 'error'),
  );

  // Opens in the panel, in place of the menu, with Back to it; a returnable
  // screen opens what's chosen on it in its place too
  const open = (ref: unknown, title: string, returnable = false) =>
    dialog.trigger({
      type: 'component',
      component: { ref },
      options: { title, returnable },
    });

  // Saves it here: the card then says where it's saved
  let saving = $state(false);
  async function save() {
    saving = true;
    try {
      await saveProject();
    } finally {
      saving = false;
    }
  }

  // The open project's name, ready before Copy Link is pressed: a clipboard
  // write right after waiting on storage can be refused (Safari)
  let shareName = $state('');
  let shareItem = $state<StoredProjectIndexItem>();
  $effect(() => {
    void project.url.href;
    void savedProjects.version;
    const linkName = project.linkName;
    storedItem().then((item) => {
      shareName = item ? (item.meta.name ?? '') : linkName;
      shareItem = item;
    });
  });

  // Copy Link and its gallery page, right in the list; what they open
  // opens in the panel with Back to this menu
  const shareRowsList = $derived(projectShareRows(shareName, shareItem));
  onMount(() => loadShareState('project'));

  // Over the page, once this panel is out of the way
  function searchWeather(mode: SearchMode) {
    dialog.close();
    weatherSearch.start({ mode });
  }

  async function copyProject() {
    try {
      await saveCopy();
      dialog.close();
      toast.trigger({
        message: 'Duplicated. You’re now working on the copy.',
        category: 'success',
      });
    } catch (e) {
      console.warn("Can't duplicate", { e });
      toast.trigger({ message: 'Unable to duplicate', category: 'error' });
    }
  }

  // To the Trash, then a new project, which offers Undo (see the home page)
  async function trashProject() {
    try {
      const item = await storedItem();
      if (!item) return;
      // Its gallery page comes down with it, so it asks first
      if (!(await confirmTrashProject(item.id))) return;
      await trashOpenProject();
      rememberJustTrashed({
        id: item.id,
        label: item.meta.name || item.meta.title || 'Untitled Project',
        href: item.meta.href,
      });
      // Replaced, so Back doesn't return to it
      window.location.replace(resolve('/'));
    } catch (e) {
      console.warn("Can't move the project to the Trash", { e });
      toast.trigger({
        message: 'Unable to delete the project',
        category: 'error',
      });
    }
  }
</script>

<!-- Save, until the project saves by itself; the Project button's dot (in
the same color) says it's waiting here -->
{#snippet saveButton()}
  <button
    type="button"
    class="{BTN_PRIMARY} self-start"
    disabled={saving}
    onclick={save}
    data-testid="menu-save"
  >
    {#if saving}
      <LoaderCircleIcon class="animate-spin" />
    {:else}
      <BookmarkIcon />
    {/if}
    Save Project
  </button>
{/snippet}

<!-- Its title, Project, is in the dialog's header -->
<div class="flex w-full flex-col gap-6 p-4 pt-2 text-left">
  <!-- This project -->
  <section
    class="bg-surface-100 dark:bg-surface-900 rounded-container card-border flex flex-col gap-2 p-4"
    aria-label="This project"
  >
    <RenameProject />

    <!-- Where it's saved -->
    {#if problem}
      <p
        class="flex items-center gap-2 text-sm font-bold"
        data-testid="autosave-status"
      >
        {#if autosave.account}
          <CloudAlertIcon class="icon-sm text-error-700-300" />
        {:else}
          <MonitorXIcon class="icon-sm text-error-700-300" />
        {/if}
        Not saved
      </p>
    {:else if autosave.on}
      <SaveStatus
        saveState={autosave.state}
        account={autosave.account}
        addToAccount={addOpenProjectToAccount}
      />
    {:else if autosave.stored}
      <!-- Another account's project, here signed out -->
      <p class="flex items-start gap-1 text-sm">
        <MonitorIcon class="icon-sm mt-0.5 shrink-0 opacity-70" />
        <span>
          Saved in this browser{#if !project.status.saved}, with unsaved changes{/if}.
        </span>
      </p>
      {#if !project.status.saved}{@render saveButton()}{/if}
    {:else if hasProject}
      {@render saveButton()}
    {:else if !hasWeather}
      <p class="text-sm opacity-70">
        Choose a location and get its weather data to start a project.
      </p>
      <!-- Signed out: their account's projects are a sign-in away -->
      {#if __ACCOUNTS_ENABLED__ && !account.summary?.id}
        <p class="mt-2 text-sm opacity-70">
          Sign in to open your saved projects and yarn palettes from any device.
        </p>
        <a
          href={signInHref(page.url)}
          onclick={backHereOnClick}
          class="btn preset-tonal-primary self-start"
          data-testid="menu-sign-in"
        >
          <LogInIcon />
          Sign In
        </a>
      {/if}
    {/if}

    {#if problem && autosave.state === 'conflict'}
      <div
        class="preset-tonal-warning rounded-container flex flex-col gap-2 p-3 text-sm"
        role="alert"
      >
        <p class="flex items-start gap-2">
          <TriangleAlertIcon class="icon-sm shrink-0" />
          {changedElsewhereMessage()}
        </p>
        <div class="flex flex-wrap gap-2">
          <button
            type="button"
            class="btn btn-sm preset-filled-primary-500"
            onclick={copyProject}><CopyPlusIcon /> Duplicate</button
          >
          <button
            type="button"
            class="btn btn-sm hover:bg-surface-200-800"
            onclick={() => window.location.reload()}
            ><RefreshCwIcon /> Reload the Latest</button
          >
        </div>
      </div>
    {:else if problem}
      <p class="text-error-700-300 text-sm" role="alert">
        {#if autosave.account}
          Changes couldn’t be saved. Check your connection; they’ll save once
          they can.
        {:else}
          Changes couldn’t be saved in this browser. They’ll try again with your
          next change.
        {/if}
      </p>
    {/if}
  </section>

  <!-- What to do with it: nothing until there's a project -->
  {#if hasWeather}
    <PanelGroup label="Download">
      <li>
        <button
          type="button"
          class={ROW}
          onclick={() => open(ExportOptions, 'Download', true)}
        >
          <DownloadIcon class="shrink-0 opacity-70" />
          <span class="flex flex-1 flex-col">
            <span>Download</span>
            <span class="text-xs opacity-70"
              >PDF, preview image, Google Sheet or weather data</span
            >
          </span>
          <ChevronRightIcon class="icon-sm shrink-0 opacity-50" />
        </button>
      </li>
    </PanelGroup>

    <!-- Its weather again, as the planner's Weather Data menu offers -->
    {#if weatherDays.canSearchAgain}
      <PanelGroup heading="Weather Data">
        {#if weatherDays.offersNewDays}
          <li>
            <button
              type="button"
              class={ROW}
              disabled={!weatherDays.newDaysCount}
              onclick={() => searchWeather('new-days')}
            >
              <CalendarPlusIcon class="shrink-0 opacity-70" />
              <span class="flex flex-1 flex-col">
                <span>{WEATHER_ACTIONS['new-days'].label}</span>
                <span class="text-xs opacity-70"
                  >{weatherDays.newDaysCount
                    ? `${weatherDays.newDaysCount} new ${pluralize('day', weatherDays.newDaysCount)} available`
                    : WEATHER_ACTIONS['new-days'].upToDate}</span
                >
              </span>
            </button>
          </li>
        {/if}
        <li>
          <button
            type="button"
            class={ROW}
            onclick={() => searchWeather('again')}
          >
            <RefreshCwIcon class="shrink-0 opacity-70" />
            <span class="flex flex-1 flex-col">
              <span>{WEATHER_ACTIONS.again.label}</span>
              <span class="text-xs opacity-70"
                >{WEATHER_ACTIONS.again.description}</span
              >
            </span>
          </button>
        </li>
      </PanelGroup>
    {/if}

    <PanelGroup heading="Share">
      <ShareRows rows={shareRowsList} />
    </PanelGroup>

    <!-- Each gauge's palette: to keep in My Palettes, or export -->
    {#if gauges.allCreated.length}
      <PanelGroup heading="Palettes">
        {#each gauges.allCreated as gauge (gauge.id)}
          <li>
            <button
              type="button"
              class={ROW}
              onclick={() =>
                openGaugePalette(
                  gauge.id,
                  gauge.label,
                  shareName || locations.projectTitle,
                )}
            >
              <span class="w-16 shrink-0" aria-hidden="true">
                <PaletteStrip
                  colors={gauge.colors}
                  height="24px"
                  corners="small"
                  insideControl
                />
              </span>
              <span class="flex min-w-0 flex-1 flex-col">
                <span>{gauge.label}</span>
                <span class="text-xs opacity-70"
                  >Save, image, color codes or yarn names</span
                >
              </span>
              <ChevronRightIcon class="icon-sm shrink-0 opacity-50" />
            </button>
          </li>
        {/each}
      </PanelGroup>
    {/if}
  {/if}

  <!-- The project itself, and others: Open even before there's one -->
  <PanelGroup heading="Project">
    {#if hasWeather}
      <li>
        <a
          href={resolve('/')}
          class={ROW}
          onclick={(event) => openHere(event, resolve('/'))}
          data-sveltekit-reload
        >
          <PlusIcon class="shrink-0 opacity-70" />
          <span class="flex flex-1 flex-col">
            <span>New Project</span>
            <span class="text-xs opacity-70"
              >{autosave.stored
                ? 'This one stays in My Projects'
                : 'In place of this one'}</span
            >
          </span>
        </a>
      </li>
    {/if}
    <li>
      <button
        type="button"
        class={ROW}
        onclick={() => openProjectScreen(true)}
        data-testid="menu-open"
      >
        <FolderOpenIcon class="shrink-0 opacity-70" />
        <span class="flex flex-1 flex-col">
          <span>Open…</span>
          <span class="text-xs opacity-70"
            >{signedIn
              ? 'Your projects, or ones you starred'
              : 'Your saved projects'}</span
          >
        </span>
        <ChevronRightIcon class="icon-sm shrink-0 opacity-50" />
      </button>
    </li>
    {#if hasProject}
      <li>
        <button
          type="button"
          class={ROW}
          title="Save these settings as a new project, and leave this one as it is"
          onclick={copyProject}
        >
          <CopyPlusIcon class="shrink-0 opacity-70" />
          <span class="flex flex-1 flex-col">
            <span>Duplicate</span>
            <span class="text-xs opacity-70">A new project from this one</span>
          </span>
        </button>
      </li>
    {/if}
    {#if hasWeather && autosave.stored}
      <li>
        <button
          type="button"
          class="{ROW} text-error-700-300"
          onclick={trashProject}
          data-testid="trash-project"
        >
          <Trash2Icon class="shrink-0 opacity-70" />
          <span class="flex flex-1 flex-col">
            <span>Move to Trash</span>
            <span class="text-xs opacity-70"
              >Restore it from My Library for {TRASH_DAYS} days</span
            >
          </span>
        </button>
      </li>
    {/if}
  </PanelGroup>

  <!-- Help, in one line: the site menu has the rest -->
  <nav
    class={[SMALL_LINKS, 'border-surface-200-800 border-t pt-4']}
    aria-label="Help"
  >
    <button
      type="button"
      class={SMALL_LINK}
      onclick={() => open(GettingStarted, 'Getting Started')}
      >Getting Started</button
    >
    <button
      type="button"
      class={SMALL_LINK}
      onclick={() => open(KeyboardShortcuts, 'Keyboard Shortcuts')}
      >Keyboard Shortcuts</button
    >

    <a href={resolve('documentation')} target="_blank" class={SMALL_LINK}>
      Guides & Help
      <ExternalLinkIcon class={LINK_ICON} /><span class="sr-only"
        >(opens in a new tab)</span
      >
    </a>

    <a href={resolve('contact')} target="_blank" class={SMALL_LINK}
      >Contact <ExternalLinkIcon class={LINK_ICON} /><span class="sr-only"
        >(opens in a new tab)</span
      ></a
    >
  </nav>
</div>

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

<!-- The Project menu, about the open project only: a card with its name, save
state and colors (on wider screens, the top bar has its name, so the card is
only its save state); a list of what to do with it; a few recent projects; a line
of help links. Save itself is in the top bar. A side panel on large screens
(see openProjectMenu); dialogs opened from here open in the panel, with a Back
button to it. -->

<script lang="ts">
  import { PANEL_LIST, PANEL_ROW } from '$lib/constants/class-constants';
  import { browser } from '$app/environment';
  import { resolve } from '$app/paths';
  import { account } from '$lib/accounts/summary.svelte';
  import RenameProject from '$lib/components/RenameProject.svelte';
  import SaveStatus from '$lib/components/SaveStatus.svelte';
  import { locations } from '$lib/state/location-state.svelte';
  import { dialog, isDesktop, toast } from '$lib/state/page-state.svelte';
  import { project } from '$lib/state/project-state.svelte';
  import { weather } from '$lib/state/weather-state.svelte';
  import {
    autosave,
    changedElsewhereMessage,
    saveCopy,
    storedItem,
    trashOpenProject,
  } from '$lib/storage/autosave.svelte';
  import {
    ProjectStorage,
    savedProjects,
    type StoredProjectIndexItem,
  } from '$lib/storage/projects.svelte';
  import { rememberJustTrashed, TRASH_DAYS } from '$lib/storage/trash';
  import { sync } from '$lib/sync/status.svelte';
  import { copyToClipboard } from '$lib/utils/clipboard-utils';
  import { getColorsFromInput } from '$lib/utils/color-utils';
  import {
    ChevronRightIcon,
    CloudAlertIcon,
    CopyPlusIcon,
    DownloadIcon,
    ExternalLinkIcon,
    FolderOpenIcon,
    LinkIcon,
    LogInIcon,
    MonitorIcon,
    MonitorXIcon,
    PlusIcon,
    RefreshCwIcon,
    SendIcon,
    Trash2Icon,
    TriangleAlertIcon,
  } from '@lucide/svelte';
  import AddToGallery from './AddToGallery.svelte';
  import ExportOptions from './ExportOptions.svelte';
  import GettingStarted from './GettingStarted.svelte';
  import KeyboardShortcuts from './KeyboardShortcuts.svelte';

  const ROW = PANEL_ROW;
  const LINK = 'hover:underline opacity-80 hover:opacity-100';
  const LINK_ICON = 'inline size-3 opacity-60';

  const hasWeather = $derived(weather.data.length > 0);
  const hasProject = $derived(hasWeather && locations.allValid);
  const hasGalleryPage = $derived(
    Boolean(
      project.gallery.href &&
      project.gallery.title &&
      project.gallery.title === locations.projectTitle,
    ),
  );
  // Wider screens show its name in the top bar, so the card here just says
  // where it's saved
  const inTopBar = $derived(isDesktop.current && hasWeather);
  const problem = $derived(
    autosave.on &&
      (autosave.state === 'conflict' || autosave.state === 'error'),
  );
  const colors = $derived(
    hasProject ? getColorsFromInput({ string: project.url.href }) || [] : [],
  );

  // Opens in the panel, in place of the menu, with Back to it; a returnable
  // screen opens what's chosen on it in its place too
  const open = (ref: unknown, title: string, returnable = false) =>
    dialog.trigger({
      type: 'component',
      component: { ref },
      options: { title, returnable },
    });

  async function copyLink() {
    await copyToClipboard(
      project.url.href,
      'Link copied',
      'Unable to copy to your clipboard',
    );
  }

  async function copyProject() {
    try {
      await saveCopy();
      dialog.close();
      toast.trigger({
        message: 'Saved a copy. You’re now working on the copy.',
        category: 'success',
      });
    } catch (e) {
      console.warn("Can't save a copy", { e });
      toast.trigger({ message: 'Unable to save a copy', category: 'error' });
    }
  }

  // To the Trash, then a new project, which offers Undo (see the home page)
  async function trashProject() {
    try {
      const item = await storedItem();
      if (!item) return;
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

  // A few recent projects, not counting this one
  let recent = $state<StoredProjectIndexItem[]>([]);
  let recentTotal = $state(0);
  $effect(() => {
    void savedProjects.version;
    void sync.version;
    void account.summary?.id;
    const openId = new URL(project.url.href).searchParams.get('project');
    if (!browser) return;
    ProjectStorage.getProjectsForDisplay().then((all) => {
      recentTotal = all.length;
      recent = all.filter((item) => item.id !== openId).slice(0, 3);
    });
  });
</script>

<!-- Its title, Project, is in the dialog's header -->
<div class="flex w-full flex-col gap-6 p-4 pt-2 text-left">
  <!-- This project -->
  <section
    class="bg-surface-100 dark:bg-surface-900 rounded-container card-border flex flex-col gap-2 p-4"
    aria-label="This project"
  >
    {#if !inTopBar}
      <RenameProject />

      {#if colors.length}
        <div
          class="rounded-base flex h-3 w-full overflow-hidden"
          aria-hidden="true"
        >
          {#each colors as color, i (i)}
            <div class="flex-1" style:background-color={color.hex}></div>
          {/each}
        </div>
      {/if}
    {/if}

    <!-- Where it's saved -->
    {#if problem}
      <p
        class="flex items-center gap-2 text-sm font-bold"
        data-testid="autosave-status"
      >
        {#if autosave.account}
          <CloudAlertIcon class="text-error-700-300 size-4" />
        {:else}
          <MonitorXIcon class="text-error-700-300 size-4" />
        {/if}
        Not saved
      </p>
    {:else if autosave.on}
      <SaveStatus />
    {:else if autosave.stored}
      <!-- Another account's project, here signed out -->
      <p class="flex items-start gap-1 text-sm">
        <MonitorIcon class="mt-0.5 size-4 shrink-0 opacity-70" />
        <span>
          Saved in this browser{#if !project.status.saved}, with unsaved changes{/if}.
        </span>
      </p>
    {:else if hasProject}
      <p class="text-sm opacity-70">Not saved yet</p>
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
          href={resolve('/account')}
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
          <TriangleAlertIcon class="size-4 shrink-0" />
          {changedElsewhereMessage()}
        </p>
        <div class="flex flex-wrap gap-2">
          <button
            type="button"
            class="btn btn-sm preset-filled-primary-500"
            onclick={copyProject}><CopyPlusIcon /> Save a Copy</button
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
    <section aria-label="Project actions">
      <ul class={PANEL_LIST}>
        {#if hasProject}
          <li>
            <button type="button" class={ROW} onclick={copyLink}>
              <LinkIcon class="shrink-0 opacity-70" />
              <span class="flex flex-1 flex-col">
                <span>Copy Link</span>
                <span class="text-xs opacity-70"
                  >Share it or bookmark it, with all its settings</span
                >
              </span>
            </button>
          </li>
        {/if}
        <li>
          <button
            type="button"
            class={ROW}
            onclick={() => open(ExportOptions, 'Download / Export', true)}
          >
            <DownloadIcon class="shrink-0 opacity-70" />
            <span class="flex flex-1 flex-col">
              <span>Download / Export</span>
              <span class="text-xs opacity-70"
                >PDF, CSV, PNG or Google Sheets</span
              >
            </span>
            <ChevronRightIcon class="size-4 shrink-0 opacity-50" />
          </button>
        </li>
        <li>
          {#if hasGalleryPage}
            <!-- eslint-disable svelte/no-navigation-without-resolve -- the gallery page's own address -->
            <a
              href={project.gallery.href}
              target="_blank"
              rel="noreferrer"
              class={ROW}
            >
              <SendIcon class="shrink-0 opacity-70" />
              <span class="flex flex-1 flex-col">
                <span>View Gallery Page</span>
                <span class="text-xs opacity-70"
                  >This project is in the Project Gallery</span
                >
              </span>
              <ExternalLinkIcon class="size-4 shrink-0 opacity-50" />
            </a>
            <!-- eslint-enable svelte/no-navigation-without-resolve -->
          {:else}
            <button
              type="button"
              class={ROW}
              onclick={() => open(AddToGallery, 'Send to Project Gallery')}
            >
              <SendIcon class="shrink-0 opacity-70" />
              <span class="flex flex-1 flex-col">
                <span>Send to Project Gallery</span>
                <span class="text-xs opacity-70"
                  >Share it on a public gallery page</span
                >
              </span>
              <ChevronRightIcon class="size-4 shrink-0 opacity-50" />
            </button>
          {/if}
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
                <span>Save a Copy</span>
                <span class="text-xs opacity-70"
                  >A new project from this one, which stays as it is</span
                >
              </span>
            </button>
          </li>
        {/if}
        <li>
          <a href={resolve('/')} target="_blank" class={ROW}>
            <PlusIcon class="shrink-0 opacity-70" />
            <span class="flex flex-1 flex-col">
              <span>Start Another Project</span>
              <span class="text-xs opacity-70"
                >In a new tab, leaving this one open</span
              >
            </span>
            <ExternalLinkIcon class="size-4 shrink-0 opacity-50" />
          </a>
        </li>
      </ul>
    </section>
  {/if}

  <!-- Deleting it, apart from the rest -->
  {#if hasWeather && autosave.stored}
    <section aria-label="Delete project">
      <ul class={PANEL_LIST}>
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
                >Restore it from My Projects for {TRASH_DAYS} days</span
              >
            </span>
          </button>
        </li>
      </ul>
    </section>
  {/if}
  <!-- A few recent projects; My Projects has them all -->
  {#if recentTotal}
    <section class="flex flex-col gap-2" aria-labelledby="recent-projects">
      <h2 id="recent-projects" class="text-sm font-bold opacity-70">
        Recent Projects
      </h2>
      <ul class={PANEL_LIST}>
        {#each recent as item (item.id)}
          <li>
            <!-- eslint-disable svelte/no-navigation-without-resolve -- the saved project's address -->
            <a
              href={item.meta.href}
              target="_blank"
              rel="noopener noreferrer"
              data-sveltekit-reload
              class={ROW}
            >
              <span class="flex min-w-0 flex-1 flex-col">
                <span class="truncate"
                  >{item.meta.name ||
                    item.meta.title ||
                    'Untitled Project'}</span
                >
                <span class="text-xs opacity-70">Saved {item.meta.date}</span>
              </span>
              <ExternalLinkIcon class="size-4 shrink-0 opacity-50" />
            </a>
            <!-- eslint-enable svelte/no-navigation-without-resolve -->
          </li>
        {/each}
        <li>
          <a href={resolve('/my-projects')} class={ROW}>
            <FolderOpenIcon class="shrink-0 opacity-70" />
            <span class="flex-1"
              >{recentTotal > recent.length
                ? `All ${recentTotal} Projects`
                : 'My Projects'}</span
            >
          </a>
        </li>
      </ul>
    </section>
  {/if}

  <!-- Help, in one line: the site menu has the rest -->
  <nav
    class="border-surface-200-800 flex flex-wrap gap-x-4 gap-y-1 border-t pt-4 text-sm"
    aria-label="Help"
  >
    <button
      type="button"
      class={LINK}
      onclick={() => open(GettingStarted, 'Getting Started')}
      >Getting Started</button
    >
    <a href={resolve('/documentation')} target="_blank" class={LINK}
      >Documentation <ExternalLinkIcon class={LINK_ICON} /></a
    >
    <a href={resolve('/faq')} target="_blank" class={LINK}
      >FAQ <ExternalLinkIcon class={LINK_ICON} /></a
    >
    <button
      type="button"
      class={LINK}
      onclick={() => open(KeyboardShortcuts, 'Keyboard Shortcuts')}
      >Keyboard Shortcuts</button
    >
    <a href={resolve('/contact')} target="_blank" class={LINK}
      >Contact <ExternalLinkIcon class={LINK_ICON} /></a
    >
    <a href="{resolve('/documentation')}#credits" target="_blank" class={LINK}
      >Data Sources & Credits <ExternalLinkIcon class={LINK_ICON} /></a
    >
  </nav>
</div>

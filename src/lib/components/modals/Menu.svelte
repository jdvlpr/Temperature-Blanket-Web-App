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
  import {
    PANEL_LIST,
    PANEL_ROW,
    SMALL_LINK,
    SMALL_LINKS,
  } from '#lib/constants/class-constants.js';
  import { browser } from '$app/env';
  import { resolve } from '$app/paths';
  import { account } from '#lib/accounts/summary.svelte.js';
  import RenameProject from '#lib/components/RenameProject.svelte';
  import SaveStatus from '#lib/components/SaveStatus.svelte';
  import { locations } from '#lib/state/location-state.svelte.js';
  import { dialog, isDesktop, toast } from '#lib/state/page-state.svelte.js';
  import { project } from '#lib/state/project-state.svelte.js';
  import { weather } from '#lib/state/weather-state.svelte.js';
  import {
    autosave,
    changedElsewhereMessage,
    saveCopy,
    storedItem,
    trashOpenProject,
  } from '#lib/storage/autosave.svelte.js';
  import {
    lastSavedAt,
    ProjectStorage,
    savedProjects,
    type StoredProjectIndexItem,
  } from '#lib/storage/projects.svelte.js';
  import ProjectPicture from '#lib/components/ProjectPicture.svelte';
  import { rememberJustTrashed, TRASH_DAYS } from '#lib/storage/trash.js';
  import { sync } from '#lib/sync/status.svelte.js';
  import CopyIcon from '#lib/components/CopyIcon.svelte';
  import { copyToClipboard } from '#lib/utils/clipboard-utils.js';
  import { withProjectName } from '#lib/utils/project-name-link.js';
  import { Flash } from '#lib/utils/feedback.svelte.js';
  import { getColorsFromInput } from '#lib/utils/color-utils.js';
  import { saveProject } from '#lib/utils/save-project.svelte.js';
  import {
    BookmarkIcon,
    ChevronRightIcon,
    CloudAlertIcon,
    CopyPlusIcon,
    DownloadIcon,
    ExternalLinkIcon,
    FolderOpenIcon,
    GlobeIcon,
    LinkIcon,
    LoaderCircleIcon,
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
  import { pluralize } from '#lib/utils/string-utils.js';

  const ROW = PANEL_ROW;
  const LINK_ICON = 'icon-sm inline opacity-60';

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

  const linkCopied = new Flash();

  // The open project's name, ready before Copy Link is pressed: a clipboard
  // write right after waiting on storage can be refused (Safari)
  let shareName = $state('');
  $effect(() => {
    void project.url.href;
    void savedProjects.version;
    const linkName = project.linkName;
    storedItem().then((item) => {
      shareName = item ? (item.meta.name ?? '') : linkName;
    });
  });

  async function copyLink() {
    const ok = await copyToClipboard(
      // With its name, so whoever opens it sees it too
      withProjectName(project.url.href, shareName, locations.projectTitle),
      'Link copied',
      'Unable to copy to your clipboard',
    );
    if (ok) linkCopied.trigger();
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

  // When each was saved, as on My Library's cards
  const savedLine = (item: StoredProjectIndexItem) => {
    const saved = lastSavedAt(item);
    return `Saved ${
      saved
        ? new Date(saved).toLocaleString(undefined, {
            dateStyle: 'medium',
            timeStyle: 'short',
          })
        : item.meta.date
    }`;
  };

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
    {/if}

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
      <SaveStatus />
    {:else if autosave.stored}
      <!-- Another account's project, here signed out -->
      <p class="flex items-start gap-1 text-sm">
        <MonitorIcon class="icon-sm mt-0.5 shrink-0 opacity-70" />
        <span>
          Saved in this browser{#if !project.status.saved}, with unsaved changes{/if}.
        </span>
      </p>
    {:else if hasProject}
      <button
        type="button"
        class="btn preset-tonal-primary self-start"
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
          href={resolve('account')}
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
              <CopyIcon
                copied={linkCopied.is()}
                icon={LinkIcon}
                class="shrink-0 opacity-70"
              />
              <span class="flex flex-1 flex-col">
                <span>Copy Link</span>
                <span class="text-xs opacity-70"
                  >Anyone with the link gets their own copy</span
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
            <ChevronRightIcon class="icon-sm shrink-0 opacity-50" />
          </button>
        </li>
        <li>
          {#if hasGalleryPage}
            <button
              type="button"
              class={ROW}
              onclick={() => open(AddToGallery, 'Gallery Page')}
            >
              <GlobeIcon class="shrink-0 opacity-70" />
              <span class="flex flex-1 flex-col">
                <span>Gallery Page</span>
                <span class="text-xs opacity-70"
                  >View it, publish a new version, or unpublish it</span
                >
              </span>
              <ChevronRightIcon class="icon-sm shrink-0 opacity-50" />
            </button>
          {:else}
            <button
              type="button"
              class={ROW}
              onclick={() => open(AddToGallery, 'Publish to Gallery')}
            >
              <SendIcon class="shrink-0 opacity-70" />
              <span class="flex flex-1 flex-col">
                <span>Publish to Gallery</span>
                <span class="text-xs opacity-70"
                  >A public snapshot, as it is now</span
                >
              </span>
              <ChevronRightIcon class="icon-sm shrink-0 opacity-50" />
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
                  >A new project from this one</span
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
            <ExternalLinkIcon class="icon-sm shrink-0 opacity-50" />
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
                >Restore it from My Library for {TRASH_DAYS} days</span
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
          {@const label =
            item.meta.name || item.meta.title || 'Untitled Project'}
          <li>
            <!-- eslint-disable svelte/no-navigation-without-resolve -- the saved project's address -->
            <a
              href={item.meta.href}
              target="_blank"
              rel="noopener noreferrer"
              data-sveltekit-reload
              class={ROW}
            >
              <!-- Its picture, as on My Library (only drawn there; until
              then, its colors) -->
              <ProjectPicture
                id={item.id}
                href={item.meta.href}
                imageClass="h-14 w-12 shrink-0 object-contain"
                coverClass="h-14 w-12 shrink-0"
                stripHeight="40px"
              />
              <span class="flex min-w-0 flex-1 flex-col">
                <span class="line-clamp-2 text-sm font-semibold break-words"
                  >{label}</span
                >
                <span class="text-surface-700-300 line-clamp-1 text-xs"
                  >{savedLine(item)}</span
                >
              </span>
              <ExternalLinkIcon class="icon-sm shrink-0 opacity-50" />
            </a>
            <!-- eslint-enable svelte/no-navigation-without-resolve -->
          </li>
        {/each}
        <li>
          <a href={resolve('my-projects')} class={ROW}>
            <FolderOpenIcon class="shrink-0 opacity-70" />
            <span class="flex-1"
              >{recentTotal > recent.length
                ? `All ${recentTotal} ${pluralize('Project', recentTotal)}`
                : 'My Projects'}</span
            >
          </a>
        </li>
      </ul>
    </section>
  {/if}

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

    <a href={resolve('faq')} target="_blank" class={SMALL_LINK}
      >FAQ <ExternalLinkIcon class={LINK_ICON} /><span class="sr-only"
        >(opens in a new tab)</span
      ></a
    >

    <a href={resolve('documentation')} target="_blank" class={SMALL_LINK}>
      Documentation
      <ExternalLinkIcon class={LINK_ICON} /><span class="sr-only"
        >(opens in a new tab)</span
      >
    </a>

    <a href={resolve('contact')} target="_blank" class={SMALL_LINK}
      >Contact <ExternalLinkIcon class={LINK_ICON} /><span class="sr-only"
        >(opens in a new tab)</span
      ></a
    >

    <a
      href="{resolve('documentation')}#credits"
      target="_blank"
      class={SMALL_LINK}
    >
      Data Sources & Credits
      <ExternalLinkIcon class={LINK_ICON} /><span class="sr-only"
        >(opens in a new tab)</span
      >
    </a>
  </nav>
</div>

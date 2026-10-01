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
state and colors; a list of what to do with it; a few recent projects; a line
of help links. Save itself is in the top bar. A side panel on large screens
(see openProjectMenu); dialogs opened from here open in the panel, with a Back
button to it. -->

<script lang="ts">
  import { LIST_ENDS, ROW_FOCUS } from '$lib/constants/class-constants';
  import { browser } from '$app/environment';
  import { resolve } from '$app/paths';
  import { account } from '$lib/accounts/summary.svelte';
  import RenameProject from '$lib/components/RenameProject.svelte';
  import ExportToGoogleSheetModal from '$lib/features/google-sheets/ExportToGoogleSheetModal.svelte';
  import { safeSlide } from '$lib/features/transitions/safeSlide';
  import { locations } from '$lib/state/location-state.svelte';
  import { dialog, projectMenu, toast } from '$lib/state/page-state.svelte';
  import { previews } from '$lib/state/preview-state.svelte';
  import { project } from '$lib/state/project-state.svelte';
  import { weather } from '$lib/state/weather-state.svelte';
  import { autosave, saveCopy } from '$lib/storage/autosave.svelte';
  import {
    ProjectStorage,
    savedProjects,
    type StoredProjectIndexItem,
  } from '$lib/storage/projects.svelte';
  import { sync } from '$lib/sync/status.svelte';
  import { getColorsFromInput } from '$lib/utils/color-utils';
  import { downloadPreviewPNG } from '$lib/utils/preview-utils.svelte';
  import {
    downloadPDF,
    downloadWeatherCSV,
  } from '$lib/utils/project-utils.svelte';
  import {
    ChevronDownIcon,
    ChevronRightIcon,
    CloudAlertIcon,
    CloudCheckIcon,
    CopyPlusIcon,
    DownloadIcon,
    ExternalLinkIcon,
    FilePlusIcon,
    FileTextIcon,
    FolderOpenIcon,
    ImageIcon,
    LinkIcon,
    LoaderCircleIcon,
    MonitorIcon,
    PlusIcon,
    RefreshCwIcon,
    SendIcon,
    TableIcon,
    TriangleAlertIcon,
  } from '@lucide/svelte';
  import AddToGallery from './AddToGallery.svelte';
  import GettingStarted from './GettingStarted.svelte';
  import KeyboardShortcuts from './KeyboardShortcuts.svelte';

  const ROW = `hover:preset-tonal-surface flex min-h-12 w-full items-center gap-3 px-4 py-2 text-left transition-colors ${ROW_FOCUS}`;
  const LINK = 'hover:underline opacity-80 hover:opacity-100';

  const hasWeather = $derived(weather.data.length > 0);
  const hasProject = $derived(hasWeather && locations.allValid);
  const hasGalleryPage = $derived(
    Boolean(
      project.gallery.href &&
      project.gallery.title &&
      project.gallery.title === locations.projectTitle,
    ),
  );
  const signedIn = $derived(
    __ACCOUNTS_ENABLED__ && Boolean(account.summary?.id),
  );
  const colors = $derived(
    hasProject ? getColorsFromInput({ string: project.url.href }) || [] : [],
  );

  // Opens in the panel, in place of the menu, with Back to it
  const open = (ref: unknown, title: string) =>
    dialog.trigger({
      type: 'component',
      component: { ref },
      options: { title },
    });

  async function copyLink() {
    try {
      await window.navigator.clipboard.writeText(project.url.href);
      toast.trigger({ message: 'Link copied', category: 'success' });
    } catch {
      toast.trigger({
        message: 'Unable to copy to your clipboard',
        category: 'error',
      });
    }
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

  function downloadPNG() {
    const active = previews.active;
    if (!active?.width || !active?.height || !active?.svg) return;
    downloadPreviewPNG(active.width, active.height, active.svg);
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
    class="bg-surface-100 dark:bg-surface-900 rounded-container flex flex-col gap-2 p-4"
    aria-label="This project"
  >
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

    <!-- Where it's saved -->
    {#if autosave.on}
      <p class="flex items-center gap-1 text-sm" data-testid="autosave-status">
        {#if autosave.state === 'error' || autosave.state === 'conflict'}
          <CloudAlertIcon class="text-error-700-300 size-4" />
          Not saved
        {:else if autosave.state === 'saved'}
          <CloudCheckIcon class="text-success-700-300 size-4" />
          Saved to your account
        {:else}
          <LoaderCircleIcon class="size-4 animate-spin opacity-70" />
          Saving…
        {/if}
      </p>
    {:else if autosave.stored}
      <p class="flex items-start gap-1 text-sm">
        <MonitorIcon class="mt-0.5 size-4 shrink-0 opacity-70" />
        <span>
          Saved in this browser{#if !project.status.saved}, with unsaved changes{/if}.
          <span class="opacity-70">
            {#if signedIn}
              It isn’t in your account, so it could be lost if this browser’s
              site data is cleared.
            {:else}
              It could be lost if this browser’s site data is cleared.
            {/if}
          </span>
        </span>
      </p>
    {:else if hasProject}
      <p class="text-sm opacity-70">Not saved yet</p>
    {:else if !hasWeather}
      <p class="text-sm opacity-70">
        Choose a location and get its weather data to start a project.
      </p>
    {/if}

    {#if autosave.on && autosave.state === 'conflict'}
      <div
        class="preset-tonal-warning rounded-container flex flex-col gap-2 p-3 text-sm"
        role="alert"
      >
        <p class="flex items-start gap-2">
          <TriangleAlertIcon class="size-4 shrink-0" />
          This project was changed on another device, so changes here aren’t being
          saved.
        </p>
        <div class="flex flex-wrap gap-2">
          <button
            type="button"
            class="btn btn-sm preset-filled-primary-500"
            onclick={copyProject}><CopyPlusIcon /> Save a Copy</button
          >
          <button
            type="button"
            class="btn btn-sm hover:preset-tonal-surface"
            onclick={() => window.location.reload()}
            ><RefreshCwIcon /> Reload the Latest</button
          >
        </div>
      </div>
    {:else if autosave.on && autosave.state === 'error'}
      <p class="text-error-700-300 text-sm" role="alert">
        Changes couldn’t be saved. Check your connection; they’ll save once they
        can.
      </p>
    {/if}
  </section>

  <!-- What to do with it: nothing until there's a project -->
  {#if hasWeather}
    <section aria-label="Project actions">
      <ul
        class="bg-surface-100 dark:bg-surface-900 rounded-container divide-surface-200-800 flex flex-col divide-y overflow-hidden {LIST_ENDS}"
      >
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
            aria-expanded={projectMenu.exportOpen}
            onclick={() => (projectMenu.exportOpen = !projectMenu.exportOpen)}
          >
            <DownloadIcon class="shrink-0 opacity-70" />
            <span class="flex flex-1 flex-col">
              <span>Download / Export</span>
              <span class="text-xs opacity-70"
                >PDF, CSV, PNG or Google Sheets</span
              >
            </span>
            <ChevronDownIcon
              class={[
                'size-4 shrink-0 opacity-50 transition-transform',
                projectMenu.exportOpen && 'rotate-180',
              ]}
            />
          </button>
          {#if projectMenu.exportOpen}
            <ul class="flex flex-col pb-2 pl-8" in:safeSlide>
              <li>
                <button type="button" class={ROW} onclick={downloadPDF}>
                  <FileTextIcon class="size-4 shrink-0 opacity-70" />
                  <span class="flex flex-1 flex-col">
                    <span>Download PDF</span>
                    <span class="text-xs opacity-70">Gauges & Weather Data</span
                    >
                  </span>
                  <ChevronRightIcon class="size-4 shrink-0 opacity-50" />
                </button>
              </li>
              <li>
                <button type="button" class={ROW} onclick={downloadWeatherCSV}>
                  <TableIcon class="size-4 shrink-0 opacity-70" />
                  <span class="flex flex-1 flex-col">
                    <span>Download CSV</span>
                    <span class="text-xs opacity-70">Weather Data</span>
                  </span>
                </button>
              </li>
              {#if previews.active?.previewComponent}
                <li>
                  <button type="button" class={ROW} onclick={downloadPNG}>
                    <ImageIcon class="size-4 shrink-0 opacity-70" />
                    <span class="flex flex-1 flex-col">
                      <span>Download PNG</span>
                      <span class="text-xs opacity-70">Preview Image</span>
                    </span>
                  </button>
                </li>
              {/if}
              <li>
                <button
                  type="button"
                  class={ROW}
                  onclick={() =>
                    open(ExportToGoogleSheetModal, 'Create Google Sheet')}
                >
                  <FilePlusIcon class="size-4 shrink-0 opacity-70" />
                  <span class="flex flex-1 flex-col">
                    <span>Create Google Sheet</span>
                    <span class="text-xs opacity-70">Gauges & Weather Data</span
                    >
                  </span>
                  <ChevronRightIcon class="size-4 shrink-0 opacity-50" />
                </button>
              </li>
            </ul>
          {/if}
        </li>
        <li>
          {#if hasGalleryPage}
            <!-- eslint-disable-next-line svelte/no-navigation-without-resolve -- the gallery page's own address -->
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

  <!-- A few recent projects; My Projects has them all -->
  {#if recentTotal}
    <section class="flex flex-col gap-2" aria-labelledby="recent-projects">
      <h2 id="recent-projects" class="text-sm font-bold opacity-70">
        Recent Projects
      </h2>
      <ul
        class="bg-surface-100 dark:bg-surface-900 rounded-container divide-surface-200-800 flex flex-col divide-y overflow-hidden {LIST_ENDS}"
      >
        {#each recent as item (item.id)}
          <li>
            <!-- eslint-disable-next-line svelte/no-navigation-without-resolve -- the saved project's address -->
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
            <ChevronRightIcon class="size-4 shrink-0 opacity-50" />
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
    <a href={resolve('/documentation')} class={LINK}>Documentation</a>
    <a href={resolve('/faq')} class={LINK}>FAQ</a>
    <button
      type="button"
      class={LINK}
      onclick={() => open(KeyboardShortcuts, 'Keyboard Shortcuts')}
      >Keyboard Shortcuts</button
    >
    <a href={resolve('/contact')} class={LINK}>Contact</a>
    <a href="{resolve('/documentation')}#credits" class={LINK}
      >Data Sources & Credits</a
    >
  </nav>
</div>

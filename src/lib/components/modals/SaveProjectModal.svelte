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
  import { project } from '$lib/state/project-state.svelte';
  import { toast } from '$lib/state/page-state.svelte';
  import { weather } from '$lib/state/weather-state.svelte';
  import {
    MAX_SAVED_PROJECT_NAME_LENGTH,
    ProjectStorage,
    type StoredProjectIndexItem,
  } from '$lib/storage/projects.svelte';
  import {
    CheckIcon,
    CircleCheckIcon,
    ClipboardCopyIcon,
    CopyPlusIcon,
    LinkIcon,
    RefreshCwIcon,
  } from '@lucide/svelte';
  import { onMount } from 'svelte';
  import {
    autosave,
    saveCopy,
    saveOpenProject,
  } from '$lib/storage/autosave.svelte';
  import ProjectDetails from '../ProjectDetails.svelte';
  import DownloadExportButton from '../buttons/DownloadExportButton.svelte';
  import SendToGalleryButton from '../buttons/SendToGalleryButton.svelte';
  import { account } from '$lib/accounts/summary.svelte';
  import SyncStatus from '$lib/components/sync/SyncStatus.svelte';
  import { sync } from '$lib/sync/status.svelte';

  // Signed in: saved projects sync to the account
  const toAccount = $derived(
    __ACCOUNTS_ENABLED__ && Boolean(account.summary?.id) && sync.active,
  );

  let storedProject: StoredProjectIndexItem | null = $state(null);

  let urlInputElement: HTMLInputElement | undefined = $state();

  // An optional name, shown on My Projects instead of the location title
  let name = $state('');

  async function saveName() {
    if (!storedProject) return;
    const { id } = storedProject;
    try {
      await ProjectStorage.rename(id, name);
      storedProject =
        (await ProjectStorage.getIndex()).find((i) => i.id === id) ??
        storedProject;
      name = storedProject.meta.name ?? '';
      toast.trigger({
        message: name ? 'Name saved' : 'Name removed',
        category: 'success',
      });
    } catch {
      toast.trigger({
        message: 'Unable to save the name',
        category: 'error',
      });
    }
  }

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

    storedProject = await saveOpenProject();
    name = storedProject?.meta.name ?? '';
  }

  /** A new project from this one, which is left as it was saved */
  async function copyProject() {
    try {
      storedProject = await saveCopy();
      name = storedProject?.meta.name ?? '';
      toast.trigger({
        message: 'Saved a copy. You’re now working on the copy.',
        category: 'success',
      });
    } catch (e) {
      console.warn("Can't save a copy", { e });
      toast.trigger({ message: 'Unable to save a copy', category: 'error' });
    }
  }

  onMount(async () => {
    await saveProject({ copy: false });
  });
</script>

<div
  class="mb-8 flex w-full flex-col items-start justify-center gap-2 p-4 pt-0"
>
  {#if browser && typeof window.localStorage !== 'undefined' && weather.data.length}
    {#if project.status.saved && toAccount}
      <div class="flex flex-col gap-1">
        <p
          class="inline-flex w-full items-center justify-start gap-2 text-lg font-bold"
        >
          <CircleCheckIcon style="size-4" class="text-success-900-100" />
          Saved to Your Account
        </p>
        <p class="text-surface-700-300 text-sm">
          Progress and {#if weather.isUserEdited}custom weather{:else}weather{/if}
          data is saved in this browser and syncs to every device where you’re signed
          in. From now on, changes save automatically. Find it any time in
          <a href="/my-projects" class="link">My Projects</a>.
        </p>
        <SyncStatus class="text-surface-700-300" />
      </div>
    {:else if project.status.saved}
      <div>
        <p
          class="inline-flex w-full items-center justify-start gap-2 text-lg font-bold"
        >
          <CircleCheckIcon style="size-4" class="text-success-900-100" />
          Saved Locally
        </p>
        <p class="text-surface-700-300 text-sm">
          Progress and {#if weather.isUserEdited}custom weather{:else}weather{/if}
          data has been saved to this web browser. Find it any time in
          <a href="/my-projects" class="link">My Projects</a>.
          <span class="font-bold">Note</span>: If your browser's site data is
          cleared, you'll lose access to this project unless you save the link
          below or send it to the Project Gallery.
        </p>
      </div>
    {:else if autosave.state === 'conflict'}
      <div class="text-warning-700-300 flex flex-col gap-2">
        <p class="font-bold">Changed on another device</p>
        <p>
          This project was changed on another device after it opened here, so
          changes here aren’t being saved. Save them as a copy, or reload to get
          the latest version.
        </p>
        <div class="flex flex-wrap gap-2">
          <button
            type="button"
            class="btn preset-filled-primary-500"
            onclick={copyProject}><CopyPlusIcon /> Save a copy</button
          >
          <button
            type="button"
            class="btn hover:preset-tonal-surface"
            onclick={() => location.reload()}><RefreshCwIcon /> Reload</button
          >
        </div>
      </div>
    {:else if project.status.error.code === 1}
      <div class="text-warning-500 flex flex-col gap-2">
        <p>
          It looks like there was a problem saving your project to this browser,
          but it can still be accessed using the URL below.
        </p>

        <p>
          The storage space in this browser for saved projects might be full. If
          you have other saved projects, you can remove some and try to save
          this one again.
        </p>
      </div>
    {/if}

    {#if storedProject && storedProject?.meta}
      <form
        class="flex w-full flex-col gap-1"
        onsubmit={(e) => {
          e.preventDefault();
          saveName();
        }}
      >
        <label class="label" for="save-project-name">
          <span class="label-text">Name (optional)</span>
        </label>
        <div class="input-group grid-cols-[1fr_auto]">
          <input
            id="save-project-name"
            type="text"
            class="ig-input"
            autocomplete="off"
            maxlength={MAX_SAVED_PROJECT_NAME_LENGTH}
            placeholder={storedProject.meta.title}
            bind:value={name}
          />
          <button type="submit" class="ig-btn hover:preset-tonal-surface">
            <CheckIcon />
            Save Name
          </button>
        </div>
        <p class="text-surface-700-300 text-sm">
          Leave it empty to use the project's locations and years.
        </p>
      </form>
      <div class="w-full">
        <ProjectDetails project={storedProject.meta} canRemove={false} />
      </div>
      {#if autosave.state !== 'conflict'}
        <button
          type="button"
          class="btn hover:preset-tonal-surface -ml-2"
          title="Save these settings as a new project, and leave this one as it is"
          onclick={copyProject}
        >
          <CopyPlusIcon />
          Save a copy
        </button>
      {/if}
    {/if}

    <div>
      <p class="text-lg font-bold">Share or Bookmark Your Project</p>
      <p class="text-surface-700-300 text-sm">
        This URL contains all your project settings. Keep the link somewhere
        safe like a note, bookmark, or document.
      </p>
    </div>

    <div class="card flex w-full flex-col gap-2">
      <div class="input-group grid-cols-[auto_1fr]">
        <div class="ig-cell">
          <LinkIcon />
        </div>
        <input
          bind:this={urlInputElement}
          value={project.url.href}
          class="ig-input w-full truncate select-all"
          readonly
          onfocus={() => urlInputElement?.select()}
          onclick={() => urlInputElement?.select()}
        />
      </div>
      <button
        class="btn hover:preset-tonal-primary bg-primary-50-950 border-primary-500 w-fit border"
        onclick={() => {
          saveProject({ copy: true });
        }}
      >
        <ClipboardCopyIcon />
        Copy Project URL
      </button>
    </div>

    <p class="text-lg font-bold">More Options</p>

    <DownloadExportButton />

    <SendToGalleryButton />
  {:else}
    <p>To save a project, you first need to get weather data.</p>
  {/if}
</div>

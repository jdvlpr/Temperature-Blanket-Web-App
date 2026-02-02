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

<script>
  import { browser } from '$app/environment';
  import { replaceState } from '$app/navigation';
  import { project, toast, weather } from '$lib/state';
  import { ProjectStorage } from '$lib/storage/projects';
  import { setProjectInStorage } from '$lib/storage/storage-utils.svelte';
  import { CircleCheckIcon, ClipboardCopyIcon, LinkIcon } from '@lucide/svelte';
  import { onMount } from 'svelte';
  import ProjectDetails from '../ProjectDetails.svelte';
  import DownloadExportButton from '../buttons/DownloadExportButton.svelte';
  import SendToGalleryButton from '../buttons/SendToGalleryButton.svelte';

  let currentProjectIndex = $state(null);

  let urlInputElement = $state();

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

    const newURL = new URL(project.url.href);
    replaceState(newURL, '');

    try {
      await setProjectInStorage();
      currentProjectIndex = await ProjectStorage.getIndexItemByHref(
        project.url.href,
      );
      project.status.saved = true;
    } catch (e) {
      currentProjectIndex = null;
      project.status.saved = false;
      project.status.error = {
        code: 1,
        message: 'Unable to save project to storage',
      };
      console.warn("Can't save project", { e });
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
    {#if project.status.saved}
      <div>
        <p
          class="inline-flex w-full items-center justify-start gap-2 text-lg font-bold"
        >
          <CircleCheckIcon style="size-4" class="text-success-900-100" />
          Saved Locally
        </p>
        <p class="text-surface-700-300 text-sm">
          Progress and {#if weather.isUserEdited}custom weather{:else}weather{/if}
          data has been saved to this web browser.
          <span class="font-bold">Note</span>: If your browser's site data is
          cleared, you'll lose access to this project unless you save the link
          below or send it to the Project Gallery.
        </p>
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

    {#if currentProjectIndex && currentProjectIndex?.meta}
      <div class="w-full">
        <ProjectDetails project={currentProjectIndex.meta} canRemove={false} />
      </div>
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
          onfocus={() => urlInputElement.select()}
          onclick={() => urlInputElement.select()}
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

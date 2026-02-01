<script>
  import { browser } from '$app/environment';
  import { replaceState } from '$app/navigation';
  import { project, toast, weather } from '$lib/state';
  import { ProjectStorage } from '$lib/storage/projects';
  import { setProjectInStorage } from '$lib/storage/storage-utils.svelte';
  import {
    CircleAlertIcon,
    CircleCheckIcon,
    CircleMinusIcon,
    ClipboardCopyIcon,
    MinusCircleIcon,
  } from '@lucide/svelte';
  import { onMount } from 'svelte';
  import ProjectDetails from '../ProjectDetails.svelte';
  import DownloadExportButton from '../buttons/DownloadExportButton.svelte';
  import SendToGalleryButton from '../buttons/SendToGalleryButton.svelte';

  let currentProjectIndex = $state(null);

  async function saveProject({ copy = true }) {
    console.log('saved');

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

<div class="mb-8 flex w-full flex-col items-start justify-center gap-2 p-4">
  {#if browser && typeof window.localStorage !== 'undefined' && weather.data.length}
    {#if project.status.saved}
      <p class="inline-flex w-full items-center justify-start gap-2">
        <CircleCheckIcon style="size-4" class="text-success-900-100" />
        Project and {#if weather.isUserEdited}custom weather{:else}weather{/if}
        data saved to this web browser.
      </p>
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

    <p class="inline-flex w-full items-center justify-start gap-2">
      <CircleAlertIcon style="size-4" class="text-warning-900-100" />
      If this browser's site data is cleared, you won't be able to access your project
      unless you save the Project URL below.
    </p>

    <div class="card flex flex-col gap-2">
      <p
        class="card border-primary-500 basis-full border p-2 text-sm break-all select-all"
      >
        {project.url.href}
      </p>
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

    <p class="">
      Keep your project URL somewhere safe like a note, bookmark, or document.
      Use the link to open your project in any web browser, or share it for
      others to see.
    </p>

    <p class="text-lg font-bold">Other Actions</p>

    <DownloadExportButton />

    <SendToGalleryButton />
  {:else}
    <p>To save a project, you first need to get weather data.</p>
  {/if}
</div>

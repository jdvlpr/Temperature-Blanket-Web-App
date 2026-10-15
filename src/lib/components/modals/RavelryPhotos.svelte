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

<!-- @component
  A project's photos on Ravelry, from My Projects: those added here and on
  Ravelry (refreshed when it opens). Add photos of your own (they're stored
  on Ravelry), delete one (on Ravelry too, after asking), or unlink the
  project here, which leaves it on Ravelry.
-->
<script lang="ts">
  import {
    addRavelryPhoto,
    deleteRavelryPhoto,
    getRavelryProject,
    ravelryErrorMessage,
    unlinkRavelryProject,
    type RavelryPhoto,
  } from '#lib/accounts/ravelry.js';
  import { ravelryLinks } from '#lib/accounts/ravelry-links.svelte.js';
  import { dialog } from '#lib/state/page-state.svelte.js';
  import {
    ExternalLinkIcon,
    ImagePlusIcon,
    LoaderCircleIcon,
    Trash2Icon,
    UnlinkIcon,
  } from '@lucide/svelte';
  import { onMount } from 'svelte';

  let { projectId, name }: { projectId: string; name: string } = $props();

  const link = $derived(ravelryLinks.links.get(projectId) ?? null);
  const photos = $derived(link?.photos ?? []);

  let busy = $state<string | null>(null);
  let message = $state('');
  let errorMessage = $state('');
  let confirmingDelete = $state<number | null>(null);
  let confirmingUnlink = $state(false);
  let fileInput = $state<HTMLInputElement>();

  const setPhotos = (next: RavelryPhoto[]) => {
    if (link) ravelryLinks.set({ ...link, photos: next });
  };

  onMount(async () => {
    try {
      ravelryLinks.set(await getRavelryProject(projectId));
    } catch (e) {
      errorMessage = ravelryErrorMessage(e);
    }
  });

  async function addPhotos(files: FileList | null) {
    if (!files?.length) return;
    errorMessage = '';
    message = '';
    let pending = false;
    for (const [index, file] of [...files].entries()) {
      busy =
        files.length > 1
          ? `Adding photo ${index + 1} of ${files.length} on Ravelry…`
          : 'Adding the photo on Ravelry…';
      try {
        const result = await addRavelryPhoto(projectId, file);
        setPhotos(result.photos);
        pending ||= result.processing;
      } catch (e) {
        errorMessage = ravelryErrorMessage(e);
        break;
      }
    }
    busy = null;
    if (!errorMessage)
      message = pending
        ? 'Added. Ravelry is still finishing a photo; it shows here next time.'
        : files.length > 1
          ? 'Photos added.'
          : 'Photo added.';
    if (fileInput) fileInput.value = '';
  }

  async function remove(photoId: number) {
    busy = 'Deleting the photo on Ravelry…';
    errorMessage = '';
    message = '';
    try {
      setPhotos(await deleteRavelryPhoto(projectId, photoId));
      message = 'Photo deleted.';
      confirmingDelete = null;
    } catch (e) {
      errorMessage = ravelryErrorMessage(e);
    } finally {
      busy = null;
    }
  }

  async function unlink() {
    busy = 'Unlinking…';
    errorMessage = '';
    try {
      await unlinkRavelryProject(projectId);
      ravelryLinks.remove(projectId);
      dialog.close();
    } catch (e) {
      errorMessage = ravelryErrorMessage(e);
      busy = null;
    }
  }
</script>

<div class="flex flex-col gap-4">
  {#if link}
    <p class="text-sm">
      Photos you add here are stored on Ravelry, on this project’s page, and
      show on its card here and on its gallery page (when that shows your name).
    </p>

    {#if photos.length}
      <ul class="grid grid-cols-3 gap-2 sm:grid-cols-4" aria-label="Photos">
        {#each photos as photo, i (photo.photoId)}
          <li class="relative">
            <img
              src={photo.smallUrl ?? photo.squareUrl ?? ''}
              alt={photo.isPicture
                ? `${name}: its picture from Temperature Blanket`
                : `${name}: photo ${i + 1}`}
              class="rounded-base aspect-square w-full object-cover"
              loading="lazy"
            />
            {#if confirmingDelete === photo.photoId}
              <div
                class="bg-surface-50-950/95 rounded-base absolute inset-0 flex flex-col items-center justify-center gap-1 p-1 text-center text-xs"
              >
                <span>Delete on Ravelry too?</span>
                <div class="flex gap-1">
                  <button
                    type="button"
                    class="btn btn-sm preset-filled-error-500"
                    onclick={() => remove(photo.photoId)}
                    disabled={!!busy}>Delete</button
                  >
                  <button
                    type="button"
                    class="btn btn-sm preset-tonal-surface"
                    onclick={() => (confirmingDelete = null)}>Keep</button
                  >
                </div>
              </div>
            {:else}
              <button
                type="button"
                class="btn-icon btn-icon-sm preset-filled-surface-50-950 absolute top-1 right-1"
                aria-label={`Delete photo ${i + 1}`}
                onclick={() => (confirmingDelete = photo.photoId)}
                disabled={!!busy}><Trash2Icon class="icon-sm" /></button
              >
            {/if}
          </li>
        {/each}
      </ul>
    {:else}
      <p class="text-sm opacity-80">No photos yet.</p>
    {/if}

    {#if busy}
      <p class="flex items-center gap-2 text-sm" role="status">
        <LoaderCircleIcon class="icon-sm animate-spin" aria-hidden="true" />
        {busy}
      </p>
    {:else if message}
      <p class="text-sm" role="status">{message}</p>
    {/if}
    {#if errorMessage}
      <p class="text-error-700-300 text-sm" role="alert">{errorMessage}</p>
    {/if}

    <div class="flex flex-wrap gap-2">
      <label
        class={[
          'btn preset-filled-primary-500 cursor-pointer',
          busy && 'pointer-events-none opacity-50',
        ]}
      >
        <ImagePlusIcon aria-hidden="true" />Add Photos
        <input
          bind:this={fileInput}
          class="sr-only"
          type="file"
          accept="image/png,image/jpeg,image/heic,image/heif"
          multiple
          disabled={!!busy}
          onchange={(e) => addPhotos(e.currentTarget.files)}
        />
      </label>
      <!-- eslint-disable svelte/no-navigation-without-resolve -- Ravelry's site -->
      <a
        class="btn preset-tonal-surface"
        href={link.url}
        target="_blank"
        rel="noopener noreferrer"
        ><ExternalLinkIcon aria-hidden="true" />View on Ravelry<span
          class="sr-only"
        >
          (opens in a new tab)</span
        ></a
      >
      <!-- eslint-enable svelte/no-navigation-without-resolve -->
    </div>

    <div class="border-surface-200-800 flex flex-col gap-2 border-t pt-4">
      {#if confirmingUnlink}
        <p class="text-sm">
          Unlink “{name}” from its Ravelry project? The project and its photos
          stay on Ravelry; they just won’t show here anymore.
        </p>
        <div class="flex gap-2">
          <button
            type="button"
            class="btn btn-sm preset-filled-error-500"
            onclick={unlink}
            disabled={!!busy}>Unlink</button
          >
          <button
            type="button"
            class="btn btn-sm preset-tonal-surface"
            onclick={() => (confirmingUnlink = false)}>Keep Linked</button
          >
        </div>
      {:else}
        <button
          type="button"
          class="btn btn-sm hover:preset-tonal-surface -ml-2 self-start"
          onclick={() => (confirmingUnlink = true)}
          disabled={!!busy}
          ><UnlinkIcon class="icon-sm" aria-hidden="true" />Unlink from Ravelry</button
        >
      {/if}
    </div>
  {:else}
    <p class="text-sm">This project isn’t posted to Ravelry.</p>
  {/if}
</div>

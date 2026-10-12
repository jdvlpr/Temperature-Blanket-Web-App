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

<!-- Publishes a saved palette to the Yarn Palette Gallery, from My Projects
while signed in: a snapshot of it as it is now, linked to the account. -->

<script lang="ts">
  import { resolve } from '$app/paths';
  import PaletteStrip from '#lib/components/PaletteStrip.svelte';
  import {
    GALLERY_PAGES_CHANGED,
    getGalleryPages,
    removeGalleryPage,
    sharePalette,
  } from '#lib/accounts/gallery.js';
  import { account } from '#lib/accounts/summary.svelte.js';
  import ShowOwnerToggle from '#lib/components/account/ShowOwnerToggle.svelte';
  import { onMount } from 'svelte';
  import type { Color } from '#lib/types/yarn-types.js';
  import { getYarnPageURL } from '#lib/utils/color-utils.js';
  import { cleanName } from '#lib/utils/string-utils.js';
  import { CheckIcon, LoaderCircleIcon, SendIcon } from '@lucide/svelte';

  // The gallery's limit (MAX_PALETTE_TITLE_LENGTH on the server)
  const MAX_NAME_LENGTH = 80;

  let {
    paletteId,
    colors,
    name: savedName,
    showOwner: chosenShowOwner,
    replacePostId,
  }: {
    paletteId: string;
    colors: Color[];
    name: string;
    /** Chosen already on My Projects: with or without the account's name */
    showOwner?: boolean;
    /** Its old gallery page, removed once this one is in */
    replacePostId?: number;
  } = $props();

  // svelte-ignore state_referenced_locally
  let name = $state(cleanName(savedName, MAX_NAME_LENGTH));
  let busy = $state(false);
  let shared = $state(false);
  // The palette's gallery page, once shared
  let postId = $state<number | null>(null);
  let errorMessage = $state('');
  // Include it on the account's public gallery, starting from the last choice
  let showOwner = $state(false);
  let serverName = $state<string | null>(null);
  let ownerName = $derived((serverName ?? account.summary?.name ?? '').trim());

  onMount(async () => {
    const gallery = await getGalleryPages();
    if (!gallery) return;
    showOwner = chosenShowOwner ?? gallery.settings.showOwnerDefault;
    if (typeof gallery.name === 'string') serverName = gallery.name;
  });

  // Whether the old page came off, when replacing one
  let oldRemoved = $state<boolean | null>(null);

  async function removeOld() {
    if (!replacePostId) return true;
    try {
      await removeGalleryPage(replacePostId);
      return true;
    } catch {
      return false;
    }
  }

  async function share(event: Event) {
    event.preventDefault();
    const title = cleanName(name, MAX_NAME_LENGTH);
    if (!title || busy) return;
    busy = true;
    errorMessage = '';
    const share = () =>
      sharePalette({
        paletteId,
        title,
        // Without the app version, so the same palette is the same link and
        // the gallery can tell it's already there
        yarnUrl: getYarnPageURL({ colors, origin: window.location.origin }),
        showOwner,
      });
    let result = await share();
    // Replacing: the old page has the same colors, so it's the one already
    // there. It goes first (removed pages don't count).
    if (replacePostId && result.status === 'error' && result.code === 409) {
      oldRemoved = await removeOld();
      if (oldRemoved) result = await share();
    }
    if (result.status === 'shared' && replacePostId && oldRemoved === null)
      oldRemoved = await removeOld();
    if (replacePostId) window.dispatchEvent(new Event(GALLERY_PAGES_CHANGED));
    busy = false;
    if (result.status === 'shared') {
      shared = true;
      postId = result.postId;
    } else {
      errorMessage = result.message;
      if (oldRemoved)
        errorMessage +=
          ' Its old gallery page was removed. You can share it again from My Projects.';
    }
  }
</script>

<div class="flex w-full max-w-(--breakpoint-sm) flex-col gap-4 p-4 text-left">
  <PaletteStrip {colors} />

  {#if shared}
    <div class="flex flex-col items-center gap-2 text-center" role="status">
      <CheckIcon class="text-success-700-300 size-8" />
      <p class="font-bold">
        {replacePostId ? 'Snapshot updated' : 'Published'}
      </p>
      {#if replacePostId && !oldRemoved}
        <p class="text-sm">
          The old snapshot couldn’t be removed. You can unpublish it from My
          Projects, under Other gallery pages.
        </p>
      {/if}
      {#if postId}
        <a
          href={resolve('/gallery/palette/[id]', { id: String(postId) })}
          target="_blank"
          class="link">View Gallery Page</a
        >
      {/if}
    </div>
  {:else}
    <form class="flex flex-col gap-4" onsubmit={share}>
      <label class="label">
        <span class="label-text">Name</span>
        <input
          type="text"
          class="input"
          autocomplete="off"
          maxlength={MAX_NAME_LENGTH}
          required
          bind:value={name}
          disabled={busy}
        />
      </label>
      <p>
        {#if replacePostId}
          Publishes a snapshot of this palette as it is now, in place of its old
          page. The new page has a new link, and its views start over.
        {:else}
          Publishes a snapshot of this palette, with this name and its colors,
          to the public
          <a
            href="{resolve('gallery')}?view=yarn-palettes"
            target="_blank"
            class="link">Yarn Palette Gallery</a
          >.
        {/if}
      </p>
      <ShowOwnerToggle
        bind:checked={showOwner}
        name={ownerName}
        disabled={busy}
      />
      {#if errorMessage}
        <p class="text-error-700-300" role="alert">{errorMessage}</p>
      {/if}
      <button
        type="submit"
        class="btn preset-filled-primary-500 w-full sm:w-fit"
        disabled={busy || !cleanName(name, MAX_NAME_LENGTH)}
      >
        {#if busy}<LoaderCircleIcon class="animate-spin" />{:else}<SendIcon
          />{/if}
        {replacePostId ? 'Update Snapshot' : 'Publish'}
      </button>
    </form>
  {/if}
</div>

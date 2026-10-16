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

<!-- Publishes a saved palette to the Yarn Palette Gallery while signed in,
linked to the account, or with `update` updates its gallery page in place (its
name and colors; its link stays the same). Each palette has one page. When the
gallery says these colors are published already, it shows that page, and can
update it. -->

<script lang="ts">
  import { resolve } from '$app/paths';
  import PaletteStrip from '#lib/components/PaletteStrip.svelte';
  import {
    GALLERY_PAGES_CHANGED,
    getGalleryPages,
    sharePalette,
    updatePalettePage,
  } from '#lib/accounts/gallery.js';
  import { account } from '#lib/accounts/summary.svelte.js';
  import AnonymousCheckbox from '#lib/components/account/AnonymousCheckbox.svelte';
  import { onMount, untrack } from 'svelte';
  import type { Color } from '#lib/types/yarn-types.js';
  import { getYarnPageURL } from '#lib/utils/color-utils.js';
  import { cleanName } from '#lib/utils/string-utils.js';
  import {
    CheckIcon,
    ExternalLinkIcon,
    LoaderCircleIcon,
    RefreshCwIcon,
    SendIcon,
  } from '@lucide/svelte';

  // The gallery's limit (MAX_PALETTE_TITLE_LENGTH on the server)
  const MAX_NAME_LENGTH = 80;

  let {
    paletteId,
    colors,
    name: savedName,
    showOwner: chosenShowOwner,
    update,
  }: {
    paletteId: string;
    colors: Color[];
    name: string;
    /** Chosen already: with or without the account's name */
    showOwner?: boolean;
    /** Updating this published page in place */
    update?: { postId: number; title: string };
  } = $props();

  // The page to update: the one given, or the one the gallery says has these
  // colors already
  let target = $state(untrack(() => update));
  // The page these colors are published on already, when the gallery says so
  let existing = $state<{ postId: number; title: string } | null>(null);

  // svelte-ignore state_referenced_locally
  let name = $state(cleanName(savedName, MAX_NAME_LENGTH));
  let busy = $state(false);
  let done = $state<'published' | 'updated' | null>(null);
  // The palette's gallery page, once shared
  let postId = $state<number | null>(null);
  let errorMessage = $state('');
  // Include a new page on the account's public gallery, starting from the last choice
  let showOwner = $state(false);
  let serverName = $state<string | null>(null);
  let ownerName = $derived((serverName ?? account.summary?.name ?? '').trim());

  onMount(async () => {
    const gallery = await getGalleryPages();
    if (!gallery) return;
    showOwner = chosenShowOwner ?? gallery.settings.showOwnerDefault;
    if (typeof gallery.name === 'string') serverName = gallery.name;
  });

  // Without the app version, so the same palette is the same link and the
  // gallery can tell it's already there
  const yarnUrl = () =>
    getYarnPageURL({ colors, origin: window.location.origin });

  async function updatePage(page: { postId: number }, title: string) {
    const result = await updatePalettePage(page.postId, {
      title,
      yarnUrl: yarnUrl(),
    });
    if (result.status === 'answered') {
      const code = Number(result.response.code);
      if (code === 200) {
        done = 'updated';
        postId = page.postId;
        window.dispatchEvent(new Event(GALLERY_PAGES_CHANGED));
        return;
      }
      errorMessage =
        code === 409
          ? 'Another of your palette pages has these colors already.'
          : String(result.response.message ?? '') ||
            'It couldn’t be updated. Try again later.';
    } else
      errorMessage =
        result.status === 'error'
          ? result.message
          : result.status === 'unsupported'
            ? 'The gallery can’t update pages yet. Try again later.'
            : result.status === 'paused'
              ? 'Publishing to the gallery is paused right now. Try again later.'
              : result.status === 'signed-out'
                ? 'Sign in again, then try again.'
                : 'Its gallery page is gone. Refresh My Library to see it.';
  }

  async function share(event?: Event) {
    event?.preventDefault();
    const title = cleanName(name, MAX_NAME_LENGTH);
    if (!title || busy) return;
    busy = true;
    errorMessage = '';
    try {
      if (target) return await updatePage(target, title);
      const result = await sharePalette({
        paletteId,
        title,
        yarnUrl: yarnUrl(),
        showOwner,
      });
      if (result.status === 'shared') {
        done = 'published';
        postId = result.postId;
      } else if (result.status === 'published-already')
        existing = { postId: result.postId, title: result.title };
      else errorMessage = result.message;
    } finally {
      busy = false;
    }
  }
</script>

<div class="flex w-full max-w-(--breakpoint-sm) flex-col gap-4 p-4 text-left">
  <PaletteStrip {colors} />

  {#if done}
    <div class="flex flex-col items-center gap-2 text-center" role="status">
      <CheckIcon class="text-success-700-300 size-8" />
      <p class="font-bold">{done === 'updated' ? 'Updated' : 'Published'}</p>
      {#if done === 'updated'}
        <p class="text-sm">
          Its gallery page has this name and these colors. Its link stays the
          same.
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
  {:else if existing}
    <div class="flex flex-col gap-2" role="status">
      <p>
        You’ve published this palette already{existing.title
          ? `, as “${existing.title}”`
          : ''}.
      </p>
      {#if errorMessage}
        <p class="text-error-700-300" role="alert">{errorMessage}</p>
      {/if}
    </div>
    <div class="flex flex-wrap gap-2">
      <a
        href={resolve('/gallery/palette/[id]', {
          id: String(existing.postId),
        })}
        target="_blank"
        class="btn hover:preset-tonal-surface"
        >View Gallery Page<ExternalLinkIcon class="icon-sm" /><span
          class="sr-only">(opens in a new tab)</span
        ></a
      >
      <button
        type="button"
        class="btn preset-filled-primary-500"
        disabled={busy}
        onclick={() => {
          target = existing ?? undefined;
          existing = null;
          share();
        }}><RefreshCwIcon />Update Gallery Page</button
      >
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
        {#if target}
          Updates its gallery page to this name and these colors. Its link stays
          the same.
        {:else}
          Publishes this palette, with this name and its colors, to the public
          <a href={resolve('/gallery/palettes')} target="_blank" class="link"
            >Yarn Palette Gallery</a
          >. You can update or unpublish it later.
        {/if}
      </p>
      {#if !target}
        <AnonymousCheckbox
          bind:checked={showOwner}
          name={ownerName}
          disabled={busy}
        />
      {/if}
      {#if errorMessage}
        <p class="text-error-700-300" role="alert">{errorMessage}</p>
      {/if}
      <button
        type="submit"
        class="btn preset-filled-primary-500 w-full sm:w-fit"
        disabled={busy || !cleanName(name, MAX_NAME_LENGTH)}
      >
        {#if busy}<LoaderCircleIcon
            class="animate-spin"
          />{:else if target}<RefreshCwIcon />{:else}<SendIcon />{/if}
        {target ? 'Update' : 'Publish'}
      </button>
    </form>
  {/if}
</div>

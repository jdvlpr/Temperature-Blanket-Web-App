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
  The Ravelry part of a saved project's Share dialog: Connect Ravelry (in
  Account), Post to Ravelry, or once posted Update on Ravelry (its details,
  yarns and photos, in one dialog) and Unlink. Posting needs the project in the
  account and its gallery page showing the owner's name: the Ravelry project
  links there.
-->
<script lang="ts">
  import { resolve } from '$app/paths';
  import type { GalleryPage } from '#lib/accounts/gallery.js';
  import { unlinkRavelryProject } from '#lib/accounts/ravelry.js';
  import { ravelryLinks } from '#lib/accounts/ravelry-links.svelte.js';
  import ShareSectionHeader from '#lib/components/account/ShareSectionHeader.svelte';
  import type { StoredProjectIndexItem } from '#lib/storage/projects.svelte.js';
  import { inAccount, openRavelryPost } from '#lib/utils/open-ravelry.js';
  import {
    LinkIcon,
    LoaderCircleIcon,
    RefreshCwIcon,
    SendIcon,
  } from '@lucide/svelte';
  import { onMount, tick } from 'svelte';
  import type { Attachment } from 'svelte/attachments';

  let {
    item,
    page,
  }: {
    item: StoredProjectIndexItem;
    /** Its gallery page, which its Ravelry project links to */
    page?: GalleryPage;
  } = $props();

  onMount(() => {
    if (!ravelryLinks.status) void ravelryLinks.load();
  });

  const link = $derived(ravelryLinks.links.get(item.id) ?? null);
  const status = $derived(ravelryLinks.status);
  /** Linked once, but it stopped working */
  const wasConnected = $derived(!!status?.available && status.connected);
  const photoCount = $derived(link?.photos.length ?? 0);

  let confirming = $state(false);
  let busy = $state(false);
  let errorMessage = $state('');
  let root = $state<HTMLElement>();
  const takeFocus: Attachment<HTMLButtonElement> = (button) => {
    button.focus({ preventScroll: true });
  };

  async function unlink() {
    busy = true;
    errorMessage = '';
    try {
      await unlinkRavelryProject(item.id);
      ravelryLinks.remove(item.id);
      confirming = false;
      await tick();
      root
        ?.querySelector<HTMLElement>('button')
        ?.focus({ preventScroll: true });
    } catch {
      errorMessage = 'It couldn’t be unlinked. Try again later.';
    } finally {
      busy = false;
    }
  }
</script>

<section
  class="flex flex-col gap-3"
  aria-labelledby="share-ravelry"
  bind:this={root}
>
  <ShareSectionHeader
    id="share-ravelry"
    title="Ravelry"
    href={link?.url}
    linkText="View on Ravelry"
  >
    {#if !status}
      <LoaderCircleIcon
        class="icon-sm inline animate-spin"
        aria-hidden="true"
      />
      Checking…
    {:else if !ravelryLinks.connected}
      {wasConnected ? 'Reconnect Ravelry to use it' : 'Not connected'}
    {:else if link}
      Posted{photoCount
        ? ` · ${photoCount} ${photoCount === 1 ? 'photo' : 'photos'}`
        : ''}
    {:else}
      Not posted
    {/if}
  </ShareSectionHeader>

  {#if status && !ravelryLinks.connected}
    <div class="flex flex-col items-start gap-1">
      <a class="btn preset-tonal-surface" href={resolve('/account')}>
        <LinkIcon aria-hidden="true" />{wasConnected ? 'Reconnect' : 'Connect'} Ravelry
      </a>
      <p class="text-xs opacity-70">
        In Account, under Connected accounts. Then post your projects and their
        photos there.
      </p>
    </div>
  {:else if status && !link}
    {#if !inAccount(item)}
      <p class="text-sm">
        Add this project to your account first (Add to your account, at the top
        of My Projects), then post it to Ravelry.
      </p>
    {:else if !page}
      <p class="text-sm">
        Publish it to the gallery first. Its Ravelry project links to its
        gallery page.
      </p>
    {:else if !page.showOwner}
      <p class="text-sm">
        Turn off Anonymous for its gallery page first. Its Ravelry project links
        there, under your Ravelry name.
      </p>
    {:else}
      <div class="flex flex-col items-start gap-1">
        <button
          type="button"
          class="btn preset-filled-primary-500"
          onclick={() => void openRavelryPost(item)}
        >
          <SendIcon aria-hidden="true" />Post to Ravelry…
        </button>
        <p class="text-xs opacity-70">
          A Ravelry project with its picture, yarns, photos and a link to its
          gallery page.
        </p>
      </div>
    {/if}
  {:else if link}
    {#if confirming}
      <div class="flex flex-col gap-2" role="group" aria-label="Unlink">
        <p class="text-sm">
          Unlink from Ravelry? The project stays on Ravelry, but it’s no longer
          updated from here, and its photos leave its gallery page.
        </p>
        <div class="flex flex-wrap gap-2">
          <button
            type="button"
            class="btn preset-filled-error-500"
            onclick={unlink}
            disabled={busy}
            {@attach takeFocus}
            >{#if busy}<LoaderCircleIcon
                class="animate-spin"
              />{/if}Unlink</button
          >
          <button
            type="button"
            class="btn preset-tonal-surface"
            onclick={() => (confirming = false)}
            disabled={busy}>Keep Linked</button
          >
        </div>
      </div>
    {:else}
      <div class="flex flex-wrap gap-2">
        <button
          type="button"
          class="btn preset-tonal-surface"
          onclick={() => void openRavelryPost(item)}
        >
          <RefreshCwIcon aria-hidden="true" />Update on Ravelry…
        </button>
        <button
          type="button"
          class="btn hover:preset-tonal-surface"
          onclick={() => (confirming = true)}>Unlink…</button
        >
      </div>
      <p class="-mt-1 text-xs opacity-70">
        Update: its details, yarns, photos and picture, as on Ravelry.
      </p>
    {/if}
  {/if}
  {#if errorMessage}
    <p class="text-error-700-300 text-sm" role="alert">{errorMessage}</p>
  {/if}
</section>

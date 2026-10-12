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
  Who can see a saved project or palette, on its row in My Projects: only
  people with its link, everyone in the gallery, or everyone in the gallery
  with the account's name. A gallery page is a copy from when it was added, so
  once the project changes it offers to update the page.
-->
<script lang="ts">
  import { resolve } from '$app/paths';
  import type { GalleryPage } from '#lib/accounts/gallery.js';
  import { galleryPages } from '#lib/accounts/gallery-pages.svelte.js';
  import { account } from '#lib/accounts/summary.svelte.js';
  import ChoiceMenu from '#lib/components/buttons/ChoiceMenu.svelte';
  import { safeSlide } from '#lib/features/transitions/safeSlide.js';
  import {
    ExternalLinkIcon,
    GlobeIcon,
    LinkIcon,
    LoaderCircleIcon,
    RefreshCwIcon,
  } from '@lucide/svelte';

  type Sharing = 'link' | 'gallery' | 'named';

  let {
    kind,
    label,
    page,
    changedSince = false,
    onadd,
    onupdate,
  }: {
    kind: 'project' | 'palette';
    /** The project's or palette's name, for screen readers */
    label: string;
    /** Its gallery page (the newest), if it has one */
    page?: GalleryPage;
    /** Whether it changed after its gallery page was made */
    changedSince?: boolean;
    /** Adds it to the gallery, with or without the account's name */
    onadd: (showOwner: boolean) => void;
    /** Replaces its gallery page with one of how it is now */
    onupdate: (page: GalleryPage) => void;
  } = $props();

  let confirming = $state(false);
  let busy = $state(false);
  let errorMessage = $state('');

  let ownerName = $derived(
    (galleryPages.name ?? account.summary?.name ?? '').trim(),
  );

  let value: Sharing = $derived(
    !page ? 'link' : page.showOwner ? 'named' : 'gallery',
  );

  let options = $derived([
    {
      value: 'link' as const,
      label: 'Only people with the link',
      short: 'Link only',
      details:
        kind === 'project'
          ? 'Not in the gallery. Anyone you send its link to can open it.'
          : 'Not in the gallery. Anyone you send its link to can open it in the Yarn Palette Creator.',
    },
    {
      value: 'gallery' as const,
      label: 'In the gallery',
      details: 'Anyone can find it in the public gallery, without your name.',
    },
    {
      value: 'named' as const,
      label: 'In the gallery with my name',
      short: 'In the gallery, with my name',
      details: ownerName
        ? `Its page says “By ${ownerName}” and your public gallery page lists it.`
        : 'Your public gallery page lists it once you add a display name on your Account page.',
    },
  ]);

  // Adding needs publishing on; changing or removing a page works either way
  let canAdd = $derived(galleryPages.publishing);

  async function change(next: Sharing) {
    errorMessage = '';
    confirming = false;
    if (next === value) return;
    if (!page) {
      if (!canAdd) {
        errorMessage =
          'Adding to the gallery is paused right now. Try again later.';
        return;
      }
      onadd(next === 'named');
      return;
    }
    if (next === 'link') {
      confirming = true;
      return;
    }
    busy = true;
    try {
      await galleryPages.setShowOwner(page.postId, next === 'named');
    } catch {
      errorMessage = 'That change couldn’t be saved. Try again later.';
    } finally {
      busy = false;
    }
  }

  async function remove() {
    if (!page) return;
    busy = true;
    errorMessage = '';
    try {
      await galleryPages.removeAllLike(page);
      confirming = false;
    } catch {
      errorMessage = 'It couldn’t be taken off the gallery. Try again later.';
    } finally {
      busy = false;
    }
  }

  // Sent more than once: each copy comes off
  let pageCount = $derived(page ? galleryPages.pagesLike(page).length : 0);

  let pageHref = $derived(
    !page
      ? null
      : page.kind === 'palette'
        ? resolve('/gallery/palette/[id]', { id: String(page.postId) })
        : resolve('/gallery/[id]', { id: String(page.postId) }),
  );

  const addedOn = (time: number) =>
    new Date(time).toLocaleDateString(undefined, { dateStyle: 'medium' });
</script>

<!-- With publishing paused, only one with a page has anything to change -->
{#if page || canAdd}
  <div
    class="mt-2 flex flex-col gap-1 text-sm"
    aria-label="Sharing: {label}"
    role="group"
  >
    <div class="flex flex-wrap items-center gap-x-3 gap-y-1">
      <ChoiceMenu
        {options}
        {value}
        onchange={change}
        label="Sharing"
        icon={page ? GlobeIcon : LinkIcon}
        triggerClass="btn btn-sm hover:preset-tonal-surface -ml-2"
      />
      {#if page && pageHref}
        <!-- eslint-disable-next-line svelte/no-navigation-without-resolve -->
        <a href={pageHref} target="_blank" class="link opacity-80"
          >Since {addedOn(page.publishedAt)}<span class="sr-only">
            : view its gallery page</span
          >
          <ExternalLinkIcon class="icon-sm inline" aria-hidden="true" /></a
        >
      {/if}
      {#if busy && !confirming}
        <LoaderCircleIcon class="icon-sm animate-spin" aria-label="Saving" />
      {/if}
    </div>

    {#if page && changedSince && canAdd && !confirming}
      <div class="flex flex-wrap items-center gap-x-2 gap-y-1">
        <span class="opacity-70"
          >Changed since then. The gallery page shows it as it was.</span
        >
        <button
          type="button"
          class="btn btn-sm preset-tonal-surface"
          onclick={() => page && onupdate(page)}
          disabled={busy}
          aria-label="Update the gallery page of {label}"
          ><RefreshCwIcon class="icon-sm" />Update gallery page</button
        >
      </div>
    {/if}

    {#if value === 'named' && !ownerName}
      <p class="text-warning-700-300">
        Add a display name on your
        <a href={resolve('account')} class="link">Account page</a>
        to show it.
      </p>
    {/if}

    {#if confirming}
      <div class="flex flex-col gap-2 py-1" in:safeSlide>
        <p>
          {#if kind === 'palette'}
            Remove this palette from the gallery{pageCount > 1
              ? ` (all ${pageCount} of its pages)`
              : ''}? Your saved palette stays, and its link still works.
          {:else}
            Remove its {pageCount > 1
              ? `${pageCount} gallery pages`
              : 'gallery page'}? {pageCount > 1
              ? 'They also come'
              : 'It also comes'}
            off the globe. Your project stays saved, and its link still works.
          {/if}
        </p>
        <div class="flex flex-wrap gap-2">
          <button
            type="button"
            class="btn btn-sm preset-filled-error-500 max-sm:w-full"
            onclick={remove}
            disabled={busy}
          >
            {#if busy}
              <LoaderCircleIcon class="animate-spin" />
            {/if}
            Remove from the gallery
          </button>
          <button
            type="button"
            class="btn btn-sm preset-tonal-surface max-sm:w-full"
            onclick={() => (confirming = false)}
            disabled={busy}>Cancel</button
          >
        </div>
      </div>
    {/if}

    {#if errorMessage}
      <p class="text-error-700-300" role="alert">{errorMessage}</p>
    {/if}
  </div>
{/if}

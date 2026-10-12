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

<!-- Gallery pages from this account that aren't next to a saved project or
palette on My Projects: older pages of the same one (sent again), and pages of
ones deleted or not saved here. Each can still be changed or removed. Hidden
when there are none. -->

<script lang="ts">
  import { resolve } from '$app/paths';
  import type { GalleryPage } from '#lib/accounts/gallery.js';
  import { galleryPages } from '#lib/accounts/gallery-pages.svelte.js';
  import { safeSlide } from '#lib/features/transitions/safeSlide.js';
  import {
    ExternalLinkIcon,
    ImageIcon,
    LoaderCircleIcon,
    PaletteIcon,
    Trash2Icon,
  } from '@lucide/svelte';

  let { cardClass }: { cardClass: string } = $props();

  let confirming = $state<number | null>(null);
  let busy = $state(false);
  let errorMessage = $state('');

  // Only once the projects here are known, so none show here for a moment
  let pages = $derived(
    galleryPages.projectIds ? galleryPages.grouped.others : [],
  );

  const isPalette = (page: GalleryPage) => page.kind === 'palette';

  /** Where a row links: the project's or the palette's gallery page. */
  function pageHref(page: GalleryPage) {
    return isPalette(page)
      ? resolve('/gallery/palette/[id]', { id: String(page.postId) })
      : resolve('/gallery/[id]', { id: String(page.postId) });
  }

  async function setShowOwner(page: GalleryPage, showOwner: boolean) {
    errorMessage = '';
    try {
      await galleryPages.setShowOwner(page.postId, showOwner);
    } catch {
      errorMessage = 'That change couldn’t be saved. Try again later.';
    }
  }

  async function remove(postId: number) {
    busy = true;
    errorMessage = '';
    try {
      await galleryPages.remove(postId);
      confirming = null;
    } catch {
      errorMessage = 'The page couldn’t be removed. Try again later.';
    } finally {
      busy = false;
    }
  }

  const addedOn = (time: number) =>
    new Date(time).toLocaleDateString(undefined, { dateStyle: 'medium' });
</script>

{#if pages.length}
  <section class="flex flex-col gap-2" aria-labelledby="other-gallery-pages">
    <h2 id="other-gallery-pages" class="h3">Other Gallery Pages</h2>
    <p class="text-sm opacity-70">
      Published from your account, but not next to a project or palette above:
      older snapshots of one you published again, or of one that’s deleted or
      not saved here.
    </p>
    <div class={cardClass}>
      <ul class="flex flex-col" aria-label="Other gallery pages">
        {#each pages as page (page.postId)}
          <li class="flex flex-col gap-2 px-4 py-3">
            <div class="flex items-center gap-3">
              {#if isPalette(page)}
                <PaletteIcon class="shrink-0 opacity-70" aria-hidden="true" />
              {:else}
                <ImageIcon class="shrink-0 opacity-70" aria-hidden="true" />
              {/if}
              <div class="flex min-w-0 flex-1 flex-col">
                <!-- eslint-disable-next-line svelte/no-navigation-without-resolve -->
                <a
                  href={pageHref(page)}
                  target="_blank"
                  class="link line-clamp-2 break-words"
                >
                  {page.title}
                  <ExternalLinkIcon class="icon-sm inline" />
                </a>
                <span class="text-sm opacity-70"
                  >{isPalette(page) ? 'Palette' : 'Project'}, published
                  {addedOn(page.publishedAt)}</span
                >
                <label
                  class="mt-1 flex w-fit cursor-pointer items-center gap-2 text-sm"
                >
                  <input
                    type="checkbox"
                    class="checkbox"
                    aria-label="Show my name: {page.title}"
                    checked={page.showOwner ?? false}
                    onchange={(event) =>
                      setShowOwner(page, event.currentTarget.checked)}
                    disabled={busy}
                  />
                  Show my name
                </label>
              </div>
              {#if confirming !== page.postId}
                <button
                  type="button"
                  class="btn-icon hover:preset-tonal-error"
                  aria-label="Unpublish {page.title}"
                  title="Unpublish"
                  onclick={() => (confirming = page.postId)}
                  disabled={busy}><Trash2Icon /></button
                >
              {/if}
            </div>
            {#if confirming === page.postId}
              <div class="flex flex-col gap-2" in:safeSlide>
                <p class="text-sm">
                  {#if isPalette(page)}
                    Unpublish this palette?
                  {:else}
                    Unpublish this page? It also comes off the globe.
                  {/if}
                </p>
                <div class="flex flex-wrap gap-2">
                  <button
                    type="button"
                    class="btn preset-filled-error-500 max-sm:w-full"
                    onclick={() => remove(page.postId)}
                    disabled={busy}
                  >
                    {#if busy}
                      <LoaderCircleIcon class="animate-spin" />
                    {/if}
                    Unpublish
                  </button>
                  <button
                    type="button"
                    class="btn preset-tonal-surface max-sm:w-full"
                    onclick={() => (confirming = null)}
                    disabled={busy}>Cancel</button
                  >
                </div>
              </div>
            {/if}
          </li>
        {/each}
      </ul>
      {#if errorMessage}
        <p class="text-error-700-300 px-4 py-3" role="alert">
          {errorMessage}
        </p>
      {/if}
    </div>
  </section>
{/if}

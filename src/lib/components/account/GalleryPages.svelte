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

<!-- Gallery pages and palettes published from this account, on the My Projects page: whether
they show the account's name (changed on the Account page), and removing them.
Hidden until the account has a page or publishing from accounts is on. -->

<script lang="ts">
  import { ROW_FOCUS } from '$lib/constants/class-constants';
  import { resolve } from '$app/paths';
  import {
    GALLERY_PAGES_CHANGED,
    getGalleryPages,
    removeGalleryPage,
    type GalleryPage,
  } from '$lib/accounts/gallery';
  import { safeSlide } from '$lib/features/transitions/safeSlide';
  import {
    ExternalLinkIcon,
    ImageIcon,
    LoaderCircleIcon,
    PaletteIcon,
    Trash2Icon,
    UserRoundIcon,
  } from '@lucide/svelte';
  import { onMount } from 'svelte';

  let {
    name,
    cardClass,
  }: {
    /** The account's display name */
    name: string;
    cardClass: string;
  } = $props();

  let loaded = $state(false);
  let publishing = $state(false);
  let pages = $state<GalleryPage[]>([]);
  let showName = $state(false);
  let publicId = $state<string | null>(null);
  let confirming = $state<number | null>(null);
  let busy = $state(false);
  let errorMessage = $state('');

  // The server's copy of the name, which may be newer than this browser's
  let serverName = $state<string | null>(null);
  let currentName = $derived(serverName ?? name);
  let hasName = $derived(Boolean(currentName.trim()));

  const ROW_LINK = `hover:bg-surface-200-800 flex min-h-12 w-full items-center gap-3 px-4 py-3 transition-colors ${ROW_FOCUS}`;

  async function load() {
    const gallery = await getGalleryPages();
    if (!gallery) return;
    pages = gallery.posts;
    showName = gallery.settings.showName;
    publicId = gallery.settings.publicId;
    publishing = gallery.publishing;
    if (typeof gallery.name === 'string') serverName = gallery.name;
    loaded = true;
  }

  onMount(() => {
    load();
    // A palette shared from this page shows up without a reload
    window.addEventListener(GALLERY_PAGES_CHANGED, load);
    return () => window.removeEventListener(GALLERY_PAGES_CHANGED, load);
  });

  const isPalette = (page: GalleryPage) => page.kind === 'palette';

  /** Where a row links: the project's gallery page, or the palette's Yarn Palette Creator link on this site. */
  function pageHref(page: GalleryPage) {
    if (!isPalette(page))
      return resolve('/gallery/[id]', { id: String(page.postId) });
    try {
      const url = new URL(page.link ?? '');
      return `${url.pathname}${url.search}`;
    } catch {
      return `${resolve('/gallery')}?view=yarn-palettes`;
    }
  }

  async function remove(postId: number) {
    busy = true;
    errorMessage = '';
    try {
      await removeGalleryPage(postId);
      confirming = null;
      await load();
    } catch {
      errorMessage = 'The page couldn’t be removed. Try again later.';
    } finally {
      busy = false;
    }
  }

  const publishedOn = (time: number) =>
    new Date(time).toLocaleDateString(undefined, { dateStyle: 'medium' });
</script>

{#if loaded && (pages.length || publishing)}
  <section class="flex flex-col gap-2" aria-labelledby="gallery-pages">
    <h2 id="gallery-pages" class="h3">My Public Gallery Pages</h2>
    <p class="text-sm opacity-70">
      Projects and palettes you add to the public gallery while signed in.
      Anyone can see them.
    </p>
    <div class={cardClass}>
      <div
        class="flex flex-wrap items-center gap-x-2 gap-y-1 px-4 py-3 text-sm"
        data-testid="gallery-name-status"
      >
        <span>
          {#if showName && hasName}
            Your pages say “By {currentName}”.
          {:else}
            Your pages don’t show your name.
          {/if}
        </span>
        <a href={resolve('/account')} class="link"
          >Change on your Account page</a
        >
      </div>
      {#if showName && hasName && publicId}
        <a
          href={resolve('/gallery/by/[ownerId]', { ownerId: publicId })}
          target="_blank"
          class={ROW_LINK}
          data-testid="gallery-owner-page"
        >
          <UserRoundIcon class="shrink-0 opacity-70" />
          <span class="flex-1">Your public gallery page</span>
          <ExternalLinkIcon class="size-4 shrink-0 opacity-50" />
        </a>
      {/if}

      {#if pages.length}
        <ul class="flex flex-col" aria-label="Your gallery pages">
          {#each pages as page (page.postId)}
            <li class="flex flex-col gap-2 px-4 py-3">
              <div class="flex items-center gap-3">
                {#if isPalette(page)}
                  <PaletteIcon class="shrink-0 opacity-70" />
                {:else}
                  <ImageIcon class="shrink-0 opacity-70" />
                {/if}
                <div class="flex min-w-0 flex-1 flex-col">
                  <!-- eslint-disable-next-line svelte/no-navigation-without-resolve -->
                  <a
                    href={pageHref(page)}
                    target="_blank"
                    class="link line-clamp-2 break-words"
                    >{page.title}
                    <ExternalLinkIcon class="inline size-4" /></a
                  >
                  <span class="text-sm opacity-70"
                    >{isPalette(page) ? 'Palette, shared' : 'Published'}
                    {publishedOn(page.publishedAt)}</span
                  >
                </div>
                {#if confirming !== page.postId}
                  <button
                    type="button"
                    class="btn-icon hover:preset-tonal-error"
                    aria-label="Remove {page.title} from the gallery"
                    title="Remove from the gallery"
                    onclick={() => (confirming = page.postId)}
                    disabled={busy}><Trash2Icon /></button
                  >
                {/if}
              </div>
              {#if confirming === page.postId}
                <div class="flex flex-col gap-2" in:safeSlide>
                  <p class="text-sm">
                    {#if isPalette(page)}
                      Remove this palette from the gallery? Your saved palette
                      stays.
                    {:else}
                      Remove this page from the gallery? It also comes off the
                      globe. Your project stays saved.
                    {/if}
                  </p>
                  <div class="flex flex-wrap gap-2">
                    <button
                      type="button"
                      class="btn preset-filled-error-500 max-sm:w-full"
                      onclick={() => remove(page.postId)}
                      disabled={busy}
                      >{#if busy}<LoaderCircleIcon class="animate-spin" />{/if} Remove
                      page</button
                    >
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
      {:else}
        <p class="px-4 py-3 text-sm opacity-70">
          Projects and palettes you add to the gallery while signed in show up
          here, so you can remove them later.
        </p>
      {/if}
      {#if errorMessage}
        <p class="text-error-700-300 px-4 py-3" role="alert">
          {errorMessage}
        </p>
      {/if}
    </div>
  </section>
{/if}

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

<!-- Gallery pages published from this account, for the account page: whether they
show the account's name, and removing them. Hidden until the account has a page or
publishing from accounts is on. -->

<script lang="ts">
  import {
    getGalleryPages,
    removeGalleryPage,
    updateGallerySettings,
    type GalleryPage,
  } from '$lib/accounts/gallery';
  import { safeSlide } from '$lib/features/transitions/safeSlide';
  import {
    ExternalLinkIcon,
    ImageIcon,
    LoaderCircleIcon,
    Trash2Icon,
    UserRoundIcon,
  } from '@lucide/svelte';
  import { onMount } from 'svelte';

  let {
    name,
    pageCount = $bindable(0),
    cardClass,
  }: {
    /** The account's display name */
    name: string;
    /** How many pages the account has, for the delete-account question */
    pageCount?: number;
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

  let hasName = $derived(Boolean(name.trim()));

  const ROW_LINK =
    'hover:preset-tonal-surface flex min-h-12 w-full items-center gap-3 px-4 py-3 transition-colors';

  async function load() {
    const gallery = await getGalleryPages();
    if (!gallery) return;
    pages = gallery.posts;
    pageCount = pages.length;
    showName = gallery.settings.showName;
    publicId = gallery.settings.publicId;
    publishing = gallery.publishing;
    loaded = true;
  }

  onMount(load);

  async function saveShowName() {
    errorMessage = '';
    try {
      const settings = await updateGallerySettings({ showName });
      showName = settings.showName;
      publicId = settings.publicId;
    } catch {
      showName = !showName;
      errorMessage = 'That setting couldn’t be saved. Try again.';
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
    <h3 id="gallery-pages" class="px-2 text-sm font-bold opacity-70">
      Gallery pages
    </h3>
    <div class={cardClass}>
      <label class="flex items-start gap-3 px-4 py-3">
        <input
          type="checkbox"
          class="checkbox mt-1 shrink-0"
          bind:checked={showName}
          onchange={saveShowName}
          disabled={!hasName && !showName}
        />
        <span class="flex flex-col gap-1">
          <span class="font-bold">Show my name on my gallery pages</span>
          <span class="text-sm opacity-70">
            {#if hasName}
              Pages you publish while signed in will say “By {name}”, linking to
              a page that lists them all.
            {:else}
              Add a display name above first.
            {/if}
          </span>
        </span>
      </label>
      {#if showName && hasName && publicId}
        <a
          href="/gallery/by/{publicId}"
          target="_blank"
          class={ROW_LINK}
          data-testid="gallery-owner-page"
        >
          <UserRoundIcon class="shrink-0 opacity-70" />
          <span class="flex-1">Your page in the gallery</span>
          <ExternalLinkIcon class="size-4 shrink-0 opacity-50" />
        </a>
      {/if}

      {#if pages.length}
        <ul class="flex flex-col" aria-label="Your gallery pages">
          {#each pages as page (page.postId)}
            <li class="flex flex-col gap-2 px-4 py-3">
              <div class="flex items-center gap-3">
                <ImageIcon class="shrink-0 opacity-70" />
                <div class="flex min-w-0 flex-1 flex-col">
                  <a
                    href="/gallery/{page.postId}"
                    target="_blank"
                    class="link line-clamp-2 break-words"
                    >{page.title}
                    <ExternalLinkIcon class="inline size-4" /></a
                  >
                  <span class="text-sm opacity-70"
                    >Published {publishedOn(page.publishedAt)}</span
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
                    Remove this page from the gallery? It also comes off the
                    globe. Your project stays saved.
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
          Projects you add to the gallery while signed in show up here, so you
          can remove them later.
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

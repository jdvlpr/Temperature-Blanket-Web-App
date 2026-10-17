<!-- Copyright (c) 2026, Thomas (https://github.com/jdvlpr)

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
  On a gallery page, only for the account that published it: Edit Gallery
  Page, beside Open a Copy. It opens the same dialog as Edit Gallery Page in
  My Library (update, Anonymous, a project's Ravelry project, Unpublish), with
  its project or palette as saved here; after saving, the page shows what
  changed. Not saved on this device yet (before a sync), the dialog offers
  Anonymous and Unpublish only. Found in the browser from the account's pages,
  so visitors get the same page as before and make no extra request. Shown even
  when the page can't be loaded, so its owner can still unpublish it.
-->
<script lang="ts">
  import { invalidateAll } from '$app/navigation';
  import { resolve } from '$app/paths';
  import { account } from '#lib/accounts/summary.svelte.js';
  import { galleryPages } from '#lib/accounts/gallery-pages.svelte.js';
  import type { GalleryPage } from '#lib/accounts/gallery.js';
  import { editGalleryPage } from '#lib/utils/edit-gallery-page.js';
  import { LoaderCircleIcon, PencilIcon } from '@lucide/svelte';

  let {
    postId,
    kind,
  }: {
    postId: number;
    kind: 'project' | 'palette';
  } = $props();

  const signedIn = $derived(
    __ACCOUNTS_ENABLED__ && Boolean(account.summary?.id),
  );

  $effect(() => {
    if (signedIn) void galleryPages.load();
  });

  let page = $derived<GalleryPage | undefined>(
    signedIn
      ? galleryPages.pages.find(
          (p) => p.postId === postId && (p.kind ?? 'project') === kind,
        )
      : undefined,
  );

  let opening = $state(false);
  let removed = $state(false);
  let errorMessage = $state('');

  const onsaved = () => void invalidateAll();
  const onunpublished = () => (removed = true);

  async function open() {
    if (!page || opening) return;
    opening = true;
    errorMessage = '';
    try {
      await editGalleryPage(page, kind, { onsaved, onunpublished });
    } catch {
      errorMessage = 'It couldn’t be opened. Try again later.';
    } finally {
      opening = false;
    }
  }
</script>

{#if removed}
  <p class="basis-full text-sm" role="status" data-testid="gallery-page-edit">
    Unpublished. This page is no longer in the gallery.
    <a
      href={kind === 'palette'
        ? resolve('/my-palettes')
        : resolve('/my-projects')}
      class="link">My Library</a
    >
  </p>
{:else if page}
  <button
    type="button"
    class="btn hover:preset-tonal-surface"
    onclick={open}
    disabled={opening}
    data-testid="gallery-page-edit"
  >
    {#if opening}<LoaderCircleIcon
        class="animate-spin"
        aria-hidden="true"
      />{:else}<PencilIcon aria-hidden="true" />{/if}
    Edit Gallery Page…
  </button>
{/if}
{#if errorMessage}
  <p class="text-error-700-300 basis-full text-center text-sm" role="alert">
    {errorMessage}
  </p>
{/if}

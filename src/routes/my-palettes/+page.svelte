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

<!-- My Library's Yarn Palettes page: every saved palette (and signed in, ones
only in the gallery), with search, filters and sort once there are a few. -->

<script lang="ts">
  import { browser } from '$app/env';
  import { resolve } from '$app/paths';
  import { PUBLIC_BASE_URL } from '$app/env/public';
  import { account } from '#lib/accounts/summary.svelte.js';
  import { galleryPages } from '#lib/accounts/gallery-pages.svelte.js';
  import {
    paletteNameDiffers,
    type GalleryPage,
  } from '#lib/accounts/gallery.js';
  import { sync } from '#lib/sync/status.svelte.js';
  import AppLogo from '#lib/components/AppLogo.svelte';
  import AppShell from '#lib/components/AppShell.svelte';
  import CollectionToolbar from '#lib/components/CollectionToolbar.svelte';
  import GallerySharing from '#lib/components/account/GallerySharing.svelte';
  import LibraryStatusMenu from '#lib/components/LibraryStatusMenu.svelte';
  import MyLibrary from '#lib/components/MyLibrary.svelte';
  import SavedPalettes from '#lib/components/SavedPalettes.svelte';
  import SharePalette from '#lib/components/modals/SharePalette.svelte';
  import AddToAccountButton from '#lib/components/sync/AddToAccountButton.svelte';
  import { dialog } from '#lib/state/page-state.svelte.js';
  import { libraryFilters } from '#lib/state/library-filters.svelte.js';
  import { preferences } from '#lib/storage/preferences.svelte.js';
  import type { Color } from '#lib/types/yarn-types.js';
  import { FILTERS_FROM, LIBRARY_SORTS } from '#lib/utils/collection-filter.js';
  import { PlusIcon } from '@lucide/svelte';

  let total = $state<number | null>(null);
  let matching = $state(0);

  const signedIn = $derived(
    __ACCOUNTS_ENABLED__ && Boolean(account.summary?.id),
  );
  // Signed in with sync on: palettes are kept in the account
  const synced = $derived(signedIn && sync.active);
  const showGallery = $derived(signedIn && galleryPages.shown);

  function sharePalette(
    palette: { id: string },
    colors: Color[],
    label: string,
    options: { replace?: GalleryPage; rename?: GalleryPage } = {},
  ) {
    const old = options.rename ?? options.replace;
    dialog.trigger({
      type: 'component',
      component: {
        ref: SharePalette,
        props: {
          paletteId: palette.id,
          colors,
          name: label,
          showOwner: old?.showOwner,
          // Kept for renaming too: an older gallery plugin can't rename, so
          // it falls back to a new version
          versions: old ? galleryPages.pagesLike(old) : undefined,
          rename: options.rename,
        },
      },
      options: {
        title: options.rename
          ? 'Update Gallery Name'
          : options.replace
            ? 'Publish New Version'
            : 'Publish to Gallery',
      },
    });
  }
</script>

<svelte:head>
  <title>My Palettes</title>
  <meta name="description" content="Your saved yarn palettes" />
  <meta name="robots" content="noindex" />

  <meta property="og:title" content="My Palettes" />
  <meta property="og:description" content="Your saved yarn palettes" />
  <meta property="og:url" content="{PUBLIC_BASE_URL}/my-palettes" />
  <meta property="og:type" content="website" />
</svelte:head>

<AppShell pageName="My Library">
  {#snippet stickyHeader()}
    <div class="hidden lg:inline-flex"><AppLogo /></div>
  {/snippet}
  {#snippet main()}
    <MyLibrary current="palettes" currentTotal={total}>
      {#if browser}
        {@const showFilters =
          (total ?? 0) > FILTERS_FROM || libraryFilters.activeFor('palettes')}
        <CollectionToolbar
          kind="palette"
          searchIcon="search"
          searchLabel="Search Palettes"
          searchPlaceholder="Name or colorway"
          bind:search={libraryFilters.search}
          bind:brandId={libraryFilters.brandId}
          bind:yarnId={libraryFilters.yarnId}
          bind:onlyThisYarn={libraryFilters.onlyThisYarn}
          sortOptions={LIBRARY_SORTS}
          sort={libraryFilters.sort}
          onsort={(sort) => (libraryFilters.sort = sort)}
          reversed={libraryFilters.reversed}
          onreverse={(reversed) => (libraryFilters.reversed = reversed)}
          bind:layout={
            () => preferences.value.myProjectsLayout ?? 'grid',
            (layout) => (preferences.value.myProjectsLayout = layout)
          }
          {showFilters}
        >
          {#snippet menus()}
            {#if showGallery}<LibraryStatusMenu />{/if}
          {/snippet}
          {#snippet actions()}
            <a href={resolve('yarn')} class="btn hover:preset-tonal-surface"
              ><PlusIcon />New Palette</a
            >
          {/snippet}
        </CollectionToolbar>
        {#if synced}
          <AddToAccountButton kind="palettes" />
        {/if}
        <p class="text-surface-700-300 text-center text-sm" aria-live="polite">
          {#if libraryFilters.activeFor('palettes') && total}
            {matching} of {total} palettes
          {/if}
        </p>
        <SavedPalettes
          galleryOnly={showGallery
            ? [...galleryPages.grouped.galleryOnlyPalettes.values()]
            : []}
          filters={libraryFilters}
          oncount={(count) => ({ total, matching } = count)}
        >
          {#snippet sharing({ palette, colors, label })}
            {#if showGallery}
              {@const page = galleryPages.grouped.byPalette.get(palette.id)}
              <GallerySharing
                compact
                kind="palette"
                {label}
                {page}
                changedSince={Boolean(page && paletteNameDiffers(label, page))}
                onadd={() => sharePalette(palette, colors, label)}
                onupdate={(old) =>
                  sharePalette(palette, colors, label, { rename: old })}
              />
            {/if}
          {/snippet}
        </SavedPalettes>
      {/if}
    </MyLibrary>
  {/snippet}
</AppShell>

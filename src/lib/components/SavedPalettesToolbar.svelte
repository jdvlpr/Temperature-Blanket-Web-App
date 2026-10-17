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
  Search, filters, sort and view for saved palettes, and "3 of 12 palettes"
  while filtering: My Library's, and Get Colors' My Palettes, which share
  them. Search and filters show once there are a few (or one is on).
-->
<script lang="ts">
  import { account } from '#lib/accounts/summary.svelte.js';
  import { galleryPages } from '#lib/accounts/gallery-pages.svelte.js';
  import CollectionToolbar from '#lib/components/CollectionToolbar.svelte';
  import { libraryFilters } from '#lib/state/library-filters.svelte.js';
  import { preferences } from '#lib/storage/preferences.svelte.js';
  import {
    FILTERS_FROM,
    LIBRARY_SORTS,
    libraryStatuses,
  } from '#lib/utils/collection-filter.js';
  import type { Snippet } from 'svelte';

  let {
    total,
    matching,
    actions,
  }: {
    /** How many are saved, once known */
    total: number | null;
    /** How many match the filters */
    matching: number;
    /** The page's buttons, e.g. New Palette */
    actions?: Snippet;
  } = $props();

  const signedIn = $derived(
    __ACCOUNTS_ENABLED__ && Boolean(account.summary?.id),
  );
  const showGallery = $derived(signedIn && galleryPages.shown);

  const showFilters = $derived(
    (total ?? 0) > FILTERS_FROM ||
      libraryFilters.activeFor('palettes') ||
      libraryFilters.sort !== 'recent' ||
      libraryFilters.reversed,
  );
</script>

<CollectionToolbar
  kind="palette"
  searchIcon="search"
  searchLabel="Search Palettes"
  searchPlaceholder="Name or colorway"
  bind:search={libraryFilters.search}
  bind:brandId={libraryFilters.brandId}
  bind:yarnId={libraryFilters.yarnId}
  bind:onlyThisYarn={libraryFilters.onlyThisYarn}
  bind:status={libraryFilters.status}
  statuses={showGallery ? libraryStatuses({ gallery: true }) : undefined}
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
  {actions}
></CollectionToolbar>
<p class="text-surface-700-300 text-center text-sm" aria-live="polite">
  {#if libraryFilters.activeFor('palettes') && total}
    {matching} of {total} palettes
  {/if}
</p>

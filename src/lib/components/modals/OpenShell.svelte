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

<!-- The Project and Palette menus' Open screen, around what each lists: Mine
| Starred (signed in), a search field, then the saved ones (`mine`, given
the search) or the starred gallery pages, opened as copies; My Library at the
foot. -->

<script lang="ts">
  import { galleryStars } from '#lib/accounts/gallery-stars.svelte.js';
  import { account } from '#lib/accounts/summary.svelte.js';
  import LibraryScope from '#lib/components/LibraryScope.svelte';
  import StarredGalleryPages from '#lib/components/StarredGalleryPages.svelte';
  import { FIELD_GROUP } from '#lib/constants/class-constants.js';
  import { LibraryFilters } from '#lib/state/library-filters.svelte.js';
  import type { GalleryPalette } from '#lib/utils/color-utils.js';
  import { ArrowRightIcon, SearchIcon, XIcon } from '@lucide/svelte';
  import type { Snippet } from 'svelte';

  let {
    kind,
    mineCount,
    libraryHref,
    mine,
    onuse,
    onopen,
  }: {
    kind: 'project' | 'palette';
    /** How many are saved, once known */
    mineCount: number | null;
    /** My Library's page for them */
    libraryHref: string;
    /** The saved ones matching the search */
    mine: Snippet<[string]>;
    /** A starred palette chosen */
    onuse?: (palette: GalleryPalette) => void;
    /** A starred project's copy chosen (its link's click) */
    onopen?: (event: MouseEvent, href: string) => void;
  } = $props();

  const noun = $derived(kind === 'project' ? 'projects' : 'palettes');

  // Mine | Starred, for the signed in (only they have stars)
  const signedIn = $derived(
    __ACCOUNTS_ENABLED__ && Boolean(account.summary?.id),
  );
  let starredChosen = $state(false);
  const starred = $derived(signedIn && starredChosen);
  $effect(() => {
    if (signedIn) return galleryStars.start();
  });
  const starredCount = $derived(
    signedIn && galleryStars.loaded ? galleryStars.list(kind).length : null,
  );

  // Its own search, apart from My Library's
  const filters = new LibraryFilters();
  const searchId = $props.id();
</script>

<div class="flex w-full flex-col gap-4 p-4 pt-2 text-left">
  {#if signedIn}
    <LibraryScope
      {starred}
      label={kind === 'project' ? 'Projects to show' : 'Palettes to show'}
      onselect={(side) => (starredChosen = side)}
      {mineCount}
      {starredCount}
    />
  {/if}

  <div class={[FIELD_GROUP, 'grid-cols-[auto_1fr_auto]']}>
    <span class="label label-text" aria-hidden="true"><SearchIcon /></span>
    <input
      id={searchId}
      type="text"
      class="input w-full truncate"
      autocomplete="off"
      aria-label="Search {starred ? `starred ${noun}` : noun}"
      placeholder="Search {noun}"
      bind:value={filters.search}
    />
    {#if filters.search}
      <button
        type="button"
        class="btn hover:preset-tonal-surface"
        title="Clear Search"
        aria-label="Clear Search"
        onclick={() => (filters.search = '')}
      >
        <XIcon />
      </button>
    {/if}
  </div>

  {#if starred}
    <StarredGalleryPages
      {kind}
      layout="list"
      narrow
      {filters}
      {onuse}
      {onopen}
    />
  {:else}
    {@render mine(filters.search)}
  {/if}

  <a href={libraryHref} class="link inline-flex items-center gap-1 self-start">
    Open My Library <ArrowRightIcon class="icon-sm" />
  </a>
</div>

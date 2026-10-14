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

<script lang="ts">
  import { page } from '$app/state';
  import { PUBLIC_BASE_URL } from '$app/env/public';
  import CollectionToolbar from '#lib/components/CollectionToolbar.svelte';
  import GalleryPaletteCard from '#lib/components/GalleryPaletteCard.svelte';
  import PlaceholderPalettes from '#lib/components/PlaceholderPalettes.svelte';
  import { ensureYarnData } from '#lib/data/yarns/colorways.svelte.js';
  import { streamed } from '#lib/utils/streamed.svelte.js';
  import type { GalleryPalette } from '#lib/utils/color-utils.js';
  import {
    FILTERS_FROM,
    matchesSearch,
    matchesYarn,
    sortGalleryPages,
  } from '#lib/utils/collection-filter.js';
  import { GALLERY_SORTS } from '#lib/utils/gallery-utils.js';
  import {
    galleryTitleText,
    sharedPaletteFrom,
  } from '#lib/utils/shared-palette-utils.js';
  import { XIcon } from '@lucide/svelte';
  import PopularPeriodMenu from '../../../PopularPeriodMenu.svelte';
  import {
    lastSeen,
    ownerFilters,
    popularOrder,
  } from '../owner-filters.svelte.js';
  import type { PageData } from './$types';

  let { data }: { data: PageData } = $props();

  let heading = $derived(`Yarn palettes by ${data.name}`);

  // Undefined while the gallery answers the first time, null if it can't be
  // reached
  const streamedList = streamed(() => data.list);
  const list = lastSeen(
    () => `palettes/${page.params.ownerId}`,
    () => streamedList.current,
  );
  const ownPalettes = $derived(list.current?.palettes);
  const all = $derived(ownPalettes ?? []);
  const popular = popularOrder(
    'palette',
    () => all.map((palette) => palette.databaseId),
    () => list.current?.popular ?? null,
  );

  // Colorway names come from the yarn data, loaded only when needed
  let yarnDataReady = $state(false);
  $effect(() => {
    if (all.length && !yarnDataReady)
      ensureYarnData().then(() => (yarnDataReady = true));
  });

  // Each palette as a card, newest first, with its date to sort by
  let cards = $derived(
    yarnDataReady
      ? all.flatMap(({ databaseId, title, yarnUrls, date }) => {
          const palette = sharedPaletteFrom(yarnUrls);
          if (!palette) return [];
          const card: GalleryPalette = {
            colors: palette.colors,
            postId: databaseId,
            yarns: [],
            page: {
              id: databaseId,
              title: galleryTitleText(title),
              kind: 'palette',
            },
            others: [],
          };
          return [{ databaseId, date, card }];
        })
      : [],
  );

  const palettes = $derived.by(() => {
    const f = ownerFilters;
    const yarn = { brandId: f.brandId, yarnId: f.yarnId, only: f.onlyThisYarn };
    const kept = cards.filter(
      ({ card }) =>
        matchesSearch(f.search, [
          card.page?.title,
          ...card.colors.flatMap((color) => [
            color.name,
            color.brandName,
            color.yarnName,
          ]),
        ]) && matchesYarn(card.colors, yarn),
    );
    return sortGalleryPages(kept, f.sort, popular.ids).map(({ card }) => card);
  });

  const filtering = $derived(ownerFilters.activeFor('palettes'));
  const showFilters = $derived(
    all.length > FILTERS_FROM || filtering || ownerFilters.sorted,
  );
</script>

<svelte:head>
  <title>Gallery: {heading}</title>
  <meta name="description" content="Temperature blanket {heading}" />
  <meta property="og:title" content="Gallery: {heading}" />
  <meta
    property="og:url"
    content="{PUBLIC_BASE_URL}/gallery/by/{page.params.ownerId}/palettes"
  />
  <meta property="og:type" content="website" />
</svelte:head>

{#if ownPalettes === undefined}
  <div class="px-2">
    <span class="sr-only" role="status">Loading palettes…</span>
    <PlaceholderPalettes items={data.paletteIds.length} maxWFull={true} />
  </div>
{:else if ownPalettes === null}
  <p class="my-8 text-center" role="alert">
    The gallery couldn’t be reached. Try again later.
  </p>
{:else if !ownPalettes.length}
  <p class="my-8 text-center">No yarn palettes yet.</p>
{:else if !yarnDataReady}
  <div class="px-2"><PlaceholderPalettes items={3} maxWFull={true} /></div>
{:else}
  <div class="px-2 lg:px-0">
    <CollectionToolbar
      kind="palette"
      searchIcon="search"
      searchLabel="Search Palettes"
      searchPlaceholder="Name or colorway"
      bind:search={ownerFilters.search}
      bind:brandId={ownerFilters.brandId}
      bind:yarnId={ownerFilters.yarnId}
      bind:onlyThisYarn={ownerFilters.onlyThisYarn}
      sortOptions={GALLERY_SORTS}
      sort={ownerFilters.sort}
      onsort={(sort) => (ownerFilters.sort = sort)}
      bind:layout={ownerFilters.layout}
      {showFilters}
    >
      {#snippet menus()}
        {#if ownerFilters.sort === 'POPULAR'}
          <PopularPeriodMenu
            days={ownerFilters.popularDays}
            onchange={(days) => (ownerFilters.popularDays = days)}
          />
        {/if}
      {/snippet}
    </CollectionToolbar>
  </div>
  <p class="text-surface-700-300 text-center text-sm" aria-live="polite">
    {#if filtering}
      {palettes.length} of {cards.length} palettes
    {/if}
  </p>
  {#if palettes.length}
    <ul
      class={[
        'w-full items-start gap-x-4 gap-y-6 px-2',
        ownerFilters.layout === 'grid'
          ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
          : 'flex flex-col',
      ]}
      aria-label="Yarn palettes by {data.name}"
    >
      {#each palettes as palette (palette.postId)}
        <li class="w-full">
          <GalleryPaletteCard {palette} />
        </li>
      {/each}
    </ul>
  {:else}
    <div class="my-8 flex flex-col items-center gap-2 text-center">
      <p>No palettes match these filters.</p>
      <button
        type="button"
        class="btn preset-tonal-primary border-primary-500 border"
        onclick={() => ownerFilters.clear()}
      >
        <XIcon />
        Clear Filters
      </button>
    </div>
  {/if}
{/if}

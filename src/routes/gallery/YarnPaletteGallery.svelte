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
  import { PUBLIC_WORDPRESS_BASE_URL } from '$app/env/public';
  import { GALLERY_SORTS } from '#lib/utils/gallery-utils.js';
  import GalleryPaletteCard from '#lib/components/GalleryPaletteCard.svelte';
  import ToTopButton from '#lib/components/buttons/ToTopButton.svelte';
  import CollectionToolbar from '#lib/components/CollectionToolbar.svelte';
  import { fetchPaletteGallery } from '#lib/utils/gallery-utils.js';
  import { ensureYarnData } from '#lib/data/yarns/colorways.svelte.js';
  import { getPalettesFromProjects } from '#lib/utils/color-utils.js';
  import { PlusIcon, XIcon } from '@lucide/svelte';
  import { onMount } from 'svelte';
  import PopularPeriodMenu from './PopularPeriodMenu.svelte';
  import { galleryFilters, yarnPaletteGalleryState } from './state.svelte';

  let first = 40;
  let loading = $state(true);
  let scrollContainer: HTMLDivElement | undefined = $state();
  let showScrollToTopButton = $state(false);
  let totalPalettes = $state<string | undefined>();

  onMount(async () => {
    // The first visit, or the filters changed on the other tab
    if (
      !yarnPaletteGalleryState.projects.length ||
      yarnPaletteGalleryState.loadedFor !== galleryFilters.key
    )
      await search();
    else {
      await ensureYarnData();
      showPalettes();
      loading = false;
    }
    const scrollObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          showScrollToTopButton =
            !entry.isIntersecting && entry.boundingClientRect.top < 0;
        });
      },
      { threshold: 0 },
    );
    if (scrollContainer) scrollObserver.observe(scrollContainer);

    // How many there are (none shown from a gallery without palettes)
    try {
      const response = await fetch(
        `${PUBLIC_WORDPRESS_BASE_URL}/wp-json/wp/v2/palettes?per_page=1&_=${Date.now()}`,
      );
      const total = response.ok ? response.headers.get('x-wp-total') : null;
      totalPalettes = total !== null ? (+total).toLocaleString() : undefined;
    } catch {
      totalPalettes = undefined;
    }
  });

  let hasNextPage = $derived(
    yarnPaletteGalleryState.gallery?.pageInfo?.hasNextPage,
  );
  let endCursor = $derived(
    yarnPaletteGalleryState.gallery?.pageInfo?.endCursor,
  );

  /** The loaded posts as palettes, with the yarn filters applied */
  function showPalettes() {
    yarnPaletteGalleryState.palettes = getPalettesFromProjects({
      projects: yarnPaletteGalleryState.projects,
      selectedBrandId: yarnPaletteGalleryState.filteredBrandId,
      selectedYarnId: yarnPaletteGalleryState.filteredYarnId,
      palettesContainOnlyFilteredYarn:
        yarnPaletteGalleryState.palettesContainOnlyFilteredYarn,
    });
  }

  async function fetchPage(after: string | null = null) {
    const results = await fetchPaletteGallery({
      first,
      after,
      search: yarnPaletteGalleryState.search,
      order: yarnPaletteGalleryState.orderBy,
      days: yarnPaletteGalleryState.popularDays,
      yarn: yarnPaletteGalleryState.getYarnSearch({
        brandId: yarnPaletteGalleryState.filteredBrandId,
        yarnId: yarnPaletteGalleryState.filteredYarnId,
      }),
    });
    // The gallery can't sort by Popular yet (an older plugin): say Newest
    if (results.popularUnavailable) yarnPaletteGalleryState.orderBy = 'DESC';
    yarnPaletteGalleryState.gallery.pageInfo = results.pageInfo;
    yarnPaletteGalleryState.projects.push(
      ...results.edges.flatMap((item) => item.node),
    );
    // Which colors are yarns comes from the yarn data
    await ensureYarnData();
    showPalettes();
  }

  async function search() {
    yarnPaletteGalleryState.projects = [];
    yarnPaletteGalleryState.palettes = [];
    loading = true;
    try {
      await fetchPage();
      yarnPaletteGalleryState.loadedFor = galleryFilters.key;
    } catch (e) {
      console.error('Search failed:', e);
    } finally {
      loading = false;
    }
  }

  let searchTimeout: ReturnType<typeof setTimeout> | undefined;
  function debouncedSearch() {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(search, 500);
  }

  function clearFilters() {
    galleryFilters.clear();
    search();
  }

  let grid = $derived(yarnPaletteGalleryState.layout === 'grid');
  const gridClass =
    'grid w-full grid-cols-1 items-start gap-x-4 gap-y-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4';
  const listClass = 'flex w-full flex-col items-start gap-6';
</script>

{#snippet placeholders(count: number)}
  {#each Array(count) as _, i (i)}
    <div class="flex w-full flex-col gap-2" aria-hidden="true">
      <div
        class="placeholder rounded-container h-[70px] w-full animate-pulse"
      ></div>
      <div class="placeholder h-4 w-2/3 animate-pulse"></div>
    </div>
  {/each}
{/snippet}

<div class="flex flex-col justify-center gap-8 px-2 lg:px-0">
  <div class="inline-grid gap-2 text-center">
    <div
      bind:this={scrollContainer}
      class="flex scroll-mt-[70px] flex-col items-center justify-center gap-2 pb-4 text-center"
    >
      {#if totalPalettes !== undefined}
        <p class="text-xs">{totalPalettes} total</p>
      {/if}
      <CollectionToolbar
        kind="palette"
        disabled={loading}
        bind:search={yarnPaletteGalleryState.search}
        bind:brandId={yarnPaletteGalleryState.filteredBrandId}
        bind:yarnId={yarnPaletteGalleryState.filteredYarnId}
        bind:onlyThisYarn={
          yarnPaletteGalleryState.palettesContainOnlyFilteredYarn
        }
        sortOptions={GALLERY_SORTS}
        sort={yarnPaletteGalleryState.orderBy}
        onsort={(order) => {
          yarnPaletteGalleryState.orderBy = order;
          search();
        }}
        bind:layout={yarnPaletteGalleryState.layout}
        onchange={debouncedSearch}
      >
        {#snippet menus()}
          {#if yarnPaletteGalleryState.orderBy === 'POPULAR'}
            <PopularPeriodMenu onchange={search} />
          {/if}
        {/snippet}
      </CollectionToolbar>
    </div>
    <div class={grid ? gridClass : listClass}>
      {#each yarnPaletteGalleryState.palettes as palette, i (i)}
        <GalleryPaletteCard {palette} />
      {/each}
      {#if loading}
        {@render placeholders(grid ? 12 : 8)}
      {/if}
    </div>
    {#if !yarnPaletteGalleryState.palettes.length && !loading}
      <div class="my-8 flex flex-col items-center gap-2 text-center">
        <p>No palettes match these filters.</p>
        {#if galleryFilters.active}
          <button
            type="button"
            class="btn preset-tonal-primary border-primary-500 border"
            onclick={clearFilters}
          >
            <XIcon />
            Clear Filters
          </button>
        {/if}
      </div>
    {:else if !loading && yarnPaletteGalleryState.palettes.length && hasNextPage}
      <button
        class="btn preset-filled m-auto my-4 flex"
        disabled={!hasNextPage}
        onclick={async () => {
          loading = true;
          try {
            await fetchPage(endCursor);
          } catch (e) {
            console.error('Could not load more palettes', e);
          } finally {
            loading = false;
          }
        }}
      >
        <PlusIcon />
        Load More
      </button>
    {/if}
  </div>
</div>

{#if showScrollToTopButton && yarnPaletteGalleryState.projects.length}
  <ToTopButton
    onClick={() => {
      scrollContainer?.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });
    }}
  />
{/if}

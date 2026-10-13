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
  import { FIELD_GROUP } from '#lib/constants/class-constants.js';
  import SortSelectMenu from '#lib/components/SortSelectMenu.svelte';
  import ViewMenu from '#lib/components/buttons/ViewMenu.svelte';
  import { GALLERY_ORDERS } from '#lib/utils/gallery-utils.js';
  import GalleryPaletteCard from '#lib/components/GalleryPaletteCard.svelte';
  import SelectYarn from '#lib/components/SelectYarn.svelte';
  import ToTopButton from '#lib/components/buttons/ToTopButton.svelte';
  import ToggleSwitch from '#lib/components/buttons/ToggleSwitch.svelte';
  import {
    fetchPopularProjects,
    fetchPaletteGallery,
    popularToGalleryNodes,
    recordPageView,
  } from '#lib/utils/gallery-utils.js';
  import { ensureYarnData } from '#lib/data/yarns/colorways.svelte.js';
  import {
    getPalettesFromProjects,
    type GalleryPalette,
  } from '#lib/utils/color-utils.js';
  import { EarthIcon, PlusIcon, XIcon } from '@lucide/svelte';
  import { onMount } from 'svelte';
  import { yarnPageState } from '../yarn/state.svelte';
  import PopularPeriodMenu from './PopularPeriodMenu.svelte';
  import { galleryFilters, yarnPaletteGalleryState } from './state.svelte';

  let first = 40;
  let loading = $state(true);
  let scrollContainer: HTMLDivElement | undefined = $state();
  let featuredEl: HTMLDivElement | undefined = $state();
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
    if (
      !yarnPaletteGalleryState.popularPalettes.length ||
      yarnPaletteGalleryState.popularFor !== galleryFilters.timePeriod
    ) {
      yarnPaletteGalleryState.popularPalettes = [];
      await fetchPopularPalettes();
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

  let showSearchReset = $derived(!!yarnPaletteGalleryState.search.length);

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
      yarn: yarnPaletteGalleryState.getYarnSearch({
        brandId: yarnPaletteGalleryState.filteredBrandId,
        yarnId: yarnPaletteGalleryState.filteredYarnId,
      }),
    });
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
    const loadedFor = galleryFilters.key;
    try {
      await fetchPage();
      yarnPaletteGalleryState.loadedFor = loadedFor;
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

  async function fetchPopularPalettes() {
    const months = galleryFilters.timePeriod;
    try {
      const [popular] = await Promise.all([
        fetchPopularProjects({ months, limit: 5, palettes: true }),
        ensureYarnData(),
      ]);
      yarnPaletteGalleryState.popularPalettes = getPalettesFromProjects({
        projects: popularToGalleryNodes(popular),
        minColors: 3,
      });
    } catch (e) {
      // Unreachable: none to feature, rather than placeholders forever
      console.error('Could not load popular palettes', e);
      yarnPaletteGalleryState.popularPalettes = [];
    }
    yarnPaletteGalleryState.popularFor = months;
  }

  /** Brings its colors and name to the Yarn Palette Creator (Open a Copy) */
  function openCopy(palette: GalleryPalette) {
    yarnPageState.gauge.colors = palette.colors;
    // Its gallery name, which Save Palette offers
    yarnPageState.suggestion = {
      name: palette.page.title,
      colors: $state.snapshot(palette.colors),
    };
    recordPageView(palette.postId);
  }

  let grid = $derived(yarnPaletteGalleryState.layout === 'grid');
  const gridClass =
    'grid w-full grid-cols-1 items-start gap-x-4 gap-y-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4';
  const listClass = 'flex w-full flex-col items-start gap-6';
</script>

{#snippet placeholders(count: number, inRow = false)}
  {#each Array(count) as _, i (i)}
    <div
      class={['flex flex-col gap-2', inRow ? 'w-64 shrink-0' : 'w-full']}
      aria-hidden="true"
    >
      <div
        class="placeholder rounded-container h-[70px] w-full animate-pulse"
      ></div>
      <div class="placeholder h-4 w-2/3 animate-pulse"></div>
    </div>
  {/each}
{/snippet}

<div class="flex flex-col justify-center gap-8 px-2 lg:px-0">
  <div class="inline-grid gap-2 text-center">
    <div class="my-2 flex flex-col items-center">
      <h2 class="text-surface-700-300 text-xl font-semibold">
        Featured Yarn Palettes
      </h2>
      <PopularPeriodMenu
        onchange={() => {
          yarnPaletteGalleryState.popularPalettes = [];
          fetchPopularPalettes();
          if (featuredEl) featuredEl.scrollLeft = 0;
        }}
      />
    </div>
    <div
      class="flex w-full snap-x snap-mandatory items-start gap-4 overflow-x-auto pb-2"
      bind:this={featuredEl}
    >
      {#if yarnPaletteGalleryState.popularFor !== galleryFilters.timePeriod}
        {@render placeholders(5, true)}
      {:else if !yarnPaletteGalleryState.popularPalettes.length}
        <p class="text-surface-700-300 mx-auto py-8 text-sm">
          Nothing popular in this period yet.
        </p>
      {:else}
        {#each yarnPaletteGalleryState.popularPalettes as palette, i (i)}
          <div class="w-64 shrink-0 snap-start">
            <GalleryPaletteCard {palette} onopen={() => openCopy(palette)} />
          </div>
        {/each}
      {/if}
    </div>
  </div>
  <div class="inline-grid gap-2 text-center">
    <div
      bind:this={scrollContainer}
      class="flex scroll-mt-[70px] flex-col items-center justify-center gap-2 pb-4 text-center"
    >
      <div class="flex flex-col">
        <h2 class="text-surface-700-300 text-xl font-semibold">
          All Yarn Palettes
        </h2>
        {#if totalPalettes !== undefined}
          <p class="text-xs">{totalPalettes} total</p>
        {/if}
      </div>
      <div class="grid w-full grid-cols-12 items-end gap-4">
        <div class="col-span-12 w-full md:col-span-5">
          <SelectYarn
            preselectDefaultYarn={false}
            disabled={loading}
            bind:selectedBrandId={yarnPaletteGalleryState.filteredBrandId}
            bind:selectedYarnId={yarnPaletteGalleryState.filteredYarnId}
            onselectautocomplete={debouncedSearch}
          />
        </div>

        {#if yarnPaletteGalleryState.filteredBrandId || yarnPaletteGalleryState.filteredYarnId}
          <div
            class="relative top-[2px] col-span-12 flex w-full flex-col items-start gap-0 text-left md:col-span-4"
          >
            <ToggleSwitch
              disabled={loading}
              bind:checked={
                yarnPaletteGalleryState.palettesContainOnlyFilteredYarn
              }
              onchange={debouncedSearch}
              label="Only This {yarnPaletteGalleryState.filteredBrandId &&
              yarnPaletteGalleryState.filteredYarnId
                ? 'Yarn'
                : 'Brand'}"
              details="All colorways in palette must be this {yarnPaletteGalleryState.filteredBrandId &&
              yarnPaletteGalleryState.filteredYarnId
                ? 'yarn'
                : 'brand'}"
            />
          </div>
        {/if}

        <div class="label col-span-12 w-full md:col-span-3">
          <span class="label-text"> Search </span>
          <div class={[FIELD_GROUP, 'grid-cols-[auto_1fr_auto]']}>
            <span class="label label-text"><EarthIcon /></span>
            <input
              type="text"
              class="input truncate"
              autocomplete="off"
              placeholder="e.g., Kansas, 2003"
              bind:value={yarnPaletteGalleryState.search}
              oninput={debouncedSearch}
            />

            {#if showSearchReset}
              <button
                class="btn hover:preset-tonal-surface"
                title="Reset Search"
                onclick={() => {
                  yarnPaletteGalleryState.search = '';
                  debouncedSearch();
                }}
              >
                <XIcon />
              </button>
            {/if}
          </div>
        </div>
      </div>
    </div>
    <div class="mb-2 flex flex-wrap justify-center gap-2">
      <SortSelectMenu
        options={GALLERY_ORDERS}
        current={yarnPaletteGalleryState.orderBy}
        disabled={loading}
        onsort={(order) => {
          yarnPaletteGalleryState.orderBy = order;
          debouncedSearch();
        }}
      />
      <ViewMenu bind:value={yarnPaletteGalleryState.layout} />
    </div>
    <div class={grid ? gridClass : listClass}>
      {#each yarnPaletteGalleryState.palettes as palette, i (i)}
        <GalleryPaletteCard {palette} onopen={() => openCopy(palette)} />
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

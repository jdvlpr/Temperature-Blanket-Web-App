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

<script module lang="ts">
  import { FIELD_GROUP } from '#lib/constants/class-constants.js';
  import type {
    GalleryOrder,
    PaletteGalleryNode,
    GalleryPageInfo,
  } from '#lib/utils/gallery-utils.js';
  import type { GalleryPalette } from '#lib/utils/color-utils.js';

  class GalleryPalettesState {
    search = $state('');
    filteredBrandId = $state('');
    filteredYarnId = $state('');
    palettesContainOnlyFilteredYarn = $state(false);
    orderBy = $state<GalleryOrder>('DESC');
    projects = $state<PaletteGalleryNode[]>([]);
    palettes = $state<GalleryPalette[]>([]);
    gallery = $state<{ pageInfo?: GalleryPageInfo }>({});

    getYarnSearch = ({
      brandId,
      yarnId,
    }: {
      brandId: string;
      yarnId: string;
    }) => {
      if (brandId && yarnId) return `${brandId}-${yarnId}`;
      else if (brandId) return brandId;
      else if (yarnId) return yarnId;
      return '';
    };
  }
  export const galleryPalettesState = new GalleryPalettesState();
</script>

<script lang="ts">
  import GalleryPaletteCard from '#lib/components/GalleryPaletteCard.svelte';
  import FilterChips, {
    yarnChipLabel,
  } from '#lib/components/FilterChips.svelte';
  import FiltersButton from '#lib/components/buttons/FiltersButton.svelte';
  import PlaceholderPalettes from '#lib/components/PlaceholderPalettes.svelte';
  import SelectYarn from '#lib/components/SelectYarn.svelte';
  import Spinner from '#lib/components/Spinner.svelte';
  import { isDesktop } from '#lib/state/page-state.svelte.js';
  import { getPalettesFromProjects } from '#lib/utils/color-utils.js';
  import {
    fetchPaletteGallery,
    recordPageView,
  } from '#lib/utils/gallery-utils.js';
  import SortSelectMenu from '#lib/components/SortSelectMenu.svelte';
  import { EarthIcon, PlusIcon, XIcon } from '@lucide/svelte';
  import { onMount, untrack } from 'svelte';

  interface Props {
    updateGauge?: any;
  }

  let { updateGauge = null }: Props = $props();

  const id = $props.id();
  const searchId = `${id}-search`;
  const panelId = `${id}-filters`;

  const yarnChip = $derived(
    yarnChipLabel(
      galleryPalettesState.filteredBrandId,
      galleryPalettesState.filteredYarnId,
      galleryPalettesState.palettesContainOnlyFilteredYarn,
    ),
  );
  // Open while a filter is on, e.g. coming back to this tab
  let filtersOpen = $state(untrack(() => !!yarnChip));
  let filtersButton = $state<FiltersButton>();

  let first = 40;
  let loading = $state(true);
  let projectsList = $state();
  let isLoadingMore = $state(false);

  let searchTimeout: any;

  function debouncedSearch() {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(async () => {
      galleryPalettesState.projects = [];
      galleryPalettesState.palettes = [];
      loading = true;
      const yarnSearch = galleryPalettesState.getYarnSearch({
        brandId: galleryPalettesState.filteredBrandId,
        yarnId: galleryPalettesState.filteredYarnId,
      });

      let results = await fetchPaletteGallery({
        search: galleryPalettesState.search,
        order: galleryPalettesState.orderBy,
        yarn: yarnSearch,
      });

      galleryPalettesState.gallery.pageInfo = results.pageInfo;
      galleryPalettesState.projects = results.edges.flatMap(
        (item) => item.node,
      );
      galleryPalettesState.palettes = getPalettesFromProjects({
        projects: galleryPalettesState.projects,
        selectedBrandId: galleryPalettesState.filteredBrandId,
        selectedYarnId: galleryPalettesState.filteredYarnId,
        palettesContainOnlyFilteredYarn:
          galleryPalettesState.palettesContainOnlyFilteredYarn,
      });
      loading = false;
    }, 500);
  }

  onMount(async () => {
    if (!galleryPalettesState.projects.length) {
      loading = true;
      let results = await fetchPaletteGallery({
        first,
        after: endCursor,
        search: galleryPalettesState.search,
        order: galleryPalettesState.orderBy,
      });
      galleryPalettesState.gallery.pageInfo = results.pageInfo;
      galleryPalettesState.projects.push(
        ...results.edges.flatMap((item) => item.node),
      );
      galleryPalettesState.projects = galleryPalettesState.projects;
      galleryPalettesState.palettes = getPalettesFromProjects({
        projects: galleryPalettesState.projects,
        selectedBrandId: galleryPalettesState.filteredBrandId,
        selectedYarnId: galleryPalettesState.filteredYarnId,
        palettesContainOnlyFilteredYarn:
          galleryPalettesState.palettesContainOnlyFilteredYarn,
      });
      loading = false;
    } else loading = false;
  });

  let showSearchReset = $derived(!!galleryPalettesState.search.length);

  let hasNextPage = $derived(
    galleryPalettesState.gallery?.pageInfo?.hasNextPage,
  );
  let endCursor = $derived(galleryPalettesState.gallery?.pageInfo?.endCursor);
</script>

<div class="flex flex-col gap-2 px-2 pb-2">
  <div class="label w-full text-left">
    <label class="label-text" for={searchId}>Search</label>
    <div class={[FIELD_GROUP, 'grid-cols-[auto_1fr_auto]']}>
      <span class="label label-text" aria-hidden="true">
        <EarthIcon />
      </span>
      <input
        id={searchId}
        type="text"
        class="input w-full truncate"
        autocomplete="off"
        placeholder="e.g., Kansas, 2003"
        bind:value={galleryPalettesState.search}
        oninput={debouncedSearch}
      />

      {#if showSearchReset}
        <button
          type="button"
          class="btn hover:preset-tonal-surface"
          title="Clear Search"
          aria-label="Clear Search"
          onclick={() => {
            galleryPalettesState.search = '';
            debouncedSearch();
          }}
        >
          <XIcon />
        </button>
      {/if}
    </div>
  </div>

  <div class="my-2 flex flex-wrap items-center justify-center gap-2">
    <SortSelectMenu
      options={[{ value: 'DESC', label: 'Newest' }]}
      current="DESC"
      disabled={loading}
      onsort={() => {}}
      reversed={galleryPalettesState.orderBy === 'ASC'}
      onreverse={(reversed) => {
        galleryPalettesState.orderBy = reversed ? 'ASC' : 'DESC';
        debouncedSearch();
      }}
    />
    <FiltersButton
      bind:this={filtersButton}
      bind:open={filtersOpen}
      count={yarnChip ? 1 : 0}
      controls={panelId}
    />
  </div>

  <div id={panelId} hidden={!filtersOpen} class="w-full text-left">
    <SelectYarn
      preselectDefaultYarn={false}
      disabled={loading}
      bind:selectedBrandId={galleryPalettesState.filteredBrandId}
      bind:selectedYarnId={galleryPalettesState.filteredYarnId}
      onselectautocomplete={debouncedSearch}
      bind:only={galleryPalettesState.palettesContainOnlyFilteredYarn}
      ononlychange={debouncedSearch}
    />
  </div>

  {#if !filtersOpen}
    <FilterChips
      chips={yarnChip
        ? [
            {
              label: yarnChip,
              remove: () => {
                galleryPalettesState.filteredBrandId = '';
                galleryPalettesState.filteredYarnId = '';
                galleryPalettesState.palettesContainOnlyFilteredYarn = false;
              },
            },
          ]
        : []}
      disabled={loading}
      onremove={() => {
        debouncedSearch();
        filtersButton?.focus();
      }}
    />
  {/if}
</div>
<div class="flex flex-col items-center px-2" bind:this={projectsList}>
  {#if loading && !galleryPalettesState.palettes.length}
    <div class="my-1"></div>
    <PlaceholderPalettes items={20} maxWFull={true} />
  {:else}
    <div class="my-2 flex w-full flex-col items-start justify-start gap-4">
      {#each galleryPalettesState.palettes as palette}
        <GalleryPaletteCard
          {palette}
          mode="use"
          onclick={() => {
            recordPageView(palette.postId);
            updateGauge({
              _colors: palette.colors,
              _schemeId: 'Custom',
            });
          }}
        />
      {/each}
    </div>
  {/if}
  {#if !galleryPalettesState.palettes.length && !loading}
    <p class="my-8 text-center">No results. Try changing the filters above.</p>
  {/if}

  {#if galleryPalettesState.palettes.length && hasNextPage}
    {#if isLoadingMore}
      <div class="flex h-28 items-center">
        <Spinner />
      </div>
    {/if}
    <button
      class="btn preset-filled m-auto my-4 flex"
      disabled={!hasNextPage || isLoadingMore}
      onclick={async () => {
        isLoadingMore = true;
        if (isDesktop.current) loading = true;
        const yarnSearch = galleryPalettesState.getYarnSearch({
          brandId: galleryPalettesState.filteredBrandId,
          yarnId: galleryPalettesState.filteredYarnId,
        });
        let results = await fetchPaletteGallery({
          first,
          after: endCursor,
          search: galleryPalettesState.search,
          order: galleryPalettesState.orderBy,
          yarn: yarnSearch,
        });
        galleryPalettesState.gallery.pageInfo = results.pageInfo;
        galleryPalettesState.projects.push(
          ...results.edges.flatMap((item) => item.node),
        );
        galleryPalettesState.projects = galleryPalettesState.projects;
        galleryPalettesState.palettes = getPalettesFromProjects({
          projects: galleryPalettesState.projects,
          selectedBrandId: galleryPalettesState.filteredBrandId,
          selectedYarnId: galleryPalettesState.filteredYarnId,
          palettesContainOnlyFilteredYarn:
            galleryPalettesState.palettesContainOnlyFilteredYarn,
        });
        loading = false;
        isLoadingMore = false;
      }}
    >
      <PlusIcon />
      Load More
    </button>
  {/if}
</div>

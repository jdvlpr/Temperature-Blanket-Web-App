<!-- Copyright (c) 2024, Thomas (https://github.com/jdvlpr)

This file is part of Temperature-Blanket-Web-App.

Temperature-Blanket-Web-App is free software: you can redistribute it and/or modify it
under the terms of the GNU General Public License as published by the Free Software Foundation, 
either version 3 of the License, or (at your option) any later version.

Temperature-Blanket-Web-App is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; 
without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. 
See the GNU General Public License for more details.

You should have received a copy of the GNU General Public License along with Temperature-Blanket-Web-App. 
If not, see <https://www.gnu.org/licenses/>. -->

<script module>
  class GalleryPalettesState {
    search = $state('');
    filteredBrandId = $state('');
    filteredYarnId = $state('');
    palettesContainOnlyFilteredYarn = $state(false);
    orderBy = $state('DESC');
    projects = $state([]);
    palettes = $state([]);
    gallery = $state({});

    getYarnSearch = ({ brandId, yarnId }) => {
      if (brandId && yarnId) return `${brandId}-${yarnId}`;
      else if (brandId) return brandId;
      else if (yarnId) return yarnId;
      return '';
    };
  }
  export const galleryPalettesState = new GalleryPalettesState();
</script>

<script lang="ts">
  import ToggleSwitch from '$lib/components/buttons/ToggleSwitch.svelte';
  import ColorPalette from '$lib/components/ColorPalette.svelte';
  import Expand from '$lib/components/Expand.svelte';
  import PlaceholderPalettes from '$lib/components/PlaceholderPalettes.svelte';
  import SelectYarn from '$lib/components/SelectYarn.svelte';
  import Spinner from '$lib/components/Spinner.svelte';
  import { ICONS } from '$lib/constants';
  import { isDesktop } from '$lib/state';
  import {
    fetchProjects,
    getPalettesFromProjects,
    recordPageView,
  } from '$lib/utils';
  import {
    ArrowUpDownIcon,
    ChevronRightIcon,
    PlusIcon,
    SearchIcon,
    XIcon,
  } from '@lucide/svelte';
  import { onMount } from 'svelte';
  import { slide } from 'svelte/transition';

  interface Props {
    updateGauge?: any;
  }

  let { updateGauge = null }: Props = $props();

  let filtersExpanded = $state(true);

  let first = 40;
  let loading = $state(true);
  let projectsList = $state();
  let isLoadingMore = $state(false);

  onMount(async () => {
    if (!galleryPalettesState.projects.length) {
      loading = true;
      let results = await fetchProjects({
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

<div class=" flex flex-wrap items-end justify-center gap-2 pb-2 text-center">
  <Expand bind:isExpanded={filtersExpanded} label="{ICONS.filter} Filters"
  ></Expand>

  {#if filtersExpanded}
    <div
      class="grid w-full grid-cols-12 items-end justify-center gap-4 px-2"
      transition:slide
    >
      <div class="col-span-12 w-full md:col-span-5">
        <SelectYarn
          preselectDefaultYarn={false}
          disabled={loading}
          bind:selectedBrandId={galleryPalettesState.filteredBrandId}
          bind:selectedYarnId={galleryPalettesState.filteredYarnId}
          context="modal"
        />
      </div>

      {#if galleryPalettesState.filteredBrandId || galleryPalettesState.filteredYarnId}
        <div
          class="relative top-[2px] col-span-12 flex w-full flex-col items-start gap-0 text-left md:col-span-4"
        >
          <ToggleSwitch
            disabled={loading}
            bind:checked={galleryPalettesState.palettesContainOnlyFilteredYarn}
            label="Only This {galleryPalettesState.filteredBrandId &&
            galleryPalettesState.filteredYarnId
              ? 'Yarn'
              : 'Brand'}"
            details="All colorways in palette must be this {galleryPalettesState.filteredBrandId &&
            galleryPalettesState.filteredYarnId
              ? 'yarn'
              : 'brand'}"
          />
        </div>
      {/if}

      <div
        class="col-span-12 flex w-full flex-col justify-start gap-1 md:col-span-3"
      >
        <span class="flex items-center gap-1">
          <SearchIcon class="size-4" />
          Search Projects
        </span>
        <div class="input-group grid-cols-[1fr_auto]">
          <input
            type="text"
            class="ig-input w-full truncate"
            autocomplete="off"
            disabled={loading}
            placeholder="e.g., Kansas, 2003"
            bind:value={galleryPalettesState.search}
          />

          {#if showSearchReset}
            <button
              disabled={loading}
              class="ig-btn hover:preset-tonal"
              title="Reset Search"
              onclick={() => {
                galleryPalettesState.search = '';
              }}
            >
              <XIcon />
            </button>
          {/if}
        </div>
      </div>

      <label class="label col-span-6 w-full md:col-span-2">
        <span class="flex items-center gap-1">
          <ArrowUpDownIcon class="size-4" />
          Order By
        </span>
        <select
          class="select truncate"
          bind:value={galleryPalettesState.orderBy}
          disabled={loading}
        >
          <option value="DESC" selected>Newest First</option>
          <option value="ASC">Oldest First</option>
        </select>
      </label>

      <div
        class="col-span-12 flex w-full justify-center md:col-span-2 {galleryPalettesState.filteredBrandId ||
        galleryPalettesState.filteredYarnId
          ? 'md:col-start-11'
          : ''}"
      >
        <button
          disabled={loading}
          class="btn preset-filled flex w-full items-center"
          onclick={async () => {
            projectsList.scrollIntoView({
              behavior: 'smooth',
              block: 'start',
            });
            galleryPalettesState.projects = [];
            galleryPalettesState.palettes = [];
            loading = true;
            const yarnSearch = galleryPalettesState.getYarnSearch({
              brandId: galleryPalettesState.filteredBrandId,
              yarnId: galleryPalettesState.filteredYarnId,
            });

            let results = await fetchProjects({
              search: galleryPalettesState.search,
              order: galleryPalettesState.orderBy,
              yarn: yarnSearch,
            });

            if (galleryPalettesState.search) {
              galleryPalettesState.gallery.pageInfo = results.pageInfo;
              galleryPalettesState.projects = results.edges.flatMap(
                (item) => item.node,
              );
            } else {
              galleryPalettesState.gallery.pageInfo = results.pageInfo;
              galleryPalettesState.projects.push(
                ...results.edges.flatMap((item) => item.node),
              );
              galleryPalettesState.projects = galleryPalettesState.projects;
            }
            galleryPalettesState.palettes = getPalettesFromProjects({
              projects: galleryPalettesState.projects,
              selectedBrandId: galleryPalettesState.filteredBrandId,
              selectedYarnId: galleryPalettesState.filteredYarnId,
              palettesContainOnlyFilteredYarn:
                galleryPalettesState.palettesContainOnlyFilteredYarn,
            });
            loading = false;
          }}
        >
          Search
          <ChevronRightIcon />
        </button>
      </div>
    </div>
  {/if}
</div>
<div class="flex flex-col items-center px-2" bind:this={projectsList}>
  {#if loading && !galleryPalettesState.palettes.length}
    <div class="my-1"></div>
    <PlaceholderPalettes items={20} maxWFull={true} />
  {:else}
    <div class="my-2 flex w-full flex-col items-start justify-start gap-4">
      {#each galleryPalettesState.palettes as { colors, schemeName, projectId }}
        <button
          type="button"
          class="w-full cursor-pointer"
          onclick={() => {
            recordPageView(projectId);
            updateGauge({
              _colors: colors,
              _schemeId: 'Custom',
            });
          }}
          title="Use This Palette"
        >
          <ColorPalette {colors} {schemeName} />
        </button>
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
        let results = await fetchProjects({
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

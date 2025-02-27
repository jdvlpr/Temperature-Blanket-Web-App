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

<div class=" pb-2 text-center flex flex-wrap justify-center items-end gap-2">
  <Expand
    bind:isExpanded={filtersExpanded}
    more="Show Filters"
    less="Hide Filters"
    iconLess={ICONS.filter}
    iconMore={ICONS.filter}
  ></Expand>

  {#if filtersExpanded}
    <div
      class="grid grid-cols-12 justify-center items-end gap-4 px-2 w-full"
      transition:slide
    >
      <div class="w-full col-span-12 md:col-span-5">
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
          class="w-full col-span-12 text-left md:col-span-4 flex flex-col items-start gap-0 top-[2px] relative"
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
        class="flex flex-col w-full justify-start col-span-12 md:col-span-3 gap-1"
      >
        <span class="flex items-center label gap-1">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke-width="1.5"
            stroke="currentColor"
            class="w-4 h-4 mr-1"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
            />
          </svg>
          Search Projects
        </span>
        <div class="input-group grid-cols-[1fr_auto]">
          <input
            type="text"
            class="truncate ig-input w-full"
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
              {@html ICONS.xMark}
            </button>
          {/if}
        </div>
      </div>

      <label class="label w-full col-span-6 md:col-span-2">
        <span class="flex items-center">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke-width="1.5"
            stroke="currentColor"
            class="w-4 h-4 mr-1"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              d="M3 7.5L7.5 3m0 0L12 7.5M7.5 3v13.5m13.5 0L16.5 21m0 0L12 16.5m4.5 4.5V7.5"
            />
          </svg>
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
        class="w-full justify-center flex col-span-12 md:col-span-2 {galleryPalettesState.filteredBrandId ||
        galleryPalettesState.filteredYarnId
          ? 'md:col-start-11'
          : ''}"
      >
        <button
          disabled={loading}
          class="btn preset-filled-primary-500 flex items-center font-bold w-full gap-1"
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
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke-width="1.5"
            stroke="currentColor"
            class="size-5 shrink-0"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              d="M4.5 12h15m0 0l-6.75-6.75M19.5 12l-6.75 6.75"
            />
          </svg>
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
    <div class="gap-4 my-2 flex flex-col items-start justify-start w-full">
      {#each galleryPalettesState.palettes as { colors, schemeName, projectId }}
        <button
          type="button"
          class="cursor-pointer w-full"
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
    <p class="text-center my-8">No results. Try changing the filters above.</p>
  {/if}

  {#if galleryPalettesState.palettes.length && hasNextPage}
    {#if isLoadingMore}
      <div class="h-28 flex items-center">
        <Spinner />
      </div>
    {/if}
    <button
      class="btn preset-filled-primary-500 flex m-auto my-4"
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
      <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        stroke-width="1.5"
        stroke="currentColor"
        class="w-6 h-6"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          d="M12 4.5v15m7.5-7.5h-15"
        />
      </svg>
      <span>Load More</span>
    </button>
  {/if}
</div>

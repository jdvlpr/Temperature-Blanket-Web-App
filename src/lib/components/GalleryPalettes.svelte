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
  export let search = writable('');
  export let filteredBrandId = writable('');
  export let filteredYarnId = writable('');
  export let palettesContainOnlyFilteredYarn = writable(false);
  export let orderBy = writable('DESC');
  export let projects = writable([]);
  export let palettes = writable([]);
  export let gallery = writable({});

  export const getYarnSearch = ({ brandId, yarnId }) => {
    if (brandId && yarnId) return `${brandId}-${yarnId}`;
    else if (brandId) return brandId;
    else if (yarnId) return yarnId;
    return '';
  };
</script>

<script lang="ts">
  import ToggleSwitch from '$lib/components/buttons/ToggleSwitch.svelte';
  import ColorPalette from '$lib/components/ColorPalette.svelte';
  import Expand from '$lib/components/Expand.svelte';
  import PlaceholderPalettes from '$lib/components/PlaceholderPalettes.svelte';
  import SelectYarn from '$lib/components/SelectYarn.svelte';
  import Spinner from '$lib/components/Spinner.svelte';
  import { ICONS } from '$lib/constants';
  import { isDesktop } from '$lib/stores';
  import {
    fetchProjects,
    getPalettesFromProjects,
    recordPageView,
  } from '$lib/utils';
  import { getModalStore } from '@skeletonlabs/skeleton';
  import { onMount } from 'svelte';
  import { writable } from 'svelte/store';
  import { slide } from 'svelte/transition';

  interface Props {
    updateGauge?: any;
  }

  let { updateGauge = null }: Props = $props();

  const modalStore = getModalStore();

  let filtersExpanded = $state(false);

  let first = 40;
  let loading = $state(true);
  let projectsList = $state();
  let isLoadingMore = $state(false);

  onMount(async () => {
    if (!$projects.length) {
      loading = true;
      let results = await fetchProjects({
        first,
        after: endCursor,
        search: $search,
        order: $orderBy,
      });
      $gallery.pageInfo = results.pageInfo;
      $projects.push(...results.edges.flatMap((item) => item.node));
      $projects = $projects;
      $palettes = getPalettesFromProjects({
        projects: $projects,
        selectedBrandId: $filteredBrandId,
        selectedYarnId: $filteredYarnId,
        palettesContainOnlyFilteredYarn: $palettesContainOnlyFilteredYarn,
      });
      loading = false;
    } else loading = false;
  });

  let showSearchReset = $derived(!!$search.length);

  let hasNextPage = $derived($gallery?.pageInfo?.hasNextPage);
  let endCursor = $derived($gallery?.pageInfo?.endCursor);
</script>

<div
  class="bg-surface-100-800-token text-token pb-2 text-center flex flex-wrap justify-center items-end gap-2"
>
  <Expand
    bind:isExpanded={filtersExpanded}
    more="Show Filters"
    less="Hide Filters"
    iconLess={ICONS.filter}
    iconMore={ICONS.filter}
  ></Expand>

  {#if filtersExpanded}
    <div
      class="grid grid-cols-12 justify-center items-end gap-4 bg-surface-100-800-token px-2 w-full"
      transition:slide
    >
      <div class="w-full col-span-12 md:col-span-5">
        <SelectYarn
          preselectDefaultYarn={false}
          disabled={loading}
          bind:selectedBrandId={$filteredBrandId}
          bind:selectedYarnId={$filteredYarnId}
          context="modal"
        />
      </div>

      {#if $filteredBrandId || $filteredYarnId}
        <div
          class="w-full col-span-12 text-left md:col-span-4 flex flex-col items-start gap-0 top-[2px] relative"
        >
          <ToggleSwitch
            disabled={loading}
            bind:checked={$palettesContainOnlyFilteredYarn}
            label="Only This {$filteredBrandId && $filteredYarnId
              ? 'Yarn'
              : 'Brand'}"
            details="All colorways in palette must be this {$filteredBrandId &&
            $filteredYarnId
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
        <div class="input-group input-group-divider grid-cols-[1fr_auto]">
          <input
            type="text"
            class="truncate w-full"
            autocomplete="off"
            disabled={loading}
            placeholder="e.g., Kansas, 2003"
            bind:value={$search}
          />

          {#if showSearchReset}
            <button
              disabled={loading}
              class=""
              title="Reset Search"
              onclick={() => {
                $search = '';
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
          bind:value={$orderBy}
          disabled={loading}
        >
          <option value="DESC" selected>Newest First</option>
          <option value="ASC">Oldest First</option>
        </select>
      </label>

      <div
        class="w-full justify-center flex col-span-12 md:col-span-2 {$filteredBrandId ||
        $filteredYarnId
          ? 'md:col-start-11'
          : ''}"
      >
        <button
          disabled={loading}
          class="btn variant-filled-primary flex items-center font-bold w-full"
          onclick={async () => {
            projectsList.scrollIntoView({
              behavior: 'smooth',
              block: 'start',
            });
            $projects = [];
            $palettes = [];
            loading = true;
            const yarnSearch = getYarnSearch({
              brandId: $filteredBrandId,
              yarnId: $filteredYarnId,
            });

            let results = await fetchProjects({
              search: $search,
              order: $orderBy,
              yarn: yarnSearch,
            });

            if ($search) {
              $gallery.pageInfo = results.pageInfo;
              $projects = results.edges.flatMap((item) => item.node);
            } else {
              $gallery.pageInfo = results.pageInfo;
              $projects.push(...results.edges.flatMap((item) => item.node));
              $projects = $projects;
            }
            $palettes = getPalettesFromProjects({
              projects: $projects,
              selectedBrandId: $filteredBrandId,
              selectedYarnId: $filteredYarnId,
              palettesContainOnlyFilteredYarn: $palettesContainOnlyFilteredYarn,
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
            class="w-6 h-6"
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
  {#if loading && !$palettes.length}
    <div class="my-1"></div>
    <PlaceholderPalettes items={20} maxWFull={true} />
  {:else}
    <div class="gap-4 my-2 flex flex-col items-start justify-start w-full">
      {#each $palettes as { colors, schemeName, projectId }}
        <button
          type="button"
          class="cursor-pointer w-full"
          onclick={() => {
            recordPageView(projectId);
            updateGauge({
              _colors: colors,
              _schemeId: 'Custom',
            });
            if ($modalStore[0]) modalStore.close();
          }}
          title="Use This Palette"
        >
          <ColorPalette {colors} {schemeName} />
        </button>
      {/each}
    </div>
  {/if}
  {#if !$palettes.length && !loading}
    <p class="text-center my-8">No results. Try changing the filters above.</p>
  {/if}

  {#if $palettes.length && hasNextPage}
    {#if isLoadingMore}
      <div class="h-28 flex items-center"><Spinner /></div>
    {/if}
    <button
      class="btn variant-filled-primary flex m-auto my-4"
      disabled={!hasNextPage || isLoadingMore}
      onclick={async () => {
        isLoadingMore = true;
        if (isDesktop.current) loading = true;
        const yarnSearch = getYarnSearch({
          brandId: $filteredBrandId,
          yarnId: $filteredYarnId,
        });
        let results = await fetchProjects({
          first,
          after: endCursor,
          search: $search,
          order: $orderBy,
          yarn: yarnSearch,
        });
        $gallery.pageInfo = results.pageInfo;
        $projects.push(...results.edges.flatMap((item) => item.node));
        $projects = $projects;
        $palettes = getPalettesFromProjects({
          projects: $projects,
          selectedBrandId: $filteredBrandId,
          selectedYarnId: $filteredYarnId,
          palettesContainOnlyFilteredYarn: $palettesContainOnlyFilteredYarn,
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

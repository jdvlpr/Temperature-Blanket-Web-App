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

<script lang="ts">
  import { PUBLIC_WORDPRESS_BASE_URL } from '$env/static/public';
  import SelectYarn from '$lib/components/SelectYarn.svelte';
  import ToTopButton from '$lib/components/buttons/ToTopButton.svelte';
  import ToggleSwitch from '$lib/components/buttons/ToggleSwitch.svelte';
  import ViewToggleBindable from '$lib/components/buttons/ViewToggleBindable.svelte';
  import { previews } from '$lib/state';
  import {
    fetchPopularProjects,
    fetchProjects,
    getColorsFromInput,
    getTitleFromLocationsMeta,
  } from '$lib/utils';
  import {
    ArrowUpDownIcon,
    ChevronRightIcon,
    ClockIcon,
    EarthIcon,
    Grid3x3,
    XIcon
  } from '@lucide/svelte';
  import { onMount } from 'svelte';
  import { galleryState } from './state.svelte';

  let first = 40;
  let loading = $state(true);
  let showScrollToTopButton = $state();
  let scrollContainer = $state();
  let projectsList = $state();
  let totalProjects = $state(0);
  let featuredProjectsEl = $state();
  let layout = $state('grid');

  onMount(async () => {
    if (!galleryState.projects.length) {
      let results = await fetchProjects({
        first,
        after: endCursor,
        search: galleryState.search,
        order: galleryState.orderBy,
        pattern: galleryState.filteredPatternType,
      });
      galleryState.gallery.pageInfo = results.pageInfo;
      galleryState.projects.push(...results.edges.flatMap((item) => item.node));
      galleryState.projects = galleryState.projects;
      galleryState.displayedProjects = getFilteredProjects();
      loading = false;
    }

    if (!galleryState.popularProjects.length) {
      await fetchPopularProjectsWrapper();
    }

    loading = false;
    const scrollObserver = new IntersectionObserver(
      (entries, observer) => {
        entries.forEach((entry) => {
          showScrollToTopButton =
            !entry.isIntersecting && entry.boundingClientRect.top < 0;
        });
      },
      { threshold: 0 },
    );

    if (typeof scrollContainer !== 'undefined')
      scrollObserver.observe(scrollContainer);

    const url = `${PUBLIC_WORDPRESS_BASE_URL}/wp-json/wp/v2/projects?_=${new Date().getTime()}`;
    const response = await fetch(url);
    const headers = response.headers;
    totalProjects =
      headers.get('x-wp-total') !== null
        ? +headers.get('x-wp-total')
        : undefined;
    totalProjects =
      totalProjects !== undefined && typeof totalProjects === 'number'
        ? totalProjects.toLocaleString()
        : undefined;
  });

  let showSearchReset = $derived(!!galleryState.search.length);

  let hasNextPage = $derived(galleryState.gallery?.pageInfo?.hasNextPage);
  let endCursor = $derived(galleryState.gallery?.pageInfo?.endCursor);

  async function fetchPopularProjectsWrapper() {
    let promisePopularProjects = await fetchPopularProjects({
      months: galleryState.timePeriod,
      limit: 5,
    });
    galleryState.popularProjects = promisePopularProjects;
  }

  function getFilteredProjects() {
    return galleryState.projects.filter((project) => {
      if (!galleryState.filteredBrandId && !galleryState.filteredYarnId)
        return true;
      const yarnURLs = JSON.parse(project?.yarnUrls);
      if (!galleryState.palettesContainOnlyFilteredYarn)
        return yarnURLs?.some((yarnURL) => {
          let colors = getColorsFromInput({
            string: yarnURL,
          });
          return colors?.some((color) => {
            if (galleryState.filteredBrandId && galleryState.filteredYarnId)
              return (
                color?.brandId === galleryState.filteredBrandId &&
                color?.yarnId === galleryState.filteredYarnId
              );
            return color?.brandId === galleryState.filteredBrandId;
          });
        });
      else
        return yarnURLs?.every((yarnURL) => {
          let colors = getColorsFromInput({
            string: yarnURL,
          });
          return colors?.every((color) => {
            if (galleryState.filteredBrandId && galleryState.filteredYarnId)
              return (
                color?.brandId === galleryState.filteredBrandId &&
                color?.yarnId === galleryState.filteredYarnId
              );
            return color?.brandId === galleryState.filteredBrandId;
          });
        });
    });
  }

  async function handleSearch(query?: string) {
    if (query !== undefined) {
      galleryState.search = query;
    }

    projectsList.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    });

    galleryState.projects = [];
    galleryState.displayedProjects = [];
    loading = true;

    const yarnSearch = galleryState.getYarnSearch({
      brandId: galleryState.filteredBrandId,
      yarnId: galleryState.filteredYarnId,
    });

    try {
      let results = await fetchProjects({
        search: galleryState.search,
        order: galleryState.orderBy,
        yarn: yarnSearch,
        pattern: galleryState.filteredPatternType,
      });

      galleryState.gallery.pageInfo = results.pageInfo;
      if (galleryState.search) {
        galleryState.projects = results.edges.flatMap((item) => item.node);
      } else {
        galleryState.projects.push(...results.edges.flatMap((item) => item.node));
        galleryState.projects = galleryState.projects;
      }
      galleryState.displayedProjects = getFilteredProjects();
    } catch (e) {
      console.error('Search failed:', e);
    } finally {
      loading = false;
    }
  }
</script>

<div class="flex flex-col justify-center gap-8">
  <div class="inline-grid gap-2 text-center">
    <div class="my-2 flex flex-col items-center">
      <h2 class="h2 text-gradient">Featured Projects</h2>
      <label class="label ">
        <span class="label-text">Popular in the last</span>
        <div class="relative flex items-center w-fit">
          <ClockIcon class="pointer-events-none absolute left-2" />
          <select
            bind:value={galleryState.timePeriod}
            class="select mx-auto w-fit min-w-[100px] truncate pl-10"
            onchange={() => {
              galleryState.popularProjects = [];
              fetchPopularProjectsWrapper();
              featuredProjectsEl.scrollLeft = 0;
            }}
          >
            <option value={0.0357}>Day</option>
            <option value={0.25}>Week</option>
            <option value={1}>Month</option>
            <option value={12}>Year</option>
          </select>
        </div>
      </label>
    </div>

    <div
      class="mx-auto flex w-full snap-x snap-mandatory items-start gap-2 overflow-x-scroll"
      bind:this={featuredProjectsEl}
    >
      {#if !galleryState.popularProjects.length}

        {#each Array(5)}
          <div
            class="placeholder rounded-container bg-surface-100 dark:bg-surface-900 h-[324px] w-[245px] shrink-0 animate-pulse snap-center"
          ></div>
        {/each}
      {:else}
        {#each galleryState.popularProjects as { featured_image_src, id, meta }}
          {@const title = getTitleFromLocationsMeta(meta.locations)}
          <a
            href="/gallery/{id}"
            class="rounded-container group hover:preset-tonal-surface mx-auto flex min-h-[200px] max-w-[245px] shrink-0 snap-center flex-col flex-wrap items-center justify-start gap-1 p-2 text-center lg:max-w-[350px]"
          >
            <img
              src={featured_image_src}
              alt="Preview"
              class="max-h-64 max-w-[225px] lg:max-h-[600px] lg:max-w-[370px]"
            />
            <p class="line-clamp-4 text-xs">
              {@html title || ''}
            </p>
          </a>
        {/each}
      {/if}
    </div>
  </div>

  <div class=" flex flex-col gap-2 text-center">
    <div
      bind:this={scrollContainer}
      class="flex scroll-mt-[70px] flex-wrap items-end justify-center text-center"
    >
      <h2 class="h2 text-gradient">All Projects</h2>
      <div class="mb-2 flex w-full justify-center">
        {#if totalProjects === 0}
          <p class="animate-pulse text-xs">...</p>
        {:else if totalProjects !== undefined}
          <p class="text-xs">
            {totalProjects} total
          </p>
        {/if}
      </div>
      <div class="grid w-full grid-cols-12 items-end gap-4 px-4">
        <div class="col-span-12 w-full md:col-span-7">
          <SelectYarn
            preselectDefaultYarn={false}
            disabled={loading}
            bind:selectedBrandId={galleryState.filteredBrandId}
            bind:selectedYarnId={galleryState.filteredYarnId}
          />
        </div>

        {#if galleryState.filteredBrandId || galleryState.filteredYarnId}
          <div
            class="col-span-12 flex w-full flex-col items-start gap-1 text-left md:col-span-5"
          >
            <ToggleSwitch
              disabled={loading}
              bind:checked={galleryState.palettesContainOnlyFilteredYarn}
              label="Only This {galleryState.filteredBrandId &&
              galleryState.filteredYarnId
                ? 'Yarn'
                : 'Brand'}"
              details="All colorways in project must be this {galleryState.filteredBrandId &&
              galleryState.filteredYarnId
                ? 'yarn'
                : 'brand'}"
            />
          </div>
        {/if}

        <div class="label col-span-12 md:col-span-5">
          <span class="label-text">Search Projects</span>
          <div class="input-group grid-cols-[auto_1fr_auto]">
            <span class="ig-cell"><EarthIcon /></span>
            <input
              disabled={loading}
              type="text"
              class="ig-input w-full truncate"
              autocomplete="off"
              placeholder="e.g., Kansas, 2003"
              bind:value={galleryState.search}
            />

            {#if showSearchReset}
              <button
                disabled={loading}
                class="ig-btn hover:preset-tonal-surface"
                title="Reset Search"
                onclick={() => {
                  galleryState.search = '';
                }}
              >
                <XIcon />
              </button>
            {/if}
          </div>
        </div>

        <label class="label col-span-6 w-full md:col-span-3">
          <span class="label-text"> Pattern Type </span>
          <div class="relative flex items-center">
            <Grid3x3 class="pointer-events-none absolute left-2" />
            <select
              disabled={loading}
              class="select truncate pl-10"
              id="select-gallery-pattern-type"
              bind:value={galleryState.filteredPatternType}
            >
              <option value="">Any Pattern</option>
              {#each previews.all as { name, wpTagSlug }}
                <option value={wpTagSlug}>{name}</option>
              {/each}
            </select>
          </div>
        </label>

        <label class="label col-span-6 w-full md:col-span-3">
          <span class="label-text"> Order By </span>
          <div class="relative flex items-center">
            <ArrowUpDownIcon class="pointer-events-none absolute left-2" />
            <select
              class="select truncate pl-10"
              bind:value={galleryState.orderBy}
              disabled={loading}
            >
              <option value="DESC" selected>Newest First</option>
              <option value="ASC">Oldest First</option>
            </select>
            <div class="relative flex items-center"></div>
          </div></label
        >

        <div
          class="col-span-12 flex justify-center {galleryState.filteredBrandId ||
          galleryState.filteredYarnId
            ? 'md:col-span-4 md:col-start-5'
            : 'md:col-span-3 md:col-start-10'}"
        >
          <button
            disabled={loading}
            class="btn preset-filled flex w-full items-center"
            onclick={() => handleSearch()}
          >
            Search
            <ChevronRightIcon />
          </button>
        </div>
      </div>
    </div>
    <div
      class="flex scroll-mt-[58px] flex-col items-center lg:scroll-mt-[44px] min-h-[70vh]"
      bind:this={projectsList}
    >
      <div class="mx-auto my-2">
        <ViewToggleBindable bind:value={layout} />
      </div>

      <div
        class=" my-2 w-full gap-2 {layout === 'grid'
          ? 'grid grid-cols-2 items-start justify-center md:grid-cols-3 xl:grid-cols-4 '
          : 'flex flex-col items-start justify-start'}"
      >
        {#each galleryState.displayedProjects as { databaseId, featuredImage, locations }}
          {@const title = getTitleFromLocationsMeta(locations)}
          <a
            href="/gallery/{databaseId}"
            class="rounded-container group hover:preset-tonal-surface flex gap-1 p-2 text-center {layout ===
            'grid'
              ? 'flex-col items-center justify-center'
              : 'w-full flex-col items-center justify-start'}"
          >
            <img
              src={featuredImage?.node?.mediaDetails.sizes?.[0].sourceUrl ||
                featuredImage?.node?.mediaItemUrl}
              alt="Preview"
              class={layout === 'grid'
                ? 'max-w-[130px] sm:max-w-[210px] md:max-w-[215px]'
                : 'max-h-[900px] max-w-full'}
            />
            <p class="line-clamp-4 text-xs">
              {@html title || ''}
            </p>
          </a>
        {/each}
      </div>
      {#if !galleryState.displayedProjects.length && !loading}
        <p class="my-8 text-center">
          No results. Try changing the filters above.
        </p>
      {/if}
      {#if loading}
        <div
          class=" w-full gap-4 {layout === 'grid'
            ? 'grid grid-cols-2 items-start justify-center md:grid-cols-3 xl:grid-cols-4 '
            : 'flex flex-col items-start justify-start'}"
        >
          {#each Array(20)}
            <div
              class="placeholder card bg-surface-100 dark:bg-surface-900 rounded-container animate-pulse text-center {layout ===
              'grid'
                ? 'h-[350px] w-full'
                : 'h-[120px] w-full'}"
            ></div>
          {/each}
        </div>
      {:else if galleryState.displayedProjects.length && hasNextPage}
        <button
          class="btn preset-filled-primary-500 m-auto my-4 flex"
          disabled={!hasNextPage}
          onclick={async () => {
            loading = true;
            const yarnSearch = galleryState.getYarnSearch({
              brandId: galleryState.filteredBrandId,
              yarnId: galleryState.filteredYarnId,
            });
            let results = await fetchProjects({
              first,
              after: endCursor,
              search: galleryState.search,
              order: galleryState.orderBy,
              pattern: galleryState.filteredPatternType,
              yarn: yarnSearch,
            });
            galleryState.gallery.pageInfo = results.pageInfo;
            galleryState.projects.push(
              ...results.edges.flatMap((item) => item.node),
            );
            galleryState.projects = galleryState.projects;
            galleryState.displayedProjects = getFilteredProjects();
            loading = false;
          }}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke-width="1.5"
            stroke="currentColor"
            class="h-6 w-6"
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
  </div>
</div>

{#if showScrollToTopButton && galleryState.projects.length}
  <ToTopButton
    bottom="1rem"
    onClick={() => {
      scrollContainer.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });
    }}
  />
{/if}

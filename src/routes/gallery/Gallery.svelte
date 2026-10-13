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
  import { FIELD_GROUP, FIELD_ICON } from '#lib/constants/class-constants.js';
  import { PUBLIC_WORDPRESS_BASE_URL } from '$app/env/public';
  import SelectYarn from '#lib/components/SelectYarn.svelte';
  import ToTopButton from '#lib/components/buttons/ToTopButton.svelte';
  import ToggleSwitch from '#lib/components/buttons/ToggleSwitch.svelte';
  import SortSelectMenu from '#lib/components/SortSelectMenu.svelte';
  import ViewMenu from '#lib/components/buttons/ViewMenu.svelte';
  import { GALLERY_ORDERS } from '#lib/utils/gallery-utils.js';
  import { previews } from '#lib/state/preview-state.svelte.js';
  import {
    fetchPopularProjects,
    fetchProjects,
  } from '#lib/utils/gallery-utils.js';
  import { getColorsFromInput } from '#lib/utils/color-utils.js';
  import { getTitleFromLocationsMeta } from '#lib/utils/project-utils.svelte.js';
  import { decodeHtmlEntities } from '#lib/utils/string-utils.js';
  import GalleryProjectCard from '#lib/components/GalleryProjectCard.svelte';
  import { resolve } from '$app/paths';
  import { EarthIcon, Grid3x3, XIcon, PlusIcon } from '@lucide/svelte';
  import { onMount } from 'svelte';
  import PopularPeriodMenu from './PopularPeriodMenu.svelte';
  import { galleryFilters, galleryState } from './state.svelte';

  let first = 40;
  let loading = $state(true);
  let showScrollToTopButton = $state();
  let scrollContainer: HTMLDivElement | undefined = $state();
  let projectsList = $state();
  let totalProjects: number | string | undefined = $state(0);
  let featuredProjectsEl: HTMLDivElement | undefined = $state();

  onMount(async () => {
    // The first visit, or the filters changed on the other tab
    if (
      !galleryState.projects.length ||
      galleryState.loadedFor !== galleryFilters.key
    )
      await search();

    if (
      !galleryState.popularProjects.length ||
      galleryState.popularFor !== galleryFilters.timePeriod
    ) {
      galleryState.popularProjects = [];
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

    if (scrollContainer) scrollObserver.observe(scrollContainer);

    const url = `${PUBLIC_WORDPRESS_BASE_URL}/wp-json/wp/v2/projects?_=${new Date().getTime()}`;
    const response = await fetch(url);
    const headers = response.headers;
    const totalProjectsHeader = headers.get('x-wp-total');
    totalProjects =
      totalProjectsHeader !== null ? +totalProjectsHeader : undefined;
    totalProjects =
      totalProjects !== undefined && typeof totalProjects === 'number'
        ? totalProjects.toLocaleString()
        : undefined;
  });

  let showSearchReset = $derived(!!galleryState.search.length);

  let hasNextPage = $derived(galleryState.gallery?.pageInfo?.hasNextPage);
  let endCursor = $derived(galleryState.gallery?.pageInfo?.endCursor);

  async function fetchPopularProjectsWrapper() {
    const months = galleryFilters.timePeriod;
    let promisePopularProjects = await fetchPopularProjects({
      months,
      limit: 5,
    });
    galleryState.popularProjects = promisePopularProjects;
    galleryState.popularFor = months;
  }

  function getFilteredProjects() {
    return galleryState.projects.filter((project) => {
      if (!galleryState.filteredBrandId && !galleryState.filteredYarnId)
        return true;
      const yarnURLs = JSON.parse(project?.yarnUrls) as string[];

      if (!galleryState.palettesContainOnlyFilteredYarn)
        return yarnURLs?.some((yarnURL) => {
          let colors = getColorsFromInput({ string: yarnURL });

          return (
            colors &&
            colors.some((color) => {
              if (galleryState.filteredBrandId && galleryState.filteredYarnId)
                return (
                  color?.brandId === galleryState.filteredBrandId &&
                  color?.yarnId === galleryState.filteredYarnId
                );

              return color?.brandId === galleryState.filteredBrandId;
            })
          );
        });
      else
        return yarnURLs?.every((yarnURL) => {
          let colors = getColorsFromInput({ string: yarnURL });

          return (
            colors &&
            colors.every((color) => {
              if (galleryState.filteredBrandId && galleryState.filteredYarnId)
                return (
                  color?.brandId === galleryState.filteredBrandId &&
                  color?.yarnId === galleryState.filteredYarnId
                );

              return color?.brandId === galleryState.filteredBrandId;
            })
          );
        });
    });
  }

  let searchTimeout: any;

  function debouncedSearch() {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(search, 500);
  }

  async function search() {
    {
      galleryState.projects = [];
      galleryState.displayedProjects = [];
      loading = true;
      const loadedFor = galleryFilters.key;

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
          galleryState.projects.push(
            ...results.edges.flatMap((item) => item.node),
          );
          galleryState.projects = galleryState.projects;
        }
        galleryState.displayedProjects = getFilteredProjects();
        galleryState.loadedFor = loadedFor;
      } catch (e) {
        console.error('Search failed:', e);
      } finally {
        loading = false;
      }
    }
  }

  function clearFilters() {
    galleryFilters.clear();
    galleryState.filteredPatternType = '';
    search();
  }
</script>

<div class="flex flex-col justify-center gap-8">
  <div class="inline-grid gap-2 text-center">
    <div class="my-2 flex flex-col items-center">
      <h2 class="text-surface-700-300 text-xl font-semibold">
        Featured Projects
      </h2>
      <PopularPeriodMenu
        onchange={() => {
          galleryState.popularProjects = [];
          fetchPopularProjectsWrapper();
          if (featuredProjectsEl) featuredProjectsEl.scrollLeft = 0;
        }}
      />
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
        {#each galleryState.popularProjects as { featured_image_src, id, meta } (id)}
          <GalleryProjectCard
            href={resolve('/gallery/[id]', { id: String(id) })}
            image={featured_image_src}
            name={meta.project_name
              ? decodeHtmlEntities(meta.project_name)
              : null}
            placesHtml={getTitleFromLocationsMeta(meta.locations)}
            layout="row"
          />
        {/each}
      {/if}
    </div>
  </div>

  <div class="flex flex-col gap-2 px-2 text-center lg:px-0">
    <div
      bind:this={scrollContainer}
      class="flex scroll-mt-[70px] flex-wrap items-end justify-center text-center"
    >
      <h2 class="text-surface-700-300 text-xl font-semibold">All Projects</h2>
      <div class="mb-2 flex w-full justify-center">
        {#if totalProjects === 0}
          <p class="animate-pulse text-xs">...</p>
        {:else if totalProjects !== undefined}
          <p class="text-xs">
            {totalProjects} total
          </p>
        {/if}
      </div>
      <div class="grid w-full grid-cols-12 items-end gap-4">
        <div class="col-span-12 w-full md:col-span-7">
          <SelectYarn
            preselectDefaultYarn={false}
            disabled={loading}
            bind:selectedBrandId={galleryState.filteredBrandId}
            bind:selectedYarnId={galleryState.filteredYarnId}
            onselectautocomplete={debouncedSearch}
          />
        </div>

        {#if galleryState.filteredBrandId || galleryState.filteredYarnId}
          <div
            class="col-span-12 flex w-full flex-col items-start gap-1 text-left md:col-span-5"
          >
            <ToggleSwitch
              disabled={loading}
              bind:checked={galleryState.palettesContainOnlyFilteredYarn}
              onchange={debouncedSearch}
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
          <div class={[FIELD_GROUP, 'grid-cols-[auto_1fr_auto]']}>
            <span class="label label-text"><EarthIcon /></span>
            <input
              type="text"
              class="input w-full truncate"
              autocomplete="off"
              placeholder="e.g., Kansas, 2003"
              bind:value={galleryState.search}
              oninput={debouncedSearch}
            />

            {#if showSearchReset}
              <button
                class="btn hover:preset-tonal-surface"
                title="Reset Search"
                onclick={() => {
                  galleryState.search = '';
                  debouncedSearch();
                }}
              >
                <XIcon />
              </button>
            {/if}
          </div>
        </div>

        <label class="label col-span-12 w-full md:col-span-7">
          <span class="label-text"> Pattern Type </span>
          <div class="relative flex items-center">
            <Grid3x3 class={FIELD_ICON} />
            <select
              disabled={loading}
              class="select truncate pl-11"
              id="select-gallery-pattern-type"
              bind:value={galleryState.filteredPatternType}
              onchange={debouncedSearch}
            >
              <option value="">Any Pattern</option>
              {#each previews.all as { name, wpTagSlug }}
                <option value={wpTagSlug}>{name}</option>
              {/each}
            </select>
          </div>
        </label>
      </div>
    </div>
    <div
      class="flex min-h-[70vh] scroll-mt-[58px] flex-col items-center lg:scroll-mt-[44px]"
      bind:this={projectsList}
    >
      <div
        class="mx-auto my-2 flex flex-wrap items-center justify-center gap-2"
      >
        <SortSelectMenu
          options={GALLERY_ORDERS}
          current={galleryState.orderBy}
          disabled={loading}
          onsort={(order) => {
            galleryState.orderBy = order;
            debouncedSearch();
          }}
        />
        <ViewMenu bind:value={galleryState.layout} />
      </div>

      <div
        class=" my-2 w-full gap-2 {galleryState.layout === 'grid'
          ? 'grid grid-cols-2 items-start justify-center md:grid-cols-3 xl:grid-cols-4 '
          : 'flex flex-col items-start justify-start'}"
      >
        {#each galleryState.displayedProjects as { databaseId, featuredImage, locations, projectName } (databaseId)}
          <GalleryProjectCard
            href={resolve('/gallery/[id]', { id: String(databaseId) })}
            image={featuredImage?.node?.mediaDetails.sizes?.[0]?.sourceUrl ||
              featuredImage?.node?.mediaItemUrl}
            name={projectName ? decodeHtmlEntities(projectName) : null}
            placesHtml={getTitleFromLocationsMeta(locations)}
            layout={galleryState.layout}
          />
        {/each}
      </div>
      {#if !galleryState.displayedProjects.length && !loading}
        <div class="my-8 flex flex-col items-center gap-2 text-center">
          <p>No projects match these filters.</p>
          {#if galleryFilters.active || galleryState.filteredPatternType}
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
      {/if}
      {#if loading}
        <div
          class=" w-full gap-4 {galleryState.layout === 'grid'
            ? 'grid grid-cols-2 items-start justify-center md:grid-cols-3 xl:grid-cols-4 '
            : 'flex flex-col items-start justify-start'}"
        >
          {#each Array(20)}
            <div
              class="placeholder card bg-surface-100 dark:bg-surface-900 rounded-container animate-pulse text-center {galleryState.layout ===
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
          <PlusIcon />
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
      scrollContainer?.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });
    }}
  />
{/if}

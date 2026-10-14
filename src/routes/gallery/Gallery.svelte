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
  import ToTopButton from '#lib/components/buttons/ToTopButton.svelte';
  import CollectionToolbar from '#lib/components/CollectionToolbar.svelte';
  import { GALLERY_ORDERS } from '#lib/utils/gallery-utils.js';
  import {
    fetchPopularProjects,
    fetchProjects,
  } from '#lib/utils/gallery-utils.js';
  import { getColorsFromInput } from '#lib/utils/color-utils.js';
  import { getTitleFromLocationsMeta } from '#lib/utils/project-utils.svelte.js';
  import { decodeHtmlEntities } from '#lib/utils/string-utils.js';
  import GalleryProjectCard from '#lib/components/GalleryProjectCard.svelte';
  import { resolve } from '$app/paths';
  import { XIcon, PlusIcon } from '@lucide/svelte';
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
      (entries) => {
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

  let hasNextPage = $derived(galleryState.gallery?.pageInfo?.hasNextPage);
  let endCursor = $derived(galleryState.gallery?.pageInfo?.endCursor);

  async function fetchPopularProjectsWrapper() {
    const months = galleryFilters.timePeriod;
    try {
      galleryState.popularProjects = await fetchPopularProjects({
        months,
        limit: 5,
      });
    } catch (e) {
      // Unreachable: none to feature, rather than placeholders forever
      console.error('Could not load popular projects', e);
      galleryState.popularProjects = [];
    }
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

  let searchTimeout: ReturnType<typeof setTimeout> | undefined;

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
      {#if galleryState.popularFor !== galleryFilters.timePeriod}
        {#each Array(5)}
          <div
            class="placeholder rounded-container bg-surface-100 dark:bg-surface-900 h-[324px] w-[245px] shrink-0 animate-pulse snap-center"
          ></div>
        {/each}
      {:else if !galleryState.popularProjects.length}
        <p class="text-surface-700-300 mx-auto py-8 text-sm">
          Nothing popular in this period yet.
        </p>
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
      <CollectionToolbar
        kind="project"
        searchLabel="Search Projects"
        disabled={loading}
        bind:search={galleryState.search}
        bind:brandId={galleryState.filteredBrandId}
        bind:yarnId={galleryState.filteredYarnId}
        bind:onlyThisYarn={galleryState.palettesContainOnlyFilteredYarn}
        bind:patternType={galleryState.filteredPatternType}
        sortOptions={GALLERY_ORDERS}
        sort={galleryState.orderBy}
        onsort={(order) => {
          galleryState.orderBy = order;
          debouncedSearch();
        }}
        bind:layout={galleryState.layout}
        onchange={debouncedSearch}
      />
    </div>
    <div
      class="flex min-h-[70vh] scroll-mt-[58px] flex-col items-center lg:scroll-mt-[44px]"
      bind:this={projectsList}
    >
      <div
        class=" my-2 w-full gap-2 {galleryState.layout === 'grid'
          ? 'grid grid-cols-2 items-start justify-center md:grid-cols-3 xl:grid-cols-4 '
          : 'grid grid-cols-1 items-start md:grid-cols-2'}"
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
            : 'grid grid-cols-1 items-start md:grid-cols-2'}"
        >
          {#each Array(20)}
            <div
              class="placeholder card bg-surface-100 dark:bg-surface-900 rounded-container animate-pulse text-center {galleryState.layout ===
              'grid'
                ? 'h-[350px] w-full'
                : 'h-[128px] w-full sm:h-[144px]'}"
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

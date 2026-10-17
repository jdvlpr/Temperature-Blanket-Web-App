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
  import ToTopButton from '#lib/components/buttons/ToTopButton.svelte';
  import CollectionToolbar from '#lib/components/CollectionToolbar.svelte';
  import GalleryProjectCard from '#lib/components/GalleryProjectCard.svelte';
  import GalleryCardMenu from '#lib/components/GalleryCardMenu.svelte';
  import { getColorsFromInput } from '#lib/utils/color-utils.js';
  import {
    fetchProjects,
    gallerySortMenu,
    type FetchProjectsResult,
  } from '#lib/utils/gallery-utils.js';
  import { getTitleTextFromLocationsMeta } from '#lib/utils/project-utils.svelte.js';
  import { decodeHtmlEntities } from '#lib/utils/string-utils.js';
  import { PUBLIC_WORDPRESS_BASE_URL } from '$app/env/public';
  import { resolve } from '$app/paths';
  import { EarthIcon, PlusIcon, XIcon } from '@lucide/svelte';
  import { onMount } from 'svelte';
  import { masonry } from '#lib/state/attachments/masonry.js';
  import { galleryOwners } from '#lib/state/gallery-owners.svelte.js';
  import {
    galleryFilters,
    galleryState,
  } from '#lib/state/gallery-state.svelte.js';

  let first = 40;
  let loading = $state(true);
  let showScrollToTopButton = $state();
  let scrollContainer: HTMLDivElement | undefined = $state();
  let projectsList = $state();
  let totalProjects: number | string | undefined = $state(0);

  onMount(async () => {
    // The first visit, or the filters changed on the other tab
    if (
      !galleryState.projects.length ||
      galleryState.loadedFor !== galleryFilters.key
    )
      await search();

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

  /** A page of projects for the filters and sort, after `after` */
  function fetchPage(after: string | null = null) {
    return fetchProjects({
      first,
      after,
      search: galleryState.search,
      order: galleryState.orderBy,
      days: galleryState.popularDays,
      yarn: galleryState.getYarnSearch({
        brandId: galleryState.filteredBrandId,
        yarnId: galleryState.filteredYarnId,
      }),
      pattern: galleryState.filteredPatternType,
    });
  }

  /** The gallery can't sort by Popular yet (an older plugin): say Newest */
  function noteSort(results: FetchProjectsResult) {
    if (results.popularUnavailable) galleryState.orderBy = 'DESC';
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

      try {
        let results = await fetchPage();
        noteSort(results);

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
        galleryState.loadedFor = galleryFilters.key;
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

  // "By <name>" on the cards shown
  $effect(() => {
    galleryOwners.load(
      galleryState.displayedProjects.map((project) => project.databaseId),
    );
  });
</script>

<div class="flex flex-col justify-center gap-8">
  <div class="flex flex-col gap-2 px-2 text-center lg:px-0">
    <div
      bind:this={scrollContainer}
      class="flex scroll-mt-[70px] flex-wrap items-end justify-center text-center"
    >
      <div class="mb-2 flex w-full items-center justify-center gap-2">
        {#if totalProjects === 0}
          <p class="animate-pulse text-xs">...</p>
        {:else if totalProjects !== undefined}
          <p class="text-xs">
            {totalProjects} total
          </p>
          <a
            href="/globe"
            class="btn btn-sm hover:preset-tonal-surface items-center gap-1"
          >
            <EarthIcon />
            View Globe
          </a>
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
        {...gallerySortMenu(
          galleryState.orderBy,
          (order) => {
            galleryState.orderBy = order;
            search();
          },
          {
            days: galleryState.popularDays,
            set: (days) => {
              galleryState.popularDays = days;
              if (galleryState.orderBy === 'POPULAR') search();
            },
          },
        )}
        bind:layout={galleryState.layout}
        onchange={debouncedSearch}
      ></CollectionToolbar>
    </div>

    <div
      class="flex min-h-[70vh] scroll-mt-[58px] flex-col items-center lg:scroll-mt-[44px]"
      bind:this={projectsList}
    >
      <div
        class=" my-2 w-full gap-2 {galleryState.layout === 'grid'
          ? 'grid grid-cols-2 justify-center md:grid-cols-3 xl:grid-cols-4 '
          : 'grid grid-cols-1 items-start md:grid-cols-2'}"
        {@attach galleryState.layout === 'grid' ? masonry : undefined}
      >
        {#each galleryState.displayedProjects as { databaseId, featuredImage, locations, projectName, projectUrl, date, views } (databaseId)}
          <GalleryProjectCard
            href={resolve('/gallery/[id]', { id: String(databaseId) })}
            image={featuredImage?.node?.mediaDetails.sizes?.[0]?.sourceUrl ||
              featuredImage?.node?.mediaItemUrl}
            label={projectName
              ? decodeHtmlEntities(projectName)
              : getTitleTextFromLocationsMeta(locations)}
            {date}
            title={getTitleTextFromLocationsMeta(locations)}
            author={galleryOwners.nameOf(databaseId)}
            {views}
            layout={galleryState.layout}
          >
            {#snippet action()}
              <GalleryCardMenu
                postId={databaseId}
                kind="project"
                name={projectName
                  ? decodeHtmlEntities(projectName)
                  : getTitleTextFromLocationsMeta(locations)}
                project={{ url: projectUrl, name: projectName }}
              />
            {/snippet}
          </GalleryProjectCard>
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
            try {
              let results = await fetchPage(endCursor);
              galleryState.gallery.pageInfo = results.pageInfo;
              galleryState.projects.push(
                ...results.edges.flatMap((item) => item.node),
              );
              galleryState.projects = galleryState.projects;
              galleryState.displayedProjects = getFilteredProjects();
            } catch (e) {
              console.error('Could not load more projects', e);
            } finally {
              loading = false;
            }
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
    bottom="calc(1rem + var(--bottom-bar-height, 0px))"
    onClick={() => {
      scrollContainer?.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });
    }}
  />
{/if}

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

<script>
  import { PUBLIC_WORDPRESS_BASE_URL } from '$env/static/public';
  import Card from '$lib/components/Card.svelte';
  import SelectYarn from '$lib/components/SelectYarn.svelte';
  import ToTopButton from '$lib/components/buttons/ToTopButton.svelte';
  import ToggleSwitch from '$lib/components/buttons/ToggleSwitch.svelte';
  import ViewToggleBindable from '$lib/components/buttons/ViewToggleBindable.svelte';
  import { ICONS } from '$lib/constants';
  import { previews } from '$lib/state';
  import {
    fetchPopularProjects,
    fetchProjects,
    getColorsFromInput,
    getTitleFromLocationsMeta,
  } from '$lib/utils';
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
</script>

<div class="flex flex-col justify-center gap-8">
  <div class="inline-grid gap-2 text-center">
    <Card>
      {#snippet header()}
        <div class="bg-surface-50-950 py-4">
          <h2 class="font-bold text-xl">Featured Projects</h2>
          <label>
            <span>Popular during the past</span>
            <select
              bind:value={galleryState.timePeriod}
              class="select w-fit mx-auto"
              onchange={() => {
                galleryState.popularProjects = [];
                fetchPopularProjectsWrapper();
                featuredProjectsEl.scrollLeft = 0;
              }}
            >
              <option value={0.0357}>day</option>
              <option value={0.25}>week</option>
              <option value={1}>month</option>
              <option value={12}>year</option>
            </select>
          </label>
        </div>
      {/snippet}
      {#snippet content()}
        <div
          class="w-full flex items-start gap-2 snap-x snap-mandatory overflow-x-scroll mx-auto bg-surface-50-950 p-2"
          bind:this={featuredProjectsEl}
        >
          {#if !galleryState.popularProjects.length}
            <!-- <div class="my-36 mx-auto"><Spinner /></div> -->

            {#each Array(5)}
              <div
                class="placeholder animate-pulse snap-center shrink-0 h-[324px] w-[245px] rounded-container bg-surface-100-900"
              ></div>
            {/each}
          {:else}
            {#each galleryState.popularProjects as { featured_image_src, id, meta }}
              {@const title = getTitleFromLocationsMeta(meta.locations)}
              <a
                href="/gallery/{id}"
                class="snap-center shrink-0 min-h-[200px] max-w-[245px] lg:max-w-[350px] gap-1 text-center flex flex-col items-center justify-start flex-wrap mx-auto rounded-container p-2 group preset-tonal-surface"
              >
                <img
                  src={featured_image_src}
                  alt="Preview"
                  class="max-h-64 lg:max-h-[600px] max-w-[225px] lg:max-w-[370px]"
                />
                <p class="text-xs line-clamp-4">
                  {@html title || ''}
                </p>
              </a>
            {/each}
          {/if}
        </div>
      {/snippet}
    </Card>
  </div>

  <div class=" flex flex-col gap-2 text-center">
    <Card>
      {#snippet header()}
        <div
          bind:this={scrollContainer}
          class="bg-surface-50-950 pt-4 text-center flex flex-wrap justify-center items-end scroll-mt-[70px]"
        >
          <h2 class="font-bold text-xl">All Projects</h2>
          <div class="w-full justify-center flex mb-2">
            {#if totalProjects === 0}
              <p class="animate-pulse text-xs">...</p>
            {:else if totalProjects !== undefined}
              <p class="text-xs">
                {totalProjects} total
              </p>
            {/if}
          </div>
          <div class="grid grid-cols-12 w-full items-end gap-4 px-4">
            <div class="w-full col-span-12 md:col-span-7">
              <SelectYarn
                preselectDefaultYarn={false}
                disabled={loading}
                bind:selectedBrandId={galleryState.filteredBrandId}
                bind:selectedYarnId={galleryState.filteredYarnId}
              />
            </div>

            {#if galleryState.filteredBrandId || galleryState.filteredYarnId}
              <div
                class="w-full col-span-12 text-left md:col-span-5 flex flex-col items-start gap-1"
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

            <div
              class="flex flex-col justify-start col-span-12 md:col-span-5 gap-1"
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
                  disabled={loading}
                  type="text"
                  class="truncate"
                  autocomplete="off"
                  placeholder="e.g., Kansas, 2003"
                  bind:value={galleryState.search}
                />

                {#if showSearchReset}
                  <button
                    disabled={loading}
                    class=""
                    title="Reset Search"
                    onclick={() => {
                      galleryState.search = '';
                    }}
                  >
                    {@html ICONS.xMark}
                  </button>
                {/if}
              </div>
            </div>

            <label class="label w-full col-span-6 md:col-span-3">
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
                    d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z"
                  />
                </svg>
                Pattern Type
              </span>
              <select
                disabled={loading}
                class="select truncate"
                id="select-gallery-pattern-type"
                bind:value={galleryState.filteredPatternType}
              >
                <option value="">Any Pattern</option>
                {#each previews.all as { name, wpTagSlug }}
                  <option value={wpTagSlug}>{name}</option>
                {/each}
              </select>
            </label>

            <label class="label w-full col-span-6 md:col-span-3">
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
                bind:value={galleryState.orderBy}
                disabled={loading}
              >
                <option value="DESC" selected>Newest First</option>
                <option value="ASC">Oldest First</option>
              </select>
            </label>

            <div
              class="justify-center flex col-span-12 {galleryState.filteredBrandId ||
              galleryState.filteredYarnId
                ? 'md:col-start-5 md:col-span-4'
                : 'md:col-start-10 md:col-span-3'}"
            >
              <button
                disabled={loading}
                class="btn preset-filled-primary-500 flex items-center text-xl font-bold w-full h-fit"
                onclick={async () => {
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

                  let results = await fetchProjects({
                    search: galleryState.search,
                    order: galleryState.orderBy,
                    yarn: yarnSearch,
                    pattern: galleryState.filteredPatternType,
                  });

                  if (galleryState.search) {
                    galleryState.gallery.pageInfo = results.pageInfo;
                    galleryState.projects = results.edges.flatMap(
                      (item) => item.node,
                    );
                  } else {
                    galleryState.gallery.pageInfo = results.pageInfo;
                    galleryState.projects.push(
                      ...results.edges.flatMap((item) => item.node),
                    );
                    galleryState.projects = galleryState.projects;
                  }
                  galleryState.displayedProjects = getFilteredProjects();
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
        </div>
      {/snippet}
      {#snippet content()}
        <div
          class="flex flex-col items-center scroll-mt-[58px] lg:scroll-mt-[44px] bg-surface-50-950 p-2 rounded-container"
          bind:this={projectsList}
        >
          <div class="my-2 mx-auto">
            <ViewToggleBindable bind:value={layout} />
          </div>

          <div
            class=" gap-2 my-2 w-full {layout === 'grid'
              ? 'grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 justify-center items-start '
              : 'flex flex-col items-start justify-start'}"
          >
            {#each galleryState.displayedProjects as { databaseId, featuredImage, locations }}
              {@const title = getTitleFromLocationsMeta(locations)}
              <a
                href="/gallery/{databaseId}"
                class="text-center preset-tonal-surface rounded-container p-2 flex gap-1 group {layout ===
                'grid'
                  ? 'flex-col items-center justify-center'
                  : 'flex-col items-center justify-start w-full'}"
              >
                <img
                  src={featuredImage?.node?.mediaDetails.sizes?.[0].sourceUrl ||
                    featuredImage?.node?.mediaItemUrl}
                  alt="Preview"
                  class={layout === 'grid'
                    ? 'max-w-[130px] sm:max-w-[210px] md:max-w-[215px]'
                    : 'max-w-full max-h-[900px]'}
                />
                <p class="text-xs line-clamp-4">
                  {@html title || ''}
                </p>
              </a>
            {/each}
          </div>
          {#if !galleryState.displayedProjects.length && !loading}
            <p class="text-center my-8">
              No results. Try changing the filters above.
            </p>
          {/if}
          {#if loading}
            <div
              class=" gap-4 w-full {layout === 'grid'
                ? 'grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 justify-center items-start '
                : 'flex flex-col items-start justify-start'}"
            >
              {#each Array(20)}
                <div
                  class="placeholder animate-pulse text-center card bg-surface-100-900 rounded-container {layout ===
                  'grid'
                    ? 'w-full h-[350px]'
                    : 'w-full h-[120px]'}"
                ></div>
              {/each}
            </div>
          {:else if galleryState.displayedProjects.length && hasNextPage}
            <button
              class="btn preset-filled-primary-500 flex m-auto my-4"
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
      {/snippet}
    </Card>
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

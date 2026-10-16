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
  import { resolve } from '$app/paths';
  import { page } from '$app/state';
  import { PUBLIC_BASE_URL } from '$app/env/public';
  import CollectionToolbar from '#lib/components/CollectionToolbar.svelte';
  import GalleryProjectCard from '#lib/components/GalleryProjectCard.svelte';
  import { previews } from '#lib/state/preview-state.svelte.js';
  import { getColorsFromInput } from '#lib/utils/color-utils.js';
  import {
    FILTERS_FROM,
    matchesSearch,
    matchesYarn,
    patternIdOf,
    sortGalleryPages,
  } from '#lib/utils/collection-filter.js';
  import { GALLERY_SORTS } from '#lib/utils/gallery-utils.js';
  import {
    getLocationsFromMeta,
    getTitleTextFromLocationsMeta,
  } from '#lib/utils/project-utils.svelte.js';
  import { decodeHtmlEntities } from '#lib/utils/string-utils.js';
  import { ensureYarnData } from '#lib/data/yarns/colorways.svelte.js';
  import { streamed } from '#lib/utils/streamed.svelte.js';
  import { XIcon } from '@lucide/svelte';
  import PopularPeriodMenu from '../../PopularPeriodMenu.svelte';
  import {
    lastSeen,
    ownerFilters,
    popularOrder,
  } from './owner-filters.svelte.js';
  import type { PageData } from './$types';

  let { data }: { data: PageData } = $props();

  let heading = $derived(`Projects by ${data.name}`);

  // Undefined while the gallery answers the first time, null if it can't be
  // reached
  const streamedList = streamed(() => data.list);
  const list = lastSeen(
    () => `projects/${page.params.ownerId}`,
    () => streamedList.current,
  );
  const projects = $derived(list.current?.projects);
  const all = $derived(projects ?? []);
  const popular = popularOrder(
    'project',
    () => all.map((project) => project.databaseId),
    () => list.current?.popular ?? null,
  );

  // Which colors are which yarns comes from the yarn data, loaded only here
  let yarnDataReady = $state(false);
  $effect(() => {
    if (all.length && !yarnDataReady)
      ensureYarnData().then(() => (yarnDataReady = true));
  });

  // Each project's colors and pattern, read once (again with the yarn data)
  const previewIds = previews.all.map((preview) => preview.id);
  const details = $derived.by(() => {
    void yarnDataReady;
    return new Map(
      all.map((project) => {
        let urls: string[];
        try {
          urls = JSON.parse(project.yarnUrls) ?? [];
        } catch {
          urls = [];
        }
        return [
          project.databaseId,
          {
            colors: urls.flatMap(
              (url) => getColorsFromInput({ string: url }) || [],
            ),
            pattern: patternIdOf(project.projectUrl, previewIds),
            texts: [
              project.projectName && decodeHtmlEntities(project.projectName),
              ...getLocationsFromMeta(project.locations).map(
                ({ label }) => label,
              ),
            ],
          },
        ];
      }),
    );
  });

  const shown = $derived.by(() => {
    const f = ownerFilters;
    const patternId = f.patternType
      ? (previews.all.find((p) => p.wpTagSlug === f.patternType)?.id ?? '')
      : null;
    const yarn = { brandId: f.brandId, yarnId: f.yarnId, only: f.onlyThisYarn };
    const kept = all.filter((project) => {
      const { colors, pattern, texts } = details.get(project.databaseId)!;
      return (
        matchesSearch(f.search, texts) &&
        (patternId === null || pattern === patternId) &&
        matchesYarn(colors, yarn)
      );
    });
    return sortGalleryPages(kept, f.sort, popular.ids);
  });

  const filtering = $derived(ownerFilters.activeFor('projects'));
  const showFilters = $derived(
    all.length > FILTERS_FROM || filtering || ownerFilters.sorted,
  );
</script>

<svelte:head>
  <title>{data.name}’s Gallery: Projects</title>
  <meta name="description" content="Temperature blanket {heading}" />
  <meta property="og:title" content="Gallery: {heading}" />
  <meta
    property="og:url"
    content="{PUBLIC_BASE_URL}/gallery/by/{page.params.ownerId}"
  />
  <meta property="og:type" content="website" />
</svelte:head>

{#if projects === undefined}
  <div
    class={[
      'w-full items-start gap-2 px-2',
      ownerFilters.layout === 'grid'
        ? 'grid grid-cols-2 justify-center md:grid-cols-3 xl:grid-cols-4'
        : 'grid grid-cols-1 md:grid-cols-2',
    ]}
  >
    <span class="sr-only" role="status">Loading projects…</span>
    {#each data.postIds as id (id)}
      <div
        class={[
          'placeholder card bg-surface-100 dark:bg-surface-900 rounded-container w-full animate-pulse',
          ownerFilters.layout === 'grid'
            ? 'h-[350px]'
            : 'h-[128px] sm:h-[144px]',
        ]}
      ></div>
    {/each}
  </div>
{:else if projects === null}
  <p class="my-8 text-center" role="alert">
    The gallery couldn’t be reached. Try again later.
  </p>
{:else if !projects.length}
  <p class="my-8 text-center">No projects yet.</p>
{:else}
  <div class="px-2 lg:px-0">
    <CollectionToolbar
      kind="project"
      searchIcon="search"
      searchLabel="Search Projects"
      searchPlaceholder="Name or place"
      bind:search={ownerFilters.search}
      bind:brandId={ownerFilters.brandId}
      bind:yarnId={ownerFilters.yarnId}
      bind:onlyThisYarn={ownerFilters.onlyThisYarn}
      bind:patternType={ownerFilters.patternType}
      sortOptions={GALLERY_SORTS}
      sort={ownerFilters.sort}
      onsort={(sort) => (ownerFilters.sort = sort)}
      bind:layout={ownerFilters.layout}
      {showFilters}
    >
      {#snippet menus()}
        {#if ownerFilters.sort === 'POPULAR'}
          <PopularPeriodMenu
            days={ownerFilters.popularDays}
            onchange={(days) => (ownerFilters.popularDays = days)}
          />
        {/if}
      {/snippet}
    </CollectionToolbar>
  </div>
  <p class="text-surface-700-300 text-center text-sm" aria-live="polite">
    {#if filtering}
      {shown.length} of {all.length} projects
    {/if}
  </p>
  {#if shown.length}
    <ul
      class={[
        'w-full items-start gap-2 px-2',
        ownerFilters.layout === 'grid'
          ? 'grid grid-cols-2 justify-center md:grid-cols-3 xl:grid-cols-4'
          : 'grid grid-cols-1 md:grid-cols-2',
      ]}
      aria-label="Projects by {data.name}"
    >
      {#each shown as { databaseId, featuredImage, locations, projectName, date } (databaseId)}
        <li>
          <GalleryProjectCard
            href={resolve('/gallery/[id]', { id: String(databaseId) })}
            image={featuredImage?.node?.mediaDetails.sizes?.[0]?.sourceUrl ||
              featuredImage?.node?.mediaItemUrl}
            label={projectName
              ? decodeHtmlEntities(projectName)
              : getTitleTextFromLocationsMeta(locations)}
            {date}
            title={getTitleTextFromLocationsMeta(locations)}
            layout={ownerFilters.layout}
          />
        </li>
      {/each}
    </ul>
  {:else}
    <div class="my-8 flex flex-col items-center gap-2 text-center">
      <p>No projects match these filters.</p>
      <button
        type="button"
        class="btn preset-tonal-primary border-primary-500 border"
        onclick={() => ownerFilters.clear()}
      >
        <XIcon />
        Clear Filters
      </button>
    </div>
  {/if}
{/if}

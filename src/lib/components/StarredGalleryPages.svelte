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

<!-- @component
  My Library's Starred side: the gallery pages of one kind the account
  starred, as the gallery's own cards (links to the pages, never copies),
  with the page's toolbar applied: search, yarn and (projects) pattern
  filters, and Starred's sorts (Recently starred, Newest published, Most
  viewed). Read from the gallery once when it shows, so a star taken off here
  stays until the next visit and can be put back. Pages the gallery doesn't
  return (taken down, or hidden while in their owner's Trash) aren't shown,
  but their stars are kept in case they come back. Signed out, it asks to
  sign in. With `onuse` (Get Colors' My Palettes, palettes only), choosing a
  palette uses it instead of opening its page.
-->
<script lang="ts">
  import { resolve } from '$app/paths';
  import { page } from '$app/state';
  import { galleryStars } from '#lib/accounts/gallery-stars.svelte.js';
  import { backHereOnClick, signInHref } from '#lib/accounts/redirect.js';
  import { account } from '#lib/accounts/summary.svelte.js';
  import GalleryCardMenu from '#lib/components/GalleryCardMenu.svelte';
  import GalleryPaletteCard from '#lib/components/GalleryPaletteCard.svelte';
  import GalleryProjectCard from '#lib/components/GalleryProjectCard.svelte';
  import { ensureYarnData } from '#lib/data/yarns/colorways.svelte.js';
  import { masonry } from '#lib/state/attachments/masonry.js';
  import { galleryOwners } from '#lib/state/gallery-owners.svelte.js';
  import type { LibraryFilters } from '#lib/state/library-filters.svelte.js';
  import { previews } from '#lib/state/preview-state.svelte.js';
  import {
    getColorsFromInput,
    type GalleryPalette,
  } from '#lib/utils/color-utils.js';
  import {
    matchesSearch,
    matchesYarn,
    patternIdOf,
    sortStarred,
  } from '#lib/utils/collection-filter.js';
  import {
    fetchPalettesByIds,
    fetchProjectsByIds,
    type GalleryProjectNode,
  } from '#lib/utils/gallery-utils.js';
  import { getTitleTextFromLocationsMeta } from '#lib/utils/project-utils.svelte.js';
  import {
    galleryTitleText,
    sharedPaletteFrom,
  } from '#lib/utils/shared-palette-utils.js';
  import { decodeHtmlEntities } from '#lib/utils/string-utils.js';
  import { PALETTE_LIST } from '#lib/constants/class-constants.js';
  import { LogInIcon, StarIcon, XIcon } from '@lucide/svelte';
  import { untrack } from 'svelte';

  interface Props {
    kind: 'project' | 'palette';
    layout?: 'grid' | 'list';
    /** My Library's toolbar: what shows, and in what order */
    filters?: LibraryFilters;
    /** How many have loaded, once known, and how many show */
    oncount?: (count: { total: number; matching: number }) => void;
    /** Uses a palette (Get Colors) rather than opening its gallery page */
    onuse?: (palette: GalleryPalette) => void;
  }

  let { kind, layout = 'grid', filters, oncount, onuse }: Props = $props();

  const signedIn = $derived(
    __ACCOUNTS_ENABLED__ && Boolean(account.summary?.id),
  );

  let projects = $state<GalleryProjectNode[] | null>(null);
  let palettes = $state<GalleryPalette[] | null>(null);
  let failed = $state(false);
  let loading = false;

  let noun = $derived(kind === 'project' ? 'projects' : 'palettes');

  $effect(() => {
    if (signedIn) return galleryStars.start();
  });

  // When each was starred, for Recently starred: as they were when the list
  // loaded, so one unstarred here keeps its place
  let starredAt = new Map<number, number>();

  async function load(ids: number[]) {
    loading = true;
    failed = false;
    starredAt = new Map(
      galleryStars.list(kind).map((star) => [star.postId, star.createdAt]),
    );
    try {
      // Colorway names, and the yarn filter, come from the yarn data
      const yarnData = ids.length ? ensureYarnData() : null;
      if (kind === 'project') {
        [projects] = await Promise.all([fetchProjectsByIds(ids), yarnData]);
      } else {
        const [nodes] = await Promise.all([fetchPalettesByIds(ids), yarnData]);
        palettes = nodes.flatMap(
          ({ databaseId, title, yarnUrls, date, views }) => {
            const palette = sharedPaletteFrom(yarnUrls);
            if (!palette) return [];
            return [
              {
                colors: palette.colors,
                postId: databaseId,
                yarns: [],
                page: {
                  id: databaseId,
                  title: galleryTitleText(title),
                  kind: 'palette' as const,
                  views,
                  date,
                },
                others: [],
              },
            ];
          },
        );
      }
      galleryOwners.load(ids);
    } catch (e) {
      console.error('Could not load starred gallery pages', e);
      failed = true;
    } finally {
      loading = false;
    }
  }

  // Once, when the stars have loaded
  $effect(() => {
    if (!galleryStars.loaded) return;
    untrack(() => {
      if ((kind === 'project' ? projects : palettes) || loading) return;
      void load(galleryStars.list(kind).map((star) => star.postId));
    });
  });

  const timeOf = (date: string | null | undefined) =>
    (date && Date.parse(date)) || 0;
  const previewIds = previews.all.map((preview) => preview.id);

  const yarnOf = (filters: LibraryFilters) => ({
    brandId: filters.brandId,
    yarnId: filters.yarnId,
    only: filters.onlyThisYarn,
  });

  const projectCards = $derived.by(() => {
    if (!projects) return null;
    const all = projects.map((node) => ({
      node,
      label: node.projectName
        ? decodeHtmlEntities(node.projectName)
        : getTitleTextFromLocationsMeta(node.locations),
    }));
    if (!filters) return { all, shown: all };
    const yarnChosen = !!(filters.brandId || filters.yarnId);
    const patternId = filters.patternType
      ? (previews.all.find((p) => p.wpTagSlug === filters.patternType)?.id ??
        null)
      : null;
    const kept = all.filter(
      ({ node, label }) =>
        matchesSearch(filters.search, [
          label,
          getTitleTextFromLocationsMeta(node.locations),
        ]) &&
        // Its colors read from its link only when a yarn is chosen
        (!yarnChosen ||
          matchesYarn(
            getColorsFromInput({ string: node.projectUrl }) || [],
            yarnOf(filters),
          )) &&
        (!patternId || patternIdOf(node.projectUrl, previewIds) === patternId),
    );
    return {
      all,
      shown: sortStarred(kept, filters.starredSort, filters.starredReversed, {
        starredAt: ({ node }) => starredAt.get(node.databaseId) ?? 0,
        publishedAt: ({ node }) => timeOf(node.date),
        views: ({ node }) => node.views ?? 0,
      }),
    };
  });

  const paletteCards = $derived.by(() => {
    if (!palettes) return null;
    if (!filters) return { all: palettes, shown: palettes };
    const kept = palettes.filter(
      (palette) =>
        matchesSearch(filters.search, [
          palette.page.title,
          ...palette.colors.flatMap((color) => [
            color.name,
            color.brandName,
            color.yarnName,
          ]),
        ]) && matchesYarn(palette.colors, yarnOf(filters)),
    );
    return {
      all: palettes,
      shown: sortStarred(kept, filters.starredSort, filters.starredReversed, {
        starredAt: (palette) => starredAt.get(Number(palette.postId)) ?? 0,
        publishedAt: (palette) => timeOf(palette.page.date),
        views: (palette) => palette.page.views ?? 0,
      }),
    };
  });

  const counts = $derived(kind === 'project' ? projectCards : paletteCards);
  $effect(() => {
    if (counts)
      oncount?.({ total: counts.all.length, matching: counts.shown.length });
  });
</script>

{#if !signedIn}
  <div
    class="bg-surface-100-900 rounded-container mx-auto my-4 flex w-full max-w-3xl flex-col items-center gap-3 p-4 text-center"
  >
    <StarIcon class="size-8 opacity-60" aria-hidden="true" />
    <p class="text-sm">Sign in to star gallery pages and find them here.</p>
    <a
      href={signInHref(page.url)}
      onclick={backHereOnClick}
      class="btn preset-filled-primary-500"><LogInIcon />Sign In</a
    >
  </div>
{:else if failed || (galleryStars.failed && !galleryStars.loaded)}
  <p class="my-8 text-center" role="alert">
    Your starred {noun} couldn’t be loaded.
    <button
      type="button"
      class="link"
      onclick={() =>
        galleryStars.loaded
          ? load(galleryStars.list(kind).map((star) => star.postId))
          : galleryStars.load()}>Try again</button
    >
  </p>
{:else if !counts}
  <p class="text-surface-700-300 my-8 text-center text-sm" role="status">
    Loading starred {noun}…
  </p>
{:else if !counts.all.length}
  <div class="my-8 flex flex-col items-center gap-2 text-center">
    <p class="font-bold">No starred {noun} yet</p>
    <p class="text-surface-700-300 text-sm">
      Star {noun} in the
      <a
        class="link"
        href={kind === 'project'
          ? resolve('/gallery')
          : resolve('/gallery/palettes')}>Gallery</a
      > to find them here. Only you see your stars.
    </p>
  </div>
{:else if !counts.shown.length && filters}
  <div class="my-8 flex flex-col items-center gap-2 text-center">
    <p>No starred {noun} match these filters.</p>
    <button
      type="button"
      class="btn preset-tonal-primary border-primary-500 border"
      onclick={() => filters.clear()}
    >
      <XIcon />
      Clear Filters
    </button>
  </div>
{:else if kind === 'project' && projectCards}
  <ul
    class={[
      'w-full items-start gap-2',
      layout === 'grid'
        ? 'grid grid-cols-2 justify-center md:grid-cols-3 xl:grid-cols-4'
        : 'grid grid-cols-1 md:grid-cols-2',
    ]}
    aria-label="Starred projects"
    {@attach layout === 'grid' ? masonry : undefined}
  >
    {#each projectCards.shown as { node, label } (node.databaseId)}
      {@const {
        databaseId,
        featuredImage,
        locations,
        projectName,
        projectUrl,
        date,
        views,
      } = node}
      <li>
        <GalleryProjectCard
          href={resolve('/gallery/[id]', { id: String(databaseId) })}
          image={featuredImage?.node?.mediaDetails.sizes?.[0]?.sourceUrl ||
            featuredImage?.node?.mediaItemUrl}
          {label}
          {date}
          title={getTitleTextFromLocationsMeta(locations)}
          author={galleryOwners.nameOf(databaseId)}
          {views}
          {layout}
        >
          {#snippet action()}
            <GalleryCardMenu
              postId={databaseId}
              kind="project"
              name={label}
              project={{ url: projectUrl, name: projectName }}
            />
          {/snippet}
        </GalleryProjectCard>
      </li>
    {/each}
  </ul>
{:else if paletteCards}
  <ul
    class={[
      'w-full items-start gap-x-4 gap-y-6',
      layout === 'grid'
        ? 'grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
        : PALETTE_LIST,
    ]}
    aria-label="Starred palettes"
  >
    {#each paletteCards.shown as palette (palette.postId)}
      <li class="w-full">
        <GalleryPaletteCard
          {palette}
          author={galleryOwners.nameOf(palette.postId)}
          {layout}
          mode={onuse ? 'use' : 'page'}
          onclick={onuse ? () => onuse(palette) : undefined}
        />
      </li>
    {/each}
  </ul>
{/if}

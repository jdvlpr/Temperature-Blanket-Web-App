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
  My Library's Starred: the gallery pages of one kind the account starred,
  newest starred first, as the gallery's own cards (links to the pages, never
  copies). Read from the gallery once when it shows, so a star taken off here
  stays until the next visit and can be put back. Pages the gallery doesn't
  return (taken down, or hidden while in their owner's Trash) aren't shown,
  but their stars are kept in case they come back.
-->
<script lang="ts">
  import { resolve } from '$app/paths';
  import { galleryStars } from '#lib/accounts/gallery-stars.svelte.js';
  import GalleryPaletteCard from '#lib/components/GalleryPaletteCard.svelte';
  import GalleryProjectCard from '#lib/components/GalleryProjectCard.svelte';
  import GalleryStarButton from '#lib/components/GalleryStarButton.svelte';
  import { ensureYarnData } from '#lib/data/yarns/colorways.svelte.js';
  import { masonry } from '#lib/state/attachments/masonry.js';
  import { galleryOwners } from '#lib/state/gallery-owners.svelte.js';
  import type { GalleryPalette } from '#lib/utils/color-utils.js';
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
  import { StarIcon } from '@lucide/svelte';
  import { untrack } from 'svelte';

  interface Props {
    kind: 'project' | 'palette';
    layout?: 'grid' | 'list';
  }

  let { kind, layout = 'grid' }: Props = $props();

  let projects = $state<GalleryProjectNode[] | null>(null);
  let palettes = $state<GalleryPalette[] | null>(null);
  let failed = $state(false);
  let loading = false;

  let noun = $derived(kind === 'project' ? 'projects' : 'palettes');
  let shown = $derived(kind === 'project' ? projects : palettes);

  $effect(() => galleryStars.start());

  async function load(ids: number[]) {
    loading = true;
    failed = false;
    try {
      if (kind === 'project') projects = await fetchProjectsByIds(ids);
      else {
        const [nodes] = await Promise.all([
          fetchPalettesByIds(ids),
          // Colorway names come from the yarn data
          ids.length ? ensureYarnData() : null,
        ]);
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
      if (shown || loading) return;
      void load(galleryStars.list(kind).map((star) => star.postId));
    });
  });
</script>

<section class="flex flex-col gap-2" aria-labelledby="starred-heading">
  <h2 id="starred-heading" class="flex items-center gap-2 text-lg font-bold">
    <StarIcon aria-hidden="true" />Starred
  </h2>
  {#if failed || (galleryStars.failed && !galleryStars.loaded)}
    <p role="alert">
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
  {:else if !shown}
    <p class="text-surface-700-300 text-sm" role="status">
      Loading starred {noun}…
    </p>
  {:else if !shown.length}
    <p class="text-surface-700-300 text-sm">
      Star {noun} in the
      <a
        class="link"
        href={kind === 'project'
          ? resolve('/gallery')
          : resolve('/gallery/palettes')}>Gallery</a
      > to find them here. Only you see your stars.
    </p>
  {:else if kind === 'project' && projects}
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
      {#each projects as { databaseId, featuredImage, locations, projectName, date, views } (databaseId)}
        {@const label = projectName
          ? decodeHtmlEntities(projectName)
          : getTitleTextFromLocationsMeta(locations)}
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
              <GalleryStarButton
                postId={databaseId}
                kind="project"
                name={label}
              />
            {/snippet}
          </GalleryProjectCard>
        </li>
      {/each}
    </ul>
  {:else if palettes}
    <ul
      class={[
        'w-full items-start gap-x-4 gap-y-6',
        layout === 'grid'
          ? 'grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
          : PALETTE_LIST,
      ]}
      aria-label="Starred palettes"
    >
      {#each palettes as palette (palette.postId)}
        <li class="w-full">
          <GalleryPaletteCard
            {palette}
            author={galleryOwners.nameOf(palette.postId)}
            {layout}
          />
        </li>
      {/each}
    </ul>
  {/if}
</section>

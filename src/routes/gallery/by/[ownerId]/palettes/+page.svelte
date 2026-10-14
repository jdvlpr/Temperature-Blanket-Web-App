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
  import { page } from '$app/state';
  import { PUBLIC_BASE_URL } from '$app/env/public';
  import GalleryPaletteCard from '#lib/components/GalleryPaletteCard.svelte';
  import PlaceholderPalettes from '#lib/components/PlaceholderPalettes.svelte';
  import { ensureYarnData } from '#lib/data/yarns/colorways.svelte.js';
  import type { GalleryPalette } from '#lib/utils/color-utils.js';
  import {
    galleryTitleText,
    sharedPaletteFrom,
  } from '#lib/utils/shared-palette-utils.js';
  import { onMount } from 'svelte';
  import type { PageData } from './$types';

  let { data }: { data: PageData } = $props();

  let heading = $derived(`Yarn palettes by ${data.name}`);

  // Colorway names come from the yarn data, loaded only when needed
  let yarnDataReady = $state(false);
  onMount(async () => {
    if (data.palettes?.length) await ensureYarnData();
    yarnDataReady = true;
  });

  let palettes = $derived(
    yarnDataReady
      ? (data.palettes ?? []).flatMap(({ databaseId, title, yarnUrls }) => {
          const palette = sharedPaletteFrom(yarnUrls);
          if (!palette) return [];
          const card: GalleryPalette = {
            colors: palette.colors,
            postId: databaseId,
            yarns: [],
            page: {
              id: databaseId,
              title: galleryTitleText(title),
              kind: 'palette',
            },
            others: [],
          };
          return [card];
        })
      : [],
  );
</script>

<svelte:head>
  <title>Gallery: {heading}</title>
  <meta name="description" content="Temperature blanket {heading}" />
  <meta property="og:title" content="Gallery: {heading}" />
  <meta
    property="og:url"
    content="{PUBLIC_BASE_URL}/gallery/by/{page.params.ownerId}/palettes"
  />
  <meta property="og:type" content="website" />
</svelte:head>

{#if data.palettes === null}
  <p class="my-8 text-center" role="alert">
    The gallery couldn’t be reached. Try again later.
  </p>
{:else if !data.palettes.length}
  <p class="my-8 text-center">No yarn palettes yet.</p>
{:else if !yarnDataReady}
  <div class="px-2"><PlaceholderPalettes items={3} maxWFull={true} /></div>
{:else}
  <ul
    class="grid w-full grid-cols-1 items-start gap-x-4 gap-y-6 px-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
    aria-label="Yarn palettes by {data.name}"
  >
    {#each palettes as palette (palette.postId)}
      <li>
        <GalleryPaletteCard {palette} />
      </li>
    {/each}
  </ul>
{/if}

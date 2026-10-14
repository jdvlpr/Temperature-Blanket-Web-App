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

<!-- Every gallery page and palette one person published from their account,
linked from "By <name>" on their gallery pages. -->

<script lang="ts">
  import { resolve } from '$app/paths';
  import { page } from '$app/state';
  import { PUBLIC_BASE_URL } from '$app/env/public';
  import AppLogo from '#lib/components/AppLogo.svelte';
  import AppShell from '#lib/components/AppShell.svelte';
  import GalleryPaletteCard from '#lib/components/GalleryPaletteCard.svelte';
  import GalleryProjectCard from '#lib/components/GalleryProjectCard.svelte';
  import { ensureYarnData } from '#lib/data/yarns/colorways.svelte.js';
  import type { GalleryPalette } from '#lib/utils/color-utils.js';
  import { getTitleFromLocationsMeta } from '#lib/utils/project-utils.svelte.js';
  import {
    galleryTitleText,
    sharedPaletteFrom,
  } from '#lib/utils/shared-palette-utils.js';
  import { decodeHtmlEntities } from '#lib/utils/string-utils.js';
  import { ArrowLeftIcon } from '@lucide/svelte';
  import { onMount } from 'svelte';
  import type { PageData } from './$types';

  let { data }: { data: PageData } = $props();

  let heading = $derived(
    data.palettes?.length && !data.projects?.length
      ? `Yarn palettes by ${data.name}`
      : data.palettes?.length
        ? `Projects and yarn palettes by ${data.name}`
        : `Projects by ${data.name}`,
  );
  // Both kinds: each under its own heading
  let both = $derived(!!data.projects?.length && !!data.palettes?.length);

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
    content="{PUBLIC_BASE_URL}/gallery/by/{page.params.ownerId}"
  />
  <meta property="og:type" content="website" />
</svelte:head>

<AppShell pageName="Gallery">
  {#snippet stickyHeader()}
    <div class="hidden lg:inline-flex"><AppLogo /></div>
  {/snippet}
  {#snippet main()}
    <main
      class="m-auto flex w-full max-w-(--breakpoint-xl) flex-col justify-start gap-2 pb-8"
    >
      <a
        href={resolve('/gallery')}
        class="btn hover:preset-tonal-surface mx-2 mt-2 flex w-fit items-center lg:mx-0 lg:mt-0"
      >
        <ArrowLeftIcon />
        Gallery</a
      >
      <h1 class="h2 text-gradient px-2 text-center">{heading}</h1>

      {#if data.projects === null || data.palettes === null}
        <p class="my-8 text-center" role="alert">
          The gallery couldn’t be reached. Try again later.
        </p>
      {:else if !data.projects.length && !data.palettes.length}
        <p class="my-8 text-center">No gallery pages yet.</p>
      {:else if data.projects.length}
        {#if both}
          <h2
            class="text-surface-700-300 mt-4 text-center text-xl font-semibold"
          >
            Projects
          </h2>
        {/if}
        <ul
          class="grid w-full grid-cols-2 items-start justify-center gap-2 px-2 md:grid-cols-3 xl:grid-cols-4"
          aria-label="Projects by {data.name}"
        >
          {#each data.projects as { databaseId, featuredImage, locations, projectName } (databaseId)}
            <li>
              <GalleryProjectCard
                href={resolve('/gallery/[id]', { id: String(databaseId) })}
                image={featuredImage?.node?.mediaDetails.sizes?.[0]
                  ?.sourceUrl || featuredImage?.node?.mediaItemUrl}
                name={projectName ? decodeHtmlEntities(projectName) : null}
                placesHtml={getTitleFromLocationsMeta(locations)}
              />
            </li>
          {/each}
        </ul>
      {/if}

      {#if palettes.length}
        {#if both}
          <h2
            class="text-surface-700-300 mt-6 text-center text-xl font-semibold"
          >
            Yarn Palettes
          </h2>
        {/if}
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
    </main>
  {/snippet}
</AppShell>

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
  import { PUBLIC_BASE_URL } from '$env/static/public';
  import AppLogo from '$lib/components/AppLogo.svelte';
  import AppShell from '$lib/components/AppShell.svelte';
  import PaletteStrip from '$lib/components/PaletteStrip.svelte';
  import { ensureYarnData } from '$lib/data/yarns/colorways.svelte';
  import { getTitleFromLocationsMeta } from '$lib/utils/project-utils.svelte';
  import {
    galleryTitleText,
    sharedPaletteFrom,
  } from '$lib/utils/shared-palette-utils';
  import { decodeHtmlEntities, stripHTMLTags } from '$lib/utils/string-utils';
  import { ArrowLeftIcon } from '@lucide/svelte';
  import { onMount } from 'svelte';
  import type { PageData } from './$types';

  let { data }: { data: PageData } = $props();

  let heading = $derived(
    data.palettes?.length && !data.projects?.length
      ? `Palettes by ${data.name}`
      : data.palettes?.length
        ? `Projects and palettes by ${data.name}`
        : `Projects by ${data.name}`,
  );

  // Colorway names come from the yarn data, loaded only when needed
  let yarnDataReady = $state(false);
  onMount(async () => {
    if (data.palettes?.length) await ensureYarnData();
    yarnDataReady = true;
  });
</script>

<svelte:head>
  <title>Project Gallery: {heading}</title>
  <meta name="description" content="Temperature blanket {heading}" />
  <meta property="og:title" content="Project Gallery: {heading}" />
  <meta
    property="og:url"
    content="{PUBLIC_BASE_URL}/gallery/by/{page.params.ownerId}"
  />
  <meta property="og:type" content="website" />
</svelte:head>

<AppShell pageName="Project Gallery">
  {#snippet stickyHeader()}
    <div class="hidden lg:inline-flex"><AppLogo /></div>
  {/snippet}
  {#snippet main()}
    <main
      class="m-auto flex w-full max-w-(--breakpoint-xl) flex-col justify-start gap-2 pb-8"
    >
      <a
        href={resolve('/gallery')}
        class="btn hover:bg-surface-100-900 mx-2 mt-2 flex w-fit items-center lg:mx-0 lg:mt-0"
      >
        <ArrowLeftIcon />
        Project Gallery</a
      >
      <h1 class="h2 text-gradient px-2 text-center">{heading}</h1>

      {#if data.projects === null || data.palettes === null}
        <p class="my-8 text-center" role="alert">
          The gallery couldn’t be reached. Try again later.
        </p>
      {:else if !data.projects.length && !data.palettes.length}
        <p class="my-8 text-center">No gallery pages yet.</p>
      {:else}
        <ul
          class="grid w-full grid-cols-2 items-start justify-center gap-2 px-2 md:grid-cols-3 xl:grid-cols-4"
          aria-label={heading}
        >
          {#each data.projects as { databaseId, featuredImage, locations, projectName } (databaseId)}
            {@const title =
              projectName?.trim() ||
              decodeHtmlEntities(
                stripHTMLTags(getTitleFromLocationsMeta(locations)),
              )}
            <li>
              <a
                href={resolve('/gallery/[id]', { id: String(databaseId) })}
                class="rounded-container hover:bg-surface-100-900 flex flex-col items-center justify-center gap-1 p-2 text-center"
              >
                <img
                  src={featuredImage?.node?.mediaDetails.sizes?.[0]
                    ?.sourceUrl || featuredImage?.node?.mediaItemUrl}
                  alt="Preview"
                  class="max-w-[130px] sm:max-w-[210px] md:max-w-[215px]"
                />
                <p class="line-clamp-4 text-xs">
                  {title}
                </p>
              </a>
            </li>
          {/each}
        </ul>
      {/if}

      {#if data.palettes?.length && yarnDataReady}
        <h2 class="h3 mt-6 px-2 text-center">Yarn Palettes</h2>
        <ul
          class="flex w-full flex-col gap-4 px-2"
          aria-label="Yarn palettes by {data.name}"
        >
          {#each data.palettes as { databaseId, title, yarnUrls } (databaseId)}
            {@const palette = sharedPaletteFrom(yarnUrls)}
            {#if palette}
              <li>
                <a
                  href={resolve('/gallery/palette/[id]', {
                    id: String(databaseId),
                  })}
                  class="flex w-full flex-col gap-y-1 text-left"
                  title="Open the palette's page"
                >
                  <PaletteStrip colors={palette.colors} insideControl>
                    {#snippet label()}
                      <span class="line-clamp-2 text-xs font-semibold"
                        >{galleryTitleText(title)}</span
                      >
                    {/snippet}
                  </PaletteStrip>
                </a>
              </li>
            {/if}
          {/each}
        </ul>
      {/if}
    </main>
  {/snippet}
</AppShell>

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

<!-- A palette shared to the gallery on its own: its colors and colorways, a
link to open it in the Yarn Palette Creator, "By <name>" when its owner
included it on their public gallery, and "From the project <title>" when it came
from a project that's still published. -->

<script lang="ts">
  import { resolve } from '$app/paths';
  import { page } from '$app/state';
  import { PUBLIC_BASE_URL } from '$app/env/public';
  import AppLogo from '#lib/components/AppLogo.svelte';
  import AppShell from '#lib/components/AppShell.svelte';
  import Card from '#lib/components/Card.svelte';
  import GalleryOwnerBar from '#lib/components/account/GalleryOwnerBar.svelte';
  import PaletteStrip from '#lib/components/PaletteStrip.svelte';
  import { ensureYarnData } from '#lib/data/yarns/colorways.svelte.js';
  import { copyToClipboard } from '#lib/utils/clipboard-utils.js';
  import { recordPageView } from '#lib/utils/gallery-utils.js';
  import { getTitleTextFromLocationsMeta } from '#lib/utils/project-utils.svelte.js';
  import {
    galleryTitleText,
    sharedPaletteFrom,
  } from '#lib/utils/shared-palette-utils.js';
  import { decodeHtmlEntities } from '#lib/utils/string-utils.js';
  import { ArrowLeftIcon, LinkIcon, PaletteIcon } from '@lucide/svelte';
  import { onMount } from 'svelte';
  import type { PageData } from './$types';

  let { data }: { data: PageData } = $props();

  // "By" and the name, which the owner bar changes in place
  let owner = $derived(data.owner);
  let name = $derived(galleryTitleText(data.palette.title) || 'Yarn Palette');
  let sharedOn = $derived(
    data.palette.date
      ? new Date(data.palette.date).toLocaleDateString(undefined, {
          dateStyle: 'long',
        })
      : '',
  );

  // The project it came from: its name, or its places and dates
  let sourceTitle = $derived(
    data.sourceProject
      ? decodeHtmlEntities(data.sourceProject.projectName ?? '').trim() ||
          getTitleTextFromLocationsMeta(data.sourceProject.locations)
      : '',
  );

  // Colorway names come from the yarn data, loaded in the browser
  let yarnDataReady = $state(false);
  onMount(async () => {
    await ensureYarnData();
    yarnDataReady = true;
  });
  let palette = $derived(
    yarnDataReady
      ? // Open a Copy brings its name along, for Save Palette
        sharedPaletteFrom(
          data.palette.yarnUrls,
          galleryTitleText(data.palette.title),
        )
      : null,
  );

  // Counts a view for Popular, in the browser (once per palette shown)
  $effect(() => {
    recordPageView(data.palette.databaseId);
  });
</script>

<svelte:head>
  <title>Yarn Palette: {name}</title>
  <meta name="description" content="Temperature blanket yarn palette: {name}" />
  <meta property="og:title" content="Yarn Palette: {name}" />
  <meta
    property="og:description"
    content="A yarn palette in the Temperature Blanket gallery"
  />
  <meta
    property="og:url"
    content="{PUBLIC_BASE_URL}/gallery/palette/{page.params.id}"
  />
  <meta property="og:type" content="website" />
</svelte:head>

<AppShell pageName="Yarn Palette">
  {#snippet stickyHeader()}
    <div class="hidden lg:inline-flex"><AppLogo /></div>
  {/snippet}
  {#snippet main()}
    <main
      class="m-auto flex w-full max-w-(--breakpoint-md) flex-col justify-start gap-2 pb-8"
    >
      <a
        href="{resolve('gallery')}?view=yarn-palettes"
        class="btn hover:preset-tonal-surface mx-2 mt-2 flex w-fit items-center lg:mx-0 lg:mt-0"
      >
        <ArrowLeftIcon />
        Yarn Palette Gallery</a
      >
      <Card>
        {#snippet header()}
          <div
            class="bg-surface-100 dark:bg-surface-900 flex flex-col gap-2 p-4 text-center"
          >
            {#if __ACCOUNTS_ENABLED__}
              <GalleryOwnerBar
                postId={data.palette.databaseId}
                kind="palette"
                onowner={(next) => (owner = next)}
              />
            {/if}
            <h1 class="text-2xl font-bold break-words">{name}</h1>
            {#if owner}
              <p class="text-surface-600-400" data-testid="gallery-owner">
                By <a
                  class="link"
                  href={resolve('/gallery/by/[ownerId]', {
                    ownerId: owner.publicId,
                  })}>{owner.name}</a
                >
              </p>
            {/if}
            {#if sharedOn}
              <p class="text-sm opacity-70">Shared {sharedOn}</p>
            {/if}
            {#if data.sourceProject && sourceTitle}
              <p class="text-sm" data-testid="gallery-source-project">
                From the project <a
                  class="link"
                  href={resolve('/gallery/[id]', {
                    id: String(data.sourceProject.databaseId),
                  })}>{sourceTitle}</a
                >
              </p>
            {/if}
          </div>
        {/snippet}
        {#snippet content()}
          <div class="flex flex-col gap-4 p-4">
            {#if !yarnDataReady}
              <div
                class="placeholder rounded-container h-[70px] w-full animate-pulse"
              ></div>
            {:else if palette}
              <PaletteStrip colors={palette.colors} />
              <ul
                class="flex flex-col gap-2 text-left"
                aria-label="Colors in this palette"
              >
                {#each palette.colors as { hex, name: colorName, brandName, yarnName }, index (index)}
                  <li class="flex items-center gap-3">
                    <span
                      class="rounded-base size-6 shrink-0 border border-black/10"
                      style="background:{hex}"
                      aria-hidden="true"
                    ></span>
                    <span>
                      {#if colorName && brandName && yarnName}
                        <span class="font-semibold">{colorName}</span>
                        <span class="opacity-70">{brandName} - {yarnName}</span>
                      {:else}
                        {hex}
                      {/if}
                    </span>
                  </li>
                {/each}
              </ul>
              <div class="flex flex-wrap items-center justify-center gap-2">
                <!-- A link on this site, built from the palette's own path -->
                <!-- eslint-disable-next-line svelte/no-navigation-without-resolve -->
                <a
                  class="btn preset-filled-primary-500"
                  href={palette.href}
                  title="Open a copy in the Yarn Palette Creator. This gallery page won’t change."
                >
                  <PaletteIcon />
                  Open a Copy
                </a>
                <button
                  type="button"
                  class="btn hover:preset-tonal-surface"
                  onclick={() =>
                    copyToClipboard(
                      `${PUBLIC_BASE_URL}/gallery/palette/${data.palette.databaseId}`,
                      'Link copied',
                    )}
                >
                  <LinkIcon />
                  Copy Link
                </button>
              </div>
            {:else}
              <p role="alert">This palette’s colors couldn’t be read.</p>
            {/if}
          </div>
        {/snippet}
      </Card>
    </main>
  {/snippet}
</AppShell>

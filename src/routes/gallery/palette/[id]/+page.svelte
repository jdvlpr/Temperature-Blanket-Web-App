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

<!-- A palette's gallery page, laid out like a project's: its name, its colors
and yarns, "By <name>" when its owner included it on their public gallery,
Open a Copy (in the Yarn Palette Creator), its colors and colorways, then the
projects with these colors (its own project first) and other palette pages
with them. -->

<script lang="ts">
  import { resolve } from '$app/paths';
  import { page } from '$app/state';
  import { PUBLIC_BASE_URL } from '$app/env/public';
  import AppLogo from '#lib/components/AppLogo.svelte';
  import AppShell from '#lib/components/AppShell.svelte';
  import Card from '#lib/components/Card.svelte';
  import GalleryProjectCard from '#lib/components/GalleryProjectCard.svelte';
  import GaugeColorsView from '#lib/components/GaugeColorsView.svelte';
  import PaletteStrip from '#lib/components/PaletteStrip.svelte';
  import YarnSources from '#lib/components/YarnSources.svelte';
  import ViewMenu from '#lib/components/buttons/ViewMenu.svelte';
  import { ensureYarnData } from '#lib/data/yarns/colorways.svelte.js';
  import { preferences } from '#lib/storage/preferences.svelte.js';
  import { yarnLinksOf } from '#lib/utils/gallery-link-utils.js';
  import {
    postsWithColors,
    type LinkedGalleryPost,
  } from '#lib/utils/gallery-match-utils.js';
  import {
    fetchProjectsWithLink,
    recordPageView,
    type GalleryProjectNode,
  } from '#lib/utils/gallery-utils.js';
  import { getTitleTextFromLocationsMeta } from '#lib/utils/project-utils.svelte.js';
  import {
    galleryTitleText,
    sharedPaletteFrom,
  } from '#lib/utils/shared-palette-utils.js';
  import { streamed } from '#lib/utils/streamed.svelte.js';
  import { decodeHtmlEntities, pluralize } from '#lib/utils/string-utils.js';
  import { ArrowLeftIcon, PlusIcon, SwatchBookIcon } from '@lucide/svelte';
  import { onMount } from 'svelte';
  import type { PageData } from './$types';
  import GalleryPageHeader from '../../GalleryPageHeader.svelte';
  import GalleryYarnLines from '../../GalleryYarnLines.svelte';

  let { data }: { data: PageData } = $props();

  // Undefined while the gallery answers (on a move within the app), or why
  // there's none
  const streamedPage = streamed(() => data.palette);
  let found = $derived(streamedPage.current);
  let galleryPalette = $derived(typeof found === 'object' ? found : undefined);

  // "By" and the name (loaded again after Edit Gallery Page saves)
  let owner = $derived(data.owner);
  let name = $derived(
    galleryPalette
      ? galleryTitleText(galleryPalette.title) || 'Yarn Palette'
      : '',
  );
  let link = $derived(yarnLinksOf(galleryPalette?.yarnUrls)[0] ?? '');
  let sourceProjectId = $derived(galleryPalette?.sourceProjectId ?? null);

  // The project it came from, when the projects with it can't be listed: its
  // name, or its places and dates. It comes after the page.
  const streamedSource = streamed(() => data.sourceProject);
  let sourceProject = $derived(streamedSource.current);
  let sourceTitle = $derived(
    sourceProject
      ? decodeHtmlEntities(sourceProject.projectName ?? '').trim() ||
          getTitleTextFromLocationsMeta(sourceProject.locations)
      : '',
  );

  // Colorway names come from the yarn data, loaded in the browser
  let yarnDataReady = $state(false);
  onMount(async () => {
    await ensureYarnData();
    yarnDataReady = true;
  });
  let palette = $derived(
    yarnDataReady && galleryPalette
      ? // Open a Copy brings its name along, for Save Palette
        sharedPaletteFrom(
          galleryPalette.yarnUrls,
          galleryTitleText(galleryPalette.title),
        )
      : null,
  );
  // Counts a view for Popular, in the browser (once per palette shown)
  $effect(() => {
    if (galleryPalette) recordPageView(galleryPalette.databaseId);
  });

  // The projects with these colors, a page at a time (they come after the
  // page); null when they couldn't be looked up
  let projectsFound = $state<GalleryProjectNode[] | null>([]);
  let projectsCursor = $state<string | null>(null);
  let moreProjects = $state(false);
  let loadingProjects = $state(true);
  // Other palette pages with these colors
  let samePalettesFound = $state<LinkedGalleryPost[]>([]);
  $effect(() => {
    let current = true;
    loadingProjects = true;
    projectsFound = [];
    samePalettesFound = [];
    Promise.resolve(data.projects)
      .then((found) => {
        if (!current) return;
        projectsFound = found ? found.nodes : null;
        projectsCursor = found?.pageInfo.endCursor ?? null;
        moreProjects = !!found?.pageInfo.hasNextPage;
      })
      .catch(() => current && (projectsFound = null))
      .finally(() => current && (loadingProjects = false));
    Promise.resolve(data.samePalettes)
      .then((found) => current && (samePalettesFound = found ?? []))
      .catch(() => {});
    return () => {
      current = false;
    };
  });

  async function showMoreProjects() {
    loadingProjects = true;
    const found = await fetchProjectsWithLink(link, { after: projectsCursor });
    if (found) {
      projectsFound = [...(projectsFound ?? []), ...found.nodes];
      projectsCursor = found.pageInfo.endCursor;
      moreProjects = found.pageInfo.hasNextPage;
    } else moreProjects = false;
    loadingProjects = false;
  }

  // Checked by their colors (the search matches part of a link), its own
  // project first
  let projects = $derived(
    palette && projectsFound
      ? postsWithColors(palette.colors, projectsFound).sort(
          (a, b) =>
            Number(b.databaseId === sourceProjectId) -
            Number(a.databaseId === sourceProjectId),
        )
      : [],
  );
  let samePalettes = $derived(
    palette
      ? postsWithColors(palette.colors, samePalettesFound).filter(
          (other) => other.databaseId !== galleryPalette?.databaseId,
        )
      : [],
  );
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

<AppShell pageName="Yarn Palette Gallery">
  {#snippet stickyHeader()}
    <div class="hidden lg:inline-flex"><AppLogo /></div>
  {/snippet}
  {#snippet main()}
    <main
      class="m-auto flex w-full max-w-(--breakpoint-xl) flex-col justify-start gap-2 pb-8"
    >
      <a
        href={resolve('/gallery/palettes')}
        class="btn hover:preset-tonal-surface mx-2 mt-2 flex w-fit items-center lg:mx-0 lg:mt-0"
      >
        <ArrowLeftIcon />
        Yarn Palette Gallery</a
      >
      <Card>
        {#snippet header()}
          <GalleryPageHeader
            postId={Number(page.params.id)}
            kind="palette"
            bind:owner
            date={galleryPalette?.date}
            open={palette
              ? {
                  href: palette.href,
                  icon: SwatchBookIcon,
                  title:
                    'Open a copy in the Yarn Palette Creator. This gallery page won’t change.',
                }
              : null}
          >
            {#snippet heading()}
              {#if found === undefined}
                <span
                  class="placeholder inline-block h-8 w-64 max-w-full animate-pulse align-middle"
                  ><span class="sr-only">Loading…</span></span
                >
              {:else if galleryPalette}
                {name}
              {:else if found === 'unreachable'}
                This yarn palette gallery page couldn’t be loaded.
              {:else}
                This yarn palette gallery page cannot be found.
              {/if}
            {/snippet}
            {#snippet subtitle()}
              {#if palette}
                {palette.colors.length}
                {pluralize(
                  'color',
                  palette.colors.length,
                )}{#if palette.colors.some((color) => color?.brandName && color?.yarnName)}<span
                    class="mx-1"
                    aria-hidden="true">·</span
                  ><GalleryYarnLines colors={palette.colors} />{/if}
              {:else}
                &nbsp;
              {/if}
            {/snippet}
          </GalleryPageHeader>
        {/snippet}
        {#snippet content()}
          <div class="flex flex-col gap-4 p-4 text-center">
            {#if found === 'missing'}
              <!-- Said in the heading -->
            {:else if found === 'unreachable'}
              <p role="alert">
                The gallery couldn’t be reached. Try again later.
              </p>
            {:else if !yarnDataReady || !galleryPalette}
              <div
                class="placeholder rounded-container h-[70px] w-full animate-pulse"
              ></div>
            {:else if palette}
              <PaletteStrip colors={palette.colors} />
              <div class="mx-auto w-fit">
                <ViewMenu bind:value={preferences.value.layout} fillOption />
              </div>
              <GaugeColorsView
                items={palette.colors.map((color, index) => ({
                  color,
                  label: index + 1,
                }))}
              />
            {:else}
              <p role="alert">This palette’s colors couldn’t be read.</p>
            {/if}
          </div>
        {/snippet}
      </Card>

      <section
        class="mt-6 flex flex-col gap-2 px-2 text-center lg:px-0"
        aria-labelledby="projects-with-palette"
      >
        {#if projects.length}
          <h2
            id="projects-with-palette"
            class="text-surface-700-300 text-xl font-semibold"
          >
            Projects with this palette
          </h2>
          <div class="flex flex-wrap items-start justify-center gap-2">
            {#each projects as { databaseId, featuredImage, locations, projectName, date } (databaseId)}
              <div class="w-40 sm:w-56">
                <GalleryProjectCard
                  href={resolve('/gallery/[id]', { id: String(databaseId) })}
                  image={featuredImage?.node?.mediaDetails?.sizes?.[0]
                    ?.sourceUrl || featuredImage?.node?.mediaItemUrl}
                  label={projectName
                    ? decodeHtmlEntities(projectName)
                    : getTitleTextFromLocationsMeta(locations)}
                  {date}
                  title={getTitleTextFromLocationsMeta(locations)}
                >
                  {#snippet details()}
                    {#if databaseId === sourceProjectId}
                      <p class="text-surface-600-400 text-xs">
                        Shared from this project
                      </p>
                    {/if}
                  {/snippet}
                </GalleryProjectCard>
              </div>
            {/each}
          </div>
          {#if moreProjects}
            <button
              type="button"
              class="btn preset-filled-primary-500 m-auto my-4 flex"
              disabled={loadingProjects}
              onclick={showMoreProjects}
            >
              <PlusIcon />
              Show More
            </button>
          {/if}
        {:else if projectsFound === null && sourceProject && sourceTitle}
          <!-- The projects couldn't be looked up: the one it came from -->
          <p class="text-sm" data-testid="gallery-source-project">
            From the project <a
              class="link"
              href={resolve('/gallery/[id]', {
                id: String(sourceProject.databaseId),
              })}>{sourceTitle}</a
            >
          </p>
        {:else if loadingProjects && yarnDataReady && galleryPalette}
          <span class="sr-only" role="status">Looking for projects…</span>
        {/if}
        {#if samePalettes.length}
          <p class="text-surface-600-400 mt-4 text-sm">
            Also shared as
            {#each samePalettes as other, i (other.databaseId)}{#if i}<span
                  class="mr-1">,</span
                >{/if}<a
                class="link"
                href={resolve('/gallery/palette/[id]', {
                  id: String(other.databaseId),
                })}>{galleryTitleText(other.title) || 'Yarn Palette'}</a
              >{/each}
          </p>
        {/if}
      </section>
    </main>
  {/snippet}
  {#snippet footer()}
    <div class="px-2">
      <YarnSources />
    </div>
  {/snippet}
</AppShell>

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
  import { withProjectName } from '#lib/utils/project-name-link.js';
  import { parseNotes } from '#lib/utils/ravelry-notes.js';
  import { fromGalleryLink } from '#lib/utils/gallery-request.js';
  import { resolve } from '$app/paths';
  import { yarnLinksOf } from '#lib/utils/gallery-link-utils.js';
  import {
    postsWithColors,
    type LinkedGalleryPost,
  } from '#lib/utils/gallery-match-utils.js';
  import { getColorsFromInput } from '#lib/utils/color-utils.js';
  import { browser } from '$app/env';
  import { page } from '$app/state';
  import { PUBLIC_BASE_URL } from '$app/env/public';
  import AppLogo from '#lib/components/AppLogo.svelte';
  import AppShell from '#lib/components/AppShell.svelte';
  import Card from '#lib/components/Card.svelte';
  import YarnSources from '#lib/components/YarnSources.svelte';
  import { ensureYarnData } from '#lib/data/yarns/colorways.svelte.js';
  import { allGaugesAttributes } from '#lib/state/gauges-state.svelte.js';
  import { locations } from '#lib/state/location-state.svelte.js';
  import type {
    GaugeRange,
    GaugeRangeCategory,
  } from '#lib/types/gauge-types.js';
  import {
    gaugeParamsHaveYarnDetails,
    parseGaugeURLHash,
  } from '#lib/utils/load-project-utils.svelte.js';

  import {
    EXTRA_COLORS_HASH_KEY,
    extraColorsFromUrlHash,
    extraColorsHaveYarnDetails,
  } from '#lib/utils/extra-colors-utils.js';
  import { exists } from '#lib/utils/other-utils.js';
  import {
    getProjectParametersFromURLHash,
    getTitleFromLocationsMeta,
  } from '#lib/utils/project-utils.svelte.js';
  import { recordPageView } from '#lib/utils/gallery-utils.js';
  import { isCustomGalleryWeather } from '#lib/utils/gallery-weather.js';
  import {
    decodeHtmlEntities,
    pluralize,
    stripHTMLTags,
  } from '#lib/utils/string-utils.js';
  import {
    ArrowLeftIcon,
    EarthIcon,
    ExternalLinkIcon,
    NotebookPenIcon,
    SwatchBookIcon,
  } from '@lucide/svelte';
  import {
    buildGlobeLinkFromLocationsMeta,
    firstLocationLabelFromLocationsMeta,
  } from '../../globe/globe-utils';
  import { yarnPageState } from '../../yarn/state.svelte';
  import { streamed } from '#lib/utils/streamed.svelte.js';
  import type { PageData } from './$types';
  import GalleryPageHeader from '../GalleryPageHeader.svelte';
  import GaugeRanges from '../GaugeRanges.svelte';

  let { data }: { data: PageData } = $props();

  let imageWidth = $state<number | undefined>();
  let imageHeight = $state<number | undefined>();

  // Undefined while the gallery answers (on a move within the app), null when
  // there's no such project
  const streamedProject = streamed(() => data.project);
  let project = $derived(streamedProject.current);
  // "By" and the name (loaded again after Edit Gallery Page saves)
  let owner = $derived(data.owner);

  // The project's photos on Ravelry, when its owner linked it there (streamed)
  type RavelryPhotos = Awaited<NonNullable<PageData['ravelry']>>;
  let ravelry = $state<RavelryPhotos>(null);
  // Its photos besides its picture, which is the one shown already
  const ravelryPhotos = $derived(
    ravelry?.photos.filter((photo) => !photo.isPicture) ?? [],
  );
  $effect(() => {
    let current = true;
    ravelry = null;
    Promise.resolve(data.ravelry)
      .then((found) => {
        if (current) ravelry = found ?? null;
      })
      .catch(() => {});
    return () => {
      current = false;
    };
  });
  let projectURL = $derived(project?.projectUrl);
  let projectTitle = $derived(
    project ? getTitleFromLocationsMeta(project.locations) : '',
  );
  // The name the project was given, if any, shown above its locations
  let projectName = $derived(project?.projectName?.trim() ?? '');
  // Opens with the name it was given, as a shared link does, and the weather
  // this page kept
  let openHref = $derived(
    projectURL
      ? fromGalleryLink(
          withProjectName(projectURL, projectName),
          Number(page.params.id),
        )
      : projectURL,
  );
  // As text (for the page title and palette names)
  let projectTitleNoHTML = $derived(
    projectName || decodeHtmlEntities(stripHTMLTags(projectTitle)),
  );

  // Counts a view for Popular, in the browser (once per project shown)
  $effect(() => {
    if (project) recordPageView(page.params.id ?? '');
  });
  // Null when the project has no usable coordinates, which hides the link.
  let globeLink = $derived(
    project ? buildGlobeLinkFromLocationsMeta(project.locations) : null,
  );
  // The link goes to the first location, so name that one (in Details)
  let globeLinkLabel = $derived.by(() => {
    const place = project
      ? firstLocationLabelFromLocationsMeta(project.locations)
      : null;
    return place
      ? `See projects near ${place} on the globe`
      : 'See nearby projects on the globe';
  });
  let weatherSources = $derived(
    project?.weatherSources ? JSON.parse(project?.weatherSources) : null,
  );
  let hash = $derived(projectURL ? new URL(projectURL).hash.substring(1) : '');
  let params = $derived(getProjectParametersFromURLHash(hash));
  let gauges = $derived(getGauges(params));

  // Its palettes' own pages (gallery plugin 1.7.0), which come after the page
  let palettePages = $state<LinkedGalleryPost[]>([]);
  $effect(() => {
    let current = true;
    palettePages = [];
    Promise.resolve(data.palettePages)
      .then((pages) => {
        if (current) palettePages = pages ?? [];
      })
      .catch(() => {});
    return () => {
      current = false;
    };
  });

  /**
   * Each gauge's palette page, if it has one: the gauge's own link (found by
   * its colors, since the links aren't in the gauges' order), then a page with
   * that link's colors, this project's first. Re-run once yarn data loads, as
   * `gauges` is.
   */
  let gaugePalettePages = $derived.by(() => {
    if (!palettePages.length) return [];
    const links = yarnLinksOf(project?.yarnUrls).map(
      (link) => getColorsFromInput({ string: link }) || [],
    );
    const hexes = (colors: { hex?: string }[]) =>
      colors.map((color) => color?.hex?.toLowerCase()).join();
    return gauges.map(({ colors }) => {
      const linkColors = links.find(
        (candidate) =>
          candidate.length && hexes(candidate) === hexes(colors ?? []),
      );
      return linkColors
        ? (postsWithColors(
            linkColors,
            palettePages,
            Number(page.params.id),
          )[0] ?? null)
        : null;
    });
  });

  // The preview's accent/border colors, from the `x` param (only in projects
  // saved after it was added). Self-heals like `gauges` once yarn data loads.
  let extraColors = $derived(
    browser
      ? extraColorsFromUrlHash(params[EXTRA_COLORS_HASH_KEY]?.value ?? '')
      : [],
  );

  // Warm the yarn dataset only when this project's gauges or extra colors
  // reference yarn details; `gauges` above self-heals once the data resolves.
  $effect(() => {
    if (
      gaugeParamsHaveYarnDetails(params) ||
      extraColorsHaveYarnDetails(params)
    )
      ensureYarnData();
  });

  let pattern = $derived(project?.projectTags?.nodes?.[0]);

  // Still in progress when it was published or last updated: Open a Copy
  // searches the weather again for the days since (gallery-weather.ts);
  // otherwise it loads the same weather as the preview, so there's nothing to say
  let inProgress = $derived.by(() => {
    const asOf = project?.modified ?? project?.date;
    if (!asOf || isCustomGalleryWeather(project?.weatherSources)) return false;
    // Days as "2024-03-13"; a later day than its weather is from wasn't in yet
    const publishedOn = asOf.slice(0, 10);
    try {
      const places: { to?: string }[] = JSON.parse(project.locations ?? '[]');
      return places.some(({ to }) => {
        const day = to ? new Date(to) : null;
        return (
          day &&
          !Number.isNaN(day.getTime()) &&
          day.toISOString().slice(0, 10) >= publishedOn
        );
      });
    } catch {
      return false;
    }
  });

  let projectUnits = $derived<'imperial' | 'metric'>(
    params?.u?.value === 'i' ? 'imperial' : 'metric',
  );

  function getGauges(params: Record<string, { key: string; value: string }>) {
    if (!browser) return [];
    let _gauges: Exclude<ReturnType<typeof parseGaugeURLHash>, undefined>[] =
      [];

    allGaugesAttributes.forEach((gauge) => {
      if (!exists(params[gauge.id])) return;
      const settings = parseGaugeURLHash(params[gauge.id].value, gauge);
      if (settings) {
        _gauges.push(settings);
      }
    });

    return _gauges;
  }

  const preloadImage = (src: string) => {
    if (!browser) return;
    return new Promise<void>((resolve) => {
      let img = new Image();
      img.onload = () => {
        imageWidth = img.width;
        imageHeight = img.height;
        resolve();
      };
      img.src = src;
    });
  };

  // This triggers after the project is loaded
  // It sets to image width and height value for the og:image meta property in head
  let preloadedImage = $derived(
    preloadImage(project?.featuredImage?.node.mediaItemUrl),
  );
</script>

<svelte:head>
  <title>Project Gallery: {projectTitleNoHTML}</title>

  <meta name="description" content="Project Gallery: {projectTitleNoHTML}" />

  <meta property="og:title" content="Project Gallery: {projectTitleNoHTML}" />

  <meta
    property="og:description"
    content="Temperature Blanket Project: {projectTitleNoHTML}"
  />
  <meta
    property="og:url"
    content="{PUBLIC_BASE_URL}/gallery/{page.params.id}"
  />
  <meta property="og:type" content="website" />
  <meta
    property="og:image"
    content={project?.featuredImage?.node.mediaItemUrl}
  />
  {#key imageWidth}
    <meta property="og:image:width" content={imageWidth?.toString()} />
  {/key}
  {#key imageHeight}
    <meta property="og:image:height" content={imageHeight?.toString()} />
  {/key}
</svelte:head>

<AppShell pageName="Project Gallery">
  {#snippet stickyHeader()}
    <div class="hidden lg:inline-flex"><AppLogo /></div>
  {/snippet}
  {#snippet main()}
    <div class="opacity-100 transition-opacity">
      <main
        class="m-auto flex max-w-(--breakpoint-xl) flex-col justify-start gap-2"
      >
        <a
          href="/gallery"
          class="btn hover:preset-tonal-surface mx-2 mt-2 flex w-fit items-center lg:mx-0 lg:mt-0"
        >
          <ArrowLeftIcon />
          Project Gallery</a
        >
        <Card>
          {#snippet header()}
            <GalleryPageHeader
              postId={Number(page.params.id)}
              kind="project"
              bind:owner
              date={project?.date}
              modified={project?.modified}
              views={project?.views}
              open={projectURL && openHref
                ? {
                    href: openHref,
                    icon: NotebookPenIcon,
                    target: locations.allValid ? '_blank' : '_self',
                    title:
                      'Open a copy in the Project Planner. This gallery page won’t change.',
                  }
                : null}
            >
              {#snippet heading()}
                {#if projectName}
                  {projectName}
                {:else if project}
                  <!-- Escaped by getTitleFromLocationsMeta -->
                  {@html projectTitle}
                {:else if project === undefined}
                  <span
                    class="placeholder inline-block h-8 w-64 max-w-full animate-pulse align-middle"
                    ><span class="sr-only">Loading…</span></span
                  >
                {:else}
                  This project gallery page cannot be found.
                {/if}
              {/snippet}
              {#snippet subtitle()}
                {#if project && projectName}
                  <!-- Escaped by getTitleFromLocationsMeta -->
                  {@html projectTitle}
                {/if}
              {/snippet}
              {#snippet details()}
                <!-- Where its weather came from, its neighbours, and Ravelry,
                beside who made it and when -->
                {#if weatherSources?.length}
                  <span
                    >Weather from {#each weatherSources as { name, url }, i (url)}{#if i}<span
                          class="mr-1">,</span
                        >{/if}<a
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        class="link">{name}</a
                      >{/each}</span
                  >
                {/if}
                {#if globeLink}
                  <span
                    ><a
                      class="link inline-flex items-center gap-1"
                      href={globeLink}
                      aria-label={globeLinkLabel}
                      title={globeLinkLabel}
                      ><EarthIcon class="icon-sm" aria-hidden="true" />Nearby
                      projects</a
                    ></span
                  >
                {/if}
                {#if ravelry}
                  <span
                    ><a
                      class="link inline-flex items-center gap-1"
                      href={ravelry.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      >On Ravelry<ExternalLinkIcon
                        class="icon-sm"
                        aria-hidden="true"
                      /><span class="sr-only"> (opens in a new tab)</span></a
                    ></span
                  >
                {/if}
              {/snippet}
            </GalleryPageHeader>
          {/snippet}
          {#snippet content()}
            <div class="grid grid-cols-1 gap-2 py-2">
              <div class="mt-2 text-center">
                {#if project}
                  <img
                    src={project?.featuredImage?.node.mediaItemUrl}
                    alt="Project Preview"
                    class="m-auto max-h-[60vh]"
                  />
                  {#if ravelryPhotos.length}
                    <!-- Photos of the made project, from Ravelry, under its
                    picture (Ravelry's copy of the picture is left out) -->
                    <ul
                      class="mx-auto mt-2 flex max-w-3xl flex-wrap justify-center gap-2 px-2"
                      aria-label="Photos on Ravelry"
                    >
                      {#each ravelryPhotos as photo, i (photo.photoId)}
                        <li>
                          <!-- eslint-disable-next-line svelte/no-navigation-without-resolve -- Ravelry's site -->
                          <a
                            href={ravelry?.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            class="block"
                            ><img
                              src={photo.mediumUrl ??
                                photo.smallUrl ??
                                photo.squareUrl ??
                                ''}
                              alt={`${projectName || 'The project'}: photo ${i + 1} on Ravelry (opens in a new tab)`}
                              class="bg-surface-100-900 h-24 w-auto max-w-full sm:h-32"
                              loading="lazy"
                            /></a
                          >
                        </li>
                      {/each}
                    </ul>
                  {/if}
                  {#if ravelry?.notes}
                    <!-- The maker's notes from Ravelry, as plain text with a few marks -->
                    <section
                      class="mx-auto mt-4 flex max-w-prose flex-col gap-2 px-2 text-left"
                      aria-label="Notes"
                    >
                      {#each parseNotes(ravelry.notes) as paragraph, p (p)}
                        <p>
                          {#each paragraph as segment, i (i)}
                            {#if segment.type === 'break'}<br />
                            {:else if segment.type === 'bold'}<strong
                                >{segment.text}</strong
                              >
                            {:else if segment.type === 'italic'}<em
                                >{segment.text}</em
                              >
                            {:else if segment.type === 'link'}<a
                                class="link"
                                href={segment.href}
                                target="_blank"
                                rel="nofollow ugc noopener noreferrer"
                                >{segment.text}</a
                              >
                            {:else}{segment.text}{/if}
                          {/each}
                        </p>
                      {/each}
                    </section>
                  {/if}
                  <!-- Only what the title, gauges and preview don't say -->
                  <p
                    class="text-surface-600-400 mt-2 flex flex-wrap justify-center gap-x-1.5 px-2 text-sm empty:hidden [&>*+*]:before:mr-1.5 [&>*+*]:before:content-['·']"
                  >
                    {#if pattern?.name}<span>{pattern.name}</span>{/if}
                    {#if project.missingDays}
                      <span
                        >{project.missingDays}
                        {pluralize('day', project.missingDays)} without weather data</span
                      >
                    {/if}
                    {#if inProgress}
                      <span
                        >In progress when published · a copy gets the weather
                        since</span
                      >
                    {/if}
                  </p>
                {:else if project === undefined}
                  <div
                    class="placeholder rounded-container m-auto h-[50vh] w-full max-w-3xl animate-pulse"
                  ></div>
                {/if}
              </div>

              <div class="mt-4 flex flex-col gap-4 px-2 pb-4">
                {#if gauges?.length}
                  {#key gauges}
                    {#each gauges as { colors, ranges, id, rangeOptions, unit }, gaugeIndex}
                      {@const attributes = allGaugesAttributes.find(
                        (item) => item.id === id,
                      )}
                      {@const gaugeName = attributes?.label ?? ''}
                      {@const palettePage = gaugePalettePages[gaugeIndex]}
                      <GaugeRanges
                        heading={gaugeName}
                        items={(ranges ?? []).map(
                          (
                            range: GaugeRange | GaugeRangeCategory,
                            index: number,
                          ) => ({
                            color: colors?.[index] ?? { hex: '' },
                            label: index + 1,
                            range,
                          }),
                        )}
                        unitLabel={attributes?.unit.label[projectUnits]}
                        unitType={unit.type}
                        {rangeOptions}
                        gaugeId={id}
                      >
                        {#snippet action()}
                          <!-- Its own gallery page if it has one, or else a
                               copy in the Yarn Palette Creator -->
                          {#if palettePage}
                            <a
                              class="btn hover:preset-tonal-surface"
                              aria-label="View the {gaugeName} yarn palette"
                              title="This yarn palette’s gallery page"
                              href={resolve('/gallery/palette/[id]', {
                                id: String(palettePage.databaseId),
                              })}
                            >
                              <SwatchBookIcon />
                              View Yarn Palette
                            </a>
                          {:else}
                            <a
                              class="btn hover:preset-tonal-surface"
                              aria-label="Open a copy of the {gaugeName} yarn palette"
                              title="Its yarn colors in the Yarn Palette Creator, without the ranges. This gallery page won’t change."
                              onclick={() => {
                                if (!colors) return;
                                yarnPageState.gauge.colors = colors;
                                // The name Save Palette offers
                                yarnPageState.suggestion = {
                                  name: `${projectTitleNoHTML} – ${gaugeName}`.slice(
                                    0,
                                    80,
                                  ),
                                  colors: $state.snapshot(colors),
                                };
                              }}
                              href={resolve('/yarn')}
                            >
                              <SwatchBookIcon />
                              Open a Copy of the Yarn Palette
                            </a>
                          {/if}
                        {/snippet}
                      </GaugeRanges>
                    {/each}
                  {/key}
                {/if}
                {#if extraColors.length}
                  <GaugeRanges
                    heading="Additional Colors"
                    items={extraColors.map(({ label, color }) => ({
                      color,
                      label,
                    }))}
                  />
                {/if}
              </div>
            </div>
          {/snippet}
        </Card>
      </main>
    </div>
  {/snippet}
  {#snippet footer()}
    <div class="px-2">
      <YarnSources />
    </div>
  {/snippet}
</AppShell>

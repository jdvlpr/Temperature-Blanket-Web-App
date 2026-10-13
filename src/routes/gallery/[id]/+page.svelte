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
  import { fromGalleryLink } from '#lib/utils/gallery-request.js';
  import { resolve } from '$app/paths';
  import {
    postsWithColors,
    yarnLinksOf,
    type LinkedGalleryPost,
  } from '#lib/utils/gallery-link-utils.js';
  import { getColorsFromInput } from '#lib/utils/color-utils.js';
  import { browser } from '$app/env';
  import { page } from '$app/state';
  import { PUBLIC_BASE_URL } from '$app/env/public';
  import AppLogo from '#lib/components/AppLogo.svelte';
  import AppShell from '#lib/components/AppShell.svelte';
  import Card from '#lib/components/Card.svelte';
  import PaletteStrip from '#lib/components/PaletteStrip.svelte';
  import YarnSources from '#lib/components/YarnSources.svelte';
  import ViewMenu from '#lib/components/buttons/ViewMenu.svelte';
  import GaugeColorsView from '#lib/components/GaugeColorsView.svelte';
  import { ensureYarnData } from '#lib/data/yarns/colorways.svelte.js';
  import { allGaugesAttributes } from '#lib/state/gauges-state.svelte.js';
  import { locations } from '#lib/state/location-state.svelte.js';
  import { dialog } from '#lib/state/page-state.svelte.js';
  import { preferences } from '#lib/storage/preferences.svelte.js';
  import type {
    GaugeRange,
    GaugeRangeCategory,
  } from '#lib/types/gauge-types.js';
  import type { Color } from '#lib/types/yarn-types.js';
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
  import { galleryTitleText } from '#lib/utils/shared-palette-utils.js';
  import {
    decodeHtmlEntities,
    stripHTMLTags,
  } from '#lib/utils/string-utils.js';
  import {
    ArrowLeftIcon,
    GlobeIcon,
    InfoIcon,
    NotebookPenIcon,
    PaletteIcon,
    SwatchBookIcon,
  } from '@lucide/svelte';
  import {
    buildGlobeLinkFromLocationsMeta,
    firstLocationLabelFromLocationsMeta,
  } from '../../globe/globe-utils';
  import { yarnPageState } from '../../yarn/state.svelte';
  import type { PageData } from './$types';
  import AboutProjectDialog from './AboutProjectDialog.svelte';
  import GalleryPageHeader from '../GalleryPageHeader.svelte';

  let { data }: { data: PageData } = $props();

  let imageWidth = $state<number | undefined>();
  let imageHeight = $state<number | undefined>();

  let project = $derived(data.project);
  // "By" and the name, which the owner bar changes in place
  let owner = $derived(data.owner);
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
  // As text (for the page title and the about dialog)
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
  // The link goes to the first location, so name that one: short button text,
  // with the place spelled out for screen readers and on hover.
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
  let flatColors = $derived(
    gauges.flatMap((item) => (item.colors ? item.colors : [])),
  );

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

  function openAbout() {
    dialog.trigger({
      type: 'component',
      component: {
        ref: AboutProjectDialog,
        props: {
          project,
          title: projectTitleNoHTML,
          owner,
          reshapedColors,
          weatherSources,
        },
      },
      options: { size: 'medium' },
    });
  }

  let reshapedColors = $derived.by(() => {
    if (!flatColors) return null;
    const yarns: Array<{
      brandId: any;
      brandName: any;
      yarnWeightId: any;
      yarnId: any;
      yarnName: any;
      colors: Array<{ name: any; hex: any }>;
    }> = [];

    const extras = extraColors.map((extra) => extra.color);
    [...flatColors, ...extras].forEach((color: Color, colorIndex: number) => {
      const isExtra = colorIndex >= flatColors.length;
      const { brandId, yarnId, brandName, yarnName, name, hex, yarnWeightId } =
        color;
      const existingYarn = yarns.find(
        (item) => item.brandId === brandId && item.yarnId === yarnId,
      );
      if (!existingYarn) {
        yarns.push({
          brandId,
          brandName,
          yarnWeightId,
          yarnId,
          yarnName,
          colors: [],
        });
      }
      const yarnToUpdate = yarns.find(
        (item) => item.brandId === brandId && item.yarnId === yarnId,
      );
      if (yarnToUpdate) {
        // Don't list an accent/border colorway twice if a gauge already uses it
        if (isExtra && yarnToUpdate.colors.some((c) => c.hex === hex)) return;
        yarnToUpdate.colors.push({ name, hex });
      }
    });
    return yarns;
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
              {#snippet actions()}
                {#if globeLink}
                  <a
                    class="btn hover:preset-tonal-surface"
                    href={globeLink}
                    aria-label={globeLinkLabel}
                    title={globeLinkLabel}
                  >
                    <GlobeIcon />
                    See Nearby Projects
                  </a>
                {/if}
                {#if project}
                  <!-- Reference details, in a dialog rather than an inline
                       accordion that pushed the preview image down -->
                  <button
                    type="button"
                    class="btn hover:preset-tonal-surface"
                    aria-label="About this project"
                    title="About this project"
                    onclick={openAbout}
                  >
                    <InfoIcon />
                    About
                  </button>
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
                {/if}
              </div>

              <div class="mt-2 flex flex-col gap-4 text-center">
                <div class="flex flex-col gap-8">
                  {#if gauges?.length}
                    {#key gauges}
                      {#each gauges as { colors, ranges, id, rangeOptions }, gaugeIndex}
                        {@const gaugeType = gauges[gaugeIndex].unit.type}
                        {@const item = (ranges ?? []).map(
                          (
                            range: GaugeRange | GaugeRangeCategory,
                            index: number,
                          ) => ({
                            color: colors?.[index] ?? { hex: '' },
                            label: index + 1,
                            range,
                          }),
                        )}
                        {@const unitLabel = allGaugesAttributes.find(
                          (item) => item.id === id,
                        )?.unit.label[projectUnits]}
                        {@const gaugeLabel = `${
                          allGaugesAttributes.find((item) => item.id === id)
                            ?.label
                        } Yarn Palette`}
                        {@const gaugeName =
                          allGaugesAttributes.find((item) => item.id === id)
                            ?.label ?? ''}
                        {@const palettePage = gaugePalettePages[gaugeIndex]}
                        <div class="flex flex-col">
                          <div class="flex flex-col">
                            <PaletteStrip
                              colors={colors ?? []}
                              label={gaugeLabel}
                            />
                            <div
                              class="mt-4 flex flex-wrap items-center justify-center gap-2"
                            >
                              <a
                                class="btn preset-tonal-primary border-primary-500 border"
                                aria-label="Open a copy of the {gaugeName} yarn palette"
                                title="Open a copy in the Yarn Palette Creator. This gallery page won’t change."
                                onclick={() => {
                                  if (!colors) return;
                                  yarnPageState.gauge.colors = colors;
                                  // Its gallery name, which Save Palette offers
                                  yarnPageState.suggestion = {
                                    name: palettePage?.title
                                      ? galleryTitleText(palettePage.title)
                                      : `${projectTitleNoHTML} – ${gaugeName}`.slice(
                                          0,
                                          80,
                                        ),
                                    colors: $state.snapshot(colors),
                                  };
                                }}
                                href={resolve('/yarn')}
                              >
                                <PaletteIcon />
                                Open a Copy
                              </a>
                              {#if palettePage}
                                <a
                                  class="btn hover:preset-tonal-surface"
                                  aria-label="{gaugeName} Palette Page"
                                  title="This yarn palette’s own gallery page"
                                  href={resolve('/gallery/palette/[id]', {
                                    id: String(palettePage.databaseId),
                                  })}
                                >
                                  <SwatchBookIcon />
                                  Palette Page
                                </a>
                              {/if}
                            </div>
                          </div>
                          <div class="mx-auto mt-4 w-fit">
                            <ViewMenu
                              bind:value={preferences.value.layout}
                              fillOption
                            />
                          </div>
                          <div class="mt-4 mb-2 xl:mb-4">
                            <GaugeColorsView
                              items={item}
                              {unitLabel}
                              unitType={gaugeType}
                              {rangeOptions}
                              gaugeId={id}
                            />
                          </div>
                        </div>
                      {/each}
                    {/key}
                  {/if}
                  {#if extraColors.length}
                    <div class="flex flex-col">
                      <p class="text-lg font-semibold">Additional Colors</p>
                      <div class="mt-4 mb-2 xl:mb-4">
                        <GaugeColorsView
                          items={extraColors.map(({ label, color }) => ({
                            color,
                            label,
                          }))}
                        />
                      </div>
                    </div>
                  {/if}
                </div>
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

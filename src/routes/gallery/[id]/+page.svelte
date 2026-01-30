<!-- Copyright (c) 2024, Thomas (https://github.com/jdvlpr)

This file is part of Temperature-Blanket-Web-App.

Temperature-Blanket-Web-App is free software: you can redistribute it and/or modify it
under the terms of the GNU General Public License as published by the Free Software Foundation, 
either version 3 of the License, or (at your option) any later version.

Temperature-Blanket-Web-App is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; 
without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. 
See the GNU General Public License for more details.

You should have received a copy of the GNU General Public License along with Temperature-Blanket-Web-App. 
If not, see <https://www.gnu.org/licenses/>. -->

<script>
  import { browser } from '$app/environment';
  import { page } from '$app/state';
  import { PUBLIC_BASE_URL } from '$env/static/public';
  import AppLogo from '$lib/components/AppLogo.svelte';
  import AppShell from '$lib/components/AppShell.svelte';
  import Card from '$lib/components/Card.svelte';
  import ColorPalette from '$lib/components/ColorPalette.svelte';
  import Spinner from '$lib/components/Spinner.svelte';
  import YarnSources from '$lib/components/YarnSources.svelte';
  import ViewToggle from '$lib/components/buttons/ViewToggle.svelte';
  import { ALL_YARN_WEIGHTS } from '$lib/constants';
  import { safeSlide } from '$lib/features/transitions/safeSlide';
  import { allGaugesAttributes, locations } from '$lib/state';
  import { preferences } from '$lib/storage/preferences.svelte';
  import {
    exists,
    getProjectParametersFromURLHash,
    getTextColor,
    getTitleFromLocationsMeta,
    parseGaugeURLHash,
    pluralize,
    stripHTMLTags,
  } from '$lib/utils';
  import {
    ArrowLeftIcon,
    ChevronDown,
    InfoIcon,
    ShoppingCartIcon,
  } from '@lucide/svelte';
  import { Accordion } from '@skeletonlabs/skeleton-svelte';
  import { onMount } from 'svelte';
  import { yarnPageState } from '../../yarn/state.svelte';

  let { data } = $props();

  let imageWidth = $state();
  let imageHeight = $state();

  let project = $state();
  let projectURL = $state();
  let projectTitle = $state();
  let projectTitleNoHTML = $state('');
  let weatherSources = $state();
  let hash;
  let params = $state();
  let gauges = $state();
  let flatColors = $state();

  let aboutState = $state([]);

  onMount(async () => {
    const { project: streamedProject } = await data.stream;

    project = streamedProject;
    projectURL = project?.projectUrl;
    projectTitle = getTitleFromLocationsMeta(project.locations);
    projectTitleNoHTML = stripHTMLTags(projectTitle);
    weatherSources = project?.weatherSources
      ? JSON.parse(project?.weatherSources)
      : null;
    hash = projectURL ? new URL(projectURL).hash.substring(1) : '';
    params = getProjectParametersFromURLHash(hash);
    gauges = getGauges(params);
    flatColors = gauges.flatMap((item) => item.colors);
  });

  let yarns = [];

  let reshapedColors = $derived(
    flatColors?.reduce((acc, color) => {
      const { brandId, yarnId, brandName, yarnName, name, hex, yarnWeightId } =
        color;
      if (
        !yarns.find(
          (item) => item.brandId === brandId && item.yarnId === yarnId,
        )
      ) {
        yarns.push({
          brandId,
          brandName,
          yarnWeightId,
          yarnId,
          yarnName,
          colors: [],
        });
      }
      yarns
        .find((item) => item.brandId === brandId && item.yarnId === yarnId)
        .colors.push({ name, hex });
      return yarns;
    }, {}) || null,
  );

  let projectUnits = $derived(params?.u?.value === 'i' ? 'imperial' : 'metric');

  function getGauges(params) {
    if (!browser) return [];
    let _gauges = [];

    allGaugesAttributes.forEach((gauge) => {
      if (!exists(params[gauge.id])) return;
      const settings = parseGaugeURLHash(params[gauge.id].value, gauge);
      _gauges.push(settings);
    });

    return _gauges;
  }

  const preloadImage = (src) => {
    if (!browser) return;
    return new Promise(async (resolve) => {
      let img = new Image();
      img.onload = resolve();
      img.src = src;
      imageWidth = img.width;
      imageHeight = img.height;
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
    <meta property="og:image:width" content={imageWidth} />
  {/key}
  {#key imageHeight}
    <meta property="og:image:height" content={imageHeight} />
  {/key}
</svelte:head>

<AppShell pageName="Project Preview">
  {#snippet stickyHeader()}
    <div class="mx-auto hidden lg:inline-flex"><AppLogo /></div>
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
            <div
              class="bg-surface-100 dark:bg-surface-900 flex flex-col gap-2 p-4 text-center"
            >
              <p class="text-xl">
                {#await data.stream}
                  ...
                {:then}
                  {#if project}
                    {@html projectTitle}
                  {:else}
                    This project gallery page cannot be found.
                  {/if}
                {/await}
              </p>

              {#await data.stream then}
                {#if projectURL}
                  <a
                    class="btn preset-filled-primary-500 m-auto w-fit items-center gap-1"
                    href={projectURL}
                    target={locations.allValid ? '_blank' : '_self'}
                  >
                    Open in {#if locations.allValid}
                      New
                    {/if} Project Planner
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke-width="1.5"
                      stroke="currentColor"
                      class="size-5"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        d="m8.25 4.5 7.5 7.5-7.5 7.5"
                      />
                    </svg>
                  </a>
                {/if}
              {/await}
              <div
                class="preset-tonal-tertiary rounded-container mx-auto mt-2 w-full max-w-(--breakpoint-sm) text-left"
              >
                <Accordion
                  value={aboutState}
                  onValueChange={(e) => (aboutState = e.value)}
                  collapsible
                >
                  <Accordion.Item value="weather-data-inaccurate">
                    <Accordion.ItemTrigger
                      class="flex items-center justify-between gap-2"
                    >
                      <InfoIcon />

                      <p class="">About this Project</p>

                      <Accordion.ItemIndicator class="group">
                        <ChevronDown
                          class="h-5 w-5 transition group-data-[state=open]:rotate-180"
                        />
                      </Accordion.ItemIndicator>
                    </Accordion.ItemTrigger>
                    <Accordion.ItemContent>
                      {#snippet element(attributes)}
                        {#if !attributes.hidden}
                          <div {...attributes} transition:safeSlide>
                            {#await data.stream then}
                              <div class="flex flex-col gap-2">
                                <p class="">
                                  <span class="font-bold">Date Created:</span>
                                  {new Date(project?.date).toLocaleDateString(
                                    undefined,
                                    {
                                      timeZone: 'UTC',
                                    },
                                  )}
                                </p>

                                {#if JSON.stringify(reshapedColors) !== '{}'}
                                  {#if reshapedColors?.some((item) => item.brandName && item.yarnName)}
                                    <span class="">
                                      <span class="font-bold">Yarn</span>:
                                      <div class="flex flex-col gap-2 pl-4">
                                        {#each reshapedColors as { brandName, yarnName, yarnWeightId, colors }}
                                          {@const yarnWeightName =
                                            ALL_YARN_WEIGHTS.find(
                                              (n) => n.id === yarnWeightId,
                                            )?.name}
                                          {#if brandName && yarnName}
                                            <div>
                                              <span>
                                                {brandName}
                                                -
                                                {yarnName}
                                                <span
                                                  class="text-sm opacity-70"
                                                >
                                                  ({#if yarnWeightName}
                                                    <a
                                                      href="/blog/yarn-weights?highlight={yarnWeightName}"
                                                      class="link"
                                                      target="_blank"
                                                      title="See the yarn weights chart"
                                                      >{yarnWeightName}</a
                                                    >,
                                                  {/if}{colors.length}
                                                  {pluralize(
                                                    'colorway',
                                                    colors.length,
                                                  )})
                                                </span>
                                              </span>
                                              <div class="pl-4">
                                                {#each colors as { name, hex }, index}
                                                  <div
                                                    class="flex items-center gap-2"
                                                  >
                                                    <div
                                                      class="h-4 w-4 rounded-full"
                                                      style="background:{hex};"
                                                    ></div>
                                                    <p class="">
                                                      {name}
                                                    </p>
                                                  </div>
                                                {/each}
                                              </div>
                                            </div>
                                          {/if}
                                        {/each}
                                      </div>
                                    </span>
                                  {/if}
                                {/if}

                                {#if project?.projectTags.nodes[0].name}
                                  <p>
                                    <span class="font-bold">Pattern Type</span>:
                                    <span class=""
                                      >{project?.projectTags.nodes[0]
                                        .name}</span
                                    >
                                  </p>
                                {/if}

                                {#if project?.projectTags.nodes[0].description}
                                  <p>
                                    <span class="font-bold"
                                      >Pattern Description</span
                                    >:
                                    <span class="">
                                      {project?.projectTags.nodes[0]
                                        .description}</span
                                    >
                                  </p>
                                {/if}

                                {#if project?.totalDays}
                                  <p>
                                    <span class="font-bold">Total Days</span>:
                                    <span class="">{project?.totalDays}</span>
                                  </p>
                                {/if}

                                {#if project?.missingDays}
                                  <p>
                                    <span class="font-bold"
                                      >Days Without Weather Data</span
                                    >:
                                    <span class="">{project?.missingDays}</span>
                                  </p>
                                {/if}

                                {#if weatherSources}
                                  {#each weatherSources as { name, url }}
                                    <p>
                                      <span class="font-bold"
                                        >Weather Source</span
                                      >:
                                      <a href={url} target="_blank" class="link"
                                        >{name}</a
                                      >
                                    </p>
                                  {/each}
                                {/if}

                                <p class="italic">
                                  The preview image below may not reflect the
                                  most recent weather information. Open the
                                  project in the Project Planner to see any
                                  updates.
                                </p>
                              </div>
                            {/await}
                          </div>
                        {/if}
                      {/snippet}
                    </Accordion.ItemContent>
                  </Accordion.Item>
                </Accordion>
              </div>
            </div>
          {/snippet}
          {#snippet content()}
            <div class="grid grid-cols-1 gap-2 py-2">
              <div class="mt-2 text-center">
                {#await data.stream}
                  <div class="my-40"><Spinner /></div>
                {:then}
                  {#if project}
                    <img
                      src={project?.featuredImage?.node.mediaItemUrl}
                      alt="Project Preview"
                      class="m-auto max-h-[60vh]"
                    />
                  {/if}
                {/await}
              </div>

              {#await data.stream then}
                <div class="mt-2 flex flex-col gap-4 text-center">
                  <div class="flex flex-col gap-8">
                    {#if gauges?.length}
                      {#key gauges}
                        {#each gauges as { colors, ranges, id }, gaugeIndex}
                          {@const gaugeType = gauges[gaugeIndex].unit.type}
                          {@const item = ranges.map((range, index) => {
                            return {
                              range,
                              ...colors[index],
                            };
                          })}
                          {@const unitLabel = allGaugesAttributes.find(
                            (item) => item.id === id,
                          )?.unit.label[projectUnits]}
                          {@const gaugeLabel = `${
                            allGaugesAttributes.find((item) => item.id === id)
                              ?.label
                          } Yarn Palette`}
                          {@const hasAffiliateLinks = colors
                            ? colors?.some(
                                (color) => !!color.affiliate_variant_href,
                              )
                            : false}
                          <div class="flex flex-col">
                            <div class="flex flex-col">
                              <ColorPalette {colors} schemeName={gaugeLabel} />
                              <a
                                class="btn preset-tonal-primary border-primary-500 m-auto mt-4 w-fit gap-1 border"
                                onclick={() => {
                                  yarnPageState.gauge.colors = colors;
                                }}
                                href="/yarn"
                              >
                                Open in Yarn Palette Creator
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  fill="none"
                                  viewBox="0 0 24 24"
                                  stroke-width="1.5"
                                  stroke="currentColor"
                                  class="size-5"
                                >
                                  <path
                                    stroke-linecap="round"
                                    stroke-linejoin="round"
                                    d="m8.25 4.5 7.5 7.5-7.5 7.5"
                                  />
                                </svg>
                              </a>
                            </div>
                            {#if hasAffiliateLinks}
                              <p class="mt-4 px-2 text-sm">
                                Purchases via links with a shopping cart icon <ShoppingCartIcon
                                  class="relative -top-px inline size-4"
                                /> support the developer of this web app at no extra
                                cost to you.
                              </p>
                            {/if}
                            <div class="mx-auto mt-4 w-fit">
                              <ViewToggle />
                            </div>
                            <div
                              class="rounded-container mt-4 mb-2 overflow-hidden xl:mb-4 {preferences
                                .value.layout === 'grid'
                                ? 'grid grid-cols-2 gap-1 md:grid-cols-3 xl:grid-cols-4'
                                : 'flex flex-col'}"
                            >
                              {#each item as { range, hex, name, yarnName, brandName, affiliate_variant_href, variant_href }, i}
                                <div
                                  class="flex flex-wrap items-center justify-around gap-2 p-2 {preferences
                                    .value.layout === 'grid'
                                    ? 'rounded-container flex-auto basis-1/3 sm:basis-1/4 md:basis-1/5'
                                    : ''}"
                                  style="background-color:{hex};color:{getTextColor(
                                    hex,
                                  )}"
                                >
                                  <p class="text-xs">
                                    {i + 1}
                                  </p>
                                  <div
                                    class="flex items-center justify-start gap-2"
                                  >
                                    {#if gaugeType === 'category'}
                                      <p id="range-{i}-value">{range.label}</p>
                                    {:else}
                                      <span
                                        class="flex flex-col items-start text-left"
                                        id="range-{i}-from"
                                      >
                                        <span class="text-xs">From</span>
                                        <span class="flex items-start">
                                          <span class="text-lg"
                                            >{range.from}</span
                                          >
                                          <span class="text-xs"
                                            >{unitLabel}</span
                                          >
                                        </span>
                                      </span>
                                      <span
                                        class="flex flex-col items-start text-left"
                                        id="range-{i}-to"
                                      >
                                        <span class="text-xs">To</span>
                                        <span class="flex items-start">
                                          <span class="text-lg">{range.to}</span
                                          >
                                          <span class="text-xs"
                                            >{unitLabel}</span
                                          >
                                        </span>
                                      </span>
                                    {/if}
                                  </div>
                                  {#if affiliate_variant_href}
                                    <a
                                      class="btn hover:preset-tonal-surface flex flex-wrap items-center justify-start"
                                      href={affiliate_variant_href}
                                      target="_blank"
                                      rel="noreferrer nofollow"
                                    >
                                      <ShoppingCartIcon />
                                      <span class="underline">Buy</span></a
                                    >
                                  {/if}
                                  {#if brandName && yarnName}
                                    <div
                                      class="flex flex-col items-start justify-start text-left text-wrap whitespace-normal"
                                    >
                                      <span class="text-xs"
                                        >{brandName}
                                        -
                                        {yarnName}</span
                                      >
                                      <span
                                        class="flex flex-wrap items-start justify-start text-lg leading-tight"
                                      >
                                        {name}
                                      </span>
                                    </div>
                                  {:else}
                                    {hex}
                                  {/if}
                                </div>
                              {/each}
                            </div>
                          </div>
                        {/each}
                      {/key}
                    {/if}
                  </div>
                </div>
              {/await}
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

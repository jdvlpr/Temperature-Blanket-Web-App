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
  import { settings as daytimeGaugeSettings } from '$lib/components/gauges/DaytimeGauge.svelte';
  import { settings as rainGaugeSettings } from '$lib/components/gauges/RainGauge.svelte';
  import { settings as snowGaugeSettings } from '$lib/components/gauges/SnowGauge.svelte';
  import { gaugeSettings as temperatureGaugeSettings } from '$lib/components/gauges/TemperatureGauge.svelte';
  import { ALL_YARN_WEIGHTS, ICONS } from '$lib/constants';
  import { allGaugesAttributes, layout, locationsState } from '$lib/state';
  import {
    exists,
    getProjectParametersFromURLHash,
    getTextColor,
    getTitleFromLocationsMeta,
    parseGaugeURLHash,
    pluralize,
    stripHTMLTags,
  } from '$lib/utils';
  import { Accordion, AccordionItem } from '@skeletonlabs/skeleton';
  import { onMount } from 'svelte';
  import { yarn as yarnPalleteCreatorPageColors } from './../../yarn/+page.svelte';

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
      switch (gauge.id) {
        case 'temp': {
          const settings = parseGaugeURLHash(params[gauge.id].value, {
            ...$temperatureGaugeSettings,
          });
          _gauges.push(settings);
          break;
        }
        case 'prcp': {
          const settings = parseGaugeURLHash(params[gauge.id].value, {
            ...$rainGaugeSettings,
          });
          _gauges.push(settings);
          break;
        }
        case 'snow': {
          const settings = parseGaugeURLHash(params[gauge.id].value, {
            ...$snowGaugeSettings,
          });
          _gauges.push(settings);
          break;
        }
        case 'dayt': {
          const settings = parseGaugeURLHash(params[gauge.id].value, {
            ...$daytimeGaugeSettings,
          });
          _gauges.push(settings);
          break;
        }
        default:
          break;
      }
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

<AppShell pageName="Project Preivew">
  {#snippet stickyHeader()}
    <div class="hidden lg:inline-flex mx-auto"><AppLogo /></div>
  {/snippet}
  {#snippet main()}
    <div class="transition-opacity opacity-100">
      <main class="max-w-screen-xl m-auto flex flex-col justify-start gap-2">
        <a
          href="/gallery"
          class="flex items-center btn bg-primary-hover-token gap-1 w-fit mx-2 lg:mx-0 mt-2 lg:mt-0"
        >
          {@html ICONS.arrowBack}
          Project Gallery</a
        >
        <Card>
          {#snippet header()}
            <div
              class="bg-surface-200-700-token text-token p-4 text-center flex flex-col gap-2"
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
                    class="btn variant-filled-primary w-fit m-auto flex flex-wrap items-center gap-1"
                    href={projectURL}
                    target={locationsState.allValid ? '_blank' : '_self'}
                  >
                    {#if locationsState.allValid}
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke-width="1.5"
                        stroke="currentColor"
                        class="w-6 h-6"
                      >
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25"
                        />
                      </svg>
                    {:else}
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke-width="1.5"
                        stroke="currentColor"
                        class="w-6 h-6"
                      >
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z"
                        />
                      </svg>
                    {/if}
                    Open in {#if locationsState.allValid}
                      New
                    {/if} Project Planner
                  </a>
                {/if}
              {/await}
              <div
                class="text-left max-w-screen-sm mx-auto w-full variant-soft-tertiary text-token rounded-container-token mt-2"
              >
                <Accordion>
                  <AccordionItem disabled={!project}>
                    {#snippet lead()}
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke-width="1.5"
                        stroke="currentColor"
                        class="w-6 h-6"
                      >
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          d="m11.25 11.25.041-.02a.75.75 0 0 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.853l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-3.75h.008v.008H12V8.25Z"
                        />
                      </svg>
                    {/snippet}
                    {#snippet summary()}
                      <p class="">About this Project</p>
                    {/snippet}
                    {#snippet content()}
                      {#await data.stream then}
                        <div class="flex flex-col gap-2">
                          <p class="">
                            <span class="font-bold">Date Created:</span>
                            {new Date(project?.date).toLocaleDateString()}
                          </p>

                          {#if JSON.stringify(reshapedColors) !== '{}'}
                            {#if reshapedColors?.some((item) => item.brandName && item.yarnName)}
                              <span class="">
                                <span class="font-bold">Yarn</span>:
                                <div class="pl-4 flex flex-col gap-2">
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
                                          <span class="text-sm opacity-70">
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
                                              class="flex gap-2 items-center"
                                            >
                                              <div
                                                class="w-4 h-4 rounded-full"
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
                                >{project?.projectTags.nodes[0].name}</span
                              >
                            </p>
                          {/if}

                          {#if project?.projectTags.nodes[0].description}
                            <p>
                              <span class="font-bold">Pattern Description</span
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
                                <span class="font-bold">Weather Source</span>:
                                <a href={url} target="_blank" class="link"
                                  >{name}</a
                                >
                              </p>
                            {/each}
                          {/if}

                          <p class="italic">
                            The preview image below may not reflect the most
                            recent weather information. Open the project in the
                            Project Planner to see any updates.
                          </p>
                        </div>
                      {/await}
                    {/snippet}
                  </AccordionItem>
                </Accordion>
              </div>
            </div>
          {/snippet}
          {#snippet content()}
            <div class="grid grid-cols-1 gap-2 py-2">
              <div class="text-center mt-2">
                {#await data.stream}
                  <div class="my-40"><Spinner /></div>
                {:then}
                  {#if project}
                    <img
                      src={project?.featuredImage?.node.mediaItemUrl}
                      alt="Project Preivew"
                      class="max-h-[60vh] m-auto"
                    />
                  {:else}
                    <p class="font-ornament text-6xl my-20">;</p>
                  {/if}
                {/await}
              </div>

              {#await data.stream then}
                <div class="text-center flex flex-col gap-4 mt-2">
                  <div class="flex flex-col gap-8">
                    {#if gauges?.length}
                      {#key gauges}
                        {#each gauges as { colors, ranges, id }, gaugeIndex}
                          {@const item = ranges.map((range, index) => {
                            return {
                              ...range,
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
                                class="btn variant-ghost-primary w-fit m-auto mt-4 flex flex-wrap items-center gap-1"
                                onclick={() => {
                                  yarnPalleteCreatorPageColors.colors = colors;
                                }}
                                href="/yarn"
                              >
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  fill="none"
                                  viewBox="0 0 24 24"
                                  stroke-width="1.5"
                                  stroke="currentColor"
                                  class="w-6 h-6"
                                >
                                  <path
                                    stroke-linecap="round"
                                    stroke-linejoin="round"
                                    d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z"
                                  />
                                </svg>
                                Open in Yarn Palette Creator
                              </a>
                            </div>
                            {#if hasAffiliateLinks}
                              <p class="px-2 mt-4 text-sm">
                                Items purchased through links with a shopping
                                bag icon
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  fill="none"
                                  viewBox="0 0 24 24"
                                  stroke-width="1.5"
                                  stroke="currentColor"
                                  class="w-5 h-5 inline relative bottom-1"
                                >
                                  <path
                                    stroke-linecap="round"
                                    stroke-linejoin="round"
                                    d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 01.75 0zm7.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z"
                                  />
                                </svg>
                                help support this site by earning the developer a
                                percentage of each sale, at no additional cost to
                                you.
                              </p>
                            {/if}
                            <div class="mt-4">
                              <ViewToggle />
                            </div>
                            <div
                              class="rounded-container-token overflow-hidden mt-4 mb-2 xl:mb-4 {layout.value ===
                              'grid'
                                ? 'gap-1 grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4'
                                : 'flex flex-col'}"
                            >
                              {#each item as { from, to, hex, name, yarnName, brandName, affiliate_variant_href, variant_href }, i}
                                <div
                                  class="flex p-2 gap-2 items-center justify-around flex-wrap {layout.value ===
                                  'grid'
                                    ? 'rounded-container-token md:basis-1/5 sm:basis-1/4 basis-1/3 flex-auto'
                                    : ''}"
                                  style="background-color:{hex};color:{getTextColor(
                                    hex,
                                  )}"
                                >
                                  <p class="text-xs">
                                    {i + 1}
                                  </p>
                                  <div
                                    class="flex gap-2 justify-start items-center"
                                  >
                                    <span
                                      class="flex flex-col text-left items-start"
                                      id="range-0-from"
                                    >
                                      <span class="text-xs">From</span>
                                      <span class="flex items-start">
                                        <span class="text-lg">{from}</span>
                                        <span class="text-xs">{unitLabel}</span>
                                      </span>
                                    </span>
                                    <span
                                      class="flex flex-col text-left items-start"
                                      id="range-0-to"
                                    >
                                      <span class="text-xs">To</span>
                                      <span class="flex items-start">
                                        <span class="text-lg">{to}</span>
                                        <span class="text-xs">{unitLabel}</span>
                                      </span>
                                    </span>
                                  </div>
                                  {#if affiliate_variant_href}
                                    <a
                                      class="btn bg-secondary-hover-token flex flex-wrap justify-start items-center"
                                      href={affiliate_variant_href}
                                      target="_blank"
                                      rel="noreferrer nofollow"
                                      ><svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke-width="1.5"
                                        stroke="currentColor"
                                        class="w-6 h-6"
                                        ><path
                                          stroke-linecap="round"
                                          stroke-linejoin="round"
                                          d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 01.75 0zm7.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z"
                                        /></svg
                                      >
                                      <span class="underline">Buy</span></a
                                    >
                                  {/if}
                                  {#if brandName && yarnName}
                                    <div
                                      class="flex flex-col items-start justify-start whitespace-normal text-left text-wrap"
                                    >
                                      <span class="text-xs"
                                        >{brandName}
                                        -
                                        {yarnName}</span
                                      >
                                      <span
                                        class="flex flex-wrap justify-start items-start text-lg leading-tight"
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

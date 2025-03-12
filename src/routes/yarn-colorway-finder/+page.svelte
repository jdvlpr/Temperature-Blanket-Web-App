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

<script module lang="ts">
  class YarnColorwayFinderState {
    selectedBrandId = $state('');
    selectedYarnId = $state('');
    selectedYarnWeightId: YarnWeight['id'] | '' = $state('');
    search = $state('');
    hex = $state('');
    inputTypeTextValue = $state('');
    inputTypeColorElement = $state(null);
    sortColors = $state('default');
  }

  const yarnColorwayFinderState = new YarnColorwayFinderState();
</script>

<script lang="ts">
  import { browser, version } from '$app/environment';
  import { PUBLIC_BASE_URL } from '$env/static/public';
  import AppLogo from '$lib/components/AppLogo.svelte';
  import AppShell from '$lib/components/AppShell.svelte';
  import Card from '$lib/components/Card.svelte';
  import Footer from '$lib/components/Footer.svelte';
  import SelectYarn from '$lib/components/SelectYarn.svelte';
  import SelectYarnWeight from '$lib/components/SelectYarnWeight.svelte';
  import Share from '$lib/components/Share.svelte';
  import Spinner from '$lib/components/Spinner.svelte';
  import YarnSources from '$lib/components/YarnSources.svelte';
  import ToTopButton from '$lib/components/buttons/ToTopButton.svelte';
  import ViewToggleBindable from '$lib/components/buttons/ViewToggleBindable.svelte';
  import {
    ALL_COLORWAYS_WITH_AFFILIATE_LINKS,
    ALL_YARN_WEIGHTS,
    YARN_COLORWAYS_PER_PAGE,
  } from '$lib/constants';
  import { toast } from '$lib/state';
  import type { YarnWeight } from '$lib/types';
  import {
    getTextColor,
    pluralize,
    sortColorsByName,
    sortColorsByNameZtoA,
    sortColorsDarktoLight,
    sortColorsLightToDark,
  } from '$lib/utils';
  import { brands } from '$lib/yarns/brands';
  import {
    ArrowDownWideNarrowIcon,
    ExternalLinkIcon,
    PlusIcon,
    SearchIcon,
    ShoppingBagIcon,
  } from '@lucide/svelte';
  import { Accordion } from '@skeletonlabs/skeleton-svelte';
  import chroma from 'chroma-js';
  import { onMount } from 'svelte';

  let loadMoreSpinner = $state();
  let urlParams;
  let isLoaded = false;
  let filtersContainer = $state();
  let showScrollToTopButton = $state(false);
  let itemsToShow = $state(YARN_COLORWAYS_PER_PAGE);

  let results = $state([]);
  let gettingResults = $state(true);
  let loadingAllColors = $state(false);

  let layout = $state('grid');

  let accordionState = $state([]);

  let debounceTimer;
  const debounce = (callback, time) => {
    if (!browser) return;
    window.clearTimeout(debounceTimer);
    debounceTimer = window.setTimeout(callback, time);
  };

  onMount(() => {
    urlParams = new URLSearchParams(window.location.search);
    // Load URL
    if (urlParams?.has('f')) getURLYarnParams(urlParams.get('f'));

    if (urlParams?.has('fw')) {
      const weightId: YarnWeight['id'] = urlParams.get('fw');
      if (weightId && ALL_YARN_WEIGHTS.map((n) => n.id).includes(weightId)) {
        yarnColorwayFinderState.selectedYarnWeightId = weightId;
      }
    }

    if (urlParams?.has('c')) {
      const color = urlParams.get('c');
      if (chroma.valid(color)) {
        yarnColorwayFinderState.hex = chroma(color).hex('rgb');
        yarnColorwayFinderState.inputTypeTextValue = color;
        yarnColorwayFinderState.inputTypeColorElement.value =
          chroma(color).hex('rgb');
        yarnColorwayFinderState.inputTypeColorElement.dispatchEvent(
          new Event('change'),
        );
      }
    }
    if (urlParams?.has('n'))
      yarnColorwayFinderState.search = urlParams.get('n');

    const scrollObserver = new IntersectionObserver(
      (entries, observer) => {
        entries.forEach((entry) => {
          if (entry.intersectionRatio === 0) {
            showScrollToTopButton = true;
          } else {
            showScrollToTopButton = false;
          }
        });
      },
      { threshold: 0 },
    );
    scrollObserver.observe(filtersContainer);
    isLoaded = true;
    getResults();
  });

  function getShareableURL({
    selectedBrandId,
    selectedYarnId,
    selectedYarnWeightId,
    search,
    hex,
  }) {
    if (!browser) return;

    let url = `${window.location.origin}${window.location.pathname}`;

    const params = {};

    if (selectedBrandId && selectedYarnId)
      params.f = `${selectedBrandId}-${selectedYarnId}`;
    else if (selectedBrandId) params.f = selectedBrandId;
    else if (selectedYarnId) params.f = selectedYarnId;

    if (selectedYarnWeightId) params.fw = selectedYarnWeightId;

    if (hex) params.c = hex.includes('#') ? hex.substring(1) : hex;
    if (search) params.n = search;

    if (params?.f || params?.fw || params?.c || params?.n) {
      params.v = version;
      url += '?';
      url += new URLSearchParams(params).toString();
    }
    const href = new URL(url).href;
    return href;
  }

  function getURLYarnParams(paramString) {
    if (!paramString?.includes('-')) {
      // check if brandId exists
      if (brands.find((brand) => brand.id === paramString))
        yarnColorwayFinderState.selectedBrandId = paramString;
      // check if yarnId exists
      if (
        brands
          .flatMap((brand) => brand.yarns)
          .find((yarn) => yarn.id === paramString)
      )
        yarnColorwayFinderState.selectedYarnId = paramString;
      return;
    }
    const [brandId, yarnId] = paramString.split('-');
    // check if brandId exists
    if (brands.find((brand) => brand.id === brandId))
      yarnColorwayFinderState.selectedBrandId = brandId;
    // check if yarnId exists
    if (
      brands.flatMap((brand) => brand.yarns).find((yarn) => yarn.id === yarnId)
    )
      yarnColorwayFinderState.selectedYarnId = yarnId;
  }

  function getResults() {
    if (!isLoaded || !browser) return;
    // debounce is because it sometimes got called more than once at a time
    gettingResults = true;
    debounce(() => {
      let _results = ALL_COLORWAYS_WITH_AFFILIATE_LINKS.filter((colorway) =>
        yarnColorwayFinderState.selectedBrandId
          ? colorway.brandId === yarnColorwayFinderState.selectedBrandId
          : true,
      )
        .filter((colorway) =>
          yarnColorwayFinderState.selectedYarnId
            ? colorway.yarnId === yarnColorwayFinderState.selectedYarnId
            : true,
        )
        .filter((colorway) =>
          yarnColorwayFinderState.selectedYarnWeightId
            ? colorway.yarnWeightId ===
              yarnColorwayFinderState.selectedYarnWeightId
            : true,
        );

      // filter by search text
      if (yarnColorwayFinderState.search !== '') {
        _results = _results.filter((color) => {
          let find = yarnColorwayFinderState.search.toLowerCase();
          return color.name.toLowerCase().includes(find);
        });
      }

      if (yarnColorwayFinderState.hex)
        _results = _results
          .map((color) => {
            return {
              ...color,
              delta: chroma.deltaE(yarnColorwayFinderState.hex, color.hex),
            };
          })
          .sort((a, b) => (a.delta > b.delta ? 1 : b.delta > a.delta ? -1 : 0))
          .filter((color) => color.delta < 40);

      switch (yarnColorwayFinderState.sortColors) {
        case 'light-to-dark':
          _results = sortColorsLightToDark({
            colors: _results,
          });
          break;
        case 'dark-to-light':
          _results = sortColorsDarktoLight({
            colors: _results,
          });
          break;
        case 'name':
          _results = sortColorsByName({
            colors: _results,
          });
          break;
        case 'name-z-to-a':
          _results = sortColorsByNameZtoA({
            colors: _results,
          });
          break;
        default:
          break;
      }

      if (_results.length > itemsToShow) _results.length = itemsToShow;
      results = _results;
      gettingResults = false;
      loadingAllColors = false;
    }, 200);
  }

  function inputTypeColorOnChange({ value }) {
    let __color = value;
    if (!chroma.valid(__color)) {
      return;
    }
    yarnColorwayFinderState.inputTypeTextValue = __color;
    yarnColorwayFinderState.hex = chroma(__color).hex('rgb'); // use 'rgb' to prevent alpha hex codes
    if (browser) {
      yarnColorwayFinderState.inputTypeColorElement.value =
        chroma(__color).hex('rgb');
    }
  }

  function inputTypeTextOnChange({ value }) {
    let __color = value;
    if (!chroma.valid(__color)) {
      return;
    }
    yarnColorwayFinderState.inputTypeTextValue = __color;
    if (browser) {
      yarnColorwayFinderState.inputTypeColorElement.value =
        chroma(__color).hex('rgb');
      yarnColorwayFinderState.inputTypeColorElement.dispatchEvent(
        new Event('change'),
      );
    }
    yarnColorwayFinderState.hex = chroma(__color).hex('rgb'); // use 'rgb' to prevent alpha hex codes
  }
  let yarns = $derived(
    yarnColorwayFinderState.selectedBrandId === ''
      ? brands
          .flatMap((n, i) =>
            n.yarns.map((n) => {
              return {
                ...n,
                brandId: brands[i].id,
                brandName: brands[i].name,
              };
            }),
          )
          .sort((a, b) => {
            const nameA = a.name.toUpperCase(); // ignore upper and lowercase
            const nameB = b.name.toUpperCase(); // ignore upper and lowercase
            if (nameA > nameB) {
              return 1;
            }
            if (nameA < nameB) {
              return -1;
            }
            // names must be equal
            return 0;
          })
      : brands
          ?.filter(
            (brand) => brand.id === yarnColorwayFinderState.selectedBrandId,
          )
          ?.flatMap((n) => {
            return n.yarns.map((yarn) => {
              return {
                ...yarn,
                brandId: n.id,
                brandName: n.name,
              };
            });
          }),
  );
  let totalResults = $derived(
    yarns
      .filter((yarn) => {
        if (!yarnColorwayFinderState.selectedYarnId) return true;
        return yarn.id === yarnColorwayFinderState.selectedYarnId;
      })
      .filter((yarn) => {
        if (!yarnColorwayFinderState.selectedYarnWeightId) return true;
        return yarn.weightId === yarnColorwayFinderState.selectedYarnWeightId;
      })
      .flatMap((n) => n.colorways.map((m) => m.colors.length))
      .reduce((partialSum, a) => partialSum + a, 0),
  );

  $effect(() => {
    yarnColorwayFinderState.selectedBrandId,
      yarnColorwayFinderState.selectedYarnId,
      yarnColorwayFinderState.selectedYarnWeightId,
      yarnColorwayFinderState.search,
      yarns,
      yarnColorwayFinderState.sortColors,
      itemsToShow,
      yarnColorwayFinderState.hex,
      getResults();
  });

  let areAnyResultsAffiliate = $derived(
    results.some((result) => result.affiliate_variant_href),
  );
  let shareableURL = $derived(
    getShareableURL({
      selectedBrandId: yarnColorwayFinderState.selectedBrandId,
      selectedYarnId: yarnColorwayFinderState.selectedYarnId,
      selectedYarnWeightId: yarnColorwayFinderState.selectedYarnWeightId,
      search: yarnColorwayFinderState.search,
      hex: yarnColorwayFinderState.hex,
    }),
  );
</script>

<svelte:head>
  <title>Yarn Colorway Finder</title>
  <meta
    name="description"
    content="Browse a collection of yarn colorways. Filter by brand or yarn name, and search by HTML color name or hex code to find matching yarn colorways."
  />

  <meta property="og:title" content="Yarn Colorway Finder" />
  <meta
    property="og:description"
    content="Browse a collection of yarn colorways. Filter by brand or yarn name, and search by HTML color name or hex code to find matching yarn colorways."
  />
  <meta property="og:url" content="{PUBLIC_BASE_URL}/yarn-colorway-finder" />
  <meta property="og:type" content="website" />
  <meta
    property="og:image"
    content="{PUBLIC_BASE_URL}/images/temperature-blanket-og-image-5.0.0.jpg"
  />
  <meta property="og:image:width" content="1200" />
  <meta property="og:image:height" content="630" />
</svelte:head>

{#if showScrollToTopButton}
  <ToTopButton
    bottom="10px"
    onClick={() =>
      filtersContainer.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      })}
  />
{/if}

<AppShell pageName="Yarn Colorway Finder">
  {#snippet stickyHeader()}
    <div class="hidden lg:inline-flex"><AppLogo /></div>
    <Share href={shareableURL} />
  {/snippet}
  {#snippet main()}
    <main class="max-w-(--breakpoint-xl) m-auto pb-6">
      <Card>
        {#snippet header()}
          <div>
            <div class="bg-surface-200 dark:bg-surface-800 p-4">
              <p class="text-center">
                Browse a collection of yarn colorways. Filter by brand or yarn
                name, and search by HTML hex color code to find matching yarn
                colorways.
              </p>
            </div>
          </div>
        {/snippet}
        {#snippet content()}
          <div class=" flex-col flex items-center my-2">
            <div
              bind:this={filtersContainer}
              class="grid grid-cols-12 gap-4 items-end scroll-mt-[66px] justify-between my-2 w-full"
            >
              <div
                class="flex flex-col justify-start w-full col-span-full gap-1"
              >
                <span class="flex items-center gap-1"
                  ><svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke-width="1.5"
                    stroke="currentColor"
                    class="w-4 h-4"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
                    />
                  </svg>
                  Search by Color</span
                >
                <div class="flex flex-wrap items-center justify-center gap-1">
                  <div class="input-group grid-cols-[auto_1fr_auto] w-full">
                    <input
                      type="color"
                      class="input ig-cell p-0 m-2 rounded-full!"
                      bind:this={yarnColorwayFinderState.inputTypeColorElement}
                      onchange={(e) =>
                        inputTypeColorOnChange({
                          value: e.target.value,
                        })}
                    />
                    <input
                      type="text"
                      placeholder="e.g., pink, #c3f4d2"
                      style="background:{yarnColorwayFinderState.hex ||
                        'none'} !important;color:{getTextColor(
                        yarnColorwayFinderState.hex,
                      )}"
                      value={yarnColorwayFinderState.inputTypeTextValue}
                      onkeyup={(e) =>
                        inputTypeTextOnChange({
                          value: e.target.value,
                        })}
                    />
                    {#if (!!yarnColorwayFinderState.hex || !!yarnColorwayFinderState.inputTypeTextValue) && !!yarnColorwayFinderState.inputTypeColorElement?.value}
                      <button
                        aria-label="Clear Color"
                        class="p-2"
                        onclick={() => {
                          yarnColorwayFinderState.hex = '';
                          yarnColorwayFinderState.inputTypeTextValue = '';
                          if (browser)
                            yarnColorwayFinderState.inputTypeColorElement.value =
                              '#000000';
                        }}
                        ><svg
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
                            d="M6 18L18 6M6 6l12 12"
                          />
                        </svg>
                      </button>
                    {/if}
                  </div>
                </div>
              </div>

              <div
                class="w-full col-span-12 md:col-span-9"
                class:md:col-span-full={!!yarnColorwayFinderState.selectedBrandId &&
                  !!yarnColorwayFinderState.selectedYarnId}
              >
                <SelectYarn
                  preselectDefaultYarn={false}
                  bind:selectedBrandId={yarnColorwayFinderState.selectedBrandId}
                  bind:selectedYarnId={yarnColorwayFinderState.selectedYarnId}
                  selectedYarnWeightId={yarnColorwayFinderState.selectedYarnWeightId}
                />
              </div>

              {#key yarnColorwayFinderState.selectedBrandId || yarnColorwayFinderState.selectedYarnId}
                <div
                  class="w-full col-span-12 md:col-span-3"
                  class:hidden={!!yarnColorwayFinderState.selectedBrandId &&
                    !!yarnColorwayFinderState.selectedYarnId}
                >
                  <SelectYarnWeight
                    selectedBrandId={yarnColorwayFinderState.selectedBrandId}
                    bind:selectedYarnWeightId={
                      yarnColorwayFinderState.selectedYarnWeightId
                    }
                  />
                </div>
              {/key}

              <div
                class="flex flex-col justify-start w-full col-span-12 md:col-span-3 gap-1"
              >
                <span class="flex items-center gap-1">
                  <SearchIcon class="size-4" />
                  <span>Colorway Name</span>
                </span>
                <div class="flex flex-wrap items-center justify-center gap-1">
                  <div class="input-group grid-cols-[1fr_auto] w-full">
                    <input
                      id="yarn-select-search-input"
                      autocomplete="off"
                      placeholder="e.g., Wisteria, Cream"
                      type="text"
                      class="ig-input w-full"
                      bind:value={yarnColorwayFinderState.search}
                      oninput={() => {
                        itemsToShow = YARN_COLORWAYS_PER_PAGE;
                      }}
                    />
                    {#if yarnColorwayFinderState.search}
                      <button
                        aria-label="Clear Search"
                        class="ig-btn hover:preset-tonal"
                        onclick={() => {
                          yarnColorwayFinderState.search = '';
                        }}
                        ><svg
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
                            d="M6 18L18 6M6 6l12 12"
                          />
                        </svg>
                      </button>
                    {/if}
                  </div>
                </div>
              </div>

              <label class="label w-full col-span-8 md:col-span-3">
                <span class="flex items-center gap-1">
                  <ArrowDownWideNarrowIcon class="size-4" />
                  <span>Sort By</span>
                </span>
                <select
                  class="select"
                  id="sort-colors-by"
                  bind:value={yarnColorwayFinderState.sortColors}
                  disabled={gettingResults}
                >
                  <option value="default">Default</option>
                  <option value="light-to-dark">Lightest to Darkest</option>
                  <option value="dark-to-light">Darkest to Lightest</option>
                  <option value="name">Name A-Z</option>
                  <option value="name-z-to-a">Name Z-A</option>
                </select>
              </label>
            </div>

            {#if areAnyResultsAffiliate}
              <p class="text-sm text-center mt-2">
                Items purchased through some links (marked with a shopping bag
                icon) earn the developer of this site a percentage of the sale
                at no additional cost to you.
              </p>
            {/if}

            {#if results?.length && !loadingAllColors}
              <p class=" my-2">
                {#if totalResults === results.length}
                  {totalResults}
                {:else}
                  Showing {results.length.toLocaleString()}
                  of {totalResults.toLocaleString()}
                {/if}
                {pluralize('Colorway', totalResults)}
              </p>
              <ViewToggleBindable bind:value={layout} />
            {/if}

            {#if results?.length && !loadingAllColors}
              <div
                class="rounded-container overflow-hidden my-4 justify-center w-full gap-1 {layout ===
                'grid'
                  ? 'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5'
                  : 'flex flex-col'}"
              >
                {#each results as { hex, name, delta, brandName, yarnName, variant_href, affiliate_variant_href, unavailable }}
                  {@const percentMatch = Math.floor(100 - delta)}
                  <div
                    class="shadow-sm flex-1 min-w-fit p-2 flex items-center gap-x-2 rounded-container {layout ===
                    'grid'
                      ? 'justify-center'
                      : ''}"
                    style="background:{hex}; color:{getTextColor(hex)};"
                  >
                    <!-- <div class={layout === "grid" ? "" : "md:w-2/5"}></div> -->
                    <div class="min-w-[43px] min-h-[43px]">
                      {#if !unavailable}
                        {#if affiliate_variant_href}
                          <a
                            aria-label="Buy this yarn colorway"
                            class="btn-icon hover:preset-tonal"
                            title="Buy this yarn colorway"
                            href={affiliate_variant_href}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <ShoppingBagIcon />
                          </a>
                        {:else}
                          <a
                            aria-label="Open link to this yarn colorway"
                            class="btn-icon hover:preset-tonal"
                            href={variant_href}
                            target="_blank"
                            rel="noopener noreferrer"
                            title="Open link to this yarn colorway"
                          >
                            <ExternalLinkIcon />
                          </a>
                        {/if}
                      {/if}
                    </div>
                    <div class="flex flex-col items-start text-pretty gap-1">
                      <span class="text-left text-xs">
                        {brandName} - {yarnName}
                      </span>

                      <button
                        class="text-lg leading-tight"
                        onclick={() => {
                          window.navigator.clipboard.writeText(name);
                          toast.trigger({
                            message: `<span class="font-bold">${name}</span> copied to clipboard`,
                            background: 'preset-tonal-success',
                          });
                        }}>{name}</button
                      >

                      <button
                        class="text-xs select-all"
                        onclick={() => {
                          window.navigator.clipboard.writeText(hex);
                          toast.trigger({
                            message: `<span class="font-bold">${hex}</span> copied to clipboard`,
                            background: 'preset-tonal-success',
                          });
                        }}>{hex}</button
                      >

                      {#if percentMatch}
                        <p class="text-xs">
                          {percentMatch}% Match
                        </p>
                      {/if}
                    </div>
                  </div>
                {/each}
              </div>
            {:else if gettingResults}
              <div class="my-6 mx-auto">
                <Spinner />
              </div>
            {:else}
              <div
                class="mx-auto preset-tonal-warning text-center card p-4 my-2"
              >
                <p>No Matching Colorways</p>
                <p class="text-sm">Try changing the filters above</p>
              </div>
            {/if}
            {#if results.length === itemsToShow}
              <div class="w-full flex justify-center mx-auto">
                <button
                  class="btn rounded-container bg-primary-200-800 mb-2"
                  bind:this={loadMoreSpinner}
                  onclick={() => {
                    if (itemsToShow <= results.length)
                      itemsToShow += YARN_COLORWAYS_PER_PAGE;
                    getResults();
                  }}
                >
                  <PlusIcon />
                  Show More</button
                >
              </div>
            {/if}
          </div>
        {/snippet}
      </Card>
    </main>
  {/snippet}
  {#snippet footer()}
    <Footer>
      {#snippet about()}
        <span>
          <Accordion
            value={accordionState}
            onValueChange={(e) => (accordionState = e.value)}
            collapsible
            multiple
          >
            {#snippet iconOpen()}<svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke-width="1.5"
                stroke="currentColor"
                class="size-4"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  d="m4.5 15.75 7.5-7.5 7.5 7.5"
                />
              </svg>
            {/snippet}
            {#snippet iconClosed()}<svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke-width="1.5"
                stroke="currentColor"
                class="size-4"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  d="m19.5 8.25-7.5 7.5-7.5-7.5"
                />
              </svg>
            {/snippet}
            <Accordion.Item value="accurate">
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
                    d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z"
                  />
                </svg>
              {/snippet}
              {#snippet control()}
                <p class="font-bold">Are the colors accurate?</p>
              {/snippet}
              {#snippet panel()}
                Colors on a screen will always look different from actual yarn
                colorways. The colors used for this site are meant to be an
                approximation. They also might not be up-to-date; some colorways
                might have changed or not be available. These results do not
                represent official colorway information from their respective
                companies. The process used to obtain colorway information is
                described here: <a
                  href="/documentation/#getting-yarn-colorway-data"
                  class="link">Getting Yarn Colorway Data</a
                >. If you find an inaccuracy, send an email to
                hello@temperature-blanket.com.
              {/snippet}
            </Accordion.Item>
            <Accordion.Item value="find">
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
                    d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z"
                  />
                </svg>
              {/snippet}
              {#snippet control()}
                <p class="font-bold">
                  What if I can't find the yarn I'm looking for?
                </p>
              {/snippet}
              {#snippet panel()}
                Requests for yarn to be included in these results can be made by
                anyone using <a
                  href="/yarn-search-request"
                  rel="noreferrer"
                  class="link">this request form.</a
                >.
              {/snippet}
            </Accordion.Item>
          </Accordion>
        </span>
      {/snippet}

      {#snippet sources()}
        <span>
          <YarnSources />
        </span>
      {/snippet}
    </Footer>
  {/snippet}
</AppShell>

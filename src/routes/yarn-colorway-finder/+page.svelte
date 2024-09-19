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

<script context="module" lang="ts">
  let selectedBrandId = writable('');
  let selectedYarnId = writable('');
  let selectedYarnWeightId: Writable<YarnWeight['id'] | ''> = writable('');
  let search = writable('');
  let hex = writable('');
  let inputTypeTextValue = writable('');
  let inputTypeColorElement = writable(null);
  let sortColors = writable('default');
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
  import ViewToggle from '$lib/components/buttons/ViewToggle.svelte';
  import {
    ALL_COLORWAYS_WITH_AFFILIATE_LINKS,
    ALL_YARN_WEIGHTS,
    YARN_COLORWAYS_PER_PAGE,
  } from '$lib/constants';
  import { layout } from '$lib/stores';
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
  import { Accordion, AccordionItem } from '@skeletonlabs/skeleton';
  import chroma from 'chroma-js';
  import { onMount } from 'svelte';
  import { writable, type Writable } from 'svelte/store';

  let loadMoreSpinner;
  let urlParams;
  let isLoaded = false;
  let filtersContainer;
  let showScrollToTopButton = false;
  let itemsToShow = YARN_COLORWAYS_PER_PAGE;

  let results = [];
  let gettingResults = true;
  let loadingAllColors = false;

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
        $selectedYarnWeightId = weightId;
      }
    }

    if (urlParams?.has('c')) {
      const color = urlParams.get('c');
      if (chroma.valid(color)) {
        $hex = chroma(color).hex('rgb');
        $inputTypeTextValue = color;
        $inputTypeColorElement.value = chroma(color).hex('rgb');
        $inputTypeColorElement.dispatchEvent(new Event('change'));
      }
    }
    if (urlParams?.has('n')) $search = urlParams.get('n');

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

  $: yarns =
    $selectedBrandId === ''
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
          ?.filter((brand) => brand.id === $selectedBrandId)
          ?.flatMap((n) => {
            return n.yarns.map((yarn) => {
              return {
                ...yarn,
                brandId: n.id,
                brandName: n.name,
              };
            });
          });

  $: totalResults = yarns
    .filter((yarn) => {
      if (!$selectedYarnId) return true;
      return yarn.id === $selectedYarnId;
    })
    .filter((yarn) => {
      if (!$selectedYarnWeightId) return true;
      return yarn.weightId === $selectedYarnWeightId;
    })
    .flatMap((n) => n.colorways.map((m) => m.colors.length))
    .reduce((partialSum, a) => partialSum + a, 0);

  $: $selectedBrandId,
    $selectedYarnId,
    $selectedYarnWeightId,
    $search,
    yarns,
    $sortColors,
    itemsToShow,
    $hex,
    getResults();

  $: areAnyResultsAffiliate = results.some(
    (result) => result.affiliate_variant_href,
  );

  $: shareableURL = getShareableURL({
    selectedBrandId: $selectedBrandId,
    selectedYarnId: $selectedYarnId,
    selectedYarnWeightId: $selectedYarnWeightId,
    search: $search,
    hex: $hex,
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
        $selectedBrandId = paramString;
      // check if yarnId exists
      if (
        brands
          .flatMap((brand) => brand.yarns)
          .find((yarn) => yarn.id === paramString)
      )
        $selectedYarnId = paramString;
      return;
    }
    const [brandId, yarnId] = paramString.split('-');
    // check if brandId exists
    if (brands.find((brand) => brand.id === brandId))
      $selectedBrandId = brandId;
    // check if yarnId exists
    if (
      brands.flatMap((brand) => brand.yarns).find((yarn) => yarn.id === yarnId)
    )
      $selectedYarnId = yarnId;
  }

  function getResults() {
    if (!isLoaded || !browser) return;
    // debounce is because it sometimes got called more than once at a time
    gettingResults = true;
    debounce(() => {
      let _results = ALL_COLORWAYS_WITH_AFFILIATE_LINKS.filter((colorway) =>
        $selectedBrandId ? colorway.brandId === $selectedBrandId : true,
      )
        .filter((colorway) =>
          $selectedYarnId ? colorway.yarnId === $selectedYarnId : true,
        )
        .filter((colorway) =>
          $selectedYarnWeightId
            ? colorway.yarnWeightId === $selectedYarnWeightId
            : true,
        );

      // filter by search text
      if ($search !== '') {
        _results = _results.filter((color) => {
          let find = $search.toLowerCase();
          return color.name.toLowerCase().includes(find);
        });
      }

      if ($hex)
        _results = _results
          .map((color) => {
            return {
              ...color,
              delta: chroma.deltaE($hex, color.hex),
            };
          })
          .sort((a, b) => (a.delta > b.delta ? 1 : b.delta > a.delta ? -1 : 0))
          .filter((color) => color.delta < 40);

      switch ($sortColors) {
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
    $inputTypeTextValue = __color;
    $hex = chroma(__color).hex('rgb'); // use 'rgb' to prevent alpha hex codes
    if (browser) {
      $inputTypeColorElement.value = chroma(__color).hex('rgb');
    }
  }

  function inputTypeTextOnChange({ value }) {
    let __color = value;
    if (!chroma.valid(__color)) {
      return;
    }
    $inputTypeTextValue = __color;
    if (browser) {
      $inputTypeColorElement.value = chroma(__color).hex('rgb');
      $inputTypeColorElement.dispatchEvent(new Event('change'));
    }
    $hex = chroma(__color).hex('rgb'); // use 'rgb' to prevent alpha hex codes
  }
</script>

<svelte:head>
  <title>Yarn Colorway Finder</title>
  <meta
    name="description"
    content="Browse a collection of yarn colorways. Filter by brand or yarn name, and search by HTML color name or hex code to find matching yarn colorways."
  />
  <meta
    name="viewport"
    content="width=device-width, initial-scale=1, maximum-scale=1.0, user-scalable=no"
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
    content="{PUBLIC_BASE_URL}/images/yarn-colorway-finder-og-image-2.4.0.jpg"
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
  <svelte:fragment slot="stickyHeader">
    <div class="hidden lg:inline-flex mx-auto"><AppLogo /></div>
    <Share href={shareableURL} />
  </svelte:fragment>
  <main slot="main" class="max-w-screen-xl m-auto pb-6">
    <Card>
      <div slot="header">
        <div class="bg-surface-200-700-token text-token p-4">
          <p class="text-center">
            Browse a collection of yarn colorways. Filter by brand or yarn name,
            and search by HTML hex color code to find matching yarn colorways.
          </p>
        </div>
      </div>
      <div slot="content" class=" flex-col flex items-center my-2">
        <div
          bind:this={filtersContainer}
          class="grid grid-cols-12 gap-4 items-end scroll-mt-[66px] justify-between my-2 w-full"
        >
          <div class="flex flex-col justify-start w-full col-span-full gap-1">
            <span class="flex items-center label gap-1"
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
              <div
                class="input-group input-group-divider grid-cols-[auto_1fr_auto]"
              >
                <input
                  type="color"
                  class="input !rounded-none input-group-shim"
                  bind:this={$inputTypeColorElement}
                  on:change={(e) =>
                    inputTypeColorOnChange({
                      value: e.target.value,
                    })}
                />
                <input
                  type="text"
                  placeholder="e.g., pink, #c3f4d2"
                  style="background:{$hex} !important;color:{getTextColor(
                    $hex,
                  )}"
                  value={$inputTypeTextValue}
                  on:keyup={(e) =>
                    inputTypeTextOnChange({
                      value: e.target.value,
                    })}
                />
                {#if (!!$hex || !!$inputTypeTextValue) && !!$inputTypeColorElement?.value}
                  <button
                    on:click={() => {
                      $hex = '';
                      $inputTypeTextValue = '';
                      if (browser) $inputTypeColorElement.value = '#000000';
                    }}
                    ><svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke-width="1.5"
                      stroke="currentColor"
                      class="w-5 h-5"
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

          {#key $selectedBrandId || $selectedYarnId}
            <div
              class="w-full col-span-12 md:col-span-9"
              class:md:col-span-full={!!$selectedBrandId && !!$selectedYarnId}
            >
              <SelectYarn
                preselectDefaultYarn={false}
                bind:selectedBrandId={$selectedBrandId}
                bind:selectedYarnId={$selectedYarnId}
                selectedYarnWeightId={$selectedYarnWeightId}
              />
            </div>

            <div
              class="w-full col-span-12 md:col-span-3"
              class:hidden={!!$selectedBrandId && !!$selectedYarnId}
            >
              <SelectYarnWeight
                selectedBrandId={$selectedBrandId}
                bind:selectedYarnWeightId={$selectedYarnWeightId}
              />
            </div>
          {/key}

          <div
            class="flex flex-col justify-start w-full col-span-12 md:col-span-3 gap-1"
          >
            <span class="flex items-center label gap-1">
              <svg
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
              Colorway Name</span
            >
            <div class="flex flex-wrap items-center justify-center gap-1">
              <div class="input-group input-group-divider grid-cols-[1fr_auto]">
                <input
                  id="yarn-select-search-input"
                  autocomplete="off"
                  placeholder="e.g., Wisteria, Cream"
                  type="text"
                  class="w-full input"
                  bind:value={$search}
                  on:input={() => {
                    itemsToShow = YARN_COLORWAYS_PER_PAGE;
                  }}
                />
                {#if $search}
                  <button
                    on:click={() => {
                      $search = '';
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
            <span class="flex items-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke-width="1.5"
                stroke="currentColor"
                class="w-4 h-4 mr-1"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  d="M3 7.5L7.5 3m0 0L12 7.5M7.5 3v13.5m13.5 0L16.5 21m0 0L12 16.5m4.5 4.5V7.5"
                />
              </svg>
              Sort By
            </span>
            <select
              class="select"
              id="sort-colors-by"
              bind:value={$sortColors}
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
            Items purchased through some links (marked with a shopping bag icon)
            earn the developer of this site a percentage of the sale at no
            additional cost to you.
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
          <ViewToggle />
        {/if}

        {#if results?.length && !loadingAllColors}
          <div
            class="rounded-container-token overflow-hidden my-4 justify-center w-full gap-1 {$layout ===
            'grid'
              ? 'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5'
              : 'flex flex-col'}"
          >
            {#each results as { hex, name, delta, brandName, yarnName, variant_href, affiliate_variant_href, unavailable }}
              {@const percentMatch = delta ? Math.floor(100 - delta) : null}
              <div
                class="shadow-sm flex-1 min-w-fit p-2 flex items-center gap-x-2 rounded-container-token {$layout ===
                'grid'
                  ? 'justify-center'
                  : ''}"
                style="background:{hex}; color:{getTextColor(hex)};"
              >
                <!-- <div class={$layout === "grid" ? "" : "md:w-2/5"}></div> -->
                <div class="min-w-[43px] min-h-[43px]">
                  {#if !unavailable}
                    {#if affiliate_variant_href}
                      <a
                        class="btn-icon bg-secondary-hover-token"
                        title="Buy this yarn colorway"
                        href={affiliate_variant_href}
                        target="_blank"
                        rel="noopener noreferrer"
                        ><svg
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke-width="1.5"
                          stroke="currentColor"
                          class="w-5 h-5"
                        >
                          <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 01.75 0zm7.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z"
                          />
                        </svg>
                      </a>
                    {:else}
                      <a
                        class="btn-icon bg-secondary-hover-token"
                        href={variant_href}
                        target="_blank"
                        rel="noopener noreferrer"
                        title="Open link to this yarn colorway"
                        ><svg
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke-width="1.5"
                          stroke="currentColor"
                          class="w-5 h-5"
                        >
                          <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25"
                          />
                        </svg>
                      </a>
                    {/if}
                  {/if}
                </div>
                <div class="flex flex-col items-start text-pretty">
                  <span class="text-left text-xs">
                    {brandName} - {yarnName}
                  </span>

                  <span class="text-lg leading-tight">{name}</span>

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
            class="mx-auto variant-soft-warning text-token text-center card p-4 my-2"
          >
            <p>No Matching Colorways</p>
            <p class="text-sm">Try changing the filters above</p>
          </div>
        {/if}
        {#if results.length === itemsToShow}
          <div class="w-full flex justify-center mx-auto">
            <button
              class="btn rounded-container-token bg-primary-200-700-token text-token gap-1 mb-2 font-bold"
              bind:this={loadMoreSpinner}
              on:click={() => {
                if (itemsToShow <= results.length)
                  itemsToShow += YARN_COLORWAYS_PER_PAGE;
                getResults();
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
                  d="M12 4.5v15m7.5-7.5h-15"
                />
              </svg>
              Show More</button
            >
          </div>
        {/if}
      </div>
    </Card>
  </main>
  <Footer slot="footer">
    <span slot="about">
      <Accordion>
        <AccordionItem>
          <svelte:fragment slot="lead">
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
          </svelte:fragment>
          <svelte:fragment slot="summary"
            ><p class="font-bold">Are the colors accurate?</p></svelte:fragment
          >
          <svelte:fragment slot="content">
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
          </svelte:fragment>
        </AccordionItem>
        <AccordionItem>
          <svelte:fragment slot="lead">
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
          </svelte:fragment>
          <svelte:fragment slot="summary"
            ><p class="font-bold">
              What if I can't find the yarn I'm looking for?
            </p></svelte:fragment
          >
          <svelte:fragment slot="content">
            Requests for yarn to be included in these results can be made by
            anyone using <a
              href="/yarn-search-request"
              rel="noreferrer"
              class="link">this request form.</a
            >.
          </svelte:fragment>
        </AccordionItem>
      </Accordion>
    </span>

    <span slot="sources">
      <YarnSources />
    </span>
  </Footer>
</AppShell>

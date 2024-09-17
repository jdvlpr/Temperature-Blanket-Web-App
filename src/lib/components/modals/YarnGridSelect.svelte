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

<script lang="ts">
  import DefaultYarnSet from '$lib/components/DefaultYarnSet.svelte';
  import SelectYarn from '$lib/components/SelectYarn.svelte';
  import Spinner from '$lib/components/Spinner.svelte';
  import ToTopButton from '$lib/components/buttons/ToTopButton.svelte';
  import { YARN_COLORWAYS_PER_PAGE } from '$lib/constants';
  import { defaultYarn } from '$lib/stores';
  import {
    getColorways,
    getTextColor,
    pluralize,
    sortColorsByName,
    sortColorsByNameZtoA,
    sortColorsDarktoLight,
    sortColorsLightToDark,
    stringToBrandAndYarnDetails,
  } from '$lib/utils';
  import { brands } from '$lib/yarns/brands';
  import chroma from 'chroma-js';
  import { onMount } from 'svelte';
  import SelectYarnWeight from '../SelectYarnWeight.svelte';

  export let selectedBrandId = '';
  export let selectedYarnId = '';
  export let search = '';
  export let selectedColors: object[];
  export let limit = false;
  export let currentColor = { hex: '#ffffff' };
  export let onClickScrollToTop;
  export let scrollToTopButtonBottom = '100px';

  let loadMoreSpinner, loadMoreColors;

  let selectedYarnWeightId = '';

  let filtersContainer;
  let showScrollToTopButton = false;
  let scrollObserver = new IntersectionObserver(
    (entries, observer) => {
      entries.forEach((entry) => {
        if (entry.intersectionRatio != 1) {
          showScrollToTopButton = true;
        } else {
          showScrollToTopButton = false;
        }
      });
    },
    { threshold: 1 },
  );

  onMount(() => {
    scrollObserver.observe(filtersContainer);
    loadMoreColors = new IntersectionObserver(
      function (element) {
        // isIntersecting is true when element and viewport are overlapping
        // isIntersecting is false when element and viewport don't overlap
        if (element[0].isIntersecting === true) {
          if (itemsToShow <= results.length)
            itemsToShow += YARN_COLORWAYS_PER_PAGE;
          getResults;
        }
      },
      { threshold: [0] },
    );
    if (!selectedBrandId && !selectedYarnId && $defaultYarn) {
      let { brandId, yarnId } = stringToBrandAndYarnDetails($defaultYarn);
      if (brandId) selectedBrandId = brandId;
      if (yarnId) selectedYarnId = yarnId;
    }
  });

  let hasIncomingColor = !!selectedColors.length;
  let itemsToShow = YARN_COLORWAYS_PER_PAGE;

  // This is for preview extra colors, so that they can be marked as selected even though their color object only has a hex
  let canMarkIfHexMatches =
    selectedColors.length === 1 &&
    !selectedColors?.[0].name &&
    !selectedColors?.[0].brandId &&
    !selectedColors?.[0].yarnId;

  let sortColors = hasIncomingColor ? 'best-match' : 'default';
  let results = [];
  let gettingResults = true;
  let loadingAllColors = false;

  let debounceTimer;
  const debounce = (callback, time) => {
    window.clearTimeout(debounceTimer);
    debounceTimer = window.setTimeout(callback, time);
  };

  $: if (loadMoreSpinner) loadMoreColors.observe(loadMoreSpinner);

  $: yarns =
    selectedBrandId === ''
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
          ?.filter((brand) => brand.id === selectedBrandId)
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
      if (!selectedYarnId) return true;
      return yarn.id === selectedYarnId;
    })
    .filter((yarn) => {
      if (!selectedYarnWeightId) return true;
      return yarn.weightId === selectedYarnWeightId;
    })
    .flatMap((n) => n.colorways.map((m) => m.colors.length))
    .reduce((partialSum, a) => partialSum + a, 0);

  $: selectedBrandId,
    selectedYarnId,
    selectedYarnWeightId,
    search,
    yarns,
    sortColors,
    currentColor,
    itemsToShow,
    getResults();

  $: selectedIds = selectedColors.map(
    (n) => `${n.hex}${n.name}${n.brandId}${n.yarnId}`,
  );

  function getResults() {
    // debounce is because it sometimes got called more than once at a time

    gettingResults = true;
    debounce(() => {
      let _results = getColorways({
        selectedBrandId,
        selectedYarnId,
        selectedYarnWeightId,
      });

      // filter by search text
      if (search !== '') {
        _results = _results.filter((color) => {
          let find = search.toLowerCase();
          return color.name.toLowerCase().includes(find);
        });
      }

      switch (sortColors) {
        case 'best-match':
          _results = _results
            .map((color) => {
              return {
                ...color,
                delta: chroma.deltaE(currentColor.hex, color.hex),
              };
            })
            .sort((a, b) =>
              a.delta > b.delta ? 1 : b.delta > a.delta ? -1 : 0,
            );
          break;
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
    }, 0);
  }

  function toggleSelected({
    brandId,
    yarnId,
    hex,
    name,
    brandName,
    yarnName,
    variant_href,
    affiliate_variant_href,
  }) {
    if (canMarkIfHexMatches) canMarkIfHexMatches = false;
    const matchId = `${hex}${name}${brandId}${yarnId}`;
    const doesMatch = selectedIds.includes(matchId);
    if (doesMatch && selectedColors.length > 0 && !limit) {
      //remove the color
      const index = selectedIds.indexOf(matchId);
      selectedColors.splice(index, 1);
      selectedColors = selectedColors;
    } else {
      // add the the color
      selectedColors = [
        ...selectedColors,
        {
          hex,
          name,
          brandId,
          yarnId,
          brandName,
          yarnName,
          variant_href,
          affiliate_variant_href,
        },
      ];
    }

    if (limit && selectedColors.length) {
      selectedColors = selectedColors.slice(selectedColors.length - 1);
      if (sortColors === 'best-match')
        filtersContainer?.parentElement.scrollIntoView({
          behavior: 'smooth',
          block: 'start',
        });
    }
  }
</script>

{#if showScrollToTopButton}
  <ToTopButton bottom={scrollToTopButtonBottom} onClick={onClickScrollToTop} />
{/if}

<div
  class="w-full grid grid-cols-12 items-end gap-2 my-2"
  bind:this={filtersContainer}
>
  <div
    class="w-full col-span-full md:col-span-9 order-1"
    class:md:col-span-full={!!selectedBrandId && !!selectedYarnId}
  >
    <SelectYarn
      context="modal"
      bind:selectedBrandId
      bind:selectedYarnId
      {selectedYarnWeightId}
    />
  </div>

  {#if selectedBrandId && selectedYarnId}
    <div class="w-full col-span-full order-2 md:order-3">
      <DefaultYarnSet {selectedBrandId} {selectedYarnId} />
    </div>
  {/if}

  {#key selectedBrandId}
    <div
      class="w-full col-span-full md:col-span-3 order-3 md:order-2"
      class:hidden={!!selectedBrandId && !!selectedYarnId}
    >
      <SelectYarnWeight {selectedBrandId} bind:selectedYarnWeightId />
    </div>
  {/key}

  <div
    class="tex-left flex flex-col items-start w-full col-span-full md:col-span-5 order-4"
  >
    <label for="yarn-select-search-input" class="label flex items-center"
      ><svg
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
          d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
        />
      </svg>
      Colorway Names</label
    >
    <input
      id="yarn-select-search-input"
      autocomplete="off"
      placeholder="Search"
      type="text"
      class="w-full input"
      bind:value={search}
      on:input={() => {
        itemsToShow = YARN_COLORWAYS_PER_PAGE;
      }}
    />
  </div>

  <label class="label w-full col-span-8 md:col-span-3 md:col-start-10 order-5">
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
      bind:value={sortColors}
      disabled={gettingResults}
    >
      {#if hasIncomingColor}
        <option value="best-match">Best Match</option>
      {/if}
      <option value="default">Default</option>
      <option value="light-to-dark">Lightest to Darkest</option>
      <option value="dark-to-light">Darkest to Lightest</option>
      <option value="name">Name A-Z</option>
      <option value="name-z-to-a">Name Z-A</option>
    </select>
  </label>
</div>

{#if results?.length && !loadingAllColors}
  <p class="text-sm mt-2">
    {#if totalResults === results.length}
      {totalResults}
    {:else}
      Showing {results.length.toLocaleString()} of {totalResults.toLocaleString()}
    {/if}
    {pluralize('Colorway', totalResults)}
  </p>
{/if}
<div class="flex flex-wrap gap-1 my-4 justify-center">
  {#if results?.length && !loadingAllColors}
    {#each results as { hex, name, delta, brandName, yarnName, brandId, yarnId, variant_href, affiliate_variant_href }}
      {@const isSelected =
        (selectedIds.includes(`${hex}${name}${brandId}${yarnId}`) &&
          (hasIncomingColor ? currentColor.hex === hex : true)) ||
        (canMarkIfHexMatches && currentColor.hex === hex)}
      {@const percentMatch = Math.floor(100 - delta)}
      <button
        type="button"
        class="rounded-container-token shadow-sm cursor-pointer flex-1 min-w-fit p-2 flex flex-col gap-2 items-start justify-start"
        style="background:{hex}; color:{getTextColor(hex)};"
        on:click={() =>
          toggleSelected({
            brandId,
            yarnId,
            hex,
            name,
            brandName,
            yarnName,
            variant_href,
            affiliate_variant_href,
          })}
      >
        <div class="flex gap-2 items-center">
          {#if isSelected}
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
                d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          {:else}
            <span
              class="rounded-full mx-[2.5px] p-2 w-3 h-3 border-[1.5px]"
              style="border-color:{getTextColor(hex)}"
            />
          {/if}
          <div
            class="flex flex-col items-start justify-start text-left break-all"
          >
            <span class="text-xs">
              <span>{brandName} - {yarnName}</span>
            </span>
            <span class="text-lg leading-tight">{name}</span>
            {#if percentMatch}
              <span class="text-xs">
                {percentMatch}% Match
              </span>
            {/if}
          </div>
        </div>
      </button>
    {/each}
    {#if results.length === itemsToShow}
      <div class="mt-4 w-full" bind:this={loadMoreSpinner}>
        <Spinner />
      </div>
    {/if}
  {:else}
    <p class="italic">No Matching Colorways</p>
  {/if}
</div>

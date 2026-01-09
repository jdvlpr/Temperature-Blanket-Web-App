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
  import { defaultYarn } from '$lib/state';
  import type { Color } from '$lib/types';
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
  import { brands } from '$lib/data/yarns/brands';
  import {
    ArrowDownWideNarrowIcon,
    CircleCheckIcon,
    CircleIcon,
    SearchIcon,
  } from '@lucide/svelte';
  import chroma from 'chroma-js';
  import SelectYarnWeight from '../SelectYarnWeight.svelte';
  import { tick } from 'svelte';

  interface Props {
    selectedBrandId?: string;
    selectedYarnId?: string;
    search?: string;
    selectedColors: Color[];
    limit?: boolean;
    incomingColor?: Color;
    onClickScrollToTop: any;
    onSelection?: any;
    scrollToTopButtonBottom?: string;
  }

  let {
    selectedBrandId = $bindable(''),
    selectedYarnId = $bindable(''),
    search = $bindable(''),
    selectedColors = $bindable(),
    limit = false,
    incomingColor = { hex: '#ffffff' },
    onClickScrollToTop,
    onSelection,
    scrollToTopButtonBottom = '100px',
  }: Props = $props();

  let loadMoreSpinner = $state();

  let loadMoreColors = $state();

  let selectedYarnWeightId = $state('');

  let filtersContainer = $state();

  let showScrollToTopButton = $state(false);

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

  let hasIncomingColor = $state(selectedColors.length);

  let itemsToShow = $state(YARN_COLORWAYS_PER_PAGE);

  // This is for preview extra colors, so that they can be marked as selected even though their color object only has a hex
  let canMarkIfHexMatches = $state(
    selectedColors.length === 1 &&
      !selectedColors?.[0].name &&
      !selectedColors?.[0].brandId &&
      !selectedColors?.[0].yarnId,
  );

  let sortColors = $state(hasIncomingColor ? 'best-match' : 'default');

  let results = $state([]);

  let gettingResults = $state(true);

  let loadingAllColors = $state(false);

  let yarns = $derived(
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
          }),
  );

  let totalResults = $derived(
    yarns
      .filter((yarn) => {
        if (!selectedYarnId) return true;
        return yarn.id === selectedYarnId;
      })
      .filter((yarn) => {
        if (!selectedYarnWeightId) return true;
        return yarn.weightId === selectedYarnWeightId;
      })
      .flatMap((n) => n.colorways.map((m) => m.colors.length))
      .reduce((partialSum, a) => partialSum + a, 0),
  );

  let selectedIds = $derived(
    selectedColors.map((n) => `${n.hex}${n.name}${n.brandId}${n.yarnId}`),
  );

  function getResults() {
    gettingResults = true;
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
              delta: chroma.deltaE(incomingColor.hex, color.hex),
            };
          })
          .sort((a, b) => (a.delta > b.delta ? 1 : b.delta > a.delta ? -1 : 0));
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

    if (onSelection) onSelection(selectedColors);
  }

  $effect(() => {
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
    if (!selectedBrandId && !selectedYarnId && defaultYarn.value) {
      let { brandId, yarnId } = stringToBrandAndYarnDetails(defaultYarn.value);
      if (brandId) selectedBrandId = brandId;
      if (yarnId) selectedYarnId = yarnId;
    }
  });

  $effect(() => {
    if (loadMoreSpinner) loadMoreColors.observe(loadMoreSpinner);
  });

  $effect(() => {
    selectedBrandId;
    selectedYarnId;
    selectedYarnWeightId;
    search;
    yarns;
    sortColors;
    incomingColor;
    itemsToShow;
    tick().then(() => {
      getResults();
    });
  });
</script>

<div
  class="my-2 grid w-full grid-cols-12 items-end gap-2"
  bind:this={filtersContainer}
>
  <div
    class="order-1 col-span-full w-full md:col-span-9"
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
    <div class="order-2 col-span-full w-full md:order-3">
      <DefaultYarnSet {selectedBrandId} {selectedYarnId} />
    </div>
  {/if}

  {#key selectedBrandId}
    <div
      class="order-3 col-span-full w-full md:order-2 md:col-span-3"
      class:hidden={!!selectedBrandId && !!selectedYarnId}
    >
      <SelectYarnWeight {selectedBrandId} bind:selectedYarnWeightId />
    </div>
  {/key}

  <div
    class="tex-left order-4 col-span-full flex w-full flex-col items-start gap-1 md:col-span-5"
  >
    <label for="yarn-select-search-input" class="label flex items-center gap-1">
      <SearchIcon class="size-4" />
      <span>Colorway Name</span>
    </label>
    <input
      id="yarn-select-search-input"
      autocomplete="off"
      placeholder="e.g., Wisteria, Cream"
      type="text"
      class="input w-full"
      bind:value={search}
      oninput={() => {
        itemsToShow = YARN_COLORWAYS_PER_PAGE;
      }}
    />
  </div>

  <label class="label order-5 col-span-8 w-full md:col-span-3 md:col-start-10">
    <span class="flex items-center gap-1">
      <ArrowDownWideNarrowIcon class="size-4" />
      <span> Sort By</span>
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
  <p class="mt-2 text-sm">
    {#if totalResults === results.length}
      {totalResults}
    {:else}
      Showing {results.length.toLocaleString()} of {totalResults.toLocaleString()}
    {/if}
    {pluralize('Colorway', totalResults)}
  </p>
{/if}

<div class="my-4 flex flex-wrap justify-center gap-1">
  {#if results?.length && !loadingAllColors}
    {#each results as { hex, name, delta, brandName, yarnName, brandId, yarnId, variant_href, affiliate_variant_href }}
      {@const isSelected =
        (selectedIds.includes(`${hex}${name}${brandId}${yarnId}`) &&
          (hasIncomingColor ? incomingColor.hex === hex : true)) ||
        (canMarkIfHexMatches && incomingColor.hex === hex)}
      {@const percentMatch = Math.floor(100 - delta)}
      <button
        type="button"
        class="rounded-container flex min-w-fit flex-1 cursor-pointer flex-col items-start justify-start gap-2 p-1 shadow-xs sm:p-2"
        style="background:{hex}; color:{getTextColor(hex)};"
        onclick={() =>
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
        <div class="flex items-center gap-2">
          {#if isSelected}
            <CircleCheckIcon />
          {:else}
            <CircleIcon />
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
  {#if showScrollToTopButton}
    <ToTopButton
      bottom={scrollToTopButtonBottom}
      onClick={onClickScrollToTop}
    />
  {/if}
</div>

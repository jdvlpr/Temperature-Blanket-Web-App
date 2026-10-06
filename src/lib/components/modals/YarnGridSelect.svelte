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

<!-- @component
  Choose yarn colorways from the catalog, laid out like the Yarn Colorway
  Finder: filters, then a Sort and View menu over the colorways as cards or
  rows, with Show More. With `matchHex`, every colorway shows its match and
  Best match comes first. `limit` keeps just the last one chosen.
-->
<script lang="ts">
  import DefaultYarnSuggestion from '$lib/components/DefaultYarnSuggestion.svelte';
  import SelectYarn from '$lib/components/SelectYarn.svelte';
  import SelectYarnWeight from '$lib/components/SelectYarnWeight.svelte';
  import SortSelectMenu from '$lib/components/SortSelectMenu.svelte';
  import Spinner from '$lib/components/Spinner.svelte';
  import ToTopButton from '$lib/components/buttons/ToTopButton.svelte';
  import ViewMenu from '$lib/components/buttons/ViewMenu.svelte';
  import ColorwayCards from '$lib/components/yarn-colorways/ColorwayCards.svelte';
  import ColorwayRows from '$lib/components/yarn-colorways/ColorwayRows.svelte';
  import {
    canReverse,
    colorwaySortOptions,
    defaultColorwaySort,
    sortColorways,
    withDeltas,
    type ColorwaySort,
  } from '$lib/components/yarn-colorways/colorway-utils';
  import { YARN_COLORWAYS_PER_PAGE } from '$lib/constants/color-constants';
  import { ensureYarnData } from '$lib/data/yarns/colorways.svelte';
  import type { Color } from '$lib/types/yarn-types';
  import { pluralize } from '$lib/utils/string-utils';
  import { getColorways } from '$lib/utils/yarn-utils';
  import { PlusIcon, SearchIcon, XIcon } from '@lucide/svelte';
  import { onMount } from 'svelte';

  interface Props {
    selectedBrandId?: string;
    selectedYarnId?: string;
    search?: string;
    selectedColors: Color[];
    limit?: boolean;
    /** A color to match colorways to, or '' for none */
    matchHex?: string;
    onClickScrollToTop: () => void;
    onSelection?: (colors: Color[]) => void;
    scrollToTopButtonBottom?: string;
  }

  let {
    selectedBrandId = $bindable(''),
    selectedYarnId = $bindable(''),
    search = $bindable(''),
    selectedColors = $bindable(),
    limit = false,
    matchHex = '',
    onClickScrollToTop,
    onSelection,
    scrollToTopButtonBottom = '100px',
  }: Props = $props();

  let selectedYarnWeightId = $state('');
  let filtersContainer = $state<HTMLDivElement>();
  let showScrollToTopButton = $state(false);
  let itemsToShow = $state(YARN_COLORWAYS_PER_PAGE);
  let layout = $state<'grid' | 'list'>('grid');
  /** The chosen sort; null follows the color (best match with one) */
  let chosenSort = $state<ColorwaySort | null>(null);
  /** Reverse the sort (any but Best match); stays on across sorts */
  let reversed = $state(false);
  let yarnDataReady = $state(false);

  /** Tells colorways apart for choosing, as the palette stores them */
  const selectionId = ({ hex, name, brandId, yarnId }: Color) =>
    `${hex}${name}${brandId}${yarnId}`;

  // A preview's extra color is only a hex code: until another is chosen,
  // colorways of that color show as chosen
  let canMarkIfHexMatches = $state(
    selectedColors.length === 1 &&
      !selectedColors[0].name &&
      !selectedColors[0].brandId &&
      !selectedColors[0].yarnId,
  );

  let selectedIds = $derived(new Set(selectedColors.map(selectionId)));

  onMount(() => {
    ensureYarnData().then(() => (yarnDataReady = true));
  });

  $effect(() => {
    if (!filtersContainer) return;
    const observer = new IntersectionObserver(
      ([entry]) => (showScrollToTopButton = entry.intersectionRatio != 1),
      { threshold: 1 },
    );
    observer.observe(filtersContainer);
    return () => observer.disconnect();
  });

  /** The colorways that pass the filters and the name search */
  let filtered = $derived.by(() => {
    if (!yarnDataReady) return [];
    const find = search.toLowerCase();
    return getColorways({
      selectedBrandId,
      selectedYarnId,
      selectedYarnWeightId,
    }).filter(
      (colorway) => !find || (colorway.name ?? '').toLowerCase().includes(find),
    );
  });

  /** With a color, all of them, each with its match */
  let matched = $derived<(Color & { delta?: number })[]>(
    matchHex ? withDeltas(filtered, matchHex) : filtered,
  );

  let sort = $derived(
    chosenSort === 'best-match' && !matchHex
      ? defaultColorwaySort(false)
      : (chosenSort ?? defaultColorwaySort(!!matchHex)),
  );

  let sorted = $derived(sortColorways(matched, sort, reversed));
  let results = $derived(sorted.slice(0, itemsToShow));

  // A new search or sort starts again from the first page
  $effect.pre(() => {
    void matched;
    void sort;
    void reversed;
    itemsToShow = YARN_COLORWAYS_PER_PAGE;
  });

  function isSelected(colorway: Color) {
    return (
      (selectedIds.has(selectionId(colorway)) &&
        (!limit || matchHex === colorway.hex)) ||
      (canMarkIfHexMatches && matchHex === colorway.hex)
    );
  }

  function toggleSelected(colorway: Color) {
    canMarkIfHexMatches = false;
    const {
      hex,
      name,
      brandId,
      yarnId,
      brandName,
      yarnName,
      variant_href,
      affiliate_variant_href,
    } = colorway;
    const id = selectionId(colorway);

    if (!limit && selectedIds.has(id)) {
      selectedColors = selectedColors.filter((n) => selectionId(n) !== id);
    } else {
      const color = {
        hex,
        name,
        brandId,
        yarnId,
        brandName,
        yarnName,
        variant_href,
        affiliate_variant_href,
      };
      selectedColors = limit ? [color] : [...selectedColors, color];
      // Choosing one changes the color to match, which reorders the list
      if (limit && sort === 'best-match')
        filtersContainer?.parentElement?.scrollIntoView({
          behavior: 'smooth',
          block: 'start',
        });
    }

    onSelection?.(selectedColors);
  }
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
      bind:selectedBrandId
      bind:selectedYarnId
      {selectedYarnWeightId}
    />
  </div>

  <DefaultYarnSuggestion
    {selectedBrandId}
    {selectedYarnId}
    class="order-2 col-span-full md:order-3"
  />

  {#if yarnDataReady}
    {#key selectedBrandId}
      <div
        class="order-3 col-span-full w-full md:order-2 md:col-span-3"
        class:hidden={!!selectedBrandId && !!selectedYarnId}
      >
        <SelectYarnWeight {selectedBrandId} bind:selectedYarnWeightId />
      </div>
    {/key}
  {/if}

  <div class="label order-4 col-span-full w-full">
    <label class="label-text" for="yarn-select-search-input"
      >Colorway Name</label
    >
    <div class="input-group w-full grid-cols-[auto_1fr_auto]">
      <span class="ig-cell"><SearchIcon /></span>
      <input
        id="yarn-select-search-input"
        autocomplete="off"
        placeholder="e.g., Wisteria, Cream"
        type="text"
        class="ig-input truncate"
        bind:value={search}
      />
      {#if search}
        <button
          type="button"
          aria-label="Clear Search"
          class="ig-btn hover:preset-tonal-surface"
          onclick={() => (search = '')}><XIcon /></button
        >
      {/if}
    </div>
  </div>
</div>

{#if results.length}
  <div class="my-2 flex flex-wrap items-center justify-between gap-2">
    <p class="text-sm">
      {#if sorted.length > results.length}
        Showing {results.length.toLocaleString()} of
      {/if}
      {sorted.length.toLocaleString()}
      {pluralize('Colorway', sorted.length)}
    </p>
    <div class="flex flex-wrap items-center gap-2">
      <SortSelectMenu
        options={colorwaySortOptions(!!matchHex)}
        current={sort}
        {canReverse}
        {reversed}
        onsort={(chosen) => (chosenSort = chosen)}
        onreverse={(value) => (reversed = value)}
      />
      <ViewMenu bind:value={layout} />
    </div>
  </div>
  <div class="my-2 w-full">
    {#if layout === 'grid'}
      <ColorwayCards
        colorways={results}
        selection={{ isSelected, ontoggle: toggleSelected }}
      />
    {:else}
      <ColorwayRows
        colorways={results}
        selection={{ isSelected, ontoggle: toggleSelected }}
      />
    {/if}
  </div>
  {#if sorted.length > results.length}
    <div class="flex w-full justify-center">
      <button
        type="button"
        class="btn rounded-container bg-primary-200-800 mb-2"
        onclick={() => (itemsToShow += YARN_COLORWAYS_PER_PAGE)}
      >
        <PlusIcon />
        Show More</button
      >
    </div>
  {/if}
{:else if !yarnDataReady}
  <div class="mx-auto my-6">
    <Spinner />
  </div>
{:else}
  <p class="text-center italic">No Matching Colorways</p>
{/if}
{#if showScrollToTopButton}
  <ToTopButton bottom={scrollToTopButtonBottom} onClick={onClickScrollToTop} />
{/if}

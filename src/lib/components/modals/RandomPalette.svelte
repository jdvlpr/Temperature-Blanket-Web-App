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
  import ColorPaletteEditable from '$lib/components/ColorPaletteEditable.svelte';
  import DefaultYarnSuggestion from '$lib/components/DefaultYarnSuggestion.svelte';
  import { yarnUses } from '$lib/storage/yarn-uses.svelte';
  import SelectNumberOfColors from '$lib/components/SelectNumberOfColors.svelte';
  import SelectYarn from '$lib/components/SelectYarn.svelte';
  import Spinner from '$lib/components/Spinner.svelte';
  import SaveAndCloseButtons from '$lib/components/modals/SaveAndCloseButtons.svelte';
  import StickyPart from '$lib/components/modals/StickyPart.svelte';
  import { ensureYarnData } from '$lib/data/yarns/colorways.svelte';
  import { dialog } from '$lib/state/page-state.svelte';
  import type { Color } from '$lib/types/yarn-types';
  import SortSelectMenu from '$lib/components/SortSelectMenu.svelte';
  import { getSortedPalette, PALETTE_SORTS } from '$lib/utils/color-utils';
  import { pickRandomFromArray } from '$lib/utils/number-utils';
  import { getColorways, getFilteredYarns } from '$lib/utils/yarn-utils';
  import { ShuffleIcon } from '@lucide/svelte';
  import { onMount } from 'svelte';
  import SelectYarnWeight from '../SelectYarnWeight.svelte';

  let { numberOfColors, updateGauge } = $props();

  let yarnDataReady = $state(false);
  onMount(() => {
    ensureYarnData().then(() => {
      yarnDataReady = true;
    });
  });

  let debounceTimer: number | undefined;
  const debounce = (callback: () => void, time: number) => {
    window.clearTimeout(debounceTimer);
    debounceTimer = window.setTimeout(callback, time);
  };

  let randomPalette: Color[] = $state([]);
  let selectedBrandId = $state<string | undefined>();
  let selectedYarnId = $state<string | undefined>();
  let selectedYarnWeightId = $state('');
  /** Each new palette is sorted this way, or left as picked */
  const RANDOM_PALETTE_SORTS = [
    { value: 'none', label: 'None' },
    ...PALETTE_SORTS,
  ] as const;

  let sortColors =
    $state<(typeof RANDOM_PALETTE_SORTS)[number]['value']>('light-to-dark');

  function getRandomColors() {
    debounce(() => {
      // colorways is empty until the lazy-loaded yarn dataset resolves;
      // bail out instead of generating colors with missing hex values
      if (!colorways.length) return;

      const tempYarnColorways: Color[] = [];

      // Create a set of existing color hex values for faster lookup
      const existingColorways = new Set();

      const colorwaysLength = colorways.length;

      // Generate new yarn colorways until the desired number is reached
      while (tempYarnColorways.length < numberOfColors) {
        // Check if the current index has a locked color
        const currentIndex = tempYarnColorways.length;
        let color: Color;
        const lockedColor = randomPalette[currentIndex];
        if (lockedColor?.locked) {
          // Use the locked color instead of a random one
          color = lockedColor;
          const colorId = `${color.hex}-${color.name}-${color.brandId}-${color.yarnId}`;
          tempYarnColorways.push(color);
          existingColorways.add(colorId);
        } else {
          // Get a random color from the colorways array
          color = {
            ...pickRandomFromArray<Color>({
              array: colorways,
            }),
          };
          color.locked = false;
          const colorId = `${color.hex}-${color.name}-${color.brandId}-${color.yarnId}`;
          if (!existingColorways.has(colorId)) {
            // Add new colorway to the temporary array and update the set
            tempYarnColorways.push(color);
            existingColorways.add(colorId);
          } else if (
            numberOfColors > colorwaysLength &&
            tempYarnColorways.length >= colorwaysLength
          ) {
            // If the desired number of colors is greater than available colorways,
            // duplicate existing colorways until the desired number is reached
            tempYarnColorways.push(color);
          }
        }
      }
      randomPalette = getSortedPalette({
        palette: tempYarnColorways,
        sortColors,
      });
    }, 10);
  }
  let filteredYarnsList = $derived(
    getFilteredYarns({
      selectedBrandId,
    }),
  );
  let colorways = $derived(
    getColorways({
      selectedBrandId,
      selectedYarnId,
      selectedYarnWeightId,
    }),
  );

  $effect(() => {
    selectedBrandId;
    selectedYarnId;
    selectedYarnWeightId;
    numberOfColors;
    yarnDataReady;
    getRandomColors();
  });
</script>

<svelte:window
  onkeydown={(e) => {
    if (
      e.target instanceof HTMLElement &&
      (e.target.tagName === 'INPUT' ||
        e.target.tagName === 'TD' ||
        e.target.tagName === 'SELECT' ||
        e.target.tagName === 'BUTTON')
    )
      return;
    if (e.key === 'r') {
      getRandomColors();
    }
  }}
/>

<div class="px-4 pt-2 pb-2 sm:pb-4">
  <div class="grid w-full grid-cols-12 items-end justify-center gap-4">
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

    <div class="order-5 col-span-full justify-self-start sm:col-span-3">
      <SelectNumberOfColors
        {numberOfColors}
        max={99}
        onchange={(e) =>
          (numberOfColors = +(e.target as HTMLSelectElement).value)}
      />
    </div>

    <div class="order-6 col-span-full sm:col-span-4">
      <SortSelectMenu
        options={RANDOM_PALETTE_SORTS}
        current={sortColors}
        onsort={(sort) => {
          sortColors = sort;
          randomPalette = getSortedPalette({
            palette: randomPalette,
            sortColors,
          });
        }}
      />
    </div>

    <button
      class="btn preset-filled order-7 col-span-full sm:col-span-4 sm:col-start-9"
      title="Generate Random Colors (r)"
      onclick={() => {
        getRandomColors();
      }}
    >
      <ShuffleIcon />
      Randomize
    </button>
  </div>
</div>

<StickyPart position="bottom">
  <div class="p-2 sm:p-4">
    <div class="">
      {#if !yarnDataReady}
        <div class="mx-auto my-6">
          <Spinner />
        </div>
      {:else}
        {#key randomPalette}
          <ColorPaletteEditable
            canUserEditColor={false}
            bind:colors={randomPalette}
            onchanged={(eventColors: Color[] | undefined) => {
              if (eventColors) randomPalette = eventColors;
              numberOfColors = randomPalette.length;
            }}
          />
        {/key}
      {/if}
    </div>

    <SaveAndCloseButtons
      disabled={!yarnDataReady}
      onSave={() => {
        yarnUses.record(selectedBrandId, selectedYarnId);
        updateGauge({
          _colors: randomPalette.map((color) => {
            delete color.locked;
            delete color.id;
            return color;
          }),
        });
        dialog.close();
      }}
      onClose={dialog.close}
    />
  </div>
</StickyPart>

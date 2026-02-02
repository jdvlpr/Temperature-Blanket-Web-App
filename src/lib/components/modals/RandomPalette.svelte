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
  import ColorPaletteEditable from '$lib/components/ColorPaletteEditable.svelte';
  import DefaultYarnSet from '$lib/components/DefaultYarnSet.svelte';
  import SelectNumberOfColors from '$lib/components/SelectNumberOfColors.svelte';
  import SelectYarn from '$lib/components/SelectYarn.svelte';
  import SaveAndCloseButtons from '$lib/components/modals/SaveAndCloseButtons.svelte';
  import StickyPart from '$lib/components/modals/StickyPart.svelte';
  import { dialog } from '$lib/state';
  import {
    getColorways,
    getFilteredYarns,
    getSortedPalette,
    pickRandomFromArray,
  } from '$lib/utils';
  import {
    ArrowDownWideNarrowIcon,
    ExternalLinkIcon,
    ShuffleIcon,
  } from '@lucide/svelte';
  import SelectYarnWeight from '../SelectYarnWeight.svelte';

  let { numberOfColors, updateGauge } = $props();

  let debounceTimer;
  const debounce = (callback, time) => {
    window.clearTimeout(debounceTimer);
    debounceTimer = window.setTimeout(callback, time);
  };

  let randomPalette = $state([getRandomColors()]);
  let selectedBrandId = $state();
  let selectedYarnId = $state();
  let selectedYarnWeightId = $state('');
  let sortColors = $state('light-to-dark');

  function getRandomColors() {
    debounce(() => {
      const tempYarnColorways = [];

      // Create a set of existing color hex values for faster lookup
      const existingColorways = new Set();

      const colorwaysLength = colorways.length;

      // Generate new yarn colorways until the desired number is reached
      while (tempYarnColorways.length < numberOfColors) {
        // Check if the current index has a locked color
        const currentIndex = tempYarnColorways.length;
        let color;
        if (randomPalette[currentIndex]?.locked) {
          // Use the locked color instead of a random one
          color = randomPalette[currentIndex];
          const colorId = `${color.hex}-${color.name}-${color.brandId}-${color.yarnId}`;
          tempYarnColorways.push(color);
          existingColorways.add(colorId);
        } else {
          // Get a random color from the colorways array
          color = {
            ...pickRandomFromArray({
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
  let isYarnUnavailable = $derived(
    filteredYarnsList
      ?.filter((n) => n.id === selectedYarnId)[0]
      ?.colorways.some((colorway) => !!colorway.source?.unavailable),
  );

  $effect(() => {
    selectedBrandId;
    selectedYarnId;
    selectedYarnWeightId;
    numberOfColors;
    getRandomColors();
  });
</script>

<svelte:window
  onkeydown={(e) => {
    if (
      e.target.tagName === 'INPUT' ||
      e.target.tagName === 'TD' ||
      e.target.tagName === 'SELECT' ||
      e.target.tagName === 'BUTTON'
    )
      return;
    if (e.key === 'r') {
      getRandomColors();
    }
  }}
/>

<div class="px-4 pt-8">
  <div class="grid w-full grid-cols-12 items-end justify-center gap-4">
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

    {#if isYarnUnavailable}
      <div class="order-4 col-span-full w-full">
        <a href="/documentation#link-unavailable" target="_blank" class="link">
          Link Unavailable <ExternalLinkIcon
            size="18"
            class="relative -top-[2px] inline"
          />
        </a>
      </div>
    {/if}

    <div class="order-5 col-span-full justify-self-start sm:col-span-3">
      <SelectNumberOfColors
        {numberOfColors}
        max={99}
        onchange={(e) => (numberOfColors = +e.target.value)}
      />
    </div>

    <label class="label order-6 col-span-full w-full sm:col-span-4">
      <span class="label-text"> Sort By</span>
      <div class="relative flex items-center">
        <ArrowDownWideNarrowIcon class="absolute left-2" />
        <select
          class="select truncate pl-10"
          id="sort-colors-by"
          bind:value={sortColors}
          onchange={() => {
            randomPalette = getSortedPalette({
              palette: randomPalette,
              sortColors,
            });
          }}
        >
          <option value="none">None</option>
          <option value="light-to-dark">Lightest to Darkest</option>
          <option value="dark-to-light">Darkest to Lightest</option>
          <option value="name">Name A-Z</option>
          <option value="name-z-to-a">Name Z-A</option>
        </select>
      </div>
    </label>

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
      {#key randomPalette}
        <ColorPaletteEditable
          canUserEditColor={false}
          typeId="randomPalette"
          bind:colors={randomPalette}
          onchanged={(eventColors) => {
            if (eventColors) randomPalette = eventColors;
            numberOfColors = randomPalette.length;
          }}
        />
      {/key}
    </div>

    <SaveAndCloseButtons
      onSave={() => {
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

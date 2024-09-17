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
  import Tooltip from '$lib/components/Tooltip.svelte';
  import SaveAndCloseButtons from '$lib/components/modals/SaveAndCloseButtons.svelte';
  import StickyPart from '$lib/components/modals/StickyPart.svelte';
  import {
    getColorways,
    getFilteredYarns,
    pickRandomFromArray,
    getSortedPalette,
  } from '$lib/utils';
  import { getContext } from 'svelte';
  import SelectYarnWeight from '../SelectYarnWeight.svelte';

  export let numberOfColors, updateGauge;

  const { close } = getContext('simple-modal');

  let debounceTimer;
  const debounce = (callback, time) => {
    window.clearTimeout(debounceTimer);
    debounceTimer = window.setTimeout(callback, time);
  };

  let _yarnColorwaysPalette = [];
  let selectedBrandId;
  let selectedYarnId;
  let selectedYarnWeightId = '';
  let sortColors = 'light-to-dark';
  let key = 0;

  $: filteredYarnsList = getFilteredYarns({
    selectedBrandId,
  });

  $: colorways = getColorways({
    selectedBrandId,
    selectedYarnId,
    selectedYarnWeightId,
  });

  $: isYarnUnavailable = filteredYarnsList
    ?.filter((n) => n.id === selectedYarnId)[0]
    ?.colorways.some((colorway) => !!colorway.source?.unavailable);

  $: selectedBrandId,
    selectedYarnId,
    selectedYarnWeightId,
    numberOfColors,
    getRandomColors();

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
        if (_yarnColorwaysPalette[currentIndex]?.locked) {
          // Use the locked color instead of a random one
          color = _yarnColorwaysPalette[currentIndex];
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
      _yarnColorwaysPalette = getSortedPalette({
        palette: tempYarnColorways,
        sortColors,
      });
    }, 0);
  }
</script>

<div class="p-2 sm:p-4 w-[98vw] md:w-[760px] lg:w-[1000px]">
  <div class="grid grid-cols-12 gap-4 justify-center items-end w-full">
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

    {#if isYarnUnavailable}
      <div class="w-full col-span-full order-4">
        <Tooltip>
          Link Unavailable <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke-width="1.5"
            stroke="currentColor"
            class="w-6 h-6 inline"
            ><path
              stroke-linecap="round"
              stroke-linejoin="round"
              d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z"
            ></path></svg
          >
          <div
            slot="tooltip"
            class="flex flex-col gap-2 justify-start text-left text-base"
          >
            <p>
              A yarn that says Link Unavailable means the webpage from which the
              colorways were accessed is no longer available. Yarns whose links
              are unavailable will remain on this web app for legacy purposes,
              but links to the yarn and its colorways will not work.
            </p>

            <p>A yarn with unavailable links could mean:</p>

            <div class="ml-4">
              <p>- The yarn has been discontinued</p>
              <p>- The yarn has been renamed</p>
              <p>
                - The yarn’s website has been re-designed and old links no
                longer exist
              </p>
            </div>
          </div>
        </Tooltip>
      </div>
    {/if}

    <div class="col-span-full sm:col-span-3 justify-self-start order-5">
      <SelectNumberOfColors
        {numberOfColors}
        max={99}
        on:change={(e) => (numberOfColors = +e.target.value)}
      />
    </div>

    <label class="label w-full col-span-full sm:col-span-4 order-6">
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
        class="select truncate"
        id="sort-colors-by"
        bind:value={sortColors}
        on:change={() => {
          _yarnColorwaysPalette = getSortedPalette({
            palette: _yarnColorwaysPalette,
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
    </label>

    <button
      class="btn variant-filled-primary col-span-full sm:col-span-4 sm:col-start-9 order-7"
      title="Generate Random Colors"
      on:click={() => {
        getRandomColors();
      }}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        stroke-width="1.5"
        stroke="currentColor"
        class="w-6 h-6 mr-1"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99"
        />
      </svg> Randomize
    </button>
  </div>
</div>

<StickyPart position="bottom">
  <div class="p-2 sm:p-4">
    {#if _yarnColorwaysPalette.length}
      <div class="mb-2 sm:mb-4">
        {#key key}
          <ColorPaletteEditable
            canUserEditColor={false}
            bind:colors={_yarnColorwaysPalette}
            on:changed={() => {
              numberOfColors = _yarnColorwaysPalette.length;
              key++;
            }}
          />
        {/key}
      </div>
    {/if}

    <SaveAndCloseButtons
      onSave={() => {
        updateGauge({
          _colors: _yarnColorwaysPalette.map((color) => {
            delete color.locked;
            return color;
          }),
        });
        close();
      }}
      onClose={close}
    />
  </div>
</StickyPart>

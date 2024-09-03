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
  import SaveAndCloseButtons from '$lib/components/modals/SaveAndCloseButtons.svelte';
  import StickyPart from '$lib/components/modals/StickyPart.svelte';
  import { getSortedPalette } from '$lib/utils';
  import { getContext } from 'svelte';

  export let colors, updateGauge;

  let sortColors = 'custom';

  const { close } = getContext('simple-modal');
</script>

<div class="p-2 sm:p-4 w-[98vw] md:w-[700px]">
  <div class="flex flex-col gap-2 items-center mt-6 sm:mt-4">
    <div class="flex flex-wrap gap-2 justify-center items-end">
      <label class="label">
        <span class="flex items-center"
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
              d="M3 7.5L7.5 3m0 0L12 7.5M7.5 3v13.5m13.5 0L16.5 21m0 0L12 16.5m4.5 4.5V7.5"
            />
          </svg>
          Sort By</span
        >
        <select
          class="select truncate"
          id="sort-colors-by"
          bind:value={sortColors}
          on:change={() => {
            colors = getSortedPalette({
              palette: colors,
              sortColors,
            });
          }}
        >
          <option value="custom">Custom</option>
          <option value="light-to-dark">Lightest to Darkest</option>
          <option value="dark-to-light">Darkest to Lightest</option>
        </select>
      </label>

      <button
        class="btn bg-secondary-hover-token"
        on:click={() => {
          sortColors = 'custom';
          colors = colors.reverse();
        }}
        title="Reverse Colors' Positions"
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
            d="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5"
          />
        </svg>
        Reverse
      </button>
    </div>
    <div class="w-full">
      <ColorPaletteEditable
        on:changed={() => {
          sortColors = 'custom';
        }}
        canUserEditColor={false}
        bind:colors
      />
    </div>
  </div>
</div>

<StickyPart position="bottom">
  <div class="p-2 sm:p-4">
    <SaveAndCloseButtons
      onSave={() => {
        updateGauge({
          _colors: colors.map((n) => {
            delete n.id;
            return n;
          }),
        });
        close();
      }}
      onClose={close}
    />
  </div>
</StickyPart>

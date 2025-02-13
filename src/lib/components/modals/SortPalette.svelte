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
  import ColorPaletteEditable from '$lib/components/ColorPaletteEditable.svelte';
  import SaveAndCloseButtons from '$lib/components/modals/SaveAndCloseButtons.svelte';
  import StickyPart from '$lib/components/modals/StickyPart.svelte';
  import { getSortedPalette } from '$lib/utils';
  import ModalShell from './ModalShell.svelte';

  let { colors, updateGauge, parent } = $props();

  let _colors = $state(colors);

  let sortColors = $state('custom');

  const modalStore = getModalStore();

  let key = $state(false);

  let allColorsHaveNames = $derived(_colors.every((color) => color?.name));
</script>

<ModalShell {parent}>
  <div class="flex flex-col gap-2 items-center mt-6 sm:mt-4">
    <div class="flex flex-wrap gap-2 justify-center items-end">
      <label class="label">
        <span class="flex items-center"
          ><svg
            xmlns="http://www.w3.org/2000/svg"
            class="size-5 mr-1"
            viewBox="0 0 24 24"
            ><path
              fill="none"
              stroke="currentColor"
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="1.5"
              d="M10 14H2m6-4H2m4-4H2m10 12H2m17 2V4m0 16l3-3m-3 3l-3-3m3-13l3 3m-3-3l-3 3"
            /></svg
          >
          Sort By</span
        >
        <select
          class="select truncate"
          id="sort-colors-by"
          bind:value={sortColors}
          onchange={() => {
            _colors = getSortedPalette({
              palette: $state.snapshot(_colors),
              sortColors,
            });
            key = !key;
          }}
        >
          <option value="custom">Custom</option>
          <option value="light-to-dark">Lightest to Darkest</option>
          <option value="dark-to-light">Darkest to Lightest</option>
          {#if allColorsHaveNames}
            <option value="name">Name A-Z</option>
            <option value="name-z-to-a">Name Z-A</option>
          {/if}
        </select>
      </label>

      <button
        class="btn preset-tonal-secondary"
        onclick={() => {
          _colors.reverse();
          key = !key;
          sortColors = 'custom';
        }}
        title="Reverse Colors' Positions"
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
            d="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5"
          />
        </svg>
        Reverse
      </button>
    </div>
    <div class="w-full">
      {#key key}
        <ColorPaletteEditable
          onchanged={() => {
            sortColors = 'custom';
          }}
          canUserEditColor={false}
          bind:colors={_colors}
        />
      {/key}
    </div>
  </div>

  {#snippet stickyPart()}
    <StickyPart position="bottom">
      <div class="p-2">
        <SaveAndCloseButtons
          onSave={() => {
            updateGauge({
              _colors: _colors.map((n) => {
                delete n.id;
                return n;
              }),
            });
            modalStore.close();
          }}
          onClose={modalStore.close}
        />
      </div>
    </StickyPart>
  {/snippet}
</ModalShell>

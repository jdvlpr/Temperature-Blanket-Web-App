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
  import { modal } from '$lib/state';
  import { getSortedPalette } from '$lib/utils';
  import { ArrowDownWideNarrow, ArrowLeftRightIcon } from '@lucide/svelte';

  let { colors, updateGauge } = $props();

  let _colors = $state(colors);

  let sortColors = $state('custom');

  let key = $state(false);

  let allColorsHaveNames = $derived(_colors.every((color) => color?.name));
</script>

<div class="p-4 sm:min-w-[600px]">
  <div class="flex flex-col gap-2 items-center mt-6 sm:mt-4">
    <div class="flex flex-wrap gap-2 justify-center items-end">
      <label class="label">
        <span class="flex items-center gap-1">
          <ArrowDownWideNarrow class="size-4" />
          <span>Sort By</span>
        </span>
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
        class="btn hover:preset-tonal gap-1"
        onclick={() => {
          _colors.reverse();
          key = !key;
          sortColors = 'custom';
        }}
        title="Reverse Colors' Positions"
      >
        Reverse
        <ArrowLeftRightIcon />
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
</div>
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
        modal.close();
      }}
      onClose={modal.close}
    />
  </div>
</StickyPart>

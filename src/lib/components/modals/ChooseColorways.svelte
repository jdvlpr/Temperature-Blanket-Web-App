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
  import SaveAndCloseButtons from '$lib/components/modals/SaveAndCloseButtons.svelte';
  import StickyPart from '$lib/components/modals/StickyPart.svelte';
  import YarnGridSelect from '$lib/components/modals/YarnGridSelect.svelte';
  import SortMenu from '$lib/components/SortMenu.svelte';
  import type { Color } from '$lib/types/yarn-types';
  import { getSortedPalette, shuffleColors } from '$lib/utils/color-utils';
  import { dialog } from '$lib/state/page-state.svelte';
  import { pluralize } from '$lib/utils/string-utils';
  import { yarnUses } from '$lib/storage/yarn-uses.svelte';

  interface Props {
    updateGauge: any;
  }

  let { updateGauge }: Props = $props();

  let selectedColors: object[] = $state([]);
  let selectedBrandId = $state('');
  let selectedYarnId = $state('');

  let paletteTitleText = $derived(getPaletteTitleText(selectedColors));

  let container: HTMLElement | null = $state(null);

  // The scroll-to-top button sits just above the footer, whose height
  // changes with the palette
  let footerHeight = $state(0);

  function getPaletteTitleText(colors: object[]) {
    if (colors.length) {
      return `${colors.length}
				${pluralize('Colorway', colors.length)}`;
    } else {
      return '';
    }
  }
</script>

<div bind:this={container} class="p-2">
  <YarnGridSelect
    bind:selectedColors
    bind:selectedBrandId
    bind:selectedYarnId
    onClickScrollToTop={() => {
      container?.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });
    }}
    scrollToTopButtonBottom="{footerHeight}px"
  />
</div>

<StickyPart position="bottom">
  <div class="p-2" bind:clientHeight={footerHeight}>
    {#if selectedColors.length}
      <div class="">
        {#key selectedColors.length}
          <ColorPaletteEditable
            canUserEditColor={false}
            showSchemeName={false}
            bind:colors={selectedColors}
          />
        {/key}
        <div class="mt-2 flex items-center justify-between gap-2">
          <p class="text-xs">{paletteTitleText}</p>
          <SortMenu
            colors={selectedColors as Color[]}
            placement="top"
            triggerClass="btn btn-sm hover:bg-surface-200-800"
            disabled={selectedColors.length < 2}
            onsort={(sort) => {
              const colors = $state.snapshot(selectedColors) as Color[];
              selectedColors =
                sort === 'reverse'
                  ? colors.reverse()
                  : sort === 'shuffle'
                    ? shuffleColors(colors)
                    : getSortedPalette({ palette: colors, sortColors: sort });
            }}
          />
        </div>
      </div>
    {/if}

    <div class="max-sm:pb-2">
      <SaveAndCloseButtons
        onSave={() => {
          yarnUses.record(selectedBrandId, selectedYarnId);
          updateGauge({
            _colors: selectedColors,
          });
          dialog.close();
        }}
        onClose={() => {
          dialog.close();
        }}
        disabled={!selectedColors.length}
      />
    </div>
  </div>
</StickyPart>

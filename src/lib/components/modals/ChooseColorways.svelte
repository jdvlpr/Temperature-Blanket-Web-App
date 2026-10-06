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
  import ColorSearchField from '$lib/components/ColorSearchField.svelte';
  import PickColorFromImage from '$lib/components/modals/PickColorFromImage.svelte';
  import SaveAndCloseButtons from '$lib/components/modals/SaveAndCloseButtons.svelte';
  import StickyPart from '$lib/components/modals/StickyPart.svelte';
  import YarnGridSelect from '$lib/components/modals/YarnGridSelect.svelte';
  import SortMenu from '$lib/components/SortMenu.svelte';
  import type { Color } from '$lib/types/yarn-types';
  import { getSortedPalette, shuffleColors } from '$lib/utils/color-utils';
  import { dialog } from '$lib/state/page-state.svelte';
  import { pluralize } from '$lib/utils/string-utils';
  import { yarnUses } from '$lib/storage/yarn-uses.svelte';
  import { tick } from 'svelte';

  interface Props {
    updateGauge: any;
  }

  let { updateGauge }: Props = $props();

  let selectedColors: Color[] = $state([]);
  let selectedBrandId = $state('');
  let selectedYarnId = $state('');
  /** A color to find colorways near */
  let matchHex = $state('');
  /** Picking a color from a photo, shown in this dialog's place so nothing
   * chosen here is lost */
  let pickingFromPhoto = $state(false);

  async function closePhoto() {
    pickingFromPhoto = false;
    await tick();
    container
      ?.querySelector<HTMLElement>('[data-photo-button]')
      ?.focus({ preventScroll: true });
  }

  let paletteTitleText = $derived(getPaletteTitleText(selectedColors));

  let container: HTMLElement | null = $state(null);

  // The scroll-to-top button sits just above the footer, whose height
  // changes with the palette
  let footerHeight = $state(0);

  function getPaletteTitleText(colors: Color[]) {
    if (colors.length) {
      return `${colors.length}
				${pluralize('Colorway', colors.length)}`;
    } else {
      return '';
    }
  }
</script>

{#if pickingFromPhoto}
  <PickColorFromImage
    onPick={(hex: string) => (matchHex = hex)}
    onBack={closePhoto}
  />
{/if}

<!-- Grows, keeping the footer at the bottom of the dialog -->
<div bind:this={container} class="flex-1 p-2" hidden={pickingFromPhoto}>
  <ColorSearchField
    bind:hex={matchHex}
    onphoto={() => (pickingFromPhoto = true)}
  />
  <YarnGridSelect
    bind:selectedColors
    bind:selectedBrandId
    bind:selectedYarnId
    {matchHex}
    onClickScrollToTop={() => {
      container?.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });
    }}
    scrollToTopButtonBottom="{footerHeight}px"
  />
</div>

{#if !pickingFromPhoto}
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
              colors={selectedColors}
              placement="top"
              triggerClass="btn btn-sm hover:bg-surface-200-800"
              disabled={selectedColors.length < 2}
              onsort={(sort) => {
                const colors = $state.snapshot(selectedColors);
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
{/if}

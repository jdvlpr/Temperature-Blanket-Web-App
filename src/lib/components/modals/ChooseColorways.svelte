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
  import YarnGridSelect from '$lib/components/modals/YarnGridSelect.svelte';
  import { modal } from '$lib/state';
  import { pluralize } from '$lib/utils';

  interface Props {
    updateGauge: any;
  }

  let { updateGauge }: Props = $props();

  let selectedColors: object[] = $state([]);

  let paletteTitleText = $derived(getPaletteTitleText(selectedColors));

  let container = null;

  function getPaletteTitleText(colors) {
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
    onClickScrollToTop={() => {
      container.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });
    }}
    scrollToTopButtonBottom={selectedColors.length ? '10rem' : '4rem'}
  />
</div>

<StickyPart position="bottom">
  <div class="p-2">
    {#if selectedColors.length}
      <div class="mb-2 sm:mb-4">
        {#key selectedColors.length}
          <ColorPaletteEditable
            canUserEditColor={false}
            schemeName={paletteTitleText}
            bind:colors={selectedColors}
          />
        {/key}
      </div>
    {/if}

    <div class="max-sm:pb-2">
      <SaveAndCloseButtons
        onSave={() => {
          updateGauge({
            _colors: selectedColors,
          });
          modal.close();
        }}
        onClose={() => {
          modal.close();
        }}
        disabled={!selectedColors.length}
      />
    </div>
  </div>
</StickyPart>

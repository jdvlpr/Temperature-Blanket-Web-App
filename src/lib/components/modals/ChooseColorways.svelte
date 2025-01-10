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
  import { pluralize } from '$lib/utils';
  import { getModalStore } from '@skeletonlabs/skeleton';
  import ModalShell from './ModalShell.svelte';

  interface Props {
    updateGauge: any;
    parent: any;
  }

  let { updateGauge, parent }: Props = $props();

  const modalStore = getModalStore();

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

<ModalShell {parent} size="large" preventDefaultFocus={true}>
  <div bind:this={container}>
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

  {#snippet stickyPart()}
    <StickyPart position="bottom">
      <div class="p-2 sm:px-4">
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

        <SaveAndCloseButtons
          onSave={() => {
            updateGauge({
              _colors: selectedColors,
            });
            if ($modalStore[0]) modalStore.close();
          }}
          onClose={() => {
            if ($modalStore[0]) modalStore.close();
          }}
          disabled={!selectedColors.length}
        />
      </div>
    </StickyPart>
  {/snippet}
</ModalShell>

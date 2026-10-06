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
  import {
    getSortedPalette,
    reverseColors,
    shuffleColors,
  } from '$lib/utils/color-utils';
  import { dialog } from '$lib/state/page-state.svelte';
  import { pluralize } from '$lib/utils/string-utils';
  import { yarnUses } from '$lib/storage/yarn-uses.svelte';
  import { Trash2Icon, Undo2Icon } from '@lucide/svelte';
  import { tick } from 'svelte';
  import type { Attachment } from 'svelte/attachments';

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
  /** The colorways just cleared, for Undo, until another is chosen */
  let cleared = $state<Color[] | null>(null);
  let clearButton: HTMLButtonElement | undefined = $state();

  function clear() {
    cleared = $state.snapshot(selectedColors);
    selectedColors = [];
  }

  async function undoClear() {
    if (!cleared) return;
    selectedColors = cleared;
    cleared = null;
    // Back to Clear, as the Undo button that was pressed is gone
    await tick();
    clearButton?.focus({ preventScroll: true });
  }

  /** Undo takes the focus, as the Clear button that was pressed is disabled */
  const takeFocus: Attachment<HTMLButtonElement> = (button) => {
    button.focus({ preventScroll: true });
  };

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
    onSelection={() => (cleared = null)}
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
      {#if cleared && !selectedColors.length}
        <div
          class="card preset-tonal-surface mb-2 flex w-full items-center justify-between gap-2 p-2 pl-4 text-left text-sm"
          role="status"
        >
          <span class="line-clamp-1"
            >Cleared {cleared.length}
            {pluralize('colorway', cleared.length)}</span
          >
          <button
            type="button"
            class="btn btn-sm hover:preset-tonal-surface"
            onclick={undoClear}
            {@attach takeFocus}
          >
            <Undo2Icon aria-hidden="true" />
            Undo
          </button>
        </div>
      {/if}
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
            <div class="flex items-center gap-1">
              <SortMenu
                colors={selectedColors}
                placement="top"
                triggerClass="btn btn-sm hover:bg-surface-200-800"
                disabled={selectedColors.length < 2}
                onsort={(sort) => {
                  const colors = $state.snapshot(selectedColors);
                  selectedColors =
                    sort === 'reverse'
                      ? reverseColors(colors)
                      : sort === 'shuffle'
                        ? shuffleColors(colors)
                        : getSortedPalette({
                            palette: colors,
                            sortColors: sort,
                          });
                }}
              />
              <button
                type="button"
                class="btn btn-sm hover:bg-surface-200-800"
                title="Remove all colorways"
                bind:this={clearButton}
                onclick={clear}
              >
                <Trash2Icon aria-hidden="true" />
                <!-- Just the icon on small screens, as in From an Image -->
                <span class="max-sm:sr-only">Clear</span>
              </button>
            </div>
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

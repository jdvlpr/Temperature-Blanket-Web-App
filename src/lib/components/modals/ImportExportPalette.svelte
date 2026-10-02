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
  import { version } from '$app/environment';
  import { PUBLIC_COOLORS_LINK } from '$env/static/public';
  import ColorPalette from '$lib/components/ColorPalette.svelte';
  import Expand from '$lib/components/Expand.svelte';
  import ToggleSwitch from '$lib/components/buttons/ToggleSwitch.svelte';
  import SaveAndCloseButtons from '$lib/components/modals/SaveAndCloseButtons.svelte';
  import { ensureYarnData } from '$lib/data/yarns/colorways.svelte';
  import { dialog, toast } from '$lib/state/page-state.svelte';
  import { safeSlide } from '$lib/features/transitions/safeSlide';
  import { getColorsFromInput, getYarnPageURL } from '$lib/utils/color-utils';
  import { pluralize } from '$lib/utils/string-utils';
  import type { Color } from '$lib/types/yarn-types';
  import { ClipboardCopyIcon } from '@lucide/svelte';
  import { onMount } from 'svelte';

  let {
    colors = [],
    updateGauge,
    mode = 'export',
    exportType = 'link',
  }: {
    colors?: Color[];
    updateGauge?: (update: { _colors: Color[] }) => void;
    /** 'export' shares the current palette; 'import' pastes colors in */
    mode?: 'export' | 'import';
    /** What to export; the toolbar's Save & Export menu chooses it */
    exportType?: 'html' | 'colorway' | 'link';
  } = $props();

  let inputValue = $state('');

  let textAreaInputElement = $state<HTMLTextAreaElement>();

  let inputColors = $state<Color[]>([]);

  let colorNamesAsArray = $state(false);

  let colorCodesAsArray = $state(false);

  let colorHexesWithHashes = $state(true);

  let isExpanded = $state(false);

  let paletteLink = $derived(
    getYarnPageURL({ colors, origin: window.location.origin, version }),
  );

  let palette = $derived(colors.map((n: Color) => n?.hex));

  let colorNames = $derived(
    colorNamesAsArray
      ? JSON.stringify(
          colors.filter((n: Color) => n.name).map((n: Color) => n.name),
        )
      : colors
          .filter((n: Color) => n.name)
          .map((n: Color) => n.name)
          .join(', '),
  );

  let colorHexes = $derived(
    getColorHexes({
      palette,
      asArray: colorCodesAsArray,
      withHashes: colorHexesWithHashes,
    }),
  );

  async function triggerChange() {
    if (inputValue === null || inputValue === '') {
      inputColors = [];
      return;
    }
    inputColors = getColorsFromInput({ string: inputValue }) || [];
  }

  function getColorHexes({
    palette,
    asArray,
    withHashes,
  }: {
    palette: (string | undefined)[];
    asArray: boolean;
    withHashes: boolean;
  }) {
    if (!Array.isArray(palette)) return false;
    if (!withHashes)
      palette = palette.map((n: string | undefined) => n?.slice(1));
    if (asArray) return JSON.stringify(palette);
    return palette.join(', ');
  }

  onMount(() => {
    ensureYarnData();
  });
</script>

<div class="px-4 pt-2 pb-4">
  {#if mode === 'import'}
    <label for="palette-code" class="label">
      <span class="label-text"
        >Enter HTML colors, a palette code, or a project URL</span
      >
      <textarea
        bind:this={textAreaInputElement}
        id="palette-code"
        class="textarea rounded-container select-all"
        placeholder="e.g. red, FFA500, #ADD8E6"
        bind:value={inputValue}
        onkeyup={triggerChange}
        onchange={triggerChange}
        onpaste={(e) => {
          if (e.cancelable) e.preventDefault();
          const _tempInputValue = e.clipboardData?.getData('text');
          inputValue = _tempInputValue || '';
          triggerChange();
          // textAreaInputElement.blur();
        }}></textarea>
    </label>

    <div class="my-2 flex flex-col gap-2 text-left">
      <div class="m-auto">
        <Expand bind:isExpanded label="What can I enter above?" />
      </div>

      {#if isExpanded}
        <div transition:safeSlide>
          <p>
            • <a
              href="https://htmlcolorcodes.com/color-names/"
              target="_blank"
              rel="noreferrer"
              class="link">HTML color names</a
            > or hex values
          </p>
          <div class="my-2 ml-2 flex flex-wrap gap-2">
            <pre class="pre select-all">red, orange, lightblue</pre>
            <pre class="pre select-all">FF0000-FFA500-ADD8E6</pre>
            <pre class="pre select-all">#FF0000 #FFA500 #ADD8E6</pre>
            <pre class="pre select-all">red, FFA500, #ADD8E6</pre>
          </div>
          <p>
            • A palette link, saved project URL, or yarn search result URL from
            this web app
          </p>
          <p>• A palette code from this web app (from older versions)</p>
          <div class="my-2 ml-2 flex flex-wrap gap-2">
            <pre
              class="pre break-all select-all">palette:40004bae8bbdf7f7f780c58100441b</pre>
          </div>
          <p>
            • The URL of a palette from <a
              href={PUBLIC_COOLORS_LINK}
              target="_blank"
              rel="nofollow noreferrer"
              class="link">Coolors.co</a
            >
          </p>
        </div>
      {/if}
    </div>

    {#if inputColors.length}
      <div class="mt-4 flex flex-col">
        <ColorPalette
          colors={inputColors}
          schemeName={`${inputColors.length ? inputColors.length + ' ' + pluralize('Color', inputColors.length) : ''}`}
        />

        <div class="mx-auto my-4 inline-block w-full">
          <SaveAndCloseButtons
            onSave={() => {
              updateGauge?.({ _colors: inputColors });
              dialog.close();
            }}
            disabled={!inputColors.length}
            onClose={() => {
              dialog.close();
            }}
          />
        </div>
      </div>
    {/if}

    {#if !inputColors.length && inputValue.length}
      <div class="mt-4 h-[170px]">
        <div
          class="preset-tonal-error card flex h-[70px] items-center justify-center p-4 text-center"
        >
          <p>Code not valid</p>
        </div>
      </div>
    {/if}
  {:else if colors}
    <!-- HTML Color Codes Section -->
    {#if exportType === 'html' && palette}
      <div class="flex w-full flex-wrap items-start gap-4">
        <div class="w-full">
          <p class="card preset-tonal-primary w-full p-4 break-all select-all">
            {colorHexes}
          </p>

          <div class="mt-4 flex flex-wrap items-center gap-4">
            <div class="flex cursor-pointer items-center gap-2">
              <ToggleSwitch bind:checked={colorCodesAsArray} label="Array" />
            </div>
            <div class="flex cursor-pointer items-center gap-2">
              <ToggleSwitch
                bind:checked={colorHexesWithHashes}
                label="Hashes"
              />
            </div>
          </div>

          <button
            class="btn hover:bg-surface-100-900 mt-4"
            onclick={() => {
              try {
                if (typeof colorHexes === 'string') {
                  window.navigator.clipboard.writeText(colorHexes);
                }
                toast.trigger({
                  message: 'Copied',
                  category: 'success',
                });
              } catch {
                toast.trigger({
                  message: 'Unable to copy to clipboard',
                  category: 'error',
                });
              }
            }}
          >
            <ClipboardCopyIcon />
            Copy HTML Color Codes
          </button>
        </div>
      </div>
    {/if}

    <!-- Link Section -->
    {#if exportType === 'link' && paletteLink}
      <div class="flex w-full flex-wrap items-start gap-4">
        <p class="text-sm">
          Anyone with this link can open the palette in the Yarn Palette
          Creator. To use it in another palette, press Get Colors, then Paste
          Colors or Code, and paste the link.
        </p>
        <div class="w-full">
          <p class="card preset-tonal-primary w-full p-4 break-all select-all">
            {paletteLink}
          </p>

          <button
            class="btn hover:bg-surface-100-900 mt-4"
            onclick={() => {
              try {
                window.navigator.clipboard.writeText(paletteLink);
                toast.trigger({
                  message: 'Copied',
                  category: 'success',
                });
              } catch {
                toast.trigger({
                  message: 'Unable to copy to clipboard',
                  category: 'error',
                });
              }
            }}
          >
            <ClipboardCopyIcon />
            Copy Link
          </button>
        </div>
      </div>
    {/if}

    <!-- Yarn Colorway Names Section -->
    {#if exportType === 'colorway' && colorNames}
      <div class="flex w-full flex-wrap items-start gap-4">
        <div class="w-full">
          <p class="card preset-tonal-primary w-full p-4 break-all select-all">
            {colorNames}
          </p>

          <div class="mt-4 flex w-fit cursor-pointer items-center gap-2">
            <ToggleSwitch bind:checked={colorNamesAsArray} label="Array" />
          </div>

          <button
            class="btn hover:bg-surface-100-900 mt-4"
            onclick={() => {
              try {
                window.navigator.clipboard.writeText(colorNames);
                toast.trigger({
                  message: 'Copied',
                  category: 'success',
                });
              } catch {
                toast.trigger({
                  message: 'Unable to copy to clipboard',
                  category: 'error',
                });
              }
            }}
          >
            <ClipboardCopyIcon />
            Copy Colorway Names
          </button>
        </div>
      </div>
    {/if}
  {/if}
</div>

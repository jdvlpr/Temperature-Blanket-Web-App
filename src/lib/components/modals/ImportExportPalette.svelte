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
  import CopyIcon from '$lib/components/CopyIcon.svelte';
  import { copyToClipboard } from '$lib/utils/clipboard-utils';
  import { Flash } from '$lib/utils/feedback.svelte';
  import ToggleSwitch from '$lib/components/buttons/ToggleSwitch.svelte';
  import type { Color } from '$lib/types/yarn-types';

  let {
    colors = [],
    exportType = 'html',
  }: {
    colors?: Color[];
    /** What to export; the toolbar's Save & Export menu chooses it */
    exportType?: 'html' | 'colorway';
  } = $props();

  // The copy button just used, which shows a check for a moment
  const copied = new Flash();

  async function copyAndFlash(text: string, key: string) {
    if (await copyToClipboard(text, 'Copied')) copied.trigger(key);
  }

  let colorNamesAsArray = $state(false);

  let colorCodesAsArray = $state(false);

  let colorHexesWithHashes = $state(true);

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
</script>

<div class="px-4 pt-2 pb-4">
  {#if colors}
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
              if (typeof colorHexes === 'string') {
                copyAndFlash(colorHexes, 'hexes');
              }
            }}
          >
            <CopyIcon copied={copied.is('hexes')} />
            Copy HTML Color Codes
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
            onclick={() => copyAndFlash(colorNames, 'names')}
          >
            <CopyIcon copied={copied.is('names')} />
            Copy Colorway Names
          </button>
        </div>
      </div>
    {/if}
  {/if}
</div>

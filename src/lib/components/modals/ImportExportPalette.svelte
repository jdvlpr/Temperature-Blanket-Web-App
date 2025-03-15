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
  import { PUBLIC_COOLORS_LINK } from '$env/static/public';
  import ColorPalette from '$lib/components/ColorPalette.svelte';
  import Expand from '$lib/components/Expand.svelte';
  import ToggleSwitch from '$lib/components/buttons/ToggleSwitch.svelte';
  import SaveAndCloseButtons from '$lib/components/modals/SaveAndCloseButtons.svelte';
  import { modal, toast } from '$lib/state';
  import {
    colorsToCode,
    colorsToYarnDetails,
    getColorsFromInput,
    pluralize,
  } from '$lib/utils';
  import { ClipboardCopyIcon } from '@lucide/svelte';
  import { Segment } from '@skeletonlabs/skeleton-svelte';
  import { slide } from 'svelte/transition';

  let { colors, updateGauge } = $props();

  let inputValue = $state('');

  let inputColors = $state([]);

  let colorNamesAsArray = $state(false);

  let colorCodesAsArray = $state(false);

  let colorHexesWithHashes = $state(true);

  let isExpanded = $state(false);

  let segmentValue = $state('export');

  let paletteCode = $derived(
    `${colorsToCode(colors, {
      includePrefixes: true,
    })}${colorsToYarnDetails({ colors }) ? 'yarn:' + colorsToYarnDetails({ colors }) : ''}`,
  );

  let palette = $derived(colors.map((n) => n?.hex));

  let colorNames = $derived(
    colorNamesAsArray
      ? JSON.stringify(colors.filter((n) => n.name).map((n) => n.name))
      : colors
          .filter((n) => n.name)
          .map((n) => n.name)
          .join(', '),
  );

  let colorHexes = $derived(
    getColorHexes({
      palette,
      asArray: colorCodesAsArray,
      withHashes: colorHexesWithHashes,
    }),
  );

  function triggerChange() {
    if (inputValue === null || inputValue === '') return;
    inputColors = getColorsFromInput({ string: inputValue }) || inputColors;
  }

  function getColorHexes({ palette, asArray, withHashes }) {
    if (!Array.isArray(palette)) return false;
    if (!withHashes) palette = palette.map((n) => n.slice(1));
    if (asArray) return JSON.stringify(palette);
    return palette.join(', ');
  }
</script>

<div class="p-4">
  <div class="mb-4 flex w-full flex-col gap-1 text-left">
    <Segment
      classes="flex wrap gap-y-2 w-fit mx-auto shadow-sm"
      background="bg-surface-200 dark:bg-surface-800"
      value={segmentValue}
      onValueChange={(e) => {
        segmentValue = e.value;
      }}
    >
      <Segment.Item value={'export'}>Export</Segment.Item>
      <Segment.Item value={'import'}>Import</Segment.Item>
    </Segment>
  </div>

  {#if segmentValue === 'import'}
    <label for="palette-code" class="text-small"
      >Enter HTML colors, a palette code, or a project URL</label
    >
    <textarea
      id="palette-code"
      class="textarea select-all"
      placeholder="e.g. red, FFA500, #ADD8E6"
      bind:value={inputValue}
      onkeyup={triggerChange}
      onchange={triggerChange}
    ></textarea>

    <div class="my-2 flex flex-col gap-2 text-left">
      <div class="m-auto">
        <Expand
          bind:isExpanded
          more={'What can I enter above?'}
          less={'What can I enter above?'}
        />
      </div>

      {#if isExpanded}
        <div in:slide out:slide>
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
          <p>• A palette code from this web app</p>
          <div class="my-2 ml-2 flex flex-wrap gap-2">
            <pre
              class="pre break-all select-all">palette:40004bae8bbdf7f7f780c58100441b</pre>
          </div>
          <p>
            • The URL of a saved project or yarn search result from this web
            app.
          </p>
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
              updateGauge({ _colors: inputColors });
              modal.close();
            }}
            disabled={!inputColors.length}
            onClose={() => {
              modal.close();
            }}
          />
        </div>
      </div>
    {/if}

    {#if !inputColors.length && inputValue.length}
      <p class="preset-tonal-error card p-4 text-center">Code not valid</p>
    {/if}
  {:else}
    {#if colors}
      <ColorPalette
        {colors}
        schemeName={`${colors.length ? colors.length + ' ' + pluralize('Color', colors.length) : ''}`}
        height="24px"
      />
    {/if}

    {#if palette}
      <div class="my-4 flex w-full flex-wrap items-center justify-start gap-2">
        <div
          class="flex w-full flex-col items-start justify-start gap-2 text-left"
        >
          <div class="flex flex-col">
            <p class="text-lg font-bold">HTML Color Codes</p>
            <p class="text-xs">For web and design</p>
          </div>
          <p
            class="card preset-tonal-primary w-full basis-full p-4 break-all select-all"
          >
            {colorHexes}
          </p>
        </div>

        <div
          class="flex cursor-pointer flex-wrap items-center justify-center gap-2"
        >
          <ToggleSwitch bind:checked={colorCodesAsArray} label="Array" />
        </div>

        <div
          class="flex cursor-pointer flex-wrap items-center justify-center gap-2"
        >
          <ToggleSwitch bind:checked={colorHexesWithHashes} label="Hashes" />
        </div>

        <button
          class="btn hover:preset-tonal"
          onclick={() => {
            try {
              window.navigator.clipboard.writeText(colorHexes);
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
    {/if}

    {#if paletteCode}
      <div class="my-4 flex w-full flex-wrap items-center justify-start gap-2">
        <div
          class="flex w-full flex-col items-start justify-start gap-2 text-left"
        >
          <div class="flex flex-col">
            <p class="text-lg font-bold">Palette Code</p>
            <p class="text-xs">For sharing between projects on this site</p>
          </div>
          <p
            class="card preset-tonal-primary w-full basis-full p-4 break-all select-all"
          >
            {paletteCode}
          </p>
        </div>

        <button
          class="btn hover:preset-tonal"
          onclick={() => {
            try {
              window.navigator.clipboard.writeText(paletteCode);
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
          Copy Palette Code
        </button>
      </div>
    {/if}

    {#if colorNames}
      <div class="my-4 flex w-full flex-wrap items-center justify-start gap-2">
        <div
          class="flex w-full flex-col items-start justify-start gap-2 text-left"
        >
          <div class="flex flex-col">
            <p class="text-lg font-bold">Yarn Colorway Names</p>
          </div>
          <p
            class="card preset-tonal-primary w-full basis-full p-4 break-all select-all"
          >
            {colorNames}
          </p>
        </div>
        <div
          class="flex cursor-pointer flex-wrap items-center justify-center gap-2"
        >
          <ToggleSwitch bind:checked={colorNamesAsArray} label="Array" />
        </div>
        <button
          class="btn hover:preset-tonal"
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
    {/if}
  {/if}
</div>

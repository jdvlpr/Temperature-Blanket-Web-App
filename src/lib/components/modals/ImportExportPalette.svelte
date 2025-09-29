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
    generatePaletteImage,
    getColorsFromInput,
    pluralize,
  } from '$lib/utils';
  import {
    ArrowLeftIcon,
    ClipboardCopyIcon,
    CodeIcon,
    DownloadIcon,
    FileCodeIcon,
    ImageIcon,
  } from '@lucide/svelte';
  import { Segment } from '@skeletonlabs/skeleton-svelte';
  import { onMount } from 'svelte';
  import { slide } from 'svelte/transition';

  let { colors, updateGauge } = $props();

  let inputValue = $state('');

  let inputColors = $state([]);

  let colorNamesAsArray = $state(false);

  let colorCodesAsArray = $state(false);

  let colorHexesWithHashes = $state(true);

  let includeBrandInImage = $derived(colors.some((n) => n.brandName));
  let includeColorwayInImage = $derived(colors.some((n) => n.name));
  let includeHexInImage = $state(false);
  let includeSpacingInImage = $state(false);

  let isExpanded = $state(false);

  let segmentValue = $state('export');
  let selectedExportType = $state('main'); // Can be: 'main', 'image', 'html', 'palette', 'colorway'

  let previewImageUrl = $derived(
    colors
      ? generatePaletteImage({
          colors,
          includeColorway: includeColorwayInImage,
          includeHex: includeHexInImage,
          includeBrand: includeBrandInImage,
          includeSpacing: includeSpacingInImage,
        })
      : null,
  );

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

  function downloadImage() {
    try {
      // Create a temporary link element using the preview URL
      const link = document.createElement('a');
      link.download = 'Yarn Palette.png';
      link.href = previewImageUrl;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.trigger({
        message: 'Image downloaded',
        category: 'success',
      });
    } catch (error) {
      toast.trigger({
        message: 'Unable to download image',
        category: 'error',
      });
    }
  }

  onMount(() => {
    includeBrandInImage = !includeBrandInImage && !includeColorwayInImage;
  });
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
  {:else if colors}
    <ColorPalette
      {colors}
      schemeName={`${colors.length ? colors.length + ' ' + pluralize('Color', colors.length) : ''}`}
      height="24px"
    />

    {#if selectedExportType === 'main'}
      <div class="my-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <!-- HTML Color Codes Button -->
        <button
          class="card hover:preset-tonal p-4 text-left"
          onclick={() => (selectedExportType = 'html')}
        >
          <div class="flex items-center gap-2">
            <CodeIcon />
            <div>
              <p class="text-lg font-bold">HTML Color Codes</p>
              <p class="text-xs">Copy codes for web and design</p>
            </div>
          </div>
        </button>

        <!-- Image Export Button -->
        <button
          class="card hover:preset-tonal p-4 text-left"
          onclick={() => (selectedExportType = 'image')}
        >
          <div class="flex items-center gap-2">
            <ImageIcon />
            <div>
              <p class="text-lg font-bold">Image</p>
              <p class="text-xs">Download a PNG image</p>
            </div>
          </div>
        </button>

        <!-- Palette Code Button -->
        <button
          class="card hover:preset-tonal p-4 text-left"
          onclick={() => (selectedExportType = 'palette')}
        >
          <div class="flex items-center gap-2">
            <FileCodeIcon />
            <div>
              <p class="text-lg font-bold">Palette Code</p>
              <p class="text-xs">Share between palettes on this site</p>
            </div>
          </div>
        </button>

        <!-- Yarn Colorway Names Button -->
        {#if colorNames}
          <button
            class="card hover:preset-tonal p-4 text-left"
            onclick={() => (selectedExportType = 'colorway')}
          >
            <div class="flex items-center gap-2">
              <ClipboardCopyIcon />
              <div>
                <p class="text-lg font-bold">Yarn Colorway Names</p>
                <p class="text-xs">Copy colorway names</p>
              </div>
            </div>
          </button>
        {/if}
      </div>
    {:else}
      <!-- Back Button -->
      <button
        class="btn hover:preset-tonal mt-4"
        onclick={() => (selectedExportType = 'main')}
      >
        <ArrowLeftIcon />
        All Export Options
      </button>

      <!-- Image Export Section -->
      {#if selectedExportType === 'image'}
        <div class="my-4 flex w-full flex-wrap items-start gap-4">
          <div class="flex w-full flex-col gap-4">
            <div
              class="preset-outlined-surface-300-700 card flex flex-col items-start gap-4 p-4"
            >
              <p class="text-2xl font-bold">Image Settings</p>
              <p class="">Choose what to include for each colorway</p>
              <div class="flex flex-wrap gap-4">
                {#if colors.some((n) => n.brandName)}
                  <div class="flex cursor-pointer items-center gap-2">
                    <ToggleSwitch
                      bind:checked={includeBrandInImage}
                      label="Yarn Brand"
                    />
                  </div>
                {/if}
                {#if colors.some((n) => n.name)}
                  <div class="flex cursor-pointer items-center gap-2">
                    <ToggleSwitch
                      bind:checked={includeColorwayInImage}
                      label="Colorway Name"
                    />
                  </div>
                {/if}
                <div class="flex cursor-pointer items-center gap-2">
                  <ToggleSwitch
                    bind:checked={includeHexInImage}
                    label="HTML Color Code"
                  />
                </div>
                <div class="flex cursor-pointer items-center gap-2">
                  <ToggleSwitch
                    bind:checked={includeSpacingInImage}
                    label="Spacing"
                  />
                </div>
              </div>
            </div>

            <div class="flex flex-wrap items-start gap-4">
              {#if previewImageUrl}
                <div class="card preset-tonal-primary w-fit overflow-auto p-4">
                  <img
                    src={previewImageUrl}
                    alt="Color palette preview"
                    class="shadow-md sm:max-h-[60vh]"
                    style="image-rendering: crisp-edges;"
                  />
                </div>
              {/if}

              <button
                class="btn hover:preset-tonal mb-8 w-fit"
                onclick={downloadImage}
              >
                <DownloadIcon />
                Download Image
              </button>
            </div>
          </div>
        </div>
      {/if}

      <!-- HTML Color Codes Section -->
      {#if selectedExportType === 'html' && palette}
        <div class="my-4 flex w-full flex-wrap items-start gap-4">
          <div class="w-full">
            <p
              class="card preset-tonal-primary w-full p-4 break-all select-all"
            >
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
              class="btn hover:preset-tonal mt-4"
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
        </div>
      {/if}

      <!-- Palette Code Section -->
      {#if selectedExportType === 'palette' && paletteCode}
        <div class="my-4 flex w-full flex-wrap items-start gap-4">
          <p class="text-sm">
            Copy this Palette Code, then import it into another palette on this
            site.
          </p>
          <div class="w-full">
            <p
              class="card preset-tonal-primary w-full p-4 break-all select-all"
            >
              {paletteCode}
            </p>

            <button
              class="btn hover:preset-tonal mt-4"
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
        </div>
      {/if}

      <!-- Yarn Colorway Names Section -->
      {#if selectedExportType === 'colorway' && colorNames}
        <div class="my-4 flex w-full flex-wrap items-start gap-4">
          <div class="w-full">
            <p
              class="card preset-tonal-primary w-full p-4 break-all select-all"
            >
              {colorNames}
            </p>

            <div class="mt-4 flex w-fit cursor-pointer items-center gap-2">
              <ToggleSwitch bind:checked={colorNamesAsArray} label="Array" />
            </div>

            <button
              class="btn hover:preset-tonal mt-4"
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
  {/if}
</div>

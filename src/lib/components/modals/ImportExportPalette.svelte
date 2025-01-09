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

<script>
  import { PUBLIC_COOLORS_LINK } from '$env/static/public';
  import ColorPalette from '$lib/components/ColorPalette.svelte';
  import Expand from '$lib/components/Expand.svelte';
  import ToggleSwitch from '$lib/components/buttons/ToggleSwitch.svelte';
  import SaveAndCloseButtons from '$lib/components/modals/SaveAndCloseButtons.svelte';
  import {
    colorsToCode,
    colorsToYarnDetails,
    getColorsFromInput,
    pluralize,
  } from '$lib/utils';
  import { getModalStore, getToastStore } from '@skeletonlabs/skeleton';
  import { getContext, hasContext } from 'svelte';
  import { slide } from 'svelte/transition';
  import ModalShell from './ModalShell.svelte';

  export let colors, updateGauge, parent;

  const toastStore = getToastStore();

  const modalStore = getModalStore();

  $: palette = colors.map((n) => n?.hex);

  let copiedPalette = false;
  let copiedNames = false;
  let copiedHexes = false;
  let colorNamesAsArray = false;
  let colorCodesAsArray = false;
  let colorHexesWithHashes = true;

  let copiedNotice = `<span transition:fade class="inline-flex items-center gap-1">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="w-5 h-5">
                    <path
                        fill-rule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z"
                        clip-rule="evenodd"
                    />
                </svg>
                Copied to your clipboard
            </span>`;

  let isExpanded = false;

  let code = `${colorsToCode(colors, {
    includePrefixes: true,
  })}${colorsToYarnDetails({ colors }) ? 'yarn:' + colorsToYarnDetails({ colors }) : ''}`;

  $: colorNames = colorNamesAsArray
    ? JSON.stringify(colors.filter((n) => n.name).map((n) => n.name))
    : colors
        .filter((n) => n.name)
        .map((n) => n.name)
        .join(', ');

  $: colorHexes = getColorHexes({
    palette,
    asArray: colorCodesAsArray,
    withHashes: colorHexesWithHashes,
  });

  $: if (copiedPalette || copiedNames || copiedHexes) {
    toastStore.trigger({
      message: copiedNotice,
      background: 'bg-success-300 text-black',
    });
    copiedPalette = false;
    copiedNames = false;
    copiedHexes = false;
  }

  function triggerChange() {
    if (code === null || code === '') return;
    colors = getColorsFromInput({ string: code }) || colors;
  }

  function getColorHexes({ palette, asArray, withHashes }) {
    if (!Array.isArray(palette)) return false;
    if (!withHashes) palette = palette.map((n) => n.slice(1));
    if (asArray) return JSON.stringify(palette);
    return palette.join(', ');
  }
</script>

<ModalShell {parent}>
  <div class="flex flex-col text-left gap-1">
    <label for="palette-code" class="text-small"
      >Enter colors or palette code</label
    >
    <textarea
      id="palette-code"
      class="select-all textarea"
      bind:value={code}
      on:keyup={triggerChange}
      on:change={triggerChange}
    ></textarea>
  </div>

  <div class="flex flex-wrap my-2 gap-2 items-center justify-start">
    <button
      class="btn bg-secondary-hover-token gap-1"
      on:click={() => {
        try {
          window.navigator.clipboard.writeText(code);
          copiedPalette = true;
        } catch {
          toastStore.trigger({
            message: 'Unable to copy to clipboard',
            background: 'bg-success-300 text-black',
          });
        }
      }}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        stroke-width="1.5"
        stroke="currentColor"
        class="w-6 h-6"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          d="M8.25 7.5V6.108c0-1.135.845-2.098 1.976-2.192.373-.03.748-.057 1.123-.08M15.75 18H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08M15.75 18.75v-1.875a3.375 3.375 0 00-3.375-3.375h-1.5a1.125 1.125 0 01-1.125-1.125v-1.5A3.375 3.375 0 006.375 7.5H5.25m11.9-3.664A2.251 2.251 0 0015 2.25h-1.5a2.251 2.251 0 00-2.15 1.586m5.8 0c.065.21.1.433.1.664v.75h-6V4.5c0-.231.035-.454.1-.664M6.75 7.5H4.875c-.621 0-1.125.504-1.125 1.125v12c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V16.5a9 9 0 00-9-9z"
        />
      </svg>
      Copy Palette Code
    </button>
  </div>

  <div class="text-left flex flex-col gap-2 my-2">
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
        <div class="ml-2 flex flex-wrap gap-2 my-2">
          <pre class="pre select-all">red, orange, lightblue</pre>
          <pre class="pre select-all">FF0000-FFA500-ADD8E6</pre>
          <pre class="pre select-all">#FF0000 #FFA500 #ADD8E6</pre>
          <pre class="pre select-all">red, FFA500, #ADD8E6</pre>
        </div>
        <p>• A palette code from this web app</p>
        <div class="ml-2 flex flex-wrap gap-2 my-2">
          <pre
            class="break-all pre select-all">palette:40004bae8bbdf7f7f780c58100441b</pre>
        </div>
        <p>
          • The URL of a saved project or yarn search result from this web app.
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

  {#if colors}
    <ColorPalette
      {colors}
      schemeName={`${palette.length ? palette.length + ' ' + pluralize('Color', palette.length) : ''}`}
    />
  {/if}

  <div class="inline-block my-4 w-full mx-auto">
    <SaveAndCloseButtons
      onSave={() => {
        updateGauge({ _colors: colors });
        modalStore.close();
      }}
      disabled={!palette}
      onClose={() => {
        modalStore.close();
      }}
    />
  </div>

  {#if !palette}
    <p class="variant-soft-warning p-4 card">Code not valid</p>
  {/if}

  {#if palette}
    <div class="flex flex-wrap gap-2 justify-start items-center w-full my-4">
      <div
        class="flex flex-col justify-start items-start text-left gap-2 w-full"
      >
        <p class="text-sm">HTML Color Codes</p>
        <p
          class="card variant-soft-primary p-4 basis-full mb-2 w-full break-all text-token select-all"
        >
          {colorHexes}
        </p>
      </div>
      <div
        class="flex flex-wrap gap-2 justify-center items-center cursor-pointer"
      >
        <ToggleSwitch bind:checked={colorCodesAsArray} label="Array" />
      </div>
      <div
        class="flex flex-wrap gap-2 justify-center items-center cursor-pointer"
      >
        <ToggleSwitch bind:checked={colorHexesWithHashes} label="Hashes" />
      </div>
      <button
        class="btn bg-secondary-hover-token gap-1"
        on:click={() => {
          try {
            window.navigator.clipboard.writeText(colorHexes);
            copiedHexes = true;
          } catch {
            toastStore.trigger({
              message: 'Unable to copy to clipboard',
              background: 'bg-success-300 text-black',
            });
          }
        }}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          stroke-width="1.5"
          stroke="currentColor"
          class="w-6 h-6"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            d="M8.25 7.5V6.108c0-1.135.845-2.098 1.976-2.192.373-.03.748-.057 1.123-.08M15.75 18H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08M15.75 18.75v-1.875a3.375 3.375 0 00-3.375-3.375h-1.5a1.125 1.125 0 01-1.125-1.125v-1.5A3.375 3.375 0 006.375 7.5H5.25m11.9-3.664A2.251 2.251 0 0015 2.25h-1.5a2.251 2.251 0 00-2.15 1.586m5.8 0c.065.21.1.433.1.664v.75h-6V4.5c0-.231.035-.454.1-.664M6.75 7.5H4.875c-.621 0-1.125.504-1.125 1.125v12c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V16.5a9 9 0 00-9-9z"
          />
        </svg>
        Copy HTML Color Codes
      </button>
    </div>
  {/if}

  {#if colorNames}
    <div class="flex flex-wrap gap-2 justify-start items-center w-full my-4">
      <div
        class="flex flex-col justify-start items-start text-left gap-2 w-full"
      >
        <p class="text-sm">Colorway Names</p>
        <p
          class="card variant-soft-primary p-4 basis-full mb-2 w-full break-all text-token select-all"
        >
          {colorNames}
        </p>
      </div>
      <div
        class="flex flex-wrap gap-2 justify-center items-center cursor-pointer"
      >
        <ToggleSwitch bind:checked={colorNamesAsArray} label="Array" />
      </div>
      <button
        class="btn bg-secondary-hover-token gap-1"
        on:click={() => {
          try {
            window.navigator.clipboard.writeText(colorNames);
            copiedNames = true;
          } catch {
            toastStore.trigger({
              message: 'Unable to copy to clipboard',
              background: 'bg-success-300 text-black',
            });
          }
        }}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          stroke-width="1.5"
          stroke="currentColor"
          class="w-6 h-6"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            d="M8.25 7.5V6.108c0-1.135.845-2.098 1.976-2.192.373-.03.748-.057 1.123-.08M15.75 18H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08M15.75 18.75v-1.875a3.375 3.375 0 00-3.375-3.375h-1.5a1.125 1.125 0 01-1.125-1.125v-1.5A3.375 3.375 0 006.375 7.5H5.25m11.9-3.664A2.251 2.251 0 0015 2.25h-1.5a2.251 2.251 0 00-2.15 1.586m5.8 0c.065.21.1.433.1.664v.75h-6V4.5c0-.231.035-.454.1-.664M6.75 7.5H4.875c-.621 0-1.125.504-1.125 1.125v12c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V16.5a9 9 0 00-9-9z"
          />
        </svg>
        Copy Colorway Names
      </button>
    </div>
  {/if}

  <p class="font-ornament text-4xl my-8 text-center">I</p>
</ModalShell>

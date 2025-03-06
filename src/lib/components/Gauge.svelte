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

<script module>
  let fullscreen = $state({ value: false });
</script>

<script lang="ts">
  import { page } from '$app/state';
  import ColorPaletteEditable from '$lib/components/ColorPaletteEditable.svelte';
  import SelectNumberOfColors from '$lib/components/SelectNumberOfColors.svelte';
  import BrowsePalettes from '$lib/components/modals/BrowsePalettes.svelte';
  import ChooseColorways from '$lib/components/modals/ChooseColorways.svelte';
  import GetPaletteFromImage from '$lib/components/modals/GetPaletteFromImage.svelte';
  import ImportExportPalette from '$lib/components/modals/ImportExportPalette.svelte';
  import RandomPalette from '$lib/components/modals/RandomPalette.svelte';
  import SortPalette from '$lib/components/modals/SortPalette.svelte';
  import { drawerState, modal, pageSections } from '$lib/state';
  import type { Color, GaugeSettingsType } from '$lib/types';
  import { createGaugeColors } from '$lib/utils';

  let { gauge = $bindable() } = $props();

  let gaugeContainerElement = $state();

  function updateGauge({
    _colors,
    _schemeId = 'Custom',
  }: {
    _colors: Color[];
    _schemeId?: GaugeSettingsType['schemeId'];
  }) {
    if (_colors) {
      gauge.updateColors({ colors: _colors });
    }

    gauge.schemeId = _schemeId;

    drawerState.closeAll();

    modal.close();
  }

  $effect(() => {
    if (fullscreen.value) {
      gaugeContainerElement.style.zIndex = '40';
      document.body.style.overflow = 'hidden';
    } else {
      gaugeContainerElement.style.zIndex = '';
      document.body.style.overflow = '';
    }
  });
</script>

<svelte:window
  onkeydown={(e) => {
    if (
      e.target.tagName === 'INPUT' ||
      e.target.tagName === 'TD' ||
      e.target.tagName === 'SELECT'
    )
      return;
    if (e.key === 'f') {
      if (
        !pageSections.items.find((p) => p.id === 'page-section-gauges')
          ?.active &&
        page.route.id === '/'
      )
        return;
      fullscreen.value = !fullscreen.value;
    } else if (e.key === 'Escape') {
      fullscreen.value = false;
    }
  }}
/>

<div
  class={[
    'w-full flex flex-col items-center',
    fullscreen.value
      ? 'justify-start fixed w-full h-full left-0 top-0 bg-surface-50 dark:bg-surface-950 overflow-scroll max-sm:pb-2'
      : 'justify-center shadow-inner mt-2 pb-2 gap-2 rounded-container bg-surface-100 dark:bg-surface-900',
  ]}
  bind:this={gaugeContainerElement}
>
  <div class={['w-full', fullscreen.value && 'flex-auto order-2 ']}>
    {#key gauge.colors}
      <ColorPaletteEditable
        bind:fullscreen={fullscreen.value}
        bind:colors={gauge.colors}
        schemeName={gauge.schemeId}
        showSchemeName={false}
        roundedBottom={false}
      />
    {/key}
  </div>

  <div
    class={[
      'flex flex-wrap justify-center items-center gap-2 px-2',
      fullscreen.value && 'py-2 order-1',
    ]}
  >
    <div class="">
      <SelectNumberOfColors
        hideText={fullscreen.value}
        numberOfColors={gauge.colors.length}
        onchange={(e) => {
          const colors = createGaugeColors({
            schemeId: gauge.schemeId,
            numberOfColors: +e.target.value,
            colors: $state.snapshot(gauge.colors),
          });
          gauge.updateColors({ colors });
        }}
      />
    </div>

    <button
      class={[
        'hover:preset-tonal gap-1',
        fullscreen.value ? 'btn-icon' : 'btn justify-start',
      ]}
      onclick={() =>
        modal.trigger({
          type: 'component',
          component: {
            ref: BrowsePalettes,
            props: {
              numberOfColors: gauge.numberOfColors,
              schemeId: gauge.schemeId,
              updateGauge,
            },
          },
          options: { size: 'large' },
        })}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        stroke-width="1.5"
        stroke="currentColor"
        class="size-6"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          d="M4.098 19.902a3.75 3.75 0 005.304 0l6.401-6.402M6.75 21A3.75 3.75 0 013 17.25V4.125C3 3.504 3.504 3 4.125 3h5.25c.621 0 1.125.504 1.125 1.125v4.072M6.75 21a3.75 3.75 0 003.75-3.75V8.197M6.75 21h13.125c.621 0 1.125-.504 1.125-1.125v-5.25c0-.621-.504-1.125-1.125-1.125h-4.072M10.5 8.197l2.88-2.88c.438-.439 1.15-.439 1.59 0l3.712 3.713c.44.44.44 1.152 0 1.59l-2.879 2.88M6.75 17.25h.008v.008H6.75v-.008z"
        />
      </svg>
      {#if !fullscreen.value}
        Browse Palettes
      {/if}
    </button>

    <button
      class={[
        'hover:preset-tonal gap-1',
        fullscreen.value ? 'btn-icon' : 'btn justify-start',
      ]}
      title="Choose Yarn Colorways, Filtered by Brand and Yarn"
      onclick={() =>
        modal.trigger({
          type: 'component',
          component: {
            ref: ChooseColorways,
            props: {
              updateGauge,
            },
          },
          options: {
            size: 'large',
          },
        })}
    >
      <svg xmlns="http://www.w3.org/2000/svg" class="size-6" viewBox="0 0 16 16"
        ><path
          fill="currentColor"
          d="M11.2 1H8.8c-.857 0-1.44 0-1.89.038c-.438.035-.663.1-.819.18a2 2 0 0 0-.874.874a2 2 0 0 0-.153.462C5.01 2.803 4.803 3 4.548 3c-.282 0-.51-.24-.47-.518a2.7 2.7 0 0 1 .248-.844a3.02 3.02 0 0 1 1.31-1.31C6.278 0 7.116 0 8.796 0h2.4c1.68 0 2.52 0 3.16.327a3.02 3.02 0 0 1 1.31 1.31c.327.642.327 1.48.327 3.16v2.4c0 1.68 0 2.52-.327 3.16a3 3 0 0 1-1.31 1.31a2.7 2.7 0 0 1-.844.248c-.279.04-.518-.188-.518-.47c0-.255.197-.462.446-.516c.209-.046.365-.104.462-.153c.376-.192.682-.498.874-.874c.08-.156.145-.381.18-.82c.037-.45.038-1.03.038-1.89v-2.4c0-.856-.001-1.44-.038-1.89c-.036-.437-.101-.662-.18-.818a2 2 0 0 0-.874-.874c-.156-.08-.381-.145-.819-.18c-.45-.037-1.03-.038-1.89-.038zM8.83 8.12a.5.5 0 0 1 .054.705l-3 3.5a.497.497 0 0 1-.733.028l-2-2a.5.5 0 0 1 .707-.707l1.62 1.62l2.65-3.09a.5.5 0 0 1 .705-.054z"
        /><path
          fill="currentColor"
          fill-rule="evenodd"
          d="M.327 5.64C0 6.282 0 7.12 0 8.8v2.4c0 1.68 0 2.52.327 3.16a3.02 3.02 0 0 0 1.31 1.31c.642.327 1.48.327 3.16.327h2.4c1.68 0 2.52 0 3.16-.327a3 3 0 0 0 1.31-1.31c.327-.642.327-1.48.327-3.16V8.8c0-1.68 0-2.52-.327-3.16a3 3 0 0 0-1.31-1.31c-.642-.327-1.48-.327-3.16-.327h-2.4c-1.68 0-2.52 0-3.16.327a3.02 3.02 0 0 0-1.31 1.31m6.87-.638h-2.4c-.857 0-1.44 0-1.89.038c-.438.035-.663.1-.819.18a2 2 0 0 0-.874.874c-.08.156-.145.38-.18.819c-.037.45-.038 1.03-.038 1.89v2.4c0 .857.001 1.44.038 1.89c.036.438.101.663.18.819c.192.376.498.682.874.874c.156.08.381.145.819.18c.45.036 1.03.037 1.89.037h2.4c.857 0 1.44 0 1.89-.037c.438-.036.663-.101.819-.18c.376-.192.682-.498.874-.874c.08-.156.145-.381.18-.82c.037-.45.038-1.03.038-1.89v-2.4c0-.856-.001-1.44-.038-1.89c-.036-.437-.101-.662-.18-.818a2 2 0 0 0-.874-.874c-.156-.08-.381-.145-.819-.18c-.45-.037-1.03-.038-1.89-.038"
          clip-rule="evenodd"
        /></svg
      >

      {#if !fullscreen.value}
        Choose Colorways
      {/if}
    </button>

    <button
      class={[
        'hover:preset-tonal gap-1',
        fullscreen.value ? 'btn-icon' : 'btn justify-start',
      ]}
      title="Get Palette from Image"
      onclick={() =>
        modal.trigger({
          type: 'component',
          component: {
            ref: GetPaletteFromImage,
            props: {
              numberOfColors: gauge.numberOfColors,
              updateGauge,
            },
          },
          options: {
            size: 'large',
          },
        })}
      ><svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        stroke-width="1.5"
        stroke="currentColor"
        class="size-6"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z"
        />
      </svg>
      {#if !fullscreen.value}
        Image Palette
      {/if}</button
    >

    <button
      class={[
        'hover:preset-tonal gap-1',
        fullscreen.value ? 'btn-icon' : 'btn justify-start',
      ]}
      title="Generate Random Colors"
      onclick={() =>
        modal.trigger({
          type: 'component',
          component: {
            ref: RandomPalette,
            props: {
              numberOfColors: gauge.numberOfColors,
              updateGauge,
            },
          },
          options: {
            size: 'medium',
          },
        })}
    >
      <svg xmlns="http://www.w3.org/2000/svg" class="size-6" viewBox="0 0 24 24"
        ><path
          fill="none"
          stroke="currentColor"
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="1.5"
          d="M3 17h2.735a4 4 0 0 0 3.43-1.942l3.67-6.116A4 4 0 0 1 16.265 7H21m0 0l-2-2m2 2l-2 2M3 7h2.735a4 4 0 0 1 2.871 1.215M21 17h-4.735a4 4 0 0 1-2.871-1.215M21 17l-2 2m2-2l-2-2"
        /></svg
      >
      {#if !fullscreen.value}
        Random
      {/if}
    </button>

    <button
      class={[
        'hover:preset-tonal gap-1',
        fullscreen.value ? 'btn-icon' : 'btn justify-start',
      ]}
      title="Load Colors or Get a Palette Code to Share"
      onclick={() =>
        modal.trigger({
          type: 'component',
          component: {
            ref: ImportExportPalette,
            props: {
              colors: $state.snapshot(gauge.colors),
              updateGauge,
            },
          },
        })}
    >
      <svg xmlns="http://www.w3.org/2000/svg" class="size-6" viewBox="0 0 24 24"
        ><path
          fill="currentColor"
          d="m16.2 20.5l2.8-2.8V20h1v-4h-4v1h2.3l-2.8 2.8zM5 21q-.825 0-1.413-.587T3 19V5q0-.825.588-1.412T5 3h14q.825 0 1.413.588T21 5v6.7q-.475-.225-.975-.387T19 11.075V5H5v14h6.05q.075.55.238 1.05t.387.95zm0-3v1V5v6.075V11zm2-1h4.075q.075-.525.238-1.025t.362-.975H7zm0-4h6.1q.8-.75 1.787-1.25T17 11.075V11H7zm0-4h10V7H7zm11 14q-2.075 0-3.537-1.463T13 18t1.463-3.537T18 13t3.538 1.463T23 18t-1.463 3.538T18 23"
        /></svg
      >

      {#if !fullscreen.value}
        Export/Import
      {/if}
    </button>

    <button
      class={[
        'hover:preset-tonal gap-1',
        fullscreen.value ? 'btn-icon' : 'btn justify-start',
      ]}
      title="Sort Colors"
      onclick={() =>
        modal.trigger({
          type: 'component',
          component: {
            ref: SortPalette,
            props: {
              colors: $state.snapshot(gauge.colors),
              updateGauge,
            },
          },
          options: {
            size: 'medium',
          },
        })}
    >
      <svg xmlns="http://www.w3.org/2000/svg" class="size-6" viewBox="0 0 24 24"
        ><path
          fill="none"
          stroke="currentColor"
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="1.5"
          d="M10 14H2m6-4H2m4-4H2m10 12H2m17 2V4m0 16l3-3m-3 3l-3-3m3-13l3 3m-3-3l-3 3"
        /></svg
      >
      {#if !fullscreen.value}
        Sort
      {/if}
    </button>

    <button
      aria-label="Fullscreen"
      class={[
        'btn flex gap-1 justify-start items-center',
        !fullscreen.value ? 'hover:preset-tonal' : 'preset-tonal',
      ]}
      onclick={() => (fullscreen.value = !fullscreen.value)}
      title="Toggle Fullscreen Editing Mode (f)"
    >
      {#if !fullscreen.value}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          stroke-width="1.5"
          stroke="currentColor"
          class="size-6"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m4.5 0v-4.5m0 4.5L15 15"
          />
        </svg>

        Fullscreen
      {:else}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          stroke-width="1.5"
          stroke="currentColor"
          class="size-6"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            d="M9 9V4.5M9 9H4.5M9 9 3.75 3.75M9 15v4.5M9 15H4.5M9 15l-5.25 5.25M15 9h4.5M15 9V4.5M15 9l5.25-5.25M15 15h4.5M15 15v4.5m0-4.5 5.25 5.25"
          />
        </svg>

        Exit Fullscreen
      {/if}
    </button>
  </div>
</div>

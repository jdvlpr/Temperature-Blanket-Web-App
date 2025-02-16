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
  import { page } from '$app/state';
  import ColorPaletteEditable from '$lib/components/ColorPaletteEditable.svelte';
  import SelectNumberOfColors from '$lib/components/SelectNumberOfColors.svelte';
  import BrowsePalettes from '$lib/components/modals/BrowsePalettes.svelte';
  import ChooseColorways from '$lib/components/modals/ChooseColorways.svelte';
  import GetPaletteFromImage from '$lib/components/modals/GetPaletteFromImage.svelte';
  import ImportExportPalette from '$lib/components/modals/ImportExportPalette.svelte';
  import RandomPalette from '$lib/components/modals/RandomPalette.svelte';
  import SortPalette from '$lib/components/modals/SortPalette.svelte';
  import { drawerState, modal, pageSections, pinAllSections } from '$lib/state';
  import type { Color, GaugeSettingsType } from '$lib/types';
  import { createGaugeColors } from '$lib/utils';
  import { Modal } from '@skeletonlabs/skeleton-svelte';
  let { gauge = $bindable() } = $props();

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

  let fullscreen = $state(false);

  let gaugeContainerElement = $state();

  $effect(() => {
    if (fullscreen) {
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
        !pinAllSections.value &&
        page.route.id === '/'
      )
        return;
      fullscreen = !fullscreen;
    } else if (e.key === 'Escape') {
      fullscreen = false;
    }
  }}
/>

<div
  class="w-full flex flex-col justify-center items-center bg-surface-100-900 {fullscreen
    ? 'fixed w-full h-full left-0 top-0 bg-surface-50-950 overflow-scroll'
    : 'shadow-inner mt-2 pb-2 gap-2 rounded-container'}"
  bind:this={gaugeContainerElement}
>
  <div class={['w-full', fullscreen && 'flex-auto']}>
    {#key gauge.colors}
      <ColorPaletteEditable
        bind:fullscreen
        bind:colors={gauge.colors}
        schemeName={gauge.schemeId}
        showSchemeName={false}
        roundedBottom={false}
      />
    {/key}
  </div>

  <div
    class="flex flex-wrap justify-center items-center gap-2 {fullscreen
      ? 'p-2'
      : ''}"
  >
    <div class="">
      <SelectNumberOfColors
        hideText={fullscreen}
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
        fullscreen ? 'btn-icon' : 'btn justify-start',
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
      {#if !fullscreen}
        Palettes
      {/if}
    </button>

    <button
      class={[
        'hover:preset-tonal gap-1',
        fullscreen ? 'btn-icon' : 'btn justify-start',
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
          d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
        />
      </svg>

      {#if !fullscreen}
        Colorways
      {/if}
    </button>

    <button
      class={[
        'hover:preset-tonal gap-1',
        fullscreen ? 'btn-icon' : 'btn justify-start',
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
      {#if !fullscreen}
        Image
      {/if}</button
    >

    <button
      class={[
        'hover:preset-tonal gap-1',
        fullscreen ? 'btn-icon' : 'btn justify-start',
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
      {#if !fullscreen}
        Random
      {/if}
    </button>

    <button
      class={[
        'hover:preset-tonal gap-1',
        fullscreen ? 'btn-icon' : 'btn justify-start',
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
      <svg xmlns="http://www.w3.org/2000/svg" class="size-5" viewBox="0 0 24 24"
        ><path
          fill="none"
          stroke="currentColor"
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="1.5"
          d="M9.697 4L6.678 21M17.054 4l-3.019 17M21 8.781H3m18 7.438H3"
        /></svg
      >

      {#if !fullscreen}
        Codes
      {/if}
    </button>

    <button
      class={[
        'hover:preset-tonal gap-1',
        fullscreen ? 'btn-icon' : 'btn justify-start',
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
      {#if !fullscreen}
        Sort
      {/if}
    </button>

    <button
      aria-label="Fullscreen"
      class="btn hover:preset-tonal gap-1 flex gap-1 justify-start items-center"
      onclick={() => (fullscreen = !fullscreen)}
      title="Toggle Fullscreen Editing Mode (f)"
    >
      {#if !fullscreen}
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
      {/if}
      {#if fullscreen}
        Exit
      {/if}
      Fullscreen
    </button>
  </div>
</div>

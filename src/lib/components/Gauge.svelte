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
  import {
    ArrowDownWideNarrowIcon,
    CircleCheckIcon,
    ExpandIcon,
    ImageIcon,
    ShareIcon,
    ShrinkIcon,
    ShuffleIcon,
    SwatchBookIcon,
  } from '@lucide/svelte';

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
      e.target.tagName === 'TEXTAREA' ||
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
    'flex w-full flex-col items-center',
    fullscreen.value
      ? 'bg-surface-50 dark:bg-surface-950 fixed top-0 left-0 h-full w-full justify-start overflow-scroll max-sm:pb-2'
      : 'rounded-container bg-surface-100 dark:bg-surface-900 mt-2 justify-center gap-2 pb-2 shadow-inner',
  ]}
  bind:this={gaugeContainerElement}
>
  <div class={['w-full', fullscreen.value && 'order-2 flex-auto ']}>
    {#key gauge.colors}
      <ColorPaletteEditable
        bind:fullscreen={fullscreen.value}
        bind:colors={gauge.colors}
        schemeName={gauge.schemeId}
        showSchemeName={false}
        roundedBottom={false}
        onchanged={() => {
          updateGauge({ _colors: gauge.colors });
        }}
      />
    {/key}
  </div>

  <div
    class={[
      'flex flex-wrap items-center justify-center gap-2 px-2',
      fullscreen.value && 'order-1 py-2',
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
        'hover:preset-tonal',
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
      <SwatchBookIcon />
      {#if !fullscreen.value}
        Browse Palettes
      {/if}
    </button>

    <button
      class={[
        'hover:preset-tonal',
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
      <CircleCheckIcon />
      {#if !fullscreen.value}
        Choose Colorways
      {/if}
    </button>

    <button
      class={[
        'hover:preset-tonal',
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
    >
      <ImageIcon />
      {#if !fullscreen.value}
        Image Palette
      {/if}</button
    >

    <button
      class={[
        'hover:preset-tonal',
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
      <ShuffleIcon />
      {#if !fullscreen.value}
        Random
      {/if}
    </button>

    <button
      class={[
        'hover:preset-tonal',
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
      <ShareIcon />

      {#if !fullscreen.value}
        Export/Import
      {/if}
    </button>

    <button
      class={[
        'hover:preset-tonal',
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
      <ArrowDownWideNarrowIcon />
      {#if !fullscreen.value}
        Sort
      {/if}
    </button>

    <button
      aria-label="Fullscreen"
      class={['btn', !fullscreen.value ? 'hover:preset-tonal' : 'preset-tonal']}
      onclick={() => (fullscreen.value = !fullscreen.value)}
      title="Toggle Fullscreen Editing Mode (f)"
    >
      {#if !fullscreen.value}
        <ExpandIcon />
        Fullscreen
      {:else}
        <ShrinkIcon />
        Exit Fullscreen
      {/if}
    </button>
  </div>
</div>

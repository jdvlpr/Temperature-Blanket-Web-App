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
  import SavePalette from '$lib/components/modals/SavePalette.svelte';
  import SortPalette from '$lib/components/modals/SortPalette.svelte';
  import {
    drawerState,
    dialog,
    pageSections,
  } from '$lib/state/page-state.svelte';
  import type { Color } from '$lib/types/yarn-types';
  import type { GaugeSettingsType } from '$lib/types/gauge-types';
  import { createGaugeColors } from '$lib/state/gauges-state.svelte';
  import {
    ArrowDownWideNarrowIcon,
    BookmarkPlusIcon,
    ChevronDownIcon,
    CircleCheckIcon,
    ClipboardPasteIcon,
    ExpandIcon,
    ImageIcon,
    PaletteIcon,
    ShareIcon,
    ShrinkIcon,
    ShuffleIcon,
    SwatchBookIcon,
  } from '@lucide/svelte';
  import { Menu, Portal } from '@skeletonlabs/skeleton-svelte';

  let { gauge = $bindable() } = $props();

  let gaugeContainerElement = $state<HTMLDivElement | undefined>(undefined);

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

    dialog.close();
  }

  let toolbarButtonClass = $derived(
    `hover:preset-tonal-surface ${fullscreen.value ? 'btn-icon' : 'btn justify-start'}`,
  );

  const colorSources = [
    {
      value: 'browse',
      label: 'Browse Palettes',
      details: 'Saved, gallery, featured, and schemes',
      icon: SwatchBookIcon,
    },
    {
      value: 'colorways',
      label: 'Choose Colorways',
      details: 'Pick yarn by brand and yarn',
      icon: CircleCheckIcon,
    },
    {
      value: 'image',
      label: 'From an Image',
      details: 'Pick colors from a photo',
      icon: ImageIcon,
    },
    {
      value: 'random',
      label: 'Random',
      details: 'Generate random colors',
      icon: ShuffleIcon,
    },
    {
      value: 'paste',
      label: 'Paste Colors or Code',
      details: 'Color names, hex codes, palette codes, or links',
      icon: ClipboardPasteIcon,
    },
  ];

  function openColorSource(value: string) {
    switch (value) {
      case 'browse':
        dialog.trigger({
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
        });
        break;
      case 'colorways':
        dialog.trigger({
          type: 'component',
          component: { ref: ChooseColorways, props: { updateGauge } },
          options: { size: 'large' },
        });
        break;
      case 'image':
        dialog.trigger({
          type: 'component',
          component: {
            ref: GetPaletteFromImage,
            props: { numberOfColors: gauge.numberOfColors, updateGauge },
          },
          options: { size: 'large' },
        });
        break;
      case 'random':
        dialog.trigger({
          type: 'component',
          component: {
            ref: RandomPalette,
            props: { numberOfColors: gauge.numberOfColors, updateGauge },
          },
          options: { size: 'medium' },
        });
        break;
      case 'paste':
        dialog.trigger({
          type: 'component',
          component: {
            ref: ImportExportPalette,
            props: {
              colors: $state.snapshot(gauge.colors),
              updateGauge,
              mode: 'import',
            },
          },
        });
        break;
    }
  }

  $effect(() => {
    if (gaugeContainerElement) {
      if (fullscreen.value) {
        gaugeContainerElement.style.zIndex = '40';
        document.body.style.overflow = 'hidden';
      } else {
        gaugeContainerElement.style.zIndex = '';
        document.body.style.overflow = '';
      }
    }
  });
</script>

<svelte:window
  onkeydown={(e: KeyboardEvent) => {
    if (e.target instanceof HTMLElement) {
      if (
        e.target.tagName === 'INPUT' ||
        e.target.tagName === 'TEXTAREA' ||
        e.target.tagName === 'TD' ||
        e.target.tagName === 'SELECT'
      )
        return;
    }
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
      : 'rounded-container bg-surface-100 dark:bg-surface-900 mt-2 justify-center gap-2 shadow-inner',
    gauge.unit.type !== 'category' ? 'pb-2' : 'overflow-hidden',
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
        isStaticGauge={gauge.isStatic}
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
      gauge.unit.type === 'category' && 'hidden',
    ]}
  >
    {#key fullscreen.value}
      <SelectNumberOfColors
        hideText={fullscreen.value}
        numberOfColors={gauge.colors.length}
        onchange={(e: Event) => {
          const target = e.target as HTMLSelectElement;
          const colors = createGaugeColors({
            schemeId: gauge.schemeId,
            numberOfColors: +target.value,
            colors: $state.snapshot(gauge.colors),
          });
          gauge.updateColors({ colors });
        }}
      />
    {/key}

    <Menu
      positioning={{ placement: 'bottom-start' }}
      onSelect={(details) => openColorSource(details.value)}
    >
      <Menu.Trigger
        class={toolbarButtonClass}
        title="Get Colors from Palettes, Yarn, an Image, and More"
      >
        <PaletteIcon />
        {#if !fullscreen.value}
          <span class="flex items-center gap-1"
            >Get Colors <ChevronDownIcon size={18} /></span
          >
        {/if}
      </Menu.Trigger>
      <Portal>
        <Menu.Positioner>
          <Menu.Content
            class="bg-surface-100-900 z-9999 max-w-[calc(100vw-2rem)]"
          >
            {#each colorSources as source (source.value)}
              <Menu.Item
                value={source.value}
                class="hover:preset-tonal-surface flex items-center justify-start gap-2 text-left whitespace-normal"
              >
                <source.icon class="shrink-0" />
                <div class="flex min-w-0 flex-col text-left">
                  <p>{source.label}</p>
                  <p class="text-surface-700-300 text-xs">
                    {source.details}
                  </p>
                </div>
              </Menu.Item>
            {/each}
          </Menu.Content>
        </Menu.Positioner>
      </Portal>
    </Menu>

    <button
      class={toolbarButtonClass}
      title="Sort Colors"
      onclick={() =>
        dialog.trigger({
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
      class={toolbarButtonClass}
      title="Save This Palette to Use Again Later"
      onclick={() =>
        dialog.trigger({
          type: 'component',
          component: {
            ref: SavePalette,
            props: {
              colors: $state.snapshot(gauge.colors),
            },
          },
          options: {
            size: 'medium',
          },
        })}
    >
      <BookmarkPlusIcon />
      {#if !fullscreen.value}
        <!-- Not just "Save": the Project Planner's top bar has a Save for the project -->
        Save Palette
      {/if}
    </button>

    <button
      class={toolbarButtonClass}
      title="Export as Color Codes, an Image, Yarn Names, or a Link"
      onclick={() =>
        dialog.trigger({
          type: 'component',
          component: {
            ref: ImportExportPalette,
            props: {
              colors: $state.snapshot(gauge.colors),
              mode: 'export',
            },
          },
        })}
    >
      <ShareIcon />
      {#if !fullscreen.value}
        Export
      {/if}
    </button>

    <button
      class={[
        'hover:preset-tonal-surface',
        fullscreen.value ? 'btn' : 'btn-icon',
      ]}
      aria-label={fullscreen.value ? 'Exit Fullscreen' : 'Fullscreen'}
      onclick={() => (fullscreen.value = !fullscreen.value)}
      title="Toggle Fullscreen Editing Mode (f)"
    >
      {#if !fullscreen.value}
        <ExpandIcon />
      {:else}
        <ShrinkIcon />
        Exit Fullscreen
      {/if}
    </button>
  </div>
</div>

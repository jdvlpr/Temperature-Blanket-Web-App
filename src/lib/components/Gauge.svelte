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
  import SelectNumberOfColors from '$lib/components/SelectNumberOfColors.svelte';
  import BrowsePalettes from '$lib/components/modals/BrowsePalettes.svelte';
  import ChooseColorways from '$lib/components/modals/ChooseColorways.svelte';
  import GetPaletteFromImage from '$lib/components/modals/GetPaletteFromImage.svelte';
  import ImportExportPalette from '$lib/components/modals/ImportExportPalette.svelte';
  import RandomPalette from '$lib/components/modals/RandomPalette.svelte';
  import SavePalette from '$lib/components/modals/SavePalette.svelte';
  import SortMenu from '$lib/components/SortMenu.svelte';
  import { getSortedPalette } from '$lib/utils/color-utils';
  import { drawerState, dialog } from '$lib/state/page-state.svelte';
  import type { Color } from '$lib/types/yarn-types';
  import type { GaugeSettingsType } from '$lib/types/gauge-types';
  import { createGaugeColors } from '$lib/state/gauges-state.svelte';
  import {
    BookmarkPlusIcon,
    ChevronDownIcon,
    CircleCheckIcon,
    ClipboardPasteIcon,
    ImageIcon,
    PaletteIcon,
    ShareIcon,
    ShuffleIcon,
    SwatchBookIcon,
  } from '@lucide/svelte';
  import { Menu, Portal } from '@skeletonlabs/skeleton-svelte';

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

    dialog.close();
  }

  const toolbarButtonClass = 'hover:preset-tonal-surface btn justify-start';

  const colorSources = [
    {
      value: 'browse',
      label: 'Browse Presets',
      details: 'Get inspiration, and your saved palettes',
      icon: SwatchBookIcon,
    },
    {
      value: 'colorways',
      label: 'Choose Colorways',
      details: 'Pick by brand and yarn',
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
      details: 'Color names, hex codes, or links',
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
          options: { size: 'large', title: 'Browse Presets' },
        });
        break;
      case 'colorways':
        dialog.trigger({
          type: 'component',
          component: { ref: ChooseColorways, props: { updateGauge } },
          options: { size: 'large', title: 'Choose Colorways' },
        });
        break;
      case 'image':
        dialog.trigger({
          type: 'component',
          component: {
            ref: GetPaletteFromImage,
            props: {
              numberOfColors: gauge.numberOfColors,
              warmFirst: gauge.rangeOptions?.direction !== 'low-to-high',
              updateGauge,
            },
          },
          options: { size: 'medium', title: 'Get Colors from an Image' },
        });
        break;
      case 'random':
        dialog.trigger({
          type: 'component',
          component: {
            ref: RandomPalette,
            props: { numberOfColors: gauge.numberOfColors, updateGauge },
          },
          options: { size: 'medium', title: 'Generate Random Colors' },
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
          options: { title: 'Paste Colors or Code' },
        });
        break;
    }
  }
</script>

<div
  class={[
    'rounded-container bg-surface-100 dark:bg-surface-900 mt-2 flex w-full flex-col items-center justify-center gap-2 shadow-inner',
    gauge.unit.type !== 'category' ? 'pb-2' : 'overflow-hidden',
  ]}
>
  <div class="w-full">
    {#key gauge.colors}
      <ColorPaletteEditable
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
      gauge.unit.type === 'category' && 'hidden',
    ]}
  >
    <SelectNumberOfColors
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

    <Menu
      positioning={{ placement: 'bottom-start' }}
      onSelect={(details) => openColorSource(details.value)}
    >
      <Menu.Trigger
        class={toolbarButtonClass}
        title="Get Colors from Palettes, Yarn, an Image, and More"
      >
        <PaletteIcon />
        <span class="flex items-center gap-1"
          >Get Colors <ChevronDownIcon size={18} /></span
        >
      </Menu.Trigger>
      <Portal>
        <Menu.Positioner>
          <Menu.Content
            class="bg-surface-100-900 z-9999 max-w-[calc(100vw-2rem)]"
          >
            {#each colorSources as source (source.value)}
              <Menu.Item
                value={source.value}
                class="data-highlighted:bg-surface-200-800 flex items-center justify-start gap-2 text-left whitespace-normal data-highlighted:text-inherit"
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

    <SortMenu
      colors={gauge.colors}
      triggerClass={toolbarButtonClass}
      onsort={(sort) => {
        const colors = $state.snapshot(gauge.colors);
        updateGauge({
          _colors:
            sort === 'reverse'
              ? colors.reverse()
              : getSortedPalette({
                  palette: colors,
                  sortColors: sort,
                }),
        });
      }}
    />

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
          options: { title: 'Export Palette' },
        })}
    >
      <ShareIcon />
      Export
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
            title: 'Save Palette',
          },
        })}
    >
      <BookmarkPlusIcon />
      <!-- Not just "Save": the Project Planner's top bar has a Save for the project -->
      Save Palette
    </button>
  </div>
</div>

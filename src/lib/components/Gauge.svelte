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
  import { copyToClipboard } from '$lib/utils/clipboard-utils';
  import { version } from '$app/environment';
  import ColorPaletteEditable from '$lib/components/ColorPaletteEditable.svelte';
  import SelectNumberOfColors from '$lib/components/SelectNumberOfColors.svelte';
  import BrowsePalettes from '$lib/components/modals/BrowsePalettes.svelte';
  import ExportPaletteImage from '$lib/components/modals/ExportPaletteImage.svelte';
  import { formatRangeLabel } from '$lib/features/palette-image/layout';
  import ChooseColorways from '$lib/components/modals/ChooseColorways.svelte';
  import GetPaletteFromImage from '$lib/components/modals/GetPaletteFromImage.svelte';
  import ImportExportPalette from '$lib/components/modals/ImportExportPalette.svelte';
  import PasteColors from '$lib/components/modals/PasteColors.svelte';
  import RandomPalette from '$lib/components/modals/RandomPalette.svelte';
  import SavePalette from '$lib/components/modals/SavePalette.svelte';
  import SortMenu from '$lib/components/SortMenu.svelte';
  import { preferences } from '$lib/storage/preferences.svelte';
  import {
    getPaletteFallbackName,
    getSortedPalette,
    getYarnPageURL,
    reverseColors,
    shuffleColors,
  } from '$lib/utils/color-utils';
  import { drawerState, dialog } from '$lib/state/page-state.svelte';
  import { previewHighlight } from '$lib/state/preview-state.svelte';
  import { historyChange } from '$lib/utils/feedback.svelte';
  import type { Color } from '$lib/types/yarn-types';
  import type { GaugeSettingsType } from '$lib/types/gauge-types';
  import { createGaugeColors } from '$lib/state/gauges-state.svelte';
  import {
    BookmarkPlusIcon,
    ChevronDownIcon,
    CircleCheckIcon,
    ClipboardCopyIcon,
    ClipboardPasteIcon,
    CodeIcon,
    ImageIcon,
    LinkIcon,
    PaletteIcon,
    ShareIcon,
    ShuffleIcon,
    SwatchBookIcon,
  } from '@lucide/svelte';
  import { Menu, Portal } from '@skeletonlabs/skeleton-svelte';

  let {
    gauge = $bindable(),
    /** A project's gauge, whose ranges mean something (the Yarn page's don't) */
    inProject = false,
  } = $props();

  // Pointing at or focusing a color highlights the days in that yarn on the preview
  let highlightIndex: number | null = $state(null);
  // A new palette (an edit, undo, or new scheme) re-creates the swatches, so
  // the one pointed at may be gone; it's highlighted again on the next hover
  $effect.pre(() => {
    void gauge.colors;
    highlightIndex = null;
  });
  $effect(() => {
    if (!inProject) return;
    previewHighlight.hex =
      highlightIndex === null
        ? null
        : (gauge.colors[highlightIndex]?.hex ?? null);
    return () => (previewHighlight.hex = null);
  });

  let flashIndices = $derived(
    inProject && historyChange.gaugeId === gauge.id
      ? historyChange.indices
      : [],
  );

  /** Each color's range, as the gauge shows it, like "50–59 °F" */
  function getRangeLabels(): string[] | undefined {
    if (!inProject || !gauge.ranges?.length) return undefined;
    const unit = gauge.unit.label?.[preferences.value.units ?? 'metric'] ?? '';
    return gauge.ranges.map(
      (range: { label?: string; from?: number; to?: number }) =>
        gauge.unit.type === 'category' || range.label
          ? (range.label ?? '')
          : formatRangeLabel(range.from ?? 0, range.to ?? 0, unit),
    );
  }

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
      label: 'Browse Palettes',
      details: 'Get inspiration, and access saved palettes',
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
          options: { size: 'large', title: 'Browse Palettes' },
        });
        break;
      case 'colorways':
        dialog.trigger({
          type: 'component',
          component: { ref: ChooseColorways, props: { updateGauge } },
          options: { size: 'full', title: 'Choose Colorways' },
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
          component: { ref: PasteColors, props: { updateGauge } },
          options: { title: 'Paste Colors or Code' },
        });
        break;
    }
  }

  const paletteOutputs = [
    {
      value: 'save',
      label: 'Save Palette',
      title: 'Save Palette',
      details: 'Keep it to use in any project',
      icon: BookmarkPlusIcon,
    },
    {
      value: 'link',
      label: 'Link',
      title: 'Palette Link',
      details: 'Copy a link to share it, or to paste into another palette',
      icon: LinkIcon,
    },
    {
      value: 'image',
      label: 'Image',
      title: 'Palette Image',
      details: 'Download a PNG image',
      icon: ImageIcon,
    },
    {
      value: 'html',
      label: 'HTML Color Codes',
      title: 'HTML Color Codes',
      details: 'Copy codes for web and design',
      icon: CodeIcon,
    },
    {
      value: 'colorway',
      label: 'Yarn Colorway Names',
      title: 'Yarn Colorway Names',
      details: 'Copy colorway names',
      icon: ClipboardCopyIcon,
      needsNames: true,
    },
  ];

  // Colorway names can only be copied when some colors are yarn colorways
  let availablePaletteOutputs = $derived(
    paletteOutputs.filter(
      (output) =>
        !output.needsNames || gauge.colors.some((color: Color) => color.name),
    ),
  );

  // A link needs nothing chosen first, so it's copied straight away
  async function copyPaletteLink(colors: Color[]) {
    await copyToClipboard(
      getYarnPageURL({ colors, origin: window.location.origin, version }),
      'Palette link copied',
    );
  }

  function openPaletteOutput(value: string) {
    const output = paletteOutputs.find((output) => output.value === value);
    if (!output) return;
    const colors = $state.snapshot(gauge.colors);
    if (value === 'image') {
      dialog.trigger({
        type: 'component',
        component: {
          ref: ExportPaletteImage,
          props: {
            colors,
            ranges: getRangeLabels(),
            fallbackName: getPaletteFallbackName(colors),
          },
        },
        options: { size: 'xlarge', title: output.title },
      });
      return;
    }
    if (value === 'link') {
      copyPaletteLink(colors);
      return;
    }
    if (value === 'save') {
      dialog.trigger({
        type: 'component',
        component: { ref: SavePalette, props: { colors } },
        options: { size: 'medium', title: output.title },
      });
      return;
    }
    dialog.trigger({
      type: 'component',
      component: {
        ref: ImportExportPalette,
        props: { colors, exportType: value },
      },
      options: { title: output.title },
    });
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
        {flashIndices}
        onhover={(index: number | null) => (highlightIndex = index)}
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
              ? reverseColors(colors)
              : sort === 'shuffle'
                ? shuffleColors(colors)
                : getSortedPalette({
                    palette: colors,
                    sortColors: sort,
                  }),
        });
      }}
    />

    <Menu
      positioning={{ placement: 'bottom-start' }}
      onSelect={(details) => openPaletteOutput(details.value)}
    >
      <!-- Not just "Save": the Project Planner's top bar has a Save for the project -->
      <Menu.Trigger
        class={toolbarButtonClass}
        title="Save This Palette, or Export It as a Link, Color Codes, an Image, or Yarn Names"
      >
        <ShareIcon />
        <span class="flex items-center gap-1"
          >Save & Export <ChevronDownIcon size={18} /></span
        >
      </Menu.Trigger>
      <Portal>
        <Menu.Positioner>
          <Menu.Content
            class="bg-surface-100-900 z-9999 max-w-[calc(100vw-2rem)]"
          >
            {#each availablePaletteOutputs as output, index (output.value)}
              <!-- Saving keeps it here; the rest take it elsewhere -->
              {#if index === 1}
                <Menu.Separator />
              {/if}
              <Menu.Item
                value={output.value}
                class="data-highlighted:bg-surface-200-800 flex items-center justify-start gap-2 text-left whitespace-normal data-highlighted:text-inherit"
              >
                <output.icon class="shrink-0" />
                <div class="flex min-w-0 flex-col text-left">
                  <p>{output.label}</p>
                  <p class="text-surface-700-300 text-xs">
                    {output.details}
                  </p>
                </div>
              </Menu.Item>
            {/each}
          </Menu.Content>
        </Menu.Positioner>
      </Portal>
    </Menu>
  </div>
</div>

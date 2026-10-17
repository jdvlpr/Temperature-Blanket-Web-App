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
  import { copyToClipboard } from '#lib/utils/clipboard-utils.js';
  import { version } from '$app/env';
  import { focusGaugeColor } from '#lib/components/GaugeCustomizer.svelte';
  import PaletteStrip from '#lib/components/PaletteStrip.svelte';
  import SelectNumberOfColors from '#lib/components/SelectNumberOfColors.svelte';
  import BrowsePalettes from '#lib/components/modals/BrowsePalettes.svelte';
  import ExportPaletteImage from '#lib/components/modals/ExportPaletteImage.svelte';
  import type { PaletteImageRange } from '#lib/features/palette-image/layout.js';
  import ChooseColorways from '#lib/components/modals/ChooseColorways.svelte';
  import GetPaletteFromImage from '#lib/components/modals/GetPaletteFromImage.svelte';
  import ImportExportPalette from '#lib/components/modals/ImportExportPalette.svelte';
  import PasteColors from '#lib/components/modals/PasteColors.svelte';
  import RandomPalette from '#lib/components/modals/RandomPalette.svelte';
  import PublishPalette from '#lib/components/modals/PublishPalette.svelte';
  import SavePalette from '#lib/components/modals/SavePalette.svelte';
  import SortMenu from '#lib/components/SortMenu.svelte';
  import { preferences } from '#lib/storage/preferences.svelte.js';
  import {
    getPaletteFallbackName,
    getSortedPalette,
    getYarnPageURL,
    reverseColors,
    shuffleColors,
  } from '#lib/utils/color-utils.js';
  import { drawerState, dialog } from '#lib/state/page-state.svelte.js';
  import { previewHighlight } from '#lib/state/preview-state.svelte.js';
  import { historyChange } from '#lib/utils/feedback.svelte.js';
  import type { Color } from '#lib/types/yarn-types.js';
  import type { GaugeSettingsType } from '#lib/types/gauge-types.js';
  import { createGaugeColors } from '#lib/state/gauges-state.svelte.js';
  import {
    BookmarkPlusIcon,
    SendIcon,
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
  import {
    menuContentClass,
    menuPositioning,
  } from '#lib/components/menu-styles.js';
  import { Menu, Portal } from '@skeletonlabs/skeleton-svelte';

  let {
    gauge = $bindable(),
    /** A project's gauge, whose ranges mean something (the Yarn page's don't) */
    inProject = false,
    /** Save Palette's name to start with (the Yarn page's, from the gallery) */
    suggestedName = '',
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

  /** Each color's range, as the gauge shows it, like 50 → 59 °F */
  function getRangeLabels(): PaletteImageRange[] | undefined {
    if (!inProject || !gauge.ranges?.length) return undefined;
    const unit = gauge.unit.label?.[preferences.value.units ?? 'metric'] ?? '';
    return gauge.ranges.map(
      (range: { label?: string; from?: number; to?: number }) =>
        gauge.unit.type === 'category' || range.label
          ? { label: range.label ?? '' }
          : {
              from: range.from ?? 0,
              to: range.to ?? 0,
              unit,
              raised: gauge.unit.type === 'temperature',
            },
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
    // Accounts only (the dialog says so when signed out)
    ...(__ACCOUNTS_ENABLED__
      ? [
          {
            value: 'publish',
            label: 'Publish to Gallery',
            title: 'Publish to Gallery',
            details: 'Share it in the Yarn Palette Gallery',
            icon: SendIcon,
          },
        ]
      : []),
    {
      value: 'link',
      label: 'Copy Link',
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

  // Colorway names can only be copied when some colors are yarn colorways,
  // and there's nothing to publish without colors
  let availablePaletteOutputs = $derived(
    paletteOutputs.filter(
      (output) =>
        (!('needsNames' in output) ||
          gauge.colors.some((color: Color) => color.name)) &&
        (output.value !== 'publish' || gauge.colors.length > 0),
    ),
  );

  // Where signing in comes back to: this project as it is, or these colors
  // on the Yarn page (with the name that came with them)
  function returnPath(colors: Color[]) {
    if (inProject)
      return (
        window.location.pathname + window.location.search + window.location.hash
      );
    const yarnPage = getYarnPageURL({ colors, origin: '' });
    return suggestedName
      ? `${yarnPage}&name=${encodeURIComponent(suggestedName)}`
      : yarnPage;
  }

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
    if (value === 'publish') {
      dialog.trigger({
        type: 'component',
        component: {
          ref: PublishPalette,
          props: { colors, suggestedName, returnTo: returnPath(colors) },
        },
        options: { size: 'medium', title: output.title },
      });
      return;
    }
    if (value === 'save') {
      dialog.trigger({
        type: 'component',
        component: { ref: SavePalette, props: { colors, suggestedName } },
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

<div class="mt-2 flex w-full flex-col items-center gap-2">
  <div class="w-full">
    <!-- The overview: pressing a color goes to it in the list below, where it's edited -->
    <PaletteStrip
      colors={gauge.colors}
      {flashIndices}
      onhover={(index) => (highlightIndex = index)}
      onselect={(index) => focusGaugeColor(gauge.id, index)}
    />
  </div>

  <div
    class={[
      'rounded-container bg-surface-100 dark:bg-surface-900 flex w-full flex-wrap items-center justify-center gap-2 p-2 shadow-inner',
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
      positioning={menuPositioning('bottom-start')}
      onSelect={(details) => openColorSource(details.value)}
    >
      <Menu.Trigger
        class={toolbarButtonClass}
        title="Get Colors from Palettes, Yarn, an Image, and More"
      >
        <PaletteIcon />
        <span class="flex items-center gap-1"
          >Get Colors <ChevronDownIcon class="icon-sm" /></span
        >
      </Menu.Trigger>
      <Portal>
        <Menu.Positioner>
          <Menu.Content class={menuContentClass}>
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

    <Menu
      positioning={menuPositioning('bottom-start')}
      onSelect={(details) => openPaletteOutput(details.value)}
    >
      <!-- Not just "Save": the Project Planner's top bar has a Save for the project -->
      <Menu.Trigger
        class={toolbarButtonClass}
        title="Save This Palette, or Export It as a Link, Color Codes, an Image, or Yarn Names"
      >
        <ShareIcon />
        <span class="flex items-center gap-1"
          >Save & Export <ChevronDownIcon class="icon-sm" /></span
        >
      </Menu.Trigger>
      <Portal>
        <Menu.Positioner>
          <Menu.Content class={menuContentClass}>
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

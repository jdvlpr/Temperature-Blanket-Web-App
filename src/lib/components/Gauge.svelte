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
  import { focusGaugeColor } from '#lib/components/GaugeCustomizer.svelte';
  import PaletteStrip from '#lib/components/PaletteStrip.svelte';
  import SelectNumberOfColors from '#lib/components/SelectNumberOfColors.svelte';
  import PaletteSource, {
    type PaletteSourceKind,
  } from '#lib/components/modals/PaletteSource.svelte';
  import ChooseColorways from '#lib/components/modals/ChooseColorways.svelte';
  import GetPaletteFromImage from '#lib/components/modals/GetPaletteFromImage.svelte';
  import PasteColors from '#lib/components/modals/PasteColors.svelte';
  import RandomPalette from '#lib/components/modals/RandomPalette.svelte';
  import SortMenu from '#lib/components/SortMenu.svelte';
  import MenuCheckbox from '#lib/components/buttons/MenuCheckbox.svelte';
  import RangesMenu from '#lib/components/buttons/RangesMenu.svelte';
  import ViewMenu from '#lib/components/buttons/ViewMenu.svelte';
  import {
    getSortedPalette,
    reverseColors,
    shuffleColors,
  } from '#lib/utils/color-utils.js';
  import { drawerState, dialog } from '#lib/state/page-state.svelte.js';
  import { previewHighlight } from '#lib/state/preview-state.svelte.js';
  import { historyChange } from '#lib/utils/feedback.svelte.js';
  import type { Color } from '#lib/types/yarn-types.js';
  import type { GaugeSettingsType } from '#lib/types/gauge-types.js';
  import {
    createGaugeColors,
    showDaysInRange,
  } from '#lib/state/gauges-state.svelte.js';
  import { preferences } from '#lib/storage/preferences.svelte.js';
  import {
    BlendIcon,
    BookmarkIcon,
    ChevronDownIcon,
    CircleCheckIcon,
    ClipboardPasteIcon,
    DiamondPlusIcon,
    ImageIcon,
    ImportIcon,
    LandmarkIcon,
    PaletteIcon,
    PlusIcon,
    SearchIcon,
    ShuffleIcon,
    TextSearchIcon,
  } from '@lucide/svelte';
  import {
    menuContentClass,
    menuItemClass,
    menuPositioning,
  } from '#lib/components/menu-styles.js';
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

  let isCategory = $derived(gauge.unit?.type === 'category');

  // On wide screens the card stays in view above the list of colors as it
  // scrolls. Stuck there, it's docked to the top bar like the steps bar is
  // to the bottom (square against it, see-through like it), its strip is
  // shorter, and the space after the card grows by as much, so the list
  // doesn't jump up.
  const STRIP_HEIGHT = 70;
  const STUCK_STRIP_HEIGHT = 36;
  let card: HTMLElement | undefined = $state();
  // Just above the card, where the card's top is until it sticks
  let above: HTMLElement | undefined = $state();
  let stuck = $state(false);

  function checkStuck() {
    if (!card || !above) return;
    // auto (NaN) where the card doesn't stick
    const top = parseFloat(getComputedStyle(card).top);
    stuck = !Number.isNaN(top) && above.getBoundingClientRect().bottom < top;
  }

  $effect(checkStuck);

  let flashIndices = $derived(
    historyChange.gaugeId === gauge.id ? historyChange.indices : [],
  );

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

  // Palettes to choose from. On the Yarn page, choosing one copies its colors
  // into the palette being made (Palette › Open… opens one itself), so the
  // details say so. Bookmark matches Save Palette; Landmark matches Gallery
  // in the sidebar.
  const paletteSources = $derived([
    {
      value: 'saved',
      label: 'My Palettes',
      details: inProject
        ? 'Saved and starred'
        : 'Copy colors from a saved or starred one',
      icon: BookmarkIcon,
    },
    {
      value: 'gallery',
      label: 'Palette Gallery',
      details: inProject
        ? 'Shared by everyone'
        : 'Copy colors from one shared by everyone',
      icon: LandmarkIcon,
    },
    {
      value: 'gradients',
      label: 'Preset Gradients',
      details: 'Automatic color combinations',
      icon: BlendIcon,
    },
  ]);

  const paletteSourceTitles: Record<PaletteSourceKind, string> = {
    saved: 'My Palettes',
    gallery: 'Palette Gallery',
    gradients: 'Preset Gradients',
  };

  // Ways to make colors
  const colorTools = [
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
  ];
  // Ways to import colors
  const colorImport = [
    {
      value: 'paste',
      label: 'Paste Colors or Code',
      details: 'Color names, hex codes, or links',
      icon: ClipboardPasteIcon,
    },
  ];

  function openColorSource(value: string) {
    switch (value) {
      case 'saved':
      case 'gallery':
      case 'gradients':
        dialog.trigger({
          type: 'component',
          component: {
            ref: PaletteSource,
            props: {
              source: value,
              inProject,
              numberOfColors: gauge.numberOfColors,
              updateGauge,
            },
          },
          options: { size: 'large', title: paletteSourceTitles[value] },
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
</script>

<svelte:window onscroll={checkStuck} onresize={checkStuck} />

<div class="h-2" bind:this={above} aria-hidden="true"></div>
<div
  class={[
    'rounded-container border-surface-200-800 flex w-full flex-col gap-2 border pb-2 lg:sticky lg:top-(--top-bar-height) lg:z-10',
    stuck
      ? 'bg-surface-50/80 dark:bg-surface-950/80 rounded-t-none shadow-lg backdrop-blur-md'
      : 'bg-surface-100 dark:bg-surface-900',
  ]}
  bind:this={card}
  data-palette-card
>
  <div class="w-full">
    <!-- The overview: pressing a color goes to it in the list below, where it's edited -->
    <PaletteStrip
      colors={gauge.colors}
      roundedBottom={false}
      corners={stuck ? 'none' : 'container'}
      height="{stuck ? STUCK_STRIP_HEIGHT : STRIP_HEIGHT}px"
      {flashIndices}
      onhover={(index) => (highlightIndex = index)}
      onselect={(index) => focusGaugeColor(gauge.id, index)}
    />
  </div>

  <div class="flex flex-wrap items-center gap-2 px-2">
    {#if !isCategory}
      <Menu
        positioning={menuPositioning('bottom-start')}
        onSelect={(details) => openColorSource(details.value)}
      >
        <Menu.Trigger
          class={toolbarButtonClass}
          title="Get Colors from Palettes, Preset Gradients, Yarn, an Image, and More"
        >
          <ImportIcon />
          <span class="flex items-center gap-1"
            >Get Colors <ChevronDownIcon class="icon-sm" /></span
          >
        </Menu.Trigger>
        <Portal>
          <Menu.Positioner>
            <Menu.Content class={menuContentClass}>
              {#each [...colorTools, { value: 'divider1', label: null }, ...paletteSources, { value: 'divider2', label: null }, ...colorImport] as source (source.value)}
                {#if source.label}
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
                {:else}
                  <Menu.Separator />
                {/if}
              {/each}
            </Menu.Content>
          </Menu.Positioner>
        </Portal>
      </Menu>
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
    {/if}

    <!-- How the list of colors below shows: a project's ranges, and its view -->
    <div class="flex flex-wrap items-center gap-2 sm:ml-auto">
      {#if inProject && !gauge.isStatic}
        <RangesMenu />
      {/if}
      {#if inProject}
        <!-- A project's list also has Days in ranges -->
        <ViewMenu bind:value={preferences.value.layout} fillOption>
          <!-- Stays open, so the check shows it took -->
          <Menu.OptionItem
            type="checkbox"
            value="days"
            checked={showDaysInRange.value}
            closeOnSelect={false}
            onCheckedChange={(checked) => (showDaysInRange.value = checked)}
            class={menuItemClass}
          >
            <span class="flex min-w-0 flex-1 flex-col">
              <span>Days in ranges</span>
              <span class="text-surface-700-300 text-xs"
                >How many fall in each</span
              >
            </span>
            <MenuCheckbox checked={showDaysInRange.value} />
          </Menu.OptionItem>
        </ViewMenu>
      {:else}
        <ViewMenu bind:value={preferences.value.layout} fillOption />
      {/if}
    </div>
  </div>
</div>
<div
  class="motion-safe:transition-[height]"
  style:height="{stuck ? STRIP_HEIGHT - STUCK_STRIP_HEIGHT : 0}px"
  aria-hidden="true"
></div>

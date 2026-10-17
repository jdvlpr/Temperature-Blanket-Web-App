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

<script module lang="ts">
  type Source = 'gallery' | 'saved' | 'schemes';
  const SOURCE_KEY = 'browse_palettes_source';

  /** The source chosen last on this device, if any */
  function rememberedSource(): Source | null {
    try {
      const value = localStorage.getItem(SOURCE_KEY);
      return value === 'gallery' || value === 'saved' || value === 'schemes'
        ? value
        : null;
    } catch {
      return null;
    }
  }

  function rememberSource(value: Source) {
    try {
      localStorage.setItem(SOURCE_KEY, value);
    } catch {
      // Private browsing: opens as if for the first time next time
    }
  }
</script>

<script lang="ts">
  import ToTopButton from '#lib/components/buttons/ToTopButton.svelte';
  import PaletteSchemes from '#lib/components/PaletteSchemes.svelte';
  import PlaceholderPalettes from '#lib/components/PlaceholderPalettes.svelte';
  import SavedPalettes from '#lib/components/SavedPalettes.svelte';
  import SavedPalettesToolbar from '#lib/components/SavedPalettesToolbar.svelte';
  import YarnPaletteGallery from '#lib/components/YarnPaletteGallery.svelte';
  import { ensureYarnData } from '#lib/data/yarns/colorways.svelte.js';
  import { dialog } from '#lib/state/page-state.svelte.js';
  import { libraryFilters } from '#lib/state/library-filters.svelte.js';
  import { savedPalettes } from '#lib/storage/palettes.svelte.js';
  import { recordPageView } from '#lib/utils/gallery-utils.js';
  import type { Color } from '#lib/types/yarn-types.js';
  import { BlendIcon, BookmarkIcon, LandmarkIcon } from '@lucide/svelte';
  import { SegmentedControl } from '@skeletonlabs/skeleton-svelte';
  import { onDestroy, onMount } from 'svelte';
  import { MediaQuery } from 'svelte/reactivity';

  interface Props {
    numberOfColors: number;
    updateGauge: (update: { _colors: Color[]; _schemeId?: string }) => void;
  }

  let { numberOfColors = $bindable(), updateGauge }: Props = $props();

  // Opens where it was left; the first time, on My Palettes when there are
  // any, otherwise the Gallery
  let source = $state<Source | null>(rememberedSource());
  let container: HTMLElement | undefined = $state();
  let top: HTMLElement | undefined = $state();
  let showScrollToTopButton = $state(false);
  // On phones the choice of source is pinned to the bottom of the sheet, so
  // To Top goes above it
  const phone = new MediaQuery('(max-width: 639.98px)');

  // My Palettes' counts, for its toolbar
  let total = $state<number | null>(null);
  let matching = $state(0);

  // Bookmark matches the Save button; Landmark matches Gallery in the sidebar
  const sources = [
    {
      value: 'gallery',
      label: 'Gallery',
      details: 'Shared by everyone',
      icon: LandmarkIcon,
    },
    {
      value: 'saved',
      label: 'My Palettes',
      details: 'The ones you’ve saved',
      icon: BookmarkIcon,
    },
    {
      value: 'schemes',
      label: 'Schemes',
      details: 'Color scales from ColorBrewer',
      icon: BlendIcon,
    },
  ] as const;

  function choose(value: Source) {
    source = value;
    rememberSource(value);
    container?.scrollIntoView({ block: 'start' });
  }

  onMount(async () => {
    ensureYarnData();
    dialog.headerControl = sourceControl;
    if (!source) {
      await savedPalettes.refresh();
      source = savedPalettes.items.length ? 'saved' : 'gallery';
    }
  });

  // Only its own: a dialog opened in its place may have set one already
  onDestroy(() => {
    if (dialog.headerControl === sourceControl) dialog.headerControl = null;
  });

  $effect(() => {
    if (!top) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        showScrollToTopButton =
          !entry.isIntersecting && entry.boundingClientRect.top < 0;
      },
      { threshold: 0 },
    );
    observer.observe(top);
    return () => observer.disconnect();
  });
</script>

<!-- Under the title (on phones, pinned to the bottom of the sheet), all three
  always in view: on phones each name sits under its icon so they fit -->
{#snippet sourceControl()}
  <SegmentedControl
    value={source}
    onValueChange={(event) => {
      if (event.value) choose(event.value as Source);
    }}
  >
    <SegmentedControl.Label class="sr-only">Browse</SegmentedControl.Label>
    <SegmentedControl.Control
      class="bg-surface-100 dark:bg-surface-900 w-full flex-row!"
    >
      <SegmentedControl.Indicator />
      {#each sources as item (item.value)}
        <SegmentedControl.Item
          value={item.value}
          title={item.details}
          class="flex-1 max-sm:h-auto max-sm:py-1"
        >
          <SegmentedControl.ItemText
            ><span
              class="flex flex-col items-center justify-center gap-0.5 text-xs sm:flex-row sm:gap-1 sm:text-base"
            >
              <item.icon aria-hidden="true" />
              {item.label}
            </span></SegmentedControl.ItemText
          >
          <SegmentedControl.ItemHiddenInput />
        </SegmentedControl.Item>
      {/each}
    </SegmentedControl.Control>
  </SegmentedControl>
{/snippet}

<!-- The dialog sizes to its content, so every source keeps it this wide and
  tall, and switching doesn't make it jump -->
<!-- Out of the column below, so it adds no space -->
<div bind:this={top}></div>
<div
  class="flex w-full max-w-full flex-col px-2 pb-4 sm:min-h-[60svh] sm:w-[36rem] md:w-[44rem] lg:w-[62rem]"
  bind:this={container}
>
  {#if source === 'saved'}
    <div class="flex flex-col px-2">
      <SavedPalettesToolbar {total} {matching} />
    </div>
    <SavedPalettes
      {updateGauge}
      filters={libraryFilters}
      oncount={(count) => ({ total, matching } = count)}
    />
  {:else if source === 'gallery'}
    <YarnPaletteGallery
      mode="use"
      onuse={(palette) => {
        recordPageView(palette.postId);
        updateGauge({ _colors: palette.colors, _schemeId: 'Custom' });
      }}
    />
  {:else if source === 'schemes'}
    <PaletteSchemes {updateGauge} bind:numberOfColors />
  {:else}
    <PlaceholderPalettes items={6} maxWFull={true} />
  {/if}

  {#if showScrollToTopButton}
    <ToTopButton
      onClick={() => container?.scrollIntoView({ behavior: 'smooth' })}
      bottom={phone.current ? '5.5rem' : '1rem'}
    />
  {/if}
</div>

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

<!-- Palettes to use on a gauge from one source, chosen in Get Colors: My
Palettes, the Palette Gallery (each with the toolbar its page has), or
Gradients -->

<script module lang="ts">
  export type PaletteSourceKind = 'saved' | 'gallery' | 'gradients';
</script>

<script lang="ts">
  import ToTopButton from '#lib/components/buttons/ToTopButton.svelte';
  import PaletteSchemes from '#lib/components/PaletteSchemes.svelte';
  import SavedPalettes from '#lib/components/SavedPalettes.svelte';
  import SavedPalettesToolbar from '#lib/components/SavedPalettesToolbar.svelte';
  import YarnPaletteGallery from '#lib/components/YarnPaletteGallery.svelte';
  import { ensureYarnData } from '#lib/data/yarns/colorways.svelte.js';
  import { libraryFilters } from '#lib/state/library-filters.svelte.js';
  import { recordPageView } from '#lib/utils/gallery-utils.js';
  import type { Color } from '#lib/types/yarn-types.js';
  import { onMount } from 'svelte';

  interface Props {
    source: PaletteSourceKind;
    numberOfColors: number;
    /** `_paletteId`: one of My Palettes was chosen */
    updateGauge: (update: {
      _colors: Color[];
      _schemeId?: string;
      _paletteId?: string;
    }) => void;
  }

  let { source, numberOfColors = $bindable(), updateGauge }: Props = $props();

  let container: HTMLElement | undefined = $state();
  let top: HTMLElement | undefined = $state();
  let showScrollToTopButton = $state(false);

  // My Palettes' counts, for its toolbar
  let total = $state<number | null>(null);
  let matching = $state(0);

  onMount(() => {
    ensureYarnData();
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
  {:else}
    <PaletteSchemes {updateGauge} bind:numberOfColors />
  {/if}

  {#if showScrollToTopButton}
    <ToTopButton
      onClick={() => container?.scrollIntoView({ behavior: 'smooth' })}
      bottom="1rem"
    />
  {/if}
</div>

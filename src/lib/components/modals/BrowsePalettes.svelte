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
  import GalleryPalettes from '$lib/components/GalleryPalettes.svelte';
  import GalleryPalettesPopular from '$lib/components/GalleryPalettesPopular.svelte';
  import PaletteSchemes from '$lib/components/PaletteSchemes.svelte';
  import ToTopButton from '$lib/components/buttons/ToTopButton.svelte';
  import { SegmentedControl } from '@skeletonlabs/skeleton-svelte';

  interface Props {
    schemeId?: string;
    numberOfColors: any;
    updateGauge: any;
    context?: string;
  }

  let {
    schemeId = 'Custom',
    numberOfColors = $bindable(),
    updateGauge,
    context = '',
  }: Props = $props();

  let category = $state(getParentCategory(schemeId));
  let container = $state();
  let showScrollToTopButton = $state(false);

  let filtersContainer: HTMLElement;
  let scrollObserver = new IntersectionObserver(
    (entries, observer) => {
      entries.forEach((entry) => {
        if (entry.intersectionRatio != 1) {
          showScrollToTopButton = true;
        } else {
          showScrollToTopButton = false;
        }
      });
    },
    { threshold: 1 },
  );
  const categories = ['Gallery', 'Featured', 'Schemes'];

  function getParentCategory(schemeId) {
    if (schemeId === 'Custom') return 'Gallery';
    else return 'Schemes';
  }

  $effect(() => {
    scrollObserver.observe(filtersContainer);
  });
</script>

<div class="p-2" bind:this={container}>
  <div
    class="flex w-full flex-wrap items-end justify-center gap-2 px-2 pb-2"
    class:pt-4={context === 'drawer'}
    bind:this={filtersContainer}
  >
    <SegmentedControl
      value={category}
      onValueChange={(e) => {
        category = e.value;
      }}
      background="bg-surface-100 dark:bg-surface-950"
      classes="shadow-sm"
    >
      <SegmentedControl.Control>
        <SegmentedControl.Indicator />
        {#each categories as categoryItem}
          <SegmentedControl.Item value={categoryItem}>
            <SegmentedControl.ItemText
              ><span class="flex items-center justify-center gap-1">
                {categoryItem}
              </span></SegmentedControl.ItemText
            >
            <SegmentedControl.ItemHiddenInput />
          </SegmentedControl.Item>
        {/each}
      </SegmentedControl.Control>
    </SegmentedControl>
  </div>

  {#if category === 'Gallery'}
    <GalleryPalettes {updateGauge} />
  {:else if category === 'Featured'}
    <GalleryPalettesPopular {updateGauge} />
  {:else if category === 'Schemes'}
    <PaletteSchemes {updateGauge} bind:numberOfColors />
  {/if}

  {#if showScrollToTopButton}
    <ToTopButton
      onClick={() => {
        container.scrollIntoView({
          behavior: 'smooth',
          block: 'start',
        });
      }}
      bottom="1rem"
    />
  {/if}
</div>

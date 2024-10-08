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

<script>
  import GalleryPalettes from '$lib/components/GalleryPalettes.svelte';
  import GalleryPalettesPopular from '$lib/components/GalleryPalettesPopular.svelte';
  import PaletteSchemes from '$lib/components/PaletteSchemes.svelte';
  import ToTopButton from '$lib/components/buttons/ToTopButton.svelte';
  import CloseButton from '$lib/components/modals/CloseButton.svelte';
  import { RadioGroup, RadioItem } from '@skeletonlabs/skeleton';
  import { getContext, onMount } from 'svelte';

  export let schemeId = 'Custom',
    numberOfColors,
    updateGauge,
    context = '';

  let category = getParentCategory(schemeId);
  let container;
  let showScrollToTopButton = false;

  let filtersContainer;
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

  let close = null;
  if (typeof getContext === 'function')
    close = getContext('simple-modal')?.close;

  onMount(() => {
    scrollObserver.observe(filtersContainer);
  });

  function getParentCategory(schemeId) {
    if (schemeId === 'Custom') return 'Gallery';
    else return 'Schemes';
  }
</script>

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

{#if context !== 'drawer'}
  <CloseButton onClose={close} />
{/if}

<div class="sm:pb-4" bind:this={container}>
  <div
    class="w-full flex flex-wrap justify-center items-end gap-2 sm:pt-4 px-2 pb-2 bg-surface-100-800-token"
    class:pt-14={context !== 'drawer'}
    class:pt-4={context === 'drawer'}
    bind:this={filtersContainer}
  >
    <RadioGroup class="flex wrap gap-y-2" active="bg-secondary-active-token">
      {#each categories as categoryItem}
        <RadioItem
          bind:group={category}
          name="category-{categoryItem}"
          value={categoryItem}
          title={categoryItem}
        >
          <span class="flex gap-1 justify-center items-center">
            {categoryItem}
          </span>
        </RadioItem>
      {/each}
    </RadioGroup>
  </div>

  {#if category === 'Gallery'}
    <GalleryPalettes {updateGauge} />
  {:else if category === 'Featured'}
    <GalleryPalettesPopular {updateGauge} />
  {:else if category === 'Schemes'}
    <PaletteSchemes {updateGauge} bind:numberOfColors />
  {/if}
</div>

<p class="font-ornament text-3xl mb-4">k</p>

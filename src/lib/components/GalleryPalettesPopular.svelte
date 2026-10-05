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
  import type { PopularProject } from '$lib/utils/gallery-utils';

  class GalleryPalettesPopularState {
    projects: PopularProject[] = $state([]);
    months = $state(0.25);
  }

  export const galleryPalettesPopularState = new GalleryPalettesPopularState();
</script>

<script lang="ts">
  import ColorPalette from '$lib/components/ColorPalette.svelte';
  import PlaceholderPalettes from '$lib/components/PlaceholderPalettes.svelte';
  import {
    fetchPopularProjects,
    popularToGalleryNodes,
    recordPageView,
  } from '$lib/utils/gallery-utils';
  import type { GalleryPalette } from '$lib/utils/color-utils';
  import { getPalettesFromProjects } from '$lib/utils/color-utils';
  import { onMount } from 'svelte';
  import { ClockIcon } from '@lucide/svelte';

  let { updateGauge } = $props();

  let palettes: GalleryPalette[] = $state([]);
  let loading = $state(true);

  onMount(async () => {
    if (!galleryPalettesPopularState.projects.length) {
      loading = true;
      let results = await fetchPopularProjects({
        months: galleryPalettesPopularState.months,
        palettes: true,
      });
      galleryPalettesPopularState.projects = results;
      loading = false;
    } else loading = false;
  });

  $effect(() => {
    palettes = getPalettesFromProjects({
      projects: popularToGalleryNodes(galleryPalettesPopularState.projects),
    });
  });
</script>

<div class="flex flex-wrap items-end justify-center gap-2 pb-4 text-center">
  <label class="label">
    <span class="label-text">Popular in the last</span>
    <div class="relative flex w-fit items-center">
      <ClockIcon class="pointer-events-none absolute left-2" />
      <select
        class="select mx-auto w-fit min-w-[100px] truncate pl-10"
        id="select-time-period"
        bind:value={galleryPalettesPopularState.months}
        onchange={async () => {
          loading = true;
          galleryPalettesPopularState.projects = [];
          let results = await fetchPopularProjects({
            months: galleryPalettesPopularState.months,
            palettes: true,
          });

          galleryPalettesPopularState.projects = results;

          loading = false;

          if (typeof document.getElementsByClassName('content') !== 'undefined')
            document.getElementsByClassName('content')[0].scrollTop = 0;
        }}
      >
        <option value={0.0357}>Day</option>
        <option value={0.25}>Week</option>
        <option value={1}>Month</option>
        <option value={12}>Year</option>
      </select>
    </div>
  </label>
</div>

<div
  class="flex scroll-mt-[58px] flex-col items-center px-2 lg:scroll-mt-[44px]"
>
  {#if loading}
    <div class="my-1"></div>
    <PlaceholderPalettes items={20} maxWFull={true} />
  {:else}
    <div class="my-2 flex w-full flex-col items-start justify-start gap-4">
      {#each palettes as { colors, schemeName, postId }}
        <button
          type="button"
          class="w-full cursor-pointer"
          onclick={() => {
            recordPageView(postId);
            updateGauge({
              _colors: colors,
              _schemeId: 'Custom',
            });
          }}
          title="Use This Palette"
        >
          <ColorPalette {colors} {schemeName} />
        </button>
      {/each}
    </div>
  {/if}

  {#if !galleryPalettesPopularState.projects.length && !loading}
    <p class="my-8 text-center">No Results</p>
  {/if}
</div>

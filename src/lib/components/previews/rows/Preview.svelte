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
  import { rowsPreview } from './state.svelte';
  import Spinner from '$lib/components/Spinner.svelte';
  import { localState, weather } from '$lib/state';
  import {
    showPreviewImageWeatherDetails,
  } from '$lib/utils';

</script>

{#if !rowsPreview.sections.length}
  <div class="inline-flex h-[80svh] w-full items-center justify-center">
    <Spinner />
  </div>
{:else}
  <svg
    id="preview-svg-image"
    class="mx-auto max-h-[80svh]"
    aria-hidden="true"
    viewBox="0 0 {rowsPreview.width} {rowsPreview.height}"
    bind:this={rowsPreview.svg}
    onclick={async (e) => {
      const target = e.target as SVGRectElement | null;
      if (!target || target.tagName !== 'rect') return;
      const group = target.parentElement as SVGGElement | null;
      if (!group || group.tagName !== 'g') return;

      if (group.dataset.isweathersection === 'true' && group.dataset.dayindex !== undefined) {
        weather.currentIndex = +group.dataset.dayindex;
        showPreviewImageWeatherDetails(rowsPreview.targets);
      }
    }}
  >
    {#each rowsPreview.sections as section}
      {@const isWeather = section[0].isWeatherSection}
      <g data-isweathersection={isWeather} data-dayindex={section[0].dayIndex}>
        {#each section as { width, height, color, x, y }}
          <rect {width} {height} fill={color} {x} {y} />
        {/each}
      </g>
    {/each}
  </svg>
{/if}

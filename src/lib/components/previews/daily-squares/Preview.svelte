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
  import Spinner from '$lib/components/Spinner.svelte';
  import { HOURS_PER_DAY } from '$lib/constants';
  import { weather } from '$lib/state';
  import {
    displayNumber,
    getColorInfo,
    getWeatherValue,
    runPreview,
    showPreviewImageWeatherDetails,
  } from '$lib/utils';
  import { dailySquaresPreview } from './state.svelte';

  let width = $state(dailySquaresPreview.width);

  let height = $state(dailySquaresPreview.height);

  $inspect(dailySquaresPreview.numberOfSquaresWithWeatherData);
  $inspect(dailySquaresPreview.settings.columns);
  $inspect(dailySquaresPreview.rows);
  // $inspect(dailySquaresPreview.totalSquares);

  runPreview(() => {
    width = dailySquaresPreview.width;
    height = dailySquaresPreview.height;
    // dailySquaresPreview.sections = sections;
  });
</script>

{#if !dailySquaresPreview.sections.length}
  <div class="inline-flex h-[80svh] w-full items-center justify-center">
    <Spinner />
  </div>
{:else}
  <svg
    id="preview-svg-image"
    class="mx-auto max-h-[80svh]"
    aria-hidden="true"
    viewBox="0 0 {width} {height}"
    bind:this={dailySquaresPreview.svg}
    onclick={(e) => {
      if (e.target.tagName !== 'rect') return;
      const group = e.target.parentElement;
      if (group.tagName !== 'g') return;

      weather.currentIndex = +group.dataset.dayindex;

      showPreviewImageWeatherDetails(dailySquaresPreview.targets);
    }}
  >
    {#each dailySquaresPreview.sections as day, i}
      <g data-dayindex={i}>
        {#each day as { color, height, x, y, width }}
          <rect {width} {height} fill={color} {x} {y} />
        {/each}
      </g>
    {/each}
  </svg>
{/if}

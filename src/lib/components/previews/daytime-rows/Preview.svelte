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
  import { gauges, project, weather } from '$lib/state';
  import {
    displayNumber,
    getColorInfo,
    showPreviewImageWeatherDetails,
  } from '$lib/utils';
  import { daytimeRowsPreview } from './state.svelte';

  let width = $state(daytimeRowsPreview.width);

  let height = $state(daytimeRowsPreview.height);

  let debounceTimer;
  const debounce = (callback, time) => {
    window.clearTimeout(debounceTimer);
    debounceTimer = window.setTimeout(callback, time);
  };

  $effect(() => {
    project.url.href;
    if (!weather.data.length || !gauges.allCreated.length) return;
    debounce(() => {
      const sections = [];
      let weatherParams = [];
      switch (daytimeRowsPreview.settings.daytimePosition) {
        case 'left':
          weatherParams = [
            daytimeRowsPreview.settings.daytimeTarget,
            daytimeRowsPreview.settings.nightTarget,
          ];
          break;
        case 'right':
          weatherParams = [
            daytimeRowsPreview.settings.nightTarget,
            daytimeRowsPreview.settings.daytimeTarget,
          ];
          break;
        case 'center':
          weatherParams = [
            daytimeRowsPreview.settings.nightTarget,
            daytimeRowsPreview.settings.daytimeTarget,
            daytimeRowsPreview.settings.nightTarget,
          ];
          break;
        case 'sides':
          weatherParams = [
            daytimeRowsPreview.settings.daytimeTarget,
            daytimeRowsPreview.settings.nightTarget,
            daytimeRowsPreview.settings.daytimeTarget,
          ];
          break;
        default:
          weatherParams = [
            daytimeRowsPreview.settings.daytimeTarget,
            daytimeRowsPreview.settings.nightTarget,
          ];
          break;
      }
      for (
        let sectionIndex = 0, dayIndex = 0, y = 0;
        sectionIndex < weather.data?.length;
        sectionIndex++, dayIndex++, y += daytimeRowsPreview.STITCH_SIZE
      ) {
        const daytime =
          displayNumber(
            (weather.data[dayIndex].dayt['imperial'] *
              daytimeRowsPreview.settings.stitchesPerRow) /
              HOURS_PER_DAY,
            0,
          ) * daytimeRowsPreview.STITCH_SIZE;
        const _day = [];
        for (
          let paramIndex = 0, x = 0;
          paramIndex < weatherParams.length;
          paramIndex++
        ) {
          let calcWidth;
          switch (daytimeRowsPreview.settings.daytimePosition) {
            case 'left':
              if (paramIndex === 0) calcWidth = daytime;
              if (paramIndex === 1)
                calcWidth = daytimeRowsPreview.width - daytime;
              break;
            case 'right':
              if (paramIndex === 0)
                calcWidth = daytimeRowsPreview.width - daytime;
              if (paramIndex === 1) calcWidth = daytime;
              break;
            case 'center':
              if (paramIndex === 0 || paramIndex === 2)
                calcWidth = (daytimeRowsPreview.width - daytime) / 2;
              if (paramIndex === 1) calcWidth = daytime;
              break;
            case 'sides':
              if (paramIndex === 0 || paramIndex === 2) calcWidth = daytime / 2;
              if (paramIndex === 1)
                calcWidth = daytimeRowsPreview.width - daytime;
              break;
          }
          let param = weatherParams[paramIndex];
          let value = weather.data[dayIndex][param][project.units];

          // Get the color based on the gauge ID and value
          const color = getColorInfo({ param, value }).hex;

          _day.push({
            color,
            width: calcWidth,
            height: daytimeRowsPreview.STITCH_SIZE,
            x,
            y,
          });
          x += calcWidth;
        }
        sections.push(_day);
      }
      width = daytimeRowsPreview.width;
      height = daytimeRowsPreview.height;
      daytimeRowsPreview.sections = sections;
    }, 10);
  });
</script>

{#if !daytimeRowsPreview.sections.length}
  <div class="w-full h-[80svh] inline-flex justify-center items-center">
    <Spinner />
  </div>
{:else}
  <svg
    id="preview-svg-image"
    class="max-h-[80svh] mx-auto"
    aria-hidden="true"
    viewBox="0 0 {width} {height}"
    bind:this={daytimeRowsPreview.svg}
    onclick={(e) => {
      if (e.target.tagName !== 'rect') return;
      const group = e.target.parentElement;
      if (group.tagName !== 'g') return;

      weather.currentIndex = +group.dataset.dayindex;

      showPreviewImageWeatherDetails(daytimeRowsPreview.targets);
    }}
  >
    {#each daytimeRowsPreview.sections as day, i}
      <g data-dayindex={i}>
        {#each day as { color, height, x, y, width }}
          <rect {width} {height} fill={color} {x} {y} />
        {/each}
      </g>
    {/each}
  </svg>
{/if}

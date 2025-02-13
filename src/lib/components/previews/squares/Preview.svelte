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
  import Spinner from '$lib/components/Spinner.svelte';
  import { gauges, project, weather } from '$lib/state';
  import {
    getColorInfo,
    getSquareSectionTargetIds,
    getTargetParentGaugeId,
    showPreviewImageWeatherDetails,
  } from '$lib/utils';
  import { untrack } from 'svelte';
  import { squaresPreview } from './state.svelte';
  import type { WeatherDay, WeatherParam } from '$lib/types';

  let width = $state(squaresPreview.width);
  let height = $state(squaresPreview.height);

  let debounceTimer;
  const debounce = (callback, time) => {
    window.clearTimeout(debounceTimer);
    debounceTimer = window.setTimeout(callback, time);
  };

  const squareSectionsCount = $derived(
    squaresPreview.settings.squareSize * squaresPreview.settings.squareSize,
  );

  const squareSectionTargetIds = $derived(
    getSquareSectionTargetIds(
      squareSectionsCount,
      squaresPreview.settings.primaryTarget,
      squaresPreview.settings.secondaryTargets,
    ),
  );

  $effect(() => {
    project.url.href;
    debounce(async () => {
      if (!weather.data.length || !gauges.allCreated.length) return;
      // Get the target IDs for each square section
      let row = 0;
      let y = 0,
        x = 0;
      const sections = [];
      let isWeatherSquare: boolean;
      let dayIndex = 0;

      // Loop through each square
      for (
        let squareIndex = 0, column = 0;
        squareIndex < squaresPreview.squaresTotalCount;
        squareIndex++, column++
      ) {
        if (
          squareIndex % squaresPreview.settings.columns === 0 &&
          squareIndex !== 0
        ) {
          // Start a new row
          column = 0;
          row++;
        }
        let square: object[] = [];

        // Check if the square is a weather square or an additional square
        isWeatherSquare =
          !squaresPreview.additionalSquaresIndexes.includes(squareIndex);

        // Calculate the starting coordinates of the square
        const xStart =
          column *
          (squaresPreview.settings.squareSize *
            squaresPreview.SQUARE_SECTION_SIZE);
        const yStart =
          row *
          (squaresPreview.settings.squareSize *
            squaresPreview.SQUARE_SECTION_SIZE);

        // Loop through each square section
        for (
          let squareSectionIndex = 0, x = xStart, y = yStart;
          squareSectionIndex < squareSectionsCount;
          squareSectionIndex++
        ) {
          let color: string;
          if (isWeatherSquare) {
            // Get the weather data for the current day
            const day: WeatherDay = weather.data[dayIndex];
            let targetId: WeatherParam['id'] =
              squareSectionTargetIds[squareSectionIndex];
            let value = day[targetId][project.units];

            // Check if the primary target value is 0 or null, use the primary target as a backup
            if (
              (squaresPreview.settings.primaryTargetAsBackup === 1 &&
                value === 0) ||
              (squaresPreview.settings.primaryTargetAsBackup === 1 &&
                value === null)
            ) {
              targetId = squaresPreview.settings.primaryTarget;
              value = day[targetId][project.units];
            }

            // Get the gauge ID for the target
            let gaugeId = getTargetParentGaugeId(targetId);

            // Get the color based on the gauge ID and value
            color = getColorInfo(gaugeId, value).hex;
          } else {
            // Use the additional squares color
            color = squaresPreview.settings.additionalSquaresColor;
          }

          // Add the square section to the square array
          square.push({
            isWeatherSquare,
            dayIndex,
            color,
            x,
            y,
          });

          // Calculate the coordinates for the next square section
          if (
            (squareSectionIndex + 1) % squaresPreview.settings.squareSize ===
              0 &&
            squareSectionIndex !== 0
          ) {
            x = xStart;
            y += squaresPreview.SQUARE_SECTION_SIZE;
          } else {
            x += squaresPreview.SQUARE_SECTION_SIZE;
          }
        }

        // Add the square to the sections array
        sections.push(square);

        // Increment the day index if it's a weather square
        if (isWeatherSquare) dayIndex++;
      }
      width = squaresPreview.width;
      height = squaresPreview.height;
      squaresPreview.sections = sections;
    }, 10);
  });
</script>

{#if !squaresPreview.sections.length}
  <div class="w-full h-[80svh] inline-flex justify-center items-center">
    <Spinner />
  </div>
{:else}
  <svg
    id="preview-svg-image"
    class="max-h-[80svh] mx-auto"
    aria-hidden="true"
    viewBox="0 0 {width} {height}"
    bind:this={squaresPreview.svg}
    onclick={(e) => {
      if (e.target.tagName !== 'rect') return;
      const group = e.target.parentElement;
      if (group.tagName !== 'g') return;

      if (group.dataset.isweathersquare === 'true') {
        weather.currentIndex = +group.dataset.dayindex;
        showPreviewImageWeatherDetails(squaresPreview.targets);
      }
    }}
  >
    {#each squaresPreview.sections as square}
      <g
        data-isweathersquare={square[0].isWeatherSquare}
        data-dayindex={square[0].dayIndex}
      >
        {#each square as { color, x, y }}
          <rect
            width={squaresPreview.SQUARE_SECTION_SIZE}
            height={squaresPreview.SQUARE_SECTION_SIZE}
            fill={color}
            {x}
            {y}
          />
        {/each}
      </g>
    {/each}
  </svg>
{/if}

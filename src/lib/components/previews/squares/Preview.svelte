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
  import { localState, weather } from '$lib/state';
  import type { Color, WeatherDay, WeatherParam } from '$lib/types';
  import {
    getColorInfo,
    getSquareSectionTargetIds,
    runPreview,
    showPreviewImageWeatherDetails,
  } from '$lib/utils';
  import { squaresPreview } from './state.svelte';

  let width = $state(squaresPreview.width);

  let height = $state(squaresPreview.height);

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

  runPreview(() => {
    // Get the target IDs for each square section
    let row = 0;
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

      // ***
      //  Calculate the starting coordinates of the square
      // ***

      //  offset the square x position if it has a border
      const xJoinOffset =
        squaresPreview.settings.joinStitches *
          2 *
          squaresPreview.SQUARE_SECTION_SIZE *
          column +
        squaresPreview.settings.joinStitches *
          squaresPreview.SQUARE_SECTION_SIZE;

      const xStart =
        column *
          (squaresPreview.settings.squareSize *
            squaresPreview.SQUARE_SECTION_SIZE) +
        xJoinOffset;

      //  offset the square y position if it has a border
      const yJoinOffset =
        squaresPreview.settings.joinStitches *
          2 *
          squaresPreview.SQUARE_SECTION_SIZE *
          row +
        squaresPreview.settings.joinStitches *
          squaresPreview.SQUARE_SECTION_SIZE;

      const yStart =
        row *
          (squaresPreview.settings.squareSize *
            squaresPreview.SQUARE_SECTION_SIZE) +
        yJoinOffset;

      // Loop through each square section
      for (
        let squareSectionIndex = 0, x = xStart, y = yStart;
        squareSectionIndex < squareSectionsCount;
        squareSectionIndex++
      ) {
        let color: Color['hex'];

        if (isWeatherSquare) {
          // Get the weather data for the current day
          const day: WeatherDay = weather.data[dayIndex];
          let targetId: WeatherParam['id'] =
            squareSectionTargetIds[squareSectionIndex];
          let value = day[targetId][localState.value.units];

          // Check if the primary target value is 0 or null, use the primary target as a backup
          if (
            (squaresPreview.settings.primaryTargetAsBackup === 1 &&
              value === 0) ||
            (squaresPreview.settings.primaryTargetAsBackup === 1 &&
              value === null)
          ) {
            targetId = squaresPreview.settings.primaryTarget;
            value = day[targetId][localState.value.units];
          }

          // Get the color based on the gauge ID and value
          color = getColorInfo({ param: targetId, value }).hex;
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
          (squareSectionIndex + 1) % squaresPreview.settings.squareSize === 0 &&
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
  });
</script>

{#if !squaresPreview.sections.length}
  <div class="inline-flex h-[80svh] w-full items-center justify-center">
    <Spinner />
  </div>
{:else}
  <svg
    id="preview-svg-image"
    class="mx-auto max-h-[80svh]"
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
        {#if squaresPreview.settings.joinStitches > 0}
          <rect
            width={squaresPreview.SQUARE_SECTION_SIZE *
              squaresPreview.settings.squareSize +
              squaresPreview.settings.joinStitches *
                squaresPreview.SQUARE_SECTION_SIZE}
            height={squaresPreview.SQUARE_SECTION_SIZE *
              squaresPreview.settings.squareSize +
              squaresPreview.settings.joinStitches *
                squaresPreview.SQUARE_SECTION_SIZE}
            stroke-width={squaresPreview.SQUARE_SECTION_SIZE *
              squaresPreview.settings.joinStitches}
            stroke={squaresPreview.settings.joinColor}
            fill="none"
            x={square[0].x -
              (squaresPreview.SQUARE_SECTION_SIZE *
                squaresPreview.settings.joinStitches) /
                2}
            y={square[0].y -
              (squaresPreview.SQUARE_SECTION_SIZE *
                squaresPreview.settings.joinStitches) /
                2}
          />
        {/if}
      </g>
    {/each}
  </svg>
{/if}

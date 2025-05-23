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
  import { calendarPreview } from '$lib/components/previews/calendar/state.svelte';
  import Spinner from '$lib/components/Spinner.svelte';
  import { localState, weather } from '$lib/state';
  import {
    getColorInfo,
    getWeatherValue,
    runPreview,
    showPreviewImageWeatherDetails,
  } from '$lib/utils';

  let width = $state(calendarPreview.width);

  let height = $state(calendarPreview.height);

  runPreview(() => {
    let row = 0;
    let additionalSquaresAddedCount = 0;
    let monthColumnIndex = 0;
    let monthIndex = 0;
    let monthRowIndex = 0;
    let total = weather.rawData?.length + calendarPreview.extraSquares.length;
    let weekIndex = 0;
    let rowPadding = 0;
    let columnPadding = 0;
    let x = 0,
      y = 0; // Yes, these are necessary.
    const sections = [];
    for (
      let squareIndex = 0, column = 0, isWeatherSquare = true;
      squareIndex < total;
      squareIndex++, column++
    ) {
      if (
        squareIndex % calendarPreview.squaresPerMonth === 0 &&
        weekIndex + 1 === calendarPreview.weeksInLongestMonth &&
        squareIndex !== 0
      ) {
        // finished month
        monthIndex += 1;
        weekIndex = 0;
        if (monthIndex % calendarPreview.dimensionsWidth === 0) {
          // finished month row
          monthRowIndex += calendarPreview.weeksInLongestMonth;
          monthColumnIndex = 0;
          rowPadding += calendarPreview.monthPadding;
          columnPadding = 0;
        } else {
          // continue in the same row
          monthColumnIndex += calendarPreview.weekLength;
          columnPadding += calendarPreview.monthPadding;
        }
        row = monthRowIndex;
        column = monthColumnIndex;
      }
      if (
        squareIndex % calendarPreview.weekLength === 0 &&
        squareIndex !== 0 &&
        squareIndex % calendarPreview.squaresPerMonth !== 0
      ) {
        // Finished week
        column = monthColumnIndex;
        row += 1;
        weekIndex += 1;
      }
      const square = [];
      let dayIndex = squareIndex - additionalSquaresAddedCount;

      if (calendarPreview.extraSquares.includes(squareIndex)) {
        isWeatherSquare = false;
        additionalSquaresAddedCount += 1;
      } else {
        isWeatherSquare = true;
      }

      // ***
      //  Calculate the starting coordinates of the square
      // ***

      //  offset the square x position if it has a border
      const xJoinOffset =
        calendarPreview.settings.joinStitches *
          2 *
          calendarPreview.squareSectionSize *
          column +
        calendarPreview.settings.joinStitches *
          calendarPreview.squareSectionSize;

      const xStart =
        xJoinOffset +
        column *
          (calendarPreview.settings.squareSize *
            calendarPreview.squareSectionSize) +
        columnPadding;

      //  offset the square y position if it has a border
      const yJoinOffset =
        calendarPreview.settings.joinStitches *
          2 *
          calendarPreview.squareSectionSize *
          row +
        calendarPreview.settings.joinStitches *
          calendarPreview.squareSectionSize;

      const yStart =
        yJoinOffset +
        row *
          (calendarPreview.settings.squareSize *
            calendarPreview.squareSectionSize) +
        rowPadding;

      let _dayIndex = dayIndex;
      if (weather.grouping === 'week') {
        _dayIndex = Math.ceil((dayIndex - weather.monthGroupingStartDay) / 7);
      }
      for (
        let squareSectionIndex = 0, x = xStart, y = yStart;
        squareSectionIndex < calendarPreview.squareSectionsCount;
        squareSectionIndex++
      ) {
        let color;
        if (isWeatherSquare) {
          let param = calendarPreview.squareSectionParams[squareSectionIndex];
          let value = getWeatherValue({ dayIndex: _dayIndex, param });
          if (
            (calendarPreview.settings.primaryTargetAsBackup === 1 &&
              value === 0) ||
            (calendarPreview.settings.primaryTargetAsBackup === 1 &&
              value === null)
          ) {
            param = calendarPreview.settings.primaryTarget;
            value = getWeatherValue({ dayIndex: _dayIndex, param });
          }

          // Get the color based on the gauge ID and value
          color = getColorInfo({ param, value }).hex;
        } else {
          color = calendarPreview.settings.additionalSquaresColor;
        }
        square.push({
          color,
          x,
          y,
          isWeatherSquare,
          dayIndex: _dayIndex,
        });
        if (
          (squareSectionIndex + 1) % calendarPreview.settings.squareSize ===
            0 &&
          squareSectionIndex !== 0
        ) {
          x = xStart;
          y += calendarPreview.squareSectionSize;
        } else {
          x += calendarPreview.squareSectionSize;
        }
      }
      sections.push(square);
    }
    width = calendarPreview.width;
    height = calendarPreview.height;
    calendarPreview.sections = sections;
  });
</script>

{#if !calendarPreview.sections.length}
  <div class="inline-flex h-[80svh] w-full items-center justify-center">
    <Spinner />
  </div>
{:else}
  <svg
    id="preview-svg-image"
    class="mx-auto max-h-[80svh]"
    aria-hidden="true"
    viewBox="0 0 {width} {height}"
    bind:this={calendarPreview.svg}
    onclick={(e) => {
      if (e.target.tagName !== 'rect') return;
      const group = e.target.parentElement;
      if (group.tagName !== 'g') return;

      if (group.dataset.isweathersquare === 'true') {
        let index = +group.dataset.dayindex;
        weather.currentIndex = index;

        showPreviewImageWeatherDetails(calendarPreview.targets);
      }
    }}
  >
    {#each calendarPreview.sections as square}
      <g
        data-isweathersquare={square[0].isWeatherSquare}
        data-dayindex={square[0].dayIndex}
      >
        {#each square as { color, x, y }}
          <rect
            width={calendarPreview.squareSectionSize}
            height={calendarPreview.squareSectionSize}
            fill={color}
            {x}
            {y}
          />
        {/each}
        {#if calendarPreview.settings.joinStitches > 0}
          <rect
            width={calendarPreview.squareSectionSize *
              calendarPreview.settings.squareSize +
              calendarPreview.settings.joinStitches *
                calendarPreview.squareSectionSize}
            height={calendarPreview.squareSectionSize *
              calendarPreview.settings.squareSize +
              calendarPreview.settings.joinStitches *
                calendarPreview.squareSectionSize}
            stroke-width={calendarPreview.squareSectionSize *
              calendarPreview.settings.joinStitches}
            stroke={calendarPreview.settings.joinColor}
            fill="none"
            x={square[0].x -
              (calendarPreview.squareSectionSize *
                calendarPreview.settings.joinStitches) /
                2}
            y={square[0].y -
              (calendarPreview.squareSectionSize *
                calendarPreview.settings.joinStitches) /
                2}
          />
        {/if}
      </g>
    {/each}
  </svg>
{/if}

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
  import {
    activeWeatherElementIndex,
    projectStatus,
    units,
    weather,
  } from '$lib/state';
  import {
    getColorInfo,
    getMonthSepparatorIndexes,
    getSquareSectionTargetIds,
    getTargetParentGaugeId,
    getWeatherTargets,
    showPreviewImageWeatherDetails,
  } from '$lib/utils';
  import { previews } from './previews';
  import { details, settings } from './SquaresSettings.svelte';

  const previewIndex = previews.findIndex((n) => n.id === 'sqrs');
  const SQUARE_SECTION_SIZE = 10;

  let svg: SVGSVGElement;
  let sections = [];

  $: previews[previewIndex].width = width;
  $: previews[previewIndex].height = height;
  $: previews[previewIndex].svg = svg;

  $: width = $settings.columns * SQUARE_SECTION_SIZE * $settings.squareSize;
  $: height = rows * SQUARE_SECTION_SIZE * $settings.squareSize;
  $: squaresCreatedCount =
    weather.data?.length +
    monthSepparatorSquaresIndexes.length +
    $settings.squaresAtBeginning;
  $: rows = Math.ceil(squaresCreatedCount / $settings.columns);
  $: squaresTotalCount = $settings.columns * rows;
  $: additionalSquaresAtBeginningIndexes =
    getAdditionalSquaresAtBeginningIndexes($settings.squaresAtBeginning);
  $: monthSepparatorSquaresIndexes = getMonthSepparatorSquaresIndexes(
    $settings.squaresBetweenMonthsCount,
    $settings.squaresAtBeginning,
  );
  $: additionalSquaresAtEndIndexes = getAdditionalSquaresIndexes(
    squaresCreatedCount,
    squaresTotalCount,
  );
  $: additionalSquaresIndexes = additionalSquaresAtBeginningIndexes
    .concat(monthSepparatorSquaresIndexes)
    .concat(additionalSquaresAtEndIndexes);

  $: $details = getDetails({
    rows,
    extras: additionalSquaresIndexes.length,
  });

  $: targets = getWeatherTargets({
    weatherParameters: filterTargets.reduce(
      (a, v) => ({ ...a, [v]: true }),
      {},
    ),
  });

  function getDetails({ rows, extras }) {
    return { rows, additionalSquares: extras };
  }

  function getAdditionalSquaresAtBeginningIndexes(squaresAtBeginning) {
    const indexes = [];
    for (let i = 0; i < squaresAtBeginning; i++) {
      indexes.push(i);
    }
    return indexes;
  }

  function getMonthSepparatorSquaresIndexes(count, squaresAtBeginning) {
    if (count === 0) return [];
    let squaresIndexes = [];
    let monthSepparatorIndexes = getMonthSepparatorIndexes();
    monthSepparatorIndexes = monthSepparatorIndexes.map(
      (n) => n + squaresAtBeginning,
    );
    monthSepparatorIndexes.forEach((spaceIndex, index) => {
      for (let i = 0; i < count; i++) {
        squaresIndexes.push(spaceIndex + i + index * count);
      }
    });
    return squaresIndexes;
  }

  function getAdditionalSquaresIndexes(created, total) {
    const squares = [];
    for (let position = created; position < total; position++) {
      squares.push(position);
    }
    return squares;
  }

  $: if (projectStatus.state.liveURL) {
    // Calculate the number of square sections
    const squareSectionsCount = $settings.squareSize * $settings.squareSize;

    // Get the target IDs for each square section
    const squareSectionTargetIds = getSquareSectionTargetIds(
      squareSectionsCount,
      $settings.primaryTarget,
      $settings.secondaryTargets,
    );

    let row = 0;
    let y = 0,
      x = 0;
    sections = [];
    let isWeatherSquare: boolean;
    let dayIndex = 0;

    // Loop through each square
    for (
      let squareIndex = 0, column = 0;
      squareIndex < squaresTotalCount;
      squareIndex++, column++
    ) {
      if (squareIndex % $settings.columns === 0 && squareIndex !== 0) {
        // Start a new row
        column = 0;
        row++;
      }
      let square: object[] = [];

      // Check if the square is a weather square or an additional square
      isWeatherSquare = !additionalSquaresIndexes.includes(squareIndex);

      // Calculate the starting coordinates of the square
      const xStart = column * ($settings.squareSize * SQUARE_SECTION_SIZE);
      const yStart = row * ($settings.squareSize * SQUARE_SECTION_SIZE);

      // Loop through each square section
      for (
        let squareSectionIndex = 0, x = xStart, y = yStart;
        squareSectionIndex < squareSectionsCount;
        squareSectionIndex++
      ) {
        let color: string;
        if (isWeatherSquare) {
          // Get the weather data for the current day
          const day: object = weather.data[dayIndex];
          let targetId: string = squareSectionTargetIds[squareSectionIndex];
          let value = day[targetId][units.value];

          // Check if the primary target value is 0 or null, use the primary target as a backup
          if (
            ($settings.primaryTargetAsBackup === 1 && value === 0) ||
            ($settings.primaryTargetAsBackup === 1 && value === null)
          ) {
            targetId = $settings.primaryTarget;
            value = day[targetId][units.value];
          }

          // Get the gauge ID for the target
          let gaugeId = getTargetParentGaugeId(targetId);

          // Get the color based on the gauge ID and value
          color = getColorInfo(gaugeId, value).hex;
        } else {
          // Use the additional squares color
          color = $settings.additionalSquaresColor;
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
          (squareSectionIndex + 1) % $settings.squareSize === 0 &&
          squareSectionIndex !== 0
        ) {
          x = xStart;
          y += SQUARE_SECTION_SIZE;
        } else {
          x += SQUARE_SECTION_SIZE;
        }
      }

      // Add the square to the sections array
      sections.push(square);

      // Increment the day index if it's a weather square
      if (isWeatherSquare) dayIndex++;
    }

    // Update the sections variable
    sections = sections;
  }

  $: filterTargets = [
    ...new Set(
      getSquareSectionTargetIds(
        $settings.squareSize * $settings.squareSize,
        $settings.primaryTarget,
        $settings.secondaryTargets,
      ),
    ),
  ];
</script>

<svg
  id="preview-svg-image"
  class="max-h-[80svh] mx-auto"
  aria-hidden="true"
  viewBox="0 0 {width} {height}"
  bind:this={svg}
  on:click={(e) => {
    if (e.target.tagName !== 'rect') return;
    const group = e.target.parentElement;
    if (group.tagName !== 'g') return;

    if (group.dataset.isweathersquare === 'true') {
      $activeWeatherElementIndex = +group.dataset.dayindex;
      showPreviewImageWeatherDetails(targets);
    }
  }}
>
  {#each sections as square}
    <g
      data-isweathersquare={square[0].isWeatherSquare}
      data-dayindex={square[0].dayIndex}
    >
      {#each square as { color, x, y }}
        <rect
          width={SQUARE_SECTION_SIZE}
          height={SQUARE_SECTION_SIZE}
          fill={color}
          {x}
          {y}
        />
      {/each}
    </g>
  {/each}
</svg>

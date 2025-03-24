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
  import { localState, weather } from '$lib/state';
  import {
    getColorInfo,
    runPreview,
    showPreviewImageWeatherDetails,
  } from '$lib/utils';
  import { splitMonthSquaresPreview } from './state.svelte';

  let width = $state(splitMonthSquaresPreview.width);
  let height = $state(splitMonthSquaresPreview.height);

  function getPoints({ x, y, roundWidth, roundHeight }) {
    const right = `${x},${y + roundHeight} ${x + roundWidth},${y + roundHeight} ${x + roundWidth},${y}`;
    const left = `${x},${y + roundHeight + splitMonthSquaresPreview.STITCH_SIZE / 2} ${x},${y} ${x + roundWidth + splitMonthSquaresPreview.STITCH_SIZE / 2},${y}`;
    return { left, right };
  }

  runPreview(() => {
    const sections = [];
    let squareIndex = 0;
    let x = splitMonthSquaresPreview.squareSize / 2;
    let y = splitMonthSquaresPreview.squareSize / 2;
    let roundWidth = splitMonthSquaresPreview.STITCH_SIZE;
    let roundHeight = splitMonthSquaresPreview.STITCH_SIZE;
    let points = getPoints({ x, y, roundWidth, roundHeight });
    let dayIndex = 0;
    let roundInSquare = 1;
    let isWeather = true;
    let daysInSquare = weather.rawData?.filter(
      (n) =>
        n.date.getFullYear() ===
          splitMonthSquaresPreview.weatherMonths[squareIndex].year &&
        n.date.getMonth() ===
          splitMonthSquaresPreview.weatherMonths[squareIndex].month,
    );
    for (
      let roundsIndex = 0;
      roundsIndex < splitMonthSquaresPreview.totalRounds;
      roundsIndex += 1
    ) {
      if (
        roundsIndex % splitMonthSquaresPreview.roundsPerSquare === 0 &&
        roundsIndex !== 0
      ) {
        // New Square
        squareIndex += 1;
        daysInSquare = weather.rawData?.filter(
          (n) =>
            n.date.getFullYear() ===
              splitMonthSquaresPreview.weatherMonths[squareIndex].year &&
            n.date.getMonth() ===
              splitMonthSquaresPreview.weatherMonths[squareIndex].month,
        );
        roundInSquare = 1;
        roundWidth = splitMonthSquaresPreview.STITCH_SIZE;
        roundHeight = splitMonthSquaresPreview.STITCH_SIZE;
        if (squareIndex % splitMonthSquaresPreview.dimensionsWidth === 0) {
          // Start new Row
          x = splitMonthSquaresPreview.squareSize / 2;
          y +=
            splitMonthSquaresPreview.squareSize +
            splitMonthSquaresPreview.squareSize / 2;
        } else {
          // Add to the right
          x +=
            splitMonthSquaresPreview.squareSize +
            splitMonthSquaresPreview.squareSize / 2;
          y += splitMonthSquaresPreview.squareSize / 2;
        }
      }

      let square;
      const day = daysInSquare?.filter(
        (n) => n.date.getDate() === roundInSquare,
      );

      let _dayIndex = dayIndex;
      if (weather.grouping === 'week') {
        _dayIndex = Math.ceil((dayIndex - weather.monthGroupingStartDay) / 7);
      }

      let color = { left: '', right: '' };
      if (day.length) {
        const leftValue =
          weather.data[_dayIndex][splitMonthSquaresPreview.settings.leftTarget][
            localState.value.units
          ];

        // Get the color based on the gauge ID and value
        color.left = getColorInfo({
          param: splitMonthSquaresPreview.settings.leftTarget,
          value: leftValue,
        }).hex;

        const rightValue =
          weather.data[_dayIndex][
            splitMonthSquaresPreview.settings.rightTarget
          ][localState.value.units];

        // Get the color based on the gauge ID and value
        color.right = getColorInfo({
          param: splitMonthSquaresPreview.settings.rightTarget,
          value: rightValue,
        }).hex;

        isWeather = true;
      } else {
        color.left = splitMonthSquaresPreview.settings.additionalRoundsColor;
        color.right = splitMonthSquaresPreview.settings.additionalRoundsColor;
        isWeather = false;
      }

      points = getPoints({ x, y, roundWidth, roundHeight });

      square = {
        isWeather,
        dayIndex: _dayIndex,
        sides: [
          {
            color: color.left,
            points: points.left,
          },
          {
            color: color.right,
            points: points.right,
          },
        ],
      };

      sections.push(square);

      if (day.length) {
        dayIndex += 1;
      }

      roundInSquare += 1;
      roundWidth += splitMonthSquaresPreview.STITCH_SIZE * 2;
      roundHeight += splitMonthSquaresPreview.STITCH_SIZE * 2;
      x -= splitMonthSquaresPreview.STITCH_SIZE;
      y -= splitMonthSquaresPreview.STITCH_SIZE;
    }

    width = splitMonthSquaresPreview.width;

    height = splitMonthSquaresPreview.height;

    splitMonthSquaresPreview.sections = sections;
  });
</script>

{#if !splitMonthSquaresPreview.sections.length}
  <div class="inline-flex h-[80svh] w-full items-center justify-center">
    <Spinner />
  </div>
{:else}
  <svg
    id="preview-svg-image"
    class="mx-auto max-h-[80svh]"
    aria-hidden="true"
    viewBox="0 0 {width} {height}"
    bind:this={splitMonthSquaresPreview.svg}
    onclick={(e) => {
      if (e.target.tagName !== 'polyline') return;
      if (e.target.dataset.isweather !== 'true') return;
      weather.currentIndex = +e.target.dataset.dayindex;
      showPreviewImageWeatherDetails(splitMonthSquaresPreview.targets);
    }}
  >
    {#each splitMonthSquaresPreview.sections as { sides, isWeather, dayIndex }}
      {#each sides as { color, points }}
        <polyline
          {points}
          stroke={color}
          stroke-width={splitMonthSquaresPreview.STITCH_SIZE}
          fill="none"
          data-isweather={isWeather}
          data-dayindex={dayIndex}
        />
      {/each}
    {/each}
  </svg>
{/if}

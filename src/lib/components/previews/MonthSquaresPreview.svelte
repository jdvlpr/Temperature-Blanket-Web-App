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
  import {
    activeWeatherElementIndex,
    projectStatus,
    units,
    weather,
    weatherGrouping,
    weatherMonthGroupingStartDay,
    weatherUngrouped,
  } from '$lib/stores';
  import {
    getColorInfo,
    getDaysInLongestMonth,
    getTargetParentGaugeId,
    getWeatherTargets,
    showPreviewImageWeatherDetails,
    weatherMonthsData,
  } from '$lib/utils';
  import { details, settings } from './MonthSquaresSettings.svelte';
  import { previews } from './previews';

  let svg;
  const previewIndex = previews.findIndex((n) => n.id === 'msqs');
  $: previews[previewIndex].width = width;
  $: previews[previewIndex].height = height;
  $: previews[previewIndex].svg = svg;

  const STITCH_SIZE = 10;
  $: squareSize = roundsPerSquare * 2 * STITCH_SIZE;

  $: dimensionsWidth = +$settings.dimensions.split('x')[0];
  $: dimensionsHeight = +$settings.dimensions.split('x')[1];

  $: width = dimensionsWidth * squareSize + STITCH_SIZE / 2;
  $: height = dimensionsHeight * squareSize + STITCH_SIZE / 2;

  $: months = weatherMonthsData({ weatherData: weather.data });

  $: daysInLongestMonth = getDaysInLongestMonth(months);

  $: roundsPerSquare = getRoundsPerSquare(
    daysInLongestMonth,
    $settings.additionalRoundsPerSquare,
  );
  function getRoundsPerSquare(daysInLongestMonth) {
    return daysInLongestMonth + $settings.additionalRoundsPerSquare;
  }

  $: $details = { roundsPerSquare };

  $: totalRounds = getTotalRounds(months, roundsPerSquare);
  function getTotalRounds() {
    return months.length * roundsPerSquare;
  }

  $: targets = getWeatherTargets({
    weatherParameters: { [$settings.selectedTarget]: true },
  });

  let squares = [];

  $: if (projectStatus.state.liveURL) {
    squares = [];
    let squareIndex = 0;
    let x = squareSize / 2;
    let y = squareSize / 2;
    let roundWidth = STITCH_SIZE;
    let roundHeight = STITCH_SIZE;
    let dayIndex = 0;
    let roundInSquare = 1;
    let isWeather = true;
    let daysInSquare = weatherUngrouped.data?.filter(
      (n) =>
        n.date.getFullYear() === months[squareIndex].year &&
        n.date.getMonth() === months[squareIndex].month,
    );
    let dateInMonth = daysInSquare?.[0].date.getDate();
    for (let roundsIndex = 0; roundsIndex < totalRounds; roundsIndex += 1) {
      if (roundsIndex % roundsPerSquare === 0 && roundsIndex !== 0) {
        // New Square
        squareIndex += 1;
        daysInSquare = weatherUngrouped.data?.filter(
          (n) =>
            n.date.getFullYear() === months[squareIndex].year &&
            n.date.getMonth() === months[squareIndex].month,
        );
        roundInSquare = 1;
        dateInMonth = daysInSquare[0].date.getDate();
        roundWidth = STITCH_SIZE;
        roundHeight = STITCH_SIZE;
        if (squareIndex % dimensionsWidth === 0) {
          // Start new Row
          x = squareSize / 2;
          y += squareSize + squareSize / 2;
        } else {
          // Add to the right
          x += squareSize + squareSize / 2;
          y += squareSize / 2;
        }
      }

      let square = {
        x,
        y,
        width: roundWidth,
        height: roundHeight,
      };
      const day = daysInSquare?.filter(
        (n) => n.date.getDate() === roundInSquare,
      );

      let _dayIndex = dayIndex;
      if (weatherGrouping.value === 'week') {
        _dayIndex = Math.ceil((dayIndex - $weatherMonthGroupingStartDay) / 7);
      }

      let color;
      if (day.length) {
        const value =
          weather.data[_dayIndex][$settings.selectedTarget][units.value];
        const gaugeId = getTargetParentGaugeId($settings.selectedTarget);
        color = getColorInfo(gaugeId, value).hex;
        isWeather = true;
        square = {
          ...square,
          isWeather,
          dayIndex: _dayIndex,
          color,
        };
        dayIndex += 1;
        dateInMonth += 1;
      } else {
        color = $settings.additionalRoundsColor;
        isWeather = false;
        square = {
          ...square,
          isWeather,
          dayIndex: _dayIndex,
          color,
        };
      }

      roundInSquare += 1;

      squares.push(square);

      roundWidth += STITCH_SIZE * 2;
      roundHeight += STITCH_SIZE * 2;
      x -= STITCH_SIZE;
      y -= STITCH_SIZE;
    }
  }
</script>

{#if weather.data}
  <svg
    id="preview-svg-image"
    class="max-h-[80svh] mx-auto"
    aria-hidden="true"
    viewBox="0 0 {width} {height}"
    bind:this={svg}
    on:click={(e) => {
      if (e.target.tagName !== 'rect') return;
      if (e.target.dataset.isweather !== 'true') return;
      $activeWeatherElementIndex = +e.target.dataset.dayindex;
      showPreviewImageWeatherDetails(targets);
    }}
  >
    {#each squares as { width, height, color, x, y, isWeather, dayIndex }}
      <rect
        {width}
        {height}
        stroke={color}
        stroke-width={STITCH_SIZE}
        {x}
        {y}
        fill={'none'}
        data-isweather={isWeather}
        data-dayindex={dayIndex}
      />
    {/each}
  </svg>
{/if}

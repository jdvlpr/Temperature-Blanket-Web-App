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
    createdGauges,
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
    showPreviewImageWeatherDetails,
    weatherMonthsData,
  } from '$lib/utils';
  import { details, settings } from './MonthRowsSettings.svelte';
  import { previews } from './previews';

  let svg;
  const previewIndex = previews.findIndex((n) => n.id === 'mrws');
  $: previews[previewIndex].width = width;
  $: previews[previewIndex].height = height;
  $: previews[previewIndex].svg = svg;

  const STITCH_SIZE = 10;

  $: dimensionsWidth = +$settings.dimensions.split('x')[0];
  $: dimensionsHeight = +$settings.dimensions.split('x')[1];

  $: width =
    $settings.stitchesPerRow * dimensionsWidth * STITCH_SIZE +
    (dimensionsWidth + 1) * $settings.borderStitches * STITCH_SIZE;
  $: height =
    dimensionsHeight *
      rowsPerMonth *
      $settings.selectedTargets.length *
      STITCH_SIZE +
    (dimensionsHeight + 1) * $settings.borderStitches * STITCH_SIZE;

  $: monthsInData = weatherMonthsData({ weatherData: weather.data });

  $: daysInLongestMonth = getDaysInLongestMonth(monthsInData);

  $: rowsPerMonth = daysInLongestMonth * $settings.selectedTargets.length;

  $: $details = { rowsPerMonth };

  $: totalRows = monthsInData?.length * rowsPerMonth;

  $: targets = $createdGauges
    .flatMap((n) => n.targets)
    .filter((n) => $settings.selectedTargets.includes(n.id));

  let months = [];
  let borders = [];

  $: if (projectStatus.state.liveURL) {
    months = [];
    borders = [
      {
        x: ($settings.borderStitches * STITCH_SIZE) / 2,
        y: ($settings.borderStitches * STITCH_SIZE) / 2,
      },
    ];
    let monthIndex = 0;
    let x = 0 + $settings.borderStitches * STITCH_SIZE;
    let y = 0 + $settings.borderStitches * STITCH_SIZE;
    let dayIndex = 0;
    // let extraInMonthIndex = 0;
    let dayInMonthCount = 1;
    let isWeather = true;
    let daysInSquare = weatherUngrouped.data?.filter(
      (n) =>
        n.date.getFullYear() === monthsInData[monthIndex].year &&
        n.date.getMonth() === monthsInData[monthIndex].month,
    );
    for (let rowIndex = 0; rowIndex < totalRows; rowIndex += 1) {
      if (rowIndex % rowsPerMonth === 0 && rowIndex !== 0) {
        // New Month
        monthIndex += 1;
        daysInSquare = weatherUngrouped.data?.filter(
          (n) =>
            n.date.getFullYear() === monthsInData[monthIndex].year &&
            n.date.getMonth() === monthsInData[monthIndex].month,
        );
        dayInMonthCount = 1;
        if ($settings.direction === 'left-to-right') {
          // Left to Right
          if (monthIndex % dimensionsWidth === 0) {
            // Start new Row (below one month and left all the way)
            x = 0 + $settings.borderStitches * STITCH_SIZE;
            y += $settings.borderStitches * STITCH_SIZE;
          } else {
            // Add to the right (right one month)
            x +=
              $settings.stitchesPerRow * STITCH_SIZE +
              $settings.borderStitches * STITCH_SIZE;
            y -= rowsPerMonth * STITCH_SIZE * $settings.selectedTargets.length;
          }
        } else if ($settings.direction === 'top-to-bottom') {
          // Top to Bottom
          if (monthIndex % dimensionsHeight === 0) {
            // Start new Column (right one month and top all the way)
            x +=
              $settings.stitchesPerRow * STITCH_SIZE +
              $settings.borderStitches * STITCH_SIZE;
            y = $settings.borderStitches * STITCH_SIZE;
          } else {
            // Add to the bottom (down one month)
            y += $settings.borderStitches * STITCH_SIZE;
          }
        }
        borders.push({
          x: x - ($settings.borderStitches * STITCH_SIZE) / 2,
          y: y - ($settings.borderStitches * STITCH_SIZE) / 2,
        });
      }

      let _dayIndex = dayIndex;
      if (weatherGrouping.value === 'week') {
        _dayIndex = Math.ceil((dayIndex - $weatherMonthGroupingStartDay) / 7);
      }

      let day = daysInSquare?.filter(
        (n) => n.date.getDate() === dayInMonthCount,
      );

      for (
        let paramIndex = 0;
        paramIndex < $settings.selectedTargets.length;
        paramIndex += 1
      ) {
        let row = {
          x,
          y,
          width: $settings.stitchesPerRow * STITCH_SIZE,
          height: STITCH_SIZE,
        };
        let color;
        if (day.length) {
          const value =
            weather.data[_dayIndex][$settings.selectedTargets[paramIndex]][
              units.value
            ];
          const gaugeId = getTargetParentGaugeId(
            $settings.selectedTargets[paramIndex],
          );
          color = getColorInfo(gaugeId, value).hex;
          isWeather = true;
          row = {
            ...row,
            isWeather,
            dayIndex: _dayIndex,
            color,
          };
        } else {
          color = $settings.extrasColor;
          isWeather = false;
          row = {
            ...row,
            isWeather,
            dayIndex: _dayIndex,
            color,
          };
        }

        months.push(row);
        y += STITCH_SIZE;
      }

      if (rowIndex % $settings.selectedTargets.length === 0) {
        if (day.length) dayIndex += 1;
        dayInMonthCount += 1;
      }
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
    {#each months as { width, height, color, x, y, isWeather, dayIndex }}
      <rect
        {width}
        {height}
        fill={color}
        {x}
        {y}
        data-isweather={isWeather}
        data-dayindex={dayIndex}
      />
    {/each}

    {#each borders as { x, y }}
      <rect
        width={$settings.stitchesPerRow * STITCH_SIZE +
          $settings.borderStitches * STITCH_SIZE}
        height={rowsPerMonth * $settings.selectedTargets.length * STITCH_SIZE +
          $settings.borderStitches * STITCH_SIZE}
        stroke-width={STITCH_SIZE * $settings.borderStitches}
        stroke={$settings.borderColor}
        fill="none"
        {x}
        {y}
        data-isweather={false}
      />
    {/each}
  </svg>
{/if}

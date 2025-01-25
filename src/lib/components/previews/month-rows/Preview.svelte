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
    getTargetParentGaugeId,
    showPreviewImageWeatherDetails,
  } from '$lib/utils';
  import { monthRowsPreview } from './state.svelte';

  let width = $state(monthRowsPreview.width);

  let height = $state(monthRowsPreview.height);

  let debounceTimer;
  const debounce = (callback, time) => {
    window.clearTimeout(debounceTimer);
    debounceTimer = window.setTimeout(callback, time);
  };

  $effect(() => {
    project.url.href;
    if (!weather.data.length || !gauges.allCreated.length) return;
    debounce(() => {
      const months = [];
      const borders = [
        {
          x:
            (monthRowsPreview.settings.borderStitches *
              monthRowsPreview.STITCH_SIZE) /
            2,
          y:
            (monthRowsPreview.settings.borderStitches *
              monthRowsPreview.STITCH_SIZE) /
            2,
        },
      ];
      let monthIndex = 0;
      let x =
        0 +
        monthRowsPreview.settings.borderStitches * monthRowsPreview.STITCH_SIZE;
      let y =
        0 +
        monthRowsPreview.settings.borderStitches * monthRowsPreview.STITCH_SIZE;
      let dayIndex = 0;
      // let extraInMonthIndex = 0;
      let dayInMonthCount = 1;
      let isWeather = true;
      let daysInSquare = weather.rawData?.filter(
        (n) =>
          n.date.getFullYear() ===
            monthRowsPreview.monthsInData[monthIndex].year &&
          n.date.getMonth() === monthRowsPreview.monthsInData[monthIndex].month,
      );
      for (
        let rowIndex = 0;
        rowIndex < monthRowsPreview.totalRows;
        rowIndex += 1
      ) {
        if (rowIndex % monthRowsPreview.rowsPerMonth === 0 && rowIndex !== 0) {
          // New Month
          monthIndex += 1;
          daysInSquare = weather.rawData?.filter(
            (n) =>
              n.date.getFullYear() ===
                monthRowsPreview.monthsInData[monthIndex].year &&
              n.date.getMonth() ===
                monthRowsPreview.monthsInData[monthIndex].month,
          );
          dayInMonthCount = 1;
          if (monthRowsPreview.settings.direction === 'left-to-right') {
            // Left to Right
            if (monthIndex % monthRowsPreview.dimensionsWidth === 0) {
              // Start new Row (below one month and left all the way)
              x =
                0 +
                monthRowsPreview.settings.borderStitches *
                  monthRowsPreview.STITCH_SIZE;
              y +=
                monthRowsPreview.settings.borderStitches *
                monthRowsPreview.STITCH_SIZE;
            } else {
              // Add to the right (right one month)
              x +=
                monthRowsPreview.settings.stitchesPerRow *
                  monthRowsPreview.STITCH_SIZE +
                monthRowsPreview.settings.borderStitches *
                  monthRowsPreview.STITCH_SIZE;
              y -=
                monthRowsPreview.rowsPerMonth *
                monthRowsPreview.STITCH_SIZE *
                monthRowsPreview.settings.selectedTargets.length;
            }
          } else if (monthRowsPreview.settings.direction === 'top-to-bottom') {
            // Top to Bottom
            if (monthIndex % monthRowsPreview.dimensionsHeight === 0) {
              // Start new Column (right one month and top all the way)
              x +=
                monthRowsPreview.settings.stitchesPerRow *
                  monthRowsPreview.STITCH_SIZE +
                monthRowsPreview.settings.borderStitches *
                  monthRowsPreview.STITCH_SIZE;
              y =
                monthRowsPreview.settings.borderStitches *
                monthRowsPreview.STITCH_SIZE;
            } else {
              // Add to the bottom (down one month)
              y +=
                monthRowsPreview.settings.borderStitches *
                monthRowsPreview.STITCH_SIZE;
            }
          }
          borders.push({
            x:
              x -
              (monthRowsPreview.settings.borderStitches *
                monthRowsPreview.STITCH_SIZE) /
                2,
            y:
              y -
              (monthRowsPreview.settings.borderStitches *
                monthRowsPreview.STITCH_SIZE) /
                2,
          });
        }

        let _dayIndex = dayIndex;
        if (weather.grouping === 'week') {
          _dayIndex = Math.ceil((dayIndex - weather.monthGroupingStartDay) / 7);
        }

        let day = daysInSquare?.filter(
          (n) => n.date.getDate() === dayInMonthCount,
        );

        for (
          let paramIndex = 0;
          paramIndex < monthRowsPreview.settings.selectedTargets.length;
          paramIndex += 1
        ) {
          let row = {
            x,
            y,
            width:
              monthRowsPreview.settings.stitchesPerRow *
              monthRowsPreview.STITCH_SIZE,
            height: monthRowsPreview.STITCH_SIZE,
          };
          let color;
          if (day.length) {
            const value =
              weather.data[_dayIndex][
                monthRowsPreview.settings.selectedTargets[paramIndex]
              ][project.units];
            const gaugeId = getTargetParentGaugeId(
              monthRowsPreview.settings.selectedTargets[paramIndex],
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
            color = monthRowsPreview.settings.extrasColor;
            isWeather = false;
            row = {
              ...row,
              isWeather,
              dayIndex: _dayIndex,
              color,
            };
          }

          months.push(row);
          y += monthRowsPreview.STITCH_SIZE;
        }

        if (rowIndex % monthRowsPreview.settings.selectedTargets.length === 0) {
          if (day.length) dayIndex += 1;
          dayInMonthCount += 1;
        }
      }
      width = monthRowsPreview.width;
      height = monthRowsPreview.height;
      monthRowsPreview.months = months;
    }, 10);
  });
</script>

{#if !monthRowsPreview.months.length}
  <div class="w-full h-[80svh] inline-flex justify-center items-center">
    <Spinner />
  </div>
{:else}
  <svg
    id="preview-svg-image"
    class="max-h-[80svh] mx-auto"
    aria-hidden="true"
    viewBox="0 0 {width} {height}"
    bind:this={monthRowsPreview.svg}
    onclick={(e) => {
      if (e.target.tagName !== 'rect') return;
      if (e.target.dataset.isweather !== 'true') return;
      weather.currentIndex = +e.target.dataset.dayindex;

      showPreviewImageWeatherDetails(monthRowsPreview.targets);
    }}
  >
    {#each monthRowsPreview.months as { width, height, color, x, y, isWeather, dayIndex }}
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

    {#each monthRowsPreview.borders as { x, y }}
      <rect
        width={monthRowsPreview.settings.stitchesPerRow *
          monthRowsPreview.STITCH_SIZE +
          monthRowsPreview.settings.borderStitches *
            monthRowsPreview.STITCH_SIZE}
        height={monthRowsPreview.rowsPerMonth *
          monthRowsPreview.settings.selectedTargets.length *
          monthRowsPreview.STITCH_SIZE +
          monthRowsPreview.settings.borderStitches *
            monthRowsPreview.STITCH_SIZE}
        stroke-width={monthRowsPreview.STITCH_SIZE *
          monthRowsPreview.settings.borderStitches}
        stroke={monthRowsPreview.settings.borderColor}
        fill="none"
        {x}
        {y}
        data-isweather={false}
      />
    {/each}
  </svg>
{/if}

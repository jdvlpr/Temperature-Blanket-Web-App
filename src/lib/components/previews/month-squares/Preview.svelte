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
  import { gauges, localState, project, weather } from '$lib/state';
  import { getColorInfo, showPreviewImageWeatherDetails } from '$lib/utils';
  import { tick } from 'svelte';
  import { monthSquaresPreview } from './state.svelte';

  let width = $state(monthSquaresPreview.width);

  let height = $state(monthSquaresPreview.height);

  $effect(() => {
    project.url.href;
    if (!weather.data.length || !gauges.allCreated.length) return;
    tick().then(() => {
      const sections = [];
      let squareIndex = 0;
      let x = monthSquaresPreview.squareSize / 2;
      let y = monthSquaresPreview.squareSize / 2;
      let roundWidth = monthSquaresPreview.STITCH_SIZE;
      let roundHeight = monthSquaresPreview.STITCH_SIZE;
      let dayIndex = 0;
      let roundInSquare = 1;
      let isWeather = true;
      let daysInSquare = weather.rawData?.filter(
        (n) =>
          n.date.getFullYear() ===
            monthSquaresPreview.weatherMonths[squareIndex].year &&
          n.date.getMonth() ===
            monthSquaresPreview.weatherMonths[squareIndex].month,
      );
      let dateInMonth = daysInSquare?.[0].date.getDate();
      for (
        let roundsIndex = 0;
        roundsIndex < monthSquaresPreview.totalRounds;
        roundsIndex += 1
      ) {
        if (
          roundsIndex % monthSquaresPreview.roundsPerSquare === 0 &&
          roundsIndex !== 0
        ) {
          // New Square
          squareIndex += 1;
          daysInSquare = weather.rawData?.filter(
            (n) =>
              n.date.getFullYear() ===
                monthSquaresPreview.weatherMonths[squareIndex].year &&
              n.date.getMonth() ===
                monthSquaresPreview.weatherMonths[squareIndex].month,
          );
          roundInSquare = 1;
          dateInMonth = daysInSquare[0].date.getDate();
          roundWidth = monthSquaresPreview.STITCH_SIZE;
          roundHeight = monthSquaresPreview.STITCH_SIZE;
          if (squareIndex % monthSquaresPreview.dimensionsWidth === 0) {
            // Start new Row
            x = monthSquaresPreview.squareSize / 2;
            y +=
              monthSquaresPreview.squareSize +
              monthSquaresPreview.squareSize / 2;
          } else {
            // Add to the right
            x +=
              monthSquaresPreview.squareSize +
              monthSquaresPreview.squareSize / 2;
            y += monthSquaresPreview.squareSize / 2;
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
        if (weather.grouping === 'week') {
          _dayIndex = Math.ceil((dayIndex - weather.monthGroupingStartDay) / 7);
        }

        let color;
        if (day.length) {
          const value =
            weather.data[_dayIndex][
              monthSquaresPreview.settings.selectedTarget
            ][localState.value.units];

          // Get the color based on the gauge ID and value
          color = getColorInfo({
            param: monthSquaresPreview.settings.selectedTarget,
            value,
          }).hex;
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
          color = monthSquaresPreview.settings.additionalRoundsColor;
          isWeather = false;
          square = {
            ...square,
            isWeather,
            dayIndex: _dayIndex,
            color,
          };
        }

        roundInSquare += 1;

        sections.push(square);

        roundWidth += monthSquaresPreview.STITCH_SIZE * 2;

        roundHeight += monthSquaresPreview.STITCH_SIZE * 2;
        x -= monthSquaresPreview.STITCH_SIZE;

        y -= monthSquaresPreview.STITCH_SIZE;
      }

      width = monthSquaresPreview.width;

      height = monthSquaresPreview.height;

      monthSquaresPreview.sections = sections;
    }, 10);
  });
</script>

{#if !monthSquaresPreview.sections.length}
  <div class="inline-flex h-[80svh] w-full items-center justify-center">
    <Spinner />
  </div>
{:else}
  <svg
    id="preview-svg-image"
    class="mx-auto max-h-[80svh]"
    aria-hidden="true"
    viewBox="0 0 {width} {height}"
    bind:this={monthSquaresPreview.svg}
    onclick={(e) => {
      if (e.target.tagName !== 'rect') return;
      if (e.target.dataset.isweather !== 'true') return;
      weather.currentIndex = +e.target.dataset.dayindex;
      showPreviewImageWeatherDetails(monthSquaresPreview.targets);
    }}
  >
    {#each monthSquaresPreview.sections as { width, height, color, x, y, isWeather, dayIndex }}
      <rect
        {width}
        {height}
        stroke={color}
        stroke-width={monthSquaresPreview.STITCH_SIZE}
        {x}
        {y}
        fill={'none'}
        data-isweather={isWeather}
        data-dayindex={dayIndex}
      />
    {/each}
  </svg>
{/if}

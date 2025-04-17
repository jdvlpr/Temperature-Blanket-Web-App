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
  import { weather } from '$lib/state';
  import {
    getColorInfo,
    getWeatherValue,
    runPreview,
    showPreviewImageWeatherDetails,
  } from '$lib/utils';
  import { dailySquaresPreview } from './state.svelte';

  let width = $state(dailySquaresPreview.width);

  let height = $state(dailySquaresPreview.height);

  runPreview(() => {
    const sections = [];
    let squareIndex = 0;
    const layoutBorderWidth =
      dailySquaresPreview.settings.layoutBorder *
      dailySquaresPreview.STITCH_SIZE;
    let x = dailySquaresPreview.squareSize / 2 + layoutBorderWidth;
    let y = dailySquaresPreview.squareSize / 2 + layoutBorderWidth;
    let roundWidth = dailySquaresPreview.STITCH_SIZE;
    let roundHeight = dailySquaresPreview.STITCH_SIZE;
    let dayIndex = 0;
    let roundInSquare = 1;
    let isWeather = true;
    let daysInSquare = dailySquaresPreview.weatherSquares[squareIndex];

    for (
      let roundsIndex = 0;
      roundsIndex < dailySquaresPreview.totalRounds;
      roundsIndex += 1
    ) {
      if (
        roundsIndex %
          (dailySquaresPreview.settings.daysPerSquare +
            dailySquaresPreview.settings.squareBorder) ===
          0 &&
        roundsIndex !== 0
      ) {
        // New Square
        squareIndex += 1;
        daysInSquare = dailySquaresPreview.weatherSquares[squareIndex];
        roundInSquare = 1;
        roundWidth = dailySquaresPreview.STITCH_SIZE;
        roundHeight = dailySquaresPreview.STITCH_SIZE;
        if (squareIndex % dailySquaresPreview.settings.columns === 0) {
          // Start new Row
          x = dailySquaresPreview.squareSize / 2 + layoutBorderWidth;
          y +=
            dailySquaresPreview.squareSize + dailySquaresPreview.squareSize / 2;
        } else {
          // Add to the right
          x +=
            dailySquaresPreview.squareSize + dailySquaresPreview.squareSize / 2;
          y += dailySquaresPreview.squareSize / 2;
        }
      }

      let square = {
        x,
        y,
        width: roundWidth,
        height: roundHeight,
      };

      const day = daysInSquare ? daysInSquare[roundInSquare - 1] : undefined;

      let _dayIndex = dayIndex;
      if (weather.grouping === 'week') {
        _dayIndex = Math.ceil((dayIndex - weather.monthGroupingStartDay) / 7);
      }

      let color;
      if (day) {
        const value = getWeatherValue({
          dayIndex: _dayIndex,
          param: dailySquaresPreview.settings.selectedTarget,
        });

        // Get the color based on the gauge ID and value
        color = getColorInfo({
          param: dailySquaresPreview.settings.selectedTarget,
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
      } else {
        color = dailySquaresPreview.settings.additionalRoundsColor;

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

      roundWidth += dailySquaresPreview.STITCH_SIZE * 2;

      roundHeight += dailySquaresPreview.STITCH_SIZE * 2;

      x -= dailySquaresPreview.STITCH_SIZE;

      y -= dailySquaresPreview.STITCH_SIZE;
    }

    width = dailySquaresPreview.width;

    height = dailySquaresPreview.height;

    dailySquaresPreview.sections = sections;
  });
</script>

{#if !dailySquaresPreview.sections.length}
  <div class="inline-flex h-[80svh] w-full items-center justify-center">
    <Spinner />
  </div>
{:else}
  <svg
    id="preview-svg-image"
    class="mx-auto max-h-[80svh]"
    aria-hidden="true"
    viewBox="0 0 {width} {height}"
    bind:this={dailySquaresPreview.svg}
    onclick={(e) => {
      if (e.target.tagName !== 'rect') return;
      if (e.target.dataset.isweather !== 'true') return;
      weather.currentIndex = +e.target.dataset.dayindex;
      showPreviewImageWeatherDetails(dailySquaresPreview.targets);
    }}
  >
    {#each dailySquaresPreview.sections as { width, height, color, x, y, isWeather, dayIndex }}
      <rect
        {width}
        {height}
        stroke={color}
        stroke-width={dailySquaresPreview.STITCH_SIZE}
        {x}
        {y}
        fill={'none'}
        data-isweather={isWeather}
        data-dayindex={dayIndex}
      />
    {/each}
    {#if dailySquaresPreview.settings.layoutBorder > 0}
      {#each Array(dailySquaresPreview.settings.layoutBorder), i}
        {@const increment = i + 1}
        {@const weatherIndex = weather.data.length - increment}
        {@const value = getWeatherValue({
          dayIndex: weatherIndex,
          param: dailySquaresPreview.settings.selectedTarget,
        })}
        {@const color = getColorInfo({
          param: dailySquaresPreview.settings.selectedTarget,
          value,
        }).hex}
        <rect
          width={width - increment * dailySquaresPreview.STITCH_SIZE * 2}
          height={height - increment * dailySquaresPreview.STITCH_SIZE * 2}
          stroke={color}
          stroke-width={dailySquaresPreview.STITCH_SIZE}
          data-isweather={true}
          data-dayindex={weatherIndex}
          x={increment * dailySquaresPreview.STITCH_SIZE}
          y={increment * dailySquaresPreview.STITCH_SIZE}
          fill={'none'}
        />
      {/each}
    {/if}
  </svg>
{/if}

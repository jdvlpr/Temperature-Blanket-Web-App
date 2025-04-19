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
  import { squareRoundsPreview } from './state.svelte';

  let width = $state(squareRoundsPreview.width);

  let height = $state(squareRoundsPreview.height);

  runPreview(() => {
    const sections = [];
    let squareIndex = 0;
    const layoutBorderOffset =
      squareRoundsPreview.layoutBorderWidth -
      squareRoundsPreview.STITCH_SIZE / 2;
    let x = squareRoundsPreview.squareSize / 2 + layoutBorderOffset;
    let y = squareRoundsPreview.squareSize / 2 + layoutBorderOffset;
    let roundWidth = squareRoundsPreview.STITCH_SIZE;
    let roundHeight = squareRoundsPreview.STITCH_SIZE;
    let dayIndex = 0;
    let roundInSquare = 1;
    let isWeather = true;
    let daysInSquare = squareRoundsPreview.weatherSquares[squareIndex];

    for (
      let roundsIndex = 0;
      roundsIndex < squareRoundsPreview.totalRounds;
      roundsIndex += 1
    ) {
      if (
        roundsIndex %
          (squareRoundsPreview.settings.daysPerSquare +
            squareRoundsPreview.settings.squareBorder) ===
          0 &&
        roundsIndex !== 0
      ) {
        // New Square
        squareIndex += 1;
        daysInSquare = squareRoundsPreview.weatherSquares[squareIndex];
        roundInSquare = 1;
        roundWidth = squareRoundsPreview.STITCH_SIZE;
        roundHeight = squareRoundsPreview.STITCH_SIZE;
        if (squareIndex % squareRoundsPreview.settings.columns === 0) {
          // Start new Row
          x = squareRoundsPreview.squareSize / 2 + layoutBorderOffset;
          y +=
            squareRoundsPreview.squareSize + squareRoundsPreview.squareSize / 2;
        } else {
          // Add to the right
          x +=
            squareRoundsPreview.squareSize + squareRoundsPreview.squareSize / 2;
          y += squareRoundsPreview.squareSize / 2;
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

      let color;
      if (day) {
        const value = getWeatherValue({
          dayIndex: _dayIndex,
          param: squareRoundsPreview.settings.selectedTarget,
        });

        // Get the color based on the gauge ID and value
        color = getColorInfo({
          param: squareRoundsPreview.settings.selectedTarget,
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
        color = squareRoundsPreview.settings.additionalRoundsColor;

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

      roundWidth += squareRoundsPreview.STITCH_SIZE * 2;

      roundHeight += squareRoundsPreview.STITCH_SIZE * 2;

      x -= squareRoundsPreview.STITCH_SIZE;

      y -= squareRoundsPreview.STITCH_SIZE;
    }

    width = squareRoundsPreview.width;

    height = squareRoundsPreview.height;

    squareRoundsPreview.sections = sections;
  });
</script>

{#if !squareRoundsPreview.sections.length}
  <div class="inline-flex h-[80svh] w-full items-center justify-center">
    <Spinner />
  </div>
{:else}
  <svg
    id="preview-svg-image"
    class="mx-auto max-h-[80svh]"
    aria-hidden="true"
    viewBox="0 0 {width} {height}"
    bind:this={squareRoundsPreview.svg}
    onclick={(e) => {
      if (e.target.tagName !== 'rect') return;
      if (e.target.dataset.isweather !== 'true') return;
      weather.currentIndex = +e.target.dataset.dayindex;
      showPreviewImageWeatherDetails(squareRoundsPreview.targets);
    }}
  >
    {#each squareRoundsPreview.sections as { width, height, color, x, y, isWeather, dayIndex }}
      <rect
        {width}
        {height}
        stroke={color}
        stroke-width={squareRoundsPreview.STITCH_SIZE}
        {x}
        {y}
        fill={'none'}
        data-isweather={isWeather}
        data-dayindex={dayIndex}
      />
    {/each}

    {#if squareRoundsPreview.settings.layoutBorder > 0}
      {#each Array(squareRoundsPreview.settings.layoutBorder), i}
        {@const increment = i + 1}
        {@const weatherIndex = weather.data.length - increment}
        {@const value = getWeatherValue({
          dayIndex: weatherIndex,
          param: squareRoundsPreview.settings.selectedTarget,
        })}
        {@const color = getColorInfo({
          param: squareRoundsPreview.settings.selectedTarget,
          value,
        }).hex}
        <rect
          width={width -
            increment * squareRoundsPreview.STITCH_SIZE * 2 +
            squareRoundsPreview.STITCH_SIZE}
          height={height -
            increment * squareRoundsPreview.STITCH_SIZE * 2 +
            squareRoundsPreview.STITCH_SIZE}
          stroke={color}
          stroke-width={squareRoundsPreview.STITCH_SIZE}
          data-isweather={true}
          data-dayindex={weatherIndex}
          x={increment * squareRoundsPreview.STITCH_SIZE -
            squareRoundsPreview.STITCH_SIZE / 2}
          y={increment * squareRoundsPreview.STITCH_SIZE -
            squareRoundsPreview.STITCH_SIZE / 2}
          fill={'none'}
        />
      {/each}
    {/if}
  </svg>
{/if}

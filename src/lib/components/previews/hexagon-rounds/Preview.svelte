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
  import { hexagonRoundsPreview } from './state.svelte';

  let width = $state(hexagonRoundsPreview.width);
  let height = $state(hexagonRoundsPreview.height);

  function getHexagonPoints(cx, cy, size) {
    // Returns a string of points for a regular hexagon centered at (cx, cy)
    const points = [];
    for (let i = 0; i < 6; i++) {
      const angle = (Math.PI / 3) * i - Math.PI / 6;
      const x = cx + size * Math.cos(angle);
      const y = cy + size * Math.sin(angle);
      points.push(`${x},${y}`);
    }
    return points.join(' ');
  }

  runPreview(() => {
    const sections = [];
    const borderHexagons = [];
    let squareIndex = 0;
    const layoutBorderOffset =
      hexagonRoundsPreview.layoutBorderWidth -
      hexagonRoundsPreview.STITCH_SIZE / 2;
    let x = hexagonRoundsPreview.hexagonWidth / 2 + layoutBorderOffset;
    let y = hexagonRoundsPreview.hexagonHeight / 2 + layoutBorderOffset;
    let roundSize = hexagonRoundsPreview.STITCH_SIZE / 1.68;
    let dayIndex = 0;
    let roundInSquare = 1;
    let isWeather = true;
    let daysInSquare = hexagonRoundsPreview.weatherHexagons[squareIndex];
    let rowIndex = 0;
    let hexagonsInRow = hexagonRoundsPreview.settings.columns;
    let hexagonRowIndex = 1;

    for (
      let roundsIndex = 0;
      roundsIndex < hexagonRoundsPreview.totalRounds;
      roundsIndex += 1
    ) {
      if (
        roundsIndex %
          (hexagonRoundsPreview.settings.roundsPerHexagon +
            hexagonRoundsPreview.settings.hexagonBorder) ===
          0 &&
        roundsIndex !== 0
      ) {
        // New Hexagon ("square")
        squareIndex += 1;
        daysInSquare = hexagonRoundsPreview.weatherHexagons[squareIndex];
        roundInSquare = 1;
        roundSize = hexagonRoundsPreview.STITCH_SIZE / 1.68;

        hexagonsInRow =
          rowIndex === 0
            ? hexagonsInRow
            : rowIndex % 2 === 0
              ? hexagonRoundsPreview.settings.columns
              : hexagonRoundsPreview.settings.columns + 1;

        // console.log({ squareIndex, hexagonsInRow, rowIndex, hexagonRowIndex });

        if (hexagonRowIndex % hexagonsInRow === 0) {
          hexagonRowIndex = 1;
          // Start new Row
          if (rowIndex % 2 === 0) {
            // New row is even
            x = layoutBorderOffset;
          } else {
            // New row is odd
            x = hexagonRoundsPreview.hexagonWidth / 2 + layoutBorderOffset;
          }
          y += hexagonRoundsPreview.hexagonHeight;
          rowIndex += 1;
        } else {
          // Add to the right
          x += hexagonRoundsPreview.hexagonWidth;
          hexagonRowIndex += 1;
          // y += hexagonRoundsPreview.hexagonSize / 2;
        }
      }

      let hex = {
        x,
        y,
        size: roundSize,
      };

      const day = daysInSquare ? daysInSquare[roundInSquare - 1] : undefined;
      let _dayIndex = dayIndex;
      let color;
      if (day) {
        const value = getWeatherValue({
          dayIndex: _dayIndex,
          param: hexagonRoundsPreview.settings.selectedTarget,
        });
        color = getColorInfo({
          param: hexagonRoundsPreview.settings.selectedTarget,
          value,
        }).hex;
        isWeather = true;
        hex = {
          ...hex,
          isWeather,
          dayIndex: _dayIndex,
          color,
        };
        dayIndex += 1;
      } else {
        color = hexagonRoundsPreview.settings.additionalRoundsColor;
        isWeather = false;
        hex = {
          ...hex,
          isWeather,
          dayIndex: _dayIndex,
          color,
        };
      }
      sections.push(hex);

      const isLastRoundInHexagon =
        roundInSquare === hexagonRoundsPreview.settings.roundsPerHexagon;

      const isBorderHexagon =
        hexagonRowIndex === 1 ||
        hexagonRowIndex === hexagonsInRow ||
        rowIndex === 0 ||
        rowIndex === hexagonRoundsPreview.rows - 1;

      if (isLastRoundInHexagon && isBorderHexagon) {
        borderHexagons.push(hex);
      }

      roundInSquare += 1;
      roundSize += hexagonRoundsPreview.STITCH_SIZE * 1.15;
    }
    width = hexagonRoundsPreview.width;
    height = hexagonRoundsPreview.height;

    hexagonRoundsPreview.sections = sections;
    hexagonRoundsPreview.borderHexagons = borderHexagons;
  });
</script>

{#if !hexagonRoundsPreview.sections.length}
  <div class="inline-flex h-[80svh] w-full items-center justify-center">
    <Spinner />
  </div>
{:else}
  <svg
    id="preview-svg-image"
    class="mx-auto max-h-[80svh]"
    aria-hidden="true"
    viewBox="-{hexagonRoundsPreview.hexagonWidth / 2 +
      hexagonRoundsPreview.STITCH_SIZE /
        2} -{hexagonRoundsPreview.hexagonHeight / 4 +
      hexagonRoundsPreview.STITCH_SIZE / 2} {width} {height}"
    bind:this={hexagonRoundsPreview.svg}
    onclick={(e) => {
      if (e.target.tagName !== 'polygon') return;
      if (e.target.dataset.isweather !== 'true') return;
      weather.currentIndex = +e.target.dataset.dayindex;
      showPreviewImageWeatherDetails(hexagonRoundsPreview.targets);
    }}
  >
    {#if hexagonRoundsPreview.borderHexagons.length}
      {#each Array(hexagonRoundsPreview.settings.layoutBorder) as _, i}
        {@const reverseI = hexagonRoundsPreview.settings.layoutBorder - 1 - i}
        {#each hexagonRoundsPreview.borderHexagons as { size, x, y }}
          {@const roundSize =
            size +
            (reverseI + 1) * hexagonRoundsPreview.STITCH_SIZE +
            hexagonRoundsPreview.settings.hexagonBorder *
              1.15 *
              hexagonRoundsPreview.STITCH_SIZE}

          {@const dayIndex =
            weather.data.length -
            hexagonRoundsPreview.settings.layoutBorder +
            reverseI}

          {@const value = getWeatherValue({
            dayIndex,
            param: hexagonRoundsPreview.settings.selectedTarget,
          })}

          {@const color = getColorInfo({
            param: hexagonRoundsPreview.settings.selectedTarget,
            value,
          }).hex}

          <polygon
            points={getHexagonPoints(x, y, roundSize)}
            stroke={color}
            stroke-width={hexagonRoundsPreview.STITCH_SIZE}
            fill="none"
            data-isweather={true}
            data-dayindex={dayIndex}
          />
        {/each}
      {/each}
    {/if}
    {#each hexagonRoundsPreview.sections as { size, color, x, y, isWeather, dayIndex }}
      <polygon
        points={getHexagonPoints(x, y, size)}
        stroke={color}
        stroke-width={hexagonRoundsPreview.STITCH_SIZE}
        fill="none"
        data-isweather={isWeather}
        data-dayindex={dayIndex}
      />
    {/each}
  </svg>
{/if}

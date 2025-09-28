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
    getWeatherValue,
    runPreview,
    showPreviewImageWeatherDetails,
  } from '$lib/utils';
  import { continuousSquarePreview } from './state.svelte';

  let width = $state(continuousSquarePreview.width);

  let height = $state(continuousSquarePreview.height);

  let unit = $derived(continuousSquarePreview.STITCH_SIZE * 2);
  let doubleUnit = $derived(unit * 2);

  function getNextStitch({ x, y, stitch, round }) {
    const endOfRoundStitch = getEndOfRoundStitch(round);

    if (stitch === endOfRoundStitch)
      return { x: x - unit, y: y - unit, isEndOfRound: true }; // Up Left

    const isEndOfRound = false;

    const topRight = nextStitchDownRight(round);
    if (stitch === topRight) return { x: x + unit, y: y + unit, isEndOfRound }; // Down Right

    const bottomRight = nextStitchDownLeft(round);
    if (stitch > topRight && stitch < bottomRight)
      return { x, y: y + doubleUnit, isEndOfRound }; // Down
    if (stitch === bottomRight)
      return { x: x - unit, y: y + unit, isEndOfRound }; // Down Left

    const bottomLeft = nextStitchUpLeft(round);
    if (stitch > bottomRight && stitch < bottomLeft)
      return { x: x - doubleUnit, y, isEndOfRound }; // Left
    if (stitch === bottomLeft)
      return { x: x - unit, y: y - unit, isEndOfRound }; // Up Left

    const topLeft = nextStitchUpRight(round);
    if (stitch === topLeft) return { x: x + unit, y: y - unit, isEndOfRound }; // Up Right
    if (stitch < topLeft) return { x, y: y - doubleUnit, isEndOfRound }; // Up

    if (stitch > topLeft && stitch < topRight)
      return { x: x + doubleUnit, y, isEndOfRound }; // Right
  }

  function nextStitchDownRight(round) {
    if (round <= 1) return round;
    return 4 * round - 2 + nextStitchDownRight(round - 1);
  }
  function nextStitchDownLeft(round) {
    if (round <= 1) return round + 1;
    return 4 * round - 1 + nextStitchDownLeft(round - 1);
  }
  function nextStitchUpLeft(round) {
    if (round <= 1) return round + 2;
    return 4 * round + nextStitchUpLeft(round - 1);
  }
  function nextStitchUpRight(round) {
    if (round <= 2) return round + 3;
    return 4 * round - 3 + nextStitchUpRight(round - 1);
  }

  function getEndOfRoundStitch(round) {
    if (round <= 1) return round * 4;
    return 4 * round + getEndOfRoundStitch(round - 1);
  }

  runPreview(() => {
    let x =
      continuousSquarePreview.width / 2 -
      continuousSquarePreview.STITCH_SIZE * 2;
    let y =
      continuousSquarePreview.height / 2 -
      continuousSquarePreview.STITCH_SIZE * 4;
    let round = 1;
    let dayIndex = 0;
    let value, color;
    let isExtraStitch = false;
    const sections = [];

    for (
      let stitch = 1;
      stitch <= continuousSquarePreview.totalStitches;
      stitch += 1
    ) {
      if (dayIndex < weather.data?.length) {
        value = getWeatherValue({
          dayIndex,
          param: continuousSquarePreview.settings.selectedTarget,
        });

        // Get the color based on the gauge ID and value
        color = getColorInfo({
          param: continuousSquarePreview.settings.selectedTarget,
          value,
        }).hex;
        isExtraStitch = false;
      } else {
        color = continuousSquarePreview.settings.extrasColor;
        isExtraStitch = true;
      }
      sections.push({
        color,
        x,
        y,
        isExtraStitch,
        dayIndex,
      });
      let nextStitch = getNextStitch({ x, y, stitch, round });
      x = nextStitch.x;
      y = nextStitch.y;
      if (nextStitch.isEndOfRound) round += 1;
      if (
        stitch % continuousSquarePreview.settings.stitchesPerDay === 0 ||
        stitch === 1
      ) {
        dayIndex += 1;
      }
    }
    width = continuousSquarePreview.width;
    height = continuousSquarePreview.height;
    continuousSquarePreview.sections = sections;
  });
</script>

{#if !continuousSquarePreview.sections.length}
  <div class="inline-flex h-[80svh] w-full items-center justify-center">
    <Spinner />
  </div>
{:else}
  <svg
    id="preview-svg-image"
    class="mx-auto max-h-[80svh]"
    aria-hidden="true"
    viewBox="0 0 {width} {height}"
    bind:this={continuousSquarePreview.svg}
    onclick={(e) => {
      if (e.target.tagName !== 'rect') return;
      if (e.target.dataset.isextrastitch === 'true') return;

      weather.currentIndex = +e.target.dataset.dayindex;
      showPreviewImageWeatherDetails(continuousSquarePreview.targets);
    }}
  >
    {#each continuousSquarePreview.sections as { color, x, y, isExtraStitch, dayIndex }}
      <rect
        width={continuousSquarePreview.STITCH_SIZE * 3.6}
        height={continuousSquarePreview.STITCH_SIZE * 3.6}
        fill={color}
        {x}
        {y}
        data-isextrastitch={isExtraStitch}
        data-dayindex={dayIndex}
      />
    {/each}
  </svg>
{/if}

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
  import { projectStatus, units, weather } from '$lib/state';
  import {
    getColorInfo,
    getTargetParentGaugeId,
    getWeatherTargets,
    showPreviewImageWeatherDetails,
  } from '$lib/utils';
  import { displayNumber } from '$lib/utils/number-utils';
  import { details, settings } from './ContinuousSquareSettings.svelte';
  import { previewsData } from './previews.svelte';

  let svg;
  const previewIndex = previewsData.findIndex((n) => n.id === 'cosq');
  $: previewsData[previewIndex].width = width;
  $: previewsData[previewIndex].height = height;
  $: previewsData[previewIndex].svg = svg;

  const STITCH_SIZE = 5;
  $: dayStitches = $settings.stitchesPerDay * weather.data?.length;
  $: initialRounds = getInitialNumberOfRounds(dayStitches);
  $: rounds =
    initialCountOfAdditionalStitches > getNumberOfStitchesInRound(initialRounds)
      ? initialRounds - 1
      : initialRounds;
  $: initialTotalStitches = getEndOfRoundStitch(initialRounds);
  $: totalStitches = getEndOfRoundStitch(rounds);
  $: initialCountOfAdditionalStitches =
    initialTotalStitches - dayStitches + $settings.stitchesPerDay;
  $: countOfAdditionalStitches =
    totalStitches - dayStitches + $settings.stitchesPerDay;

  $: $details = { rounds, countOfAdditionalStitches };

  $: width = displayNumber(Math.sqrt(totalStitches) * STITCH_SIZE * 3);
  $: height = displayNumber(Math.sqrt(totalStitches) * STITCH_SIZE * 3);

  $: targets = getWeatherTargets({
    weatherParameters: { [$settings.selectedTarget]: true },
  });

  function getNumberOfStitchesInRound(round) {
    if (round === 1) return 4;
    return getEndOfRoundStitch(round) - getEndOfRoundStitch(round - 1);
  }

  function getInitialNumberOfRounds(dayStitches) {
    let round = 1;
    for (let stitch = 1; stitch <= dayStitches; stitch += 1) {
      if (stitch === getEndOfRoundStitch(round) + 1) round += 1;
    }
    return round;
  }

  function getNextStitch({ x, y, stitch, round }) {
    const unit = STITCH_SIZE * 2;
    const doubleUnit = unit * 2;

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

  let sections = [];

  $: if (projectStatus.state.liveURL) {
    // Setup constants
    let x = width / 2 - STITCH_SIZE * 2;
    let y = height / 2 - STITCH_SIZE * 4;
    let round = 1;
    let dayIndex = 0;
    let value, gaugeId, color;
    let isExtraStitch = false;
    sections = [];
    for (let stitch = 1; stitch <= totalStitches; stitch += 1) {
      if (dayIndex < weather.data?.length) {
        value = weather.data[dayIndex][$settings.selectedTarget][units.value];
        gaugeId = getTargetParentGaugeId($settings.selectedTarget);
        color = getColorInfo(gaugeId, value).hex;
        isExtraStitch = false;
      } else {
        color = $settings.extrasColor;
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
      if (stitch % $settings.stitchesPerDay === 0 || stitch === 1) {
        dayIndex += 1;
      }
    }
  }
</script>

<svg
  id="preview-svg-image"
  class="max-h-[80svh] mx-auto"
  aria-hidden="true"
  viewBox="0 0 {width} {height}"
  bind:this={svg}
  on:click={(e) => {
    if (e.target.tagName !== 'rect') return;
    if (e.target.dataset.isextrastitch === 'true') return;

    weather.currentIndex = +e.target.dataset.dayindex;
    showPreviewImageWeatherDetails(targets);
  }}
>
  {#each sections as { color, x, y, isExtraStitch, dayIndex }}
    <rect
      width={STITCH_SIZE * 3.6}
      height={STITCH_SIZE * 3.6}
      fill={color}
      {x}
      {y}
      data-isextrastitch={isExtraStitch}
      data-dayindex={dayIndex}
    />
  {/each}
</svg>

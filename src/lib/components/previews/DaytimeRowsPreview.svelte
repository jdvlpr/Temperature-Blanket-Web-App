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
  import { HOURS_PER_DAY } from '$lib/constants';
  import {
    activeWeatherElementIndex,
    createdGauges,
    projectStatus,
    units,
    weather,
  } from '$lib/stores';
  import {
    displayNumber,
    getColorInfo,
    getTargetParentGaugeId,
    showPreviewImageWeatherDetails,
  } from '$lib/utils';
  import { settings } from './DaytimeRowsSettings.svelte';
  import { previews } from './previews';

  const previewIndex = previews.findIndex((n) => n.id === 'rsun');
  const STITCH_SIZE = 10;

  let svg;
  let days = [];

  $: previews[previewIndex].width = width;
  $: previews[previewIndex].height = height;
  $: previews[previewIndex].svg = svg;

  $: width = $settings.stitchesPerRow * STITCH_SIZE;
  $: height = $weather?.length * STITCH_SIZE;

  $: targets = $createdGauges
    .map((n) => n.targets)
    .flat()
    .filter(
      (n) => $settings.nightTarget === n.id || $settings.daytimeTarget === n.id,
    );

  $: if ($projectStatus.liveURL) {
    const _days = [];
    let weatherParams = [];
    switch ($settings.daytimePosition) {
      case 'left':
        weatherParams = [$settings.daytimeTarget, $settings.nightTarget];
        break;
      case 'right':
        weatherParams = [$settings.nightTarget, $settings.daytimeTarget];
        break;
      case 'center':
        weatherParams = [
          $settings.nightTarget,
          $settings.daytimeTarget,
          $settings.nightTarget,
        ];
        break;
      case 'sides':
        weatherParams = [
          $settings.daytimeTarget,
          $settings.nightTarget,
          $settings.daytimeTarget,
        ];
        break;
      default:
        weatherParams = [$settings.daytimeTarget, $settings.nightTarget];
        break;
    }
    for (
      let sectionIndex = 0, dayIndex = 0, y = 0;
      sectionIndex < $weather?.length;
      sectionIndex++, dayIndex++, y += STITCH_SIZE
    ) {
       const daytimeLength = displayNumber(
      ($weather[dayIndex].dayt['imperial'] * $settings.stitchesPerRow) / HOURS_PER_DAY,
      0,
    ) * STITCH_SIZE;
      const _day = [];
      for (
        let paramIndex = 0, x = 0;
        paramIndex < weatherParams.length;
        paramIndex++
      ) {
        let calcWidth;
        switch ($settings.daytimePosition) {
          case 'left':
            if (paramIndex === 0) calcWidth = daytimeLength;
            if (paramIndex === 1) calcWidth = width - daytimeLength;
            break;
          case 'right':
            if (paramIndex === 0) calcWidth = width - daytimeLength;
            if (paramIndex === 1) calcWidth = daytimeLength;
            break;
          case 'center':
            if (paramIndex === 0 || paramIndex === 2)
              calcWidth = (width - daytimeLength) / 2;
            if (paramIndex === 1) calcWidth = daytimeLength;
            // if (paramIndex === 0 || paramIndex === 2) calcWidth = daytime / 2;
            // if (paramIndex === 1) calcWidth = width - daytime;
            break;
          case 'sides':
            if (paramIndex === 0 || paramIndex === 2) calcWidth = daytimeLength / 2;
            if (paramIndex === 1) calcWidth = width - daytimeLength;
            break;
        }
        let param = weatherParams[paramIndex];
        let value = $weather[dayIndex][param][$units];
        let gaugeId = getTargetParentGaugeId(param);
        let color = getColorInfo(gaugeId, value);
        _day.push({
          color: color.hex,
          width: calcWidth,
          height: STITCH_SIZE,
          x,
          y,
        });
        x += calcWidth;
      }
      _days.push(_day);
    }
    days = _days;
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
    const group = e.target.parentElement;
    if (group.tagName !== 'g') return;

    $activeWeatherElementIndex = +group.dataset.dayindex;

    showPreviewImageWeatherDetails(targets);
  }}
>
  {#each days as day, i}
    <g data-dayindex={i}>
      {#each day as { color, height, x, y, width }}
        <rect {width} {height} fill={color} {x} {y} />
      {/each}
    </g>
  {/each}
</svg>

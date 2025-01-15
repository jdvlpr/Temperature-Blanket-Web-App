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
  import { gauges, project, weather } from '$lib/state';
  import {
    getColorInfo,
    getTargetParentGaugeId,
    showPreviewImageWeatherDetails,
  } from '$lib/utils';
  import { settings } from './CornerToCornerSettings.svelte';
  import { previewsData } from './previews.svelte';

  let svg;
  const previewIndex = previewsData.findIndex((n) => n.id === 'crnr');

  $: previewsData[previewIndex].width = width;
  $: previewsData[previewIndex].height = height;
  $: previewsData[previewIndex].svg = svg;

  const STITCH_SIZE = 5;
  $: dimensions = $settings.dimensions.split('x').map((n) => +n);
  $: width = dimensions[0] * STITCH_SIZE;
  $: height = dimensions[1] * STITCH_SIZE;

  $: targets = gauges.allCreated
    .flatMap((n) => n.targets)
    .filter((n) => $settings.selectedTarget === n.id);

  const getX = (props) => {
    if (reachedTop(props)) return props.x - STITCH_SIZE;
    if (reachedRight(props)) return props.x;
    if (reachedBottom(props) && reachedLeft(props)) return props.x;
    if (reachedBottom(props)) return props.x - STITCH_SIZE;
    if (reachedLeft(props)) return props.x;

    if (isUpRow(props.row)) return props.x + STITCH_SIZE;
    if (isDownRow(props.row)) return props.x - STITCH_SIZE;
  };
  const getY = (props) => {
    if (reachedTop(props)) return props.y;
    if (reachedRight(props)) return props.y - STITCH_SIZE;
    if (reachedBottom(props) && reachedLeft(props))
      return props.y - STITCH_SIZE;
    if (reachedBottom(props)) return props.y;
    if (reachedLeft(props)) return props.y - STITCH_SIZE;

    if (isUpRow(props.row)) return props.y - STITCH_SIZE;
    if (isDownRow(props.row)) return props.y + STITCH_SIZE;
  };
  const getRow = (props) => {
    if (
      reachedTop(props) ||
      reachedRight(props) ||
      reachedBottom(props) ||
      reachedLeft(props)
    )
      return props.row + 1;
    return props.row;
  };

  const reachedTop = (props) => {
    return props.y === 0 && props.row % 2 !== 0;
  };

  const reachedRight = (props) => {
    return props.x === width - STITCH_SIZE && props.row % 2 !== 0;
  };

  const reachedBottom = (props) => {
    return props.y === height - STITCH_SIZE && props.row % 2 === 0;
  };

  const reachedLeft = (props) => {
    return props.x === 0 && props.row % 2 === 0;
  };

  const isUpRow = (row) => {
    return row % 2 !== 0;
  };

  const isDownRow = (row) => {
    return row % 2 === 0;
  };

  let sections = [];

  $: if (project.url.href) {
    let row = 0,
      x = 0,
      y = 0,
      dayIndex = 0;
    sections = [];
    for (
      let x = width - STITCH_SIZE, y = height - STITCH_SIZE;
      dayIndex < weather.data?.length;
      dayIndex++
    ) {
      let section = [];
      let day = weather.data[dayIndex];
      let target = $settings.selectedTarget;
      let value = day[target][project.units];
      let gaugeId = getTargetParentGaugeId(target);
      let color = getColorInfo(gaugeId, value).hex;
      for (
        let squareIndex = 0;
        squareIndex < $settings.lineLength;
        squareIndex++
      ) {
        y -= STITCH_SIZE;
        section.push({
          x,
          y,
          width: STITCH_SIZE,
          height: STITCH_SIZE,
          color,
          dayIndex,
        });
        y += STITCH_SIZE;
        const props = { x, y, row };
        x = getX(props);
        y = getY(props);
        row = getRow(props);
      }
      sections.push(section);
    }
    sections = sections;
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

    weather.currentIndex = +group.dataset.dayindex;

    showPreviewImageWeatherDetails(targets);
  }}
>
  {#each sections as section}
    <g data-dayindex={section[0].dayIndex}>
      {#each section as { x, y, width, height, color }}
        <rect {x} {y} {width} {height} fill={color} />
      {/each}
    </g>
  {/each}
</svg>

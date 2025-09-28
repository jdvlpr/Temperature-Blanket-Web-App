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
  import { cornerToCornerPreview } from './state.svelte';

  let width = $state(cornerToCornerPreview.width);

  let height = $state(cornerToCornerPreview.height);

  const getX = (props) => {
    if (reachedTop(props)) return props.x - cornerToCornerPreview.STITCH_SIZE;
    if (reachedRight(props)) return props.x;
    if (reachedBottom(props) && reachedLeft(props)) return props.x;
    if (reachedBottom(props))
      return props.x - cornerToCornerPreview.STITCH_SIZE;
    if (reachedLeft(props)) return props.x;

    if (isUpRow(props.row)) return props.x + cornerToCornerPreview.STITCH_SIZE;
    if (isDownRow(props.row))
      return props.x - cornerToCornerPreview.STITCH_SIZE;
  };
  const getY = (props) => {
    if (reachedTop(props)) return props.y;
    if (reachedRight(props)) return props.y - cornerToCornerPreview.STITCH_SIZE;
    if (reachedBottom(props) && reachedLeft(props))
      return props.y - cornerToCornerPreview.STITCH_SIZE;
    if (reachedBottom(props)) return props.y;
    if (reachedLeft(props)) return props.y - cornerToCornerPreview.STITCH_SIZE;

    if (isUpRow(props.row)) return props.y - cornerToCornerPreview.STITCH_SIZE;
    if (isDownRow(props.row))
      return props.y + cornerToCornerPreview.STITCH_SIZE;
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
    return (
      props.x ===
        cornerToCornerPreview.width - cornerToCornerPreview.STITCH_SIZE &&
      props.row % 2 !== 0
    );
  };

  const reachedBottom = (props) => {
    return (
      props.y ===
        cornerToCornerPreview.height - cornerToCornerPreview.STITCH_SIZE &&
      props.row % 2 === 0
    );
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

  runPreview(() => {
    let row = 0,
      x = 0,
      y = 0,
      dayIndex = 0;
    const sections = [];
    for (
      let x = cornerToCornerPreview.width - cornerToCornerPreview.STITCH_SIZE,
        y = cornerToCornerPreview.height - cornerToCornerPreview.STITCH_SIZE;
      dayIndex < weather.data?.length;
      dayIndex++
    ) {
      let section = [];
      let target = cornerToCornerPreview.settings.selectedTarget;
      let value = getWeatherValue({ dayIndex, param: target });

      // Get the color based on the gauge ID and value
      const color = getColorInfo({ param: target, value }).hex;
      for (
        let squareIndex = 0;
        squareIndex < cornerToCornerPreview.settings.lineLength;
        squareIndex++
      ) {
        y -= cornerToCornerPreview.STITCH_SIZE;
        section.push({
          x,
          y,
          width: cornerToCornerPreview.STITCH_SIZE,
          height: cornerToCornerPreview.STITCH_SIZE,
          color,
          dayIndex,
        });
        y += cornerToCornerPreview.STITCH_SIZE;
        const props = { x, y, row };
        x = getX(props);
        y = getY(props);
        row = getRow(props);
      }
      sections.push(section);
    }
    width = cornerToCornerPreview.width;
    height = cornerToCornerPreview.height;
    cornerToCornerPreview.sections = sections;
  });
</script>

{#if !cornerToCornerPreview.sections.length}
  <div class="inline-flex h-[80svh] w-full items-center justify-center">
    <Spinner />
  </div>
{:else}
  <svg
    id="preview-svg-image"
    class="mx-auto max-h-[80svh]"
    aria-hidden="true"
    viewBox="0 0 {width} {height}"
    bind:this={cornerToCornerPreview.svg}
    onclick={(e) => {
      if (e.target.tagName !== 'rect') return;
      const group = e.target.parentElement;
      if (group.tagName !== 'g') return;

      weather.currentIndex = +group.dataset.dayindex;

      showPreviewImageWeatherDetails(cornerToCornerPreview.targets);
    }}
  >
    {#each cornerToCornerPreview.sections as section}
      <g data-dayindex={section[0].dayIndex}>
        {#each section as { x, y, width, height, color }}
          <rect {x} {y} {width} {height} fill={color} />
        {/each}
      </g>
    {/each}
  </svg>
{/if}

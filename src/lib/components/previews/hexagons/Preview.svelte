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
  import { gauges } from '$lib/state/gauges-state.svelte';
  import { project } from '$lib/state/project-state.svelte';
  import { weather } from '$lib/state/weather-state.svelte';
  import { preferences } from '$lib/storage/preferences.svelte';
  import { getColorInfo } from '$lib/utils/color-utils';
  import { showPreviewImageWeatherDetails } from '$lib/utils/preview-utils.svelte';
  import { tick } from 'svelte';
  import { hexagonsPreview } from './state.svelte';

  let width = $state(hexagonsPreview.width);
  let height = $state(hexagonsPreview.height);

  // Adjust constants for proper hexagon tiling
  const HEX_SIZE = hexagonsPreview.STITCH_SIZE;
  // Width of the hex is 2× the size (flat-to-flat)
  const HEX_WIDTH = HEX_SIZE * 2;
  // Height is √3 × size for a regular hexagon
  const HEX_HEIGHT = Math.round(HEX_SIZE * Math.sqrt(3));

  // Precise calculations for perfect hexagon tiling with flat-topped hexagons
  // Horizontal spacing should be exactly the width (no overlap)
  const HEX_HORIZ_SPACING = HEX_WIDTH * 0.75; // This is key - 3/4 width for proper tiling
  // Vertical spacing should account for the pointy parts
  const HEX_VERT_SPACING = HEX_HEIGHT;

  // Add generous padding to ensure hexagons at edges are fully visible
  const PADDING = {
    TOP: Math.round(HEX_HEIGHT * 0.5),
    LEFT: Math.round(HEX_WIDTH * 0.5),
    RIGHT: Math.round(HEX_WIDTH * 0.5),
    BOTTOM: Math.round(HEX_HEIGHT * 0.5),
  };

  // Generate a honeycomb pattern in a corner-to-corner, back-and-forth pattern
  function generateCornerToCornerPositions() {
    // Calculate usable area
    const usableWidth = width - PADDING.LEFT - PADDING.RIGHT;
    const usableHeight = height - PADDING.TOP - PADDING.BOTTOM;

    // Calculate how many hexagons can fit horizontally and vertically
    const cols = Math.max(1, Math.floor(usableWidth / HEX_HORIZ_SPACING));
    const rows = Math.max(
      1,
      Math.floor(usableHeight / (HEX_VERT_SPACING * 0.75)),
    );

    // Calculate all positions in a grid
    const grid = [];
    for (let row = 0; row < rows; row++) {
      grid[row] = [];
      for (let col = 0; col < cols; col++) {
        // Offset every other row horizontally by half the spacing for perfect tiling
        const xOffset = row % 2 === 1 ? HEX_HORIZ_SPACING / 2 : 0;

        // Calculate center position with padding
        const centerX = PADDING.LEFT + col * HEX_HORIZ_SPACING + xOffset;
        // Use exact vertical spacing to prevent overlap
        const centerY = PADDING.TOP + row * (HEX_HEIGHT * 0.75);

        // Convert from center position to top-left of symbol
        const x = centerX - HEX_WIDTH / 2;
        const y = centerY - HEX_HEIGHT / 2;

        // Skip if the hexagon would go beyond the bounds
        if (
          centerX + HEX_WIDTH / 2 > width - PADDING.RIGHT ||
          centerY + HEX_HEIGHT / 2 > height - PADDING.BOTTOM
        ) {
          grid[row][col] = null;
          continue;
        }

        grid[row][col] = {
          x,
          y,
          row,
          col,
        };
      }
    }

    // Create a diagonal traversal pattern
    const positions = [];
    const maxSum = rows + cols - 2; // Maximum row+col sum

    // First corner-to-corner pass (top-left to bottom-right)
    for (let sum = 0; sum <= maxSum; sum++) {
      const diagonalPositions = [];

      // Collect positions on this diagonal
      for (let r = 0; r <= sum; r++) {
        const c = sum - r;
        if (r < rows && c < cols && grid[r][c]) {
          diagonalPositions.push(grid[r][c]);
        }
      }

      // Alternate the direction of each diagonal
      if (sum % 2 === 1) {
        diagonalPositions.reverse();
      }

      positions.push(...diagonalPositions);
    }

    return positions;
  }

  $effect(() => {
    project.url.href;
    if (!weather.data.length || !gauges.allCreated.length) return;

    tick().then(() => {
      const cornerPositions = generateCornerToCornerPositions();
      const sections = [];

      // Use as many positions as we have weather data for
      const dataLength = Math.min(cornerPositions.length, weather.data?.length);

      for (let i = 0; i < dataLength; i++) {
        const pos = cornerPositions[i];
        let hexagon = [];
        let day = weather.data[i];
        let target = hexagonsPreview.settings.primaryTarget;
        let value = day[target][preferences.value.units];

        // Get the color based on the gauge ID and value
        const color = getColorInfo({ param: target, value }).hex;

        hexagon.push({
          x: pos.x,
          y: pos.y,
          width: HEX_WIDTH,
          height: HEX_HEIGHT,
          color,
          dayIndex: i,
        });

        sections.push(hexagon);
      }

      width = hexagonsPreview.width;
      height = hexagonsPreview.height;
      hexagonsPreview.sections = sections;
    });
  });

  // Optional debug function to visualize the grid
  function debugGrid() {
    const positions = generateCornerToCornerPositions();
    console.log(`Generated ${positions.length} hexagon positions`);
    // You could add a visual debug mode by setting a class on the SVG
  }
</script>

{#if !hexagonsPreview.sections.length}
  <div class="inline-flex h-[80svh] w-full items-center justify-center">
    <Spinner />
  </div>
{:else}
  <svg
    id="preview-svg-image"
    class="mx-auto max-h-[80svh]"
    aria-hidden="true"
    preserveAspectRatio="xMidYMid meet"
    viewBox="0 0 {width} {height}"
    bind:this={hexagonsPreview.svg}
    onclick={(e) => {
      if (e.target.tagName !== 'use') return;
      const group = e.target.parentElement;
      if (group.tagName !== 'g') return;

      weather.currentIndex = +group.dataset.dayindex;

      showPreviewImageWeatherDetails(hexagonsPreview.targets);
    }}
  >
    <defs xmlns="http://www.w3.org/2000/svg">
      <symbol id="hex" viewBox="0 0 100 86.6">
        <polygon
          points="50,0 100,25 100,75 50,100 0,75 0,25"
          stroke="currentColor"
          stroke-width="0.5"
          fill="inherit"
        />
      </symbol>
    </defs>
    {#each hexagonsPreview.sections as section}
      <g data-dayindex={section[0].dayIndex}>
        {#each section as { x, y, width, height, color }}
          <use href="#hex" {x} {y} {width} {height} fill={color} />
        {/each}
      </g>
    {/each}
  </svg>
{/if}

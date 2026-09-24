<!-- Copyright (c) 2024 - 2026, Thomas (https://github.com/jdvlpr)

This file is part of Temperature-Blanket-Web-App.

Temperature-Blanket-Web-App is free software: you can redistribute it and/or modify it
under the terms of the GNU General Public License as published by the Free Software Foundation,
either version 3 of the License, or (at your option) any later version.

Temperature-Blanket-Web-App is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY;
without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.
See the GNU General Public License for more details.

You should have received a copy of the GNU General Public License along with Temperature-Blanket-Web-App.
If not, see <https://www.gnu.org/licenses/>. -->
<script lang="ts">
  import Spinner from '$lib/components/Spinner.svelte';
  import { weather } from '$lib/state/weather-state.svelte';
  import type { WeatherParam } from '$lib/types/gauge-types';
  import type { Color } from '$lib/types/yarn-types';
  import { getColorInfo } from '$lib/utils/color-utils';
  import { runPreview } from '$lib/utils/function-utils.svelte';
  import { showPreviewImageWeatherDetails } from '$lib/utils/preview-utils.svelte';
  import { hexagonsPreview, type HexagonsSection } from './state.svelte';

  let width = $state(hexagonsPreview.width);

  let height = $state(hexagonsPreview.height);

  // Returns the color for one round of a day's hexagon
  function getRoundColor(dayIndex: number, targetId: WeatherParam['id']) {
    const { primaryTarget, primaryTargetAsBackup } = hexagonsPreview.settings;
    let param = targetId;
    let value = weather.getWeatherValue({ dayIndex, param });

    // If the secondary target value is 0 or null, use the primary target as a backup
    if (primaryTargetAsBackup && (value === 0 || value === null)) {
      param = primaryTarget;
      value = weather.getWeatherValue({ dayIndex, param });
    }

    return getColorInfo({ param, value }).hex as NonNullable<Color['hex']>;
  }

  runPreview(() => {
    const sections: HexagonsSection[] = [];
    const { roundTargetIds } = hexagonsPreview;
    const additionalIndexes = new Set(
      hexagonsPreview.additionalHexagonsIndexes,
    );
    let dayIndex = 0;

    hexagonsPreview.positions.forEach((position, index) => {
      const isWeatherHexagon =
        !additionalIndexes.has(index) && dayIndex < weather.data.length;
      const colors = roundTargetIds.map((targetId) =>
        isWeatherHexagon
          ? getRoundColor(dayIndex, targetId)
          : hexagonsPreview.settings.additionalHexagonsColor,
      );

      sections.push({ isWeatherHexagon, dayIndex, colors, ...position });

      if (isWeatherHexagon) dayIndex++;
    });

    width = hexagonsPreview.width;
    height = hexagonsPreview.height;
    hexagonsPreview.sections = sections;
  });
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
    viewBox="0 0 {width} {height}"
    bind:this={hexagonsPreview.svg}
    onclick={(e) => {
      if (!(e.target instanceof SVGElement)) return;
      if (e.target.tagName !== 'polygon') return;
      const group = e.target.parentElement;
      if (!group || group.tagName !== 'g') return;

      const dayIndex = group.dataset.dayindex;
      if (group.dataset.isweatherhexagon === 'true' && dayIndex !== undefined) {
        weather.currentIndex = +dayIndex;
        showPreviewImageWeatherDetails(hexagonsPreview.targets);
      }
    }}
  >
    {#each hexagonsPreview.sections as { isWeatherHexagon, dayIndex, colors, x, y }, index (index)}
      <g data-isweatherhexagon={isWeatherHexagon} data-dayindex={dayIndex}>
        {#if hexagonsPreview.settings.joinStitches > 0}
          <!-- The border is a larger hexagon behind the day's hexagon -->
          <polygon
            points={hexagonsPreview.getPoints(
              x,
              y,
              hexagonsPreview.outerRadius,
            )}
            fill={hexagonsPreview.settings.joinColor}
          />
        {/if}
        <!-- Rounds are drawn from the outside in, so each one covers the center of the previous -->
        {#each [...colors].reverse() as color, reversedRound (reversedRound)}
          <polygon
            points={hexagonsPreview.getPoints(
              x,
              y,
              hexagonsPreview.getRoundRadius(colors.length - 1 - reversedRound),
            )}
            fill={color}
          />
        {/each}
      </g>
    {/each}
  </svg>
{/if}

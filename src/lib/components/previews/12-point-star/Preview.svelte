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

<script>
  import Spinner from '$lib/components/Spinner.svelte';
  import { weather } from '$lib/state/weather-state.svelte';
  import { getColorInfo } from '$lib/utils/color-utils';
  import { runPreview } from '$lib/utils/function-utils.svelte';
  import { showPreviewImageWeatherDetails } from '$lib/utils/preview-utils.svelte';
  import { twelvePointStarPreview } from './state.svelte';

  let width = $state(twelvePointStarPreview.width);
  let height = $state(twelvePointStarPreview.height);

  /**
   * Generate SVG polygon points for a star shape at a given radius.
   * The star has NUM_POINTS peaks and NUM_POINTS valleys.
   * @param cx - center x
   * @param cy - center y
   * @param peakR - radius at the peak of each star point
   * @param valleyR - radius at the valley between star points
   * @param numPoints - number of star points (12)
   */
  function getStarPolygonPoints(cx, cy, peakR, valleyR, numPoints = 12) {
    const points = [];
    const totalVertices = numPoints * 2;
    for (let i = 0; i < totalVertices; i++) {
      const angle = (Math.PI / numPoints) * i - Math.PI / 2 + Math.PI / numPoints; // start from top with half-step offset to align peaks with chevron peaks
      const r = i % 2 === 0 ? peakR : valleyR;
      const x = cx + r * Math.cos(angle);
      const y = cy + r * Math.sin(angle);
      points.push(`${x},${y}`);
    }
    return points.join(' ');
  }

  /**
   * Generate SVG polygon points for a single chevron section within a wedge.
   * Each chevron is the band between innerR and outerR for a given month wedge.
   *
   * For month m (0-11), the wedge spans:
   *   leftAngle = m * (2π/12) - π/2
   *   midAngle  = leftAngle + π/12  (peak of star point)
   *   rightAngle = leftAngle + 2π/12
   *
   * The chevron polygon has 6 vertices:
   *   inner-left (valley), inner-mid (peak), inner-right (valley),
   *   outer-right (valley), outer-mid (peak), outer-left (valley)
   */
  function getChevronPoints(
    cx,
    cy,
    monthIndex,
    innerPeakR,
    innerValleyR,
    outerPeakR,
    outerValleyR,
  ) {
    const wedgeAngle = (2 * Math.PI) / 12;
    const leftAngle = monthIndex * wedgeAngle - Math.PI / 2;
    const midAngle = leftAngle + wedgeAngle / 2;
    const rightAngle = leftAngle + wedgeAngle;

    // 6 vertices forming the chevron band
    const p1x = cx + innerValleyR * Math.cos(leftAngle);
    const p1y = cy + innerValleyR * Math.sin(leftAngle);

    const p2x = cx + innerPeakR * Math.cos(midAngle);
    const p2y = cy + innerPeakR * Math.sin(midAngle);

    const p3x = cx + innerValleyR * Math.cos(rightAngle);
    const p3y = cy + innerValleyR * Math.sin(rightAngle);

    const p4x = cx + outerValleyR * Math.cos(rightAngle);
    const p4y = cy + outerValleyR * Math.sin(rightAngle);

    const p5x = cx + outerPeakR * Math.cos(midAngle);
    const p5y = cy + outerPeakR * Math.sin(midAngle);

    const p6x = cx + outerValleyR * Math.cos(leftAngle);
    const p6y = cy + outerValleyR * Math.sin(leftAngle);

    return `${p1x},${p1y} ${p2x},${p2y} ${p3x},${p3y} ${p4x},${p4y} ${p5x},${p5y} ${p6x},${p6y}`;
  }

  runPreview(() => {
    const sections = [];
    const cx = twelvePointStarPreview.width / 2;
    const cy = twelvePointStarPreview.height / 2;
    const maxDays = twelvePointStarPreview.maxDaysInMonth;

    for (let monthIndex = 0; monthIndex < 12; monthIndex++) {
      const monthDays = twelvePointStarPreview.weatherByMonth[monthIndex];
      const actualDayCount = monthDays.length;

      for (let row = 0; row < maxDays; row++) {
        const innerPeakR =
          twelvePointStarPreview.centerPeakR +
          row * twelvePointStarPreview.peakStep;
        const innerValleyR =
          twelvePointStarPreview.centerValleyR +
          row * twelvePointStarPreview.valleyStep;
        const outerPeakR =
          twelvePointStarPreview.centerPeakR +
          (row + 1) * twelvePointStarPreview.peakStep;
        const outerValleyR =
          twelvePointStarPreview.centerValleyR +
          (row + 1) * twelvePointStarPreview.valleyStep;

        const points = getChevronPoints(
          cx,
          cy,
          monthIndex,
          innerPeakR,
          innerValleyR,
          outerPeakR,
          outerValleyR,
        );

        let color;
        let isWeather = false;
        let dayIndex = 0;

        if (row < actualDayCount) {
          // This row has weather data
          dayIndex = monthDays[row].dayIndex;
          const value = weather.getWeatherValue({
            dayIndex,
            param: twelvePointStarPreview.settings.selectedTarget,
          });
          color = getColorInfo({
            param: twelvePointStarPreview.settings.selectedTarget,
            value,
          }).hex;
          isWeather = true;
        } else {
          // Padding row for short months
          color = twelvePointStarPreview.settings.additionalRoundsColor;
          isWeather = false;
          dayIndex = -1;
        }

        sections.push({
          points,
          color,
          isWeather,
          dayIndex,
        });
      }
    }

    width = twelvePointStarPreview.width;
    height = twelvePointStarPreview.height;
    twelvePointStarPreview.sections = sections;
  });
</script>

{#if !twelvePointStarPreview.sections.length}
  <div class="inline-flex h-[80svh] w-full items-center justify-center">
    <Spinner />
  </div>
{:else}
  <svg
    id="preview-svg-image"
    class="mx-auto max-h-[80svh]"
    aria-hidden="true"
    viewBox="0 0 {width} {height}"
    bind:this={twelvePointStarPreview.svg}
    onclick={(e) => {
      if (e.target.tagName !== 'polygon') return;
      if (e.target.dataset.isweather !== 'true') return;
      weather.currentIndex = +e.target.dataset.dayindex;
      showPreviewImageWeatherDetails(twelvePointStarPreview.targets);
    }}
  >
    <!-- Optional outer border (rendered first/underneath) -->
    {#if twelvePointStarPreview.settings.showBorder}
      <polygon
        points={getStarPolygonPoints(
          width / 2,
          height / 2,
          twelvePointStarPreview.outerPeakR,
          twelvePointStarPreview.outerValleyR,
        )}
        fill="none"
        stroke={twelvePointStarPreview.settings.borderColor}
        stroke-width={twelvePointStarPreview.settings.borderThickness * twelvePointStarPreview.STITCH_SIZE * 2}
      />
    {/if}

    <!-- Center star shape -->
    <polygon
      points={getStarPolygonPoints(
        width / 2,
        height / 2,
        twelvePointStarPreview.centerPeakR,
        twelvePointStarPreview.centerValleyR,
      )}
      fill={twelvePointStarPreview.settings.additionalRoundsColor}
      stroke={twelvePointStarPreview.settings.additionalRoundsColor}
      stroke-width="1"
    />

    <!-- Day chevron sections -->
    {#each twelvePointStarPreview.sections as { points, color, isWeather, dayIndex }}
      <polygon
        {points}
        fill={color}
        stroke={color}
        stroke-width="0.5"
        data-isweather={isWeather}
        data-dayindex={dayIndex}
      />
    {/each}
  </svg>
{/if}

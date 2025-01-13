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

<script lang="ts">
  import {
    activeWeatherElementIndex,
    gaugesState,
    projectStatus,
    units,
    weather,
  } from '$lib/state';
  import {
    getColorInfo,
    getTargetParentGaugeId,
    showPreviewImageWeatherDetails,
    sum,
  } from '$lib/utils';
  import { displayNumber } from '$lib/utils/number-utils';
  import { details, settings } from './RowsSettings.svelte';
  import { previews } from './previews';

  let svg: SVGSVGElement;

  const previewIndex = previews.findIndex((n) => n.id === 'rows');
  $: previews[previewIndex].width = width;
  $: previews[previewIndex].height = height;
  $: previews[previewIndex].svg = svg;

  const STITCH_SIZE = 10;
  $: width = $settings.stitchesPerRow * STITCH_SIZE;
  $: height = rows * STITCH_SIZE * $settings.selectedTargets.length;
  $: totalStitches = getTotalStitches(
    $settings.lengthTarget,
    $settings.stitchesPerRow,
    $settings.stitchesPerDay,
    $settings.rowsBetweenMonths,
  );

  function getTotalStitches(target, perRow, perDay) {
    if (target === 'none') return perRow * weather.data?.length;
    if (target === 'custom') return perDay * weather.data?.length;
    return sum(target);
  }

  $: rows = Math.ceil(totalStitches / $settings.stitchesPerRow);
  $: countOfAdditionalStitches = displayNumber(
    rows * $settings.stitchesPerRow - totalStitches,
    6,
  );

  $: targets = gaugesState.gauges
    .flatMap((n) => n.targets)
    .filter((n) => $settings.selectedTargets.includes(n.id));

  $: $details = {
    rows: rows * $settings.selectedTargets.length,
    countOfAdditionalStitches,
  };

  function getSectionStitchesCount(dayIndex: number) {
    if ($settings.lengthTarget === 'none') return $settings.stitchesPerRow;
    if ($settings.lengthTarget === 'custom') return $settings.stitchesPerDay;
    let value = Math.abs(
      weather.data[dayIndex][$settings.lengthTarget][units.value],
    );
    if (isNaN(value)) value = $settings.stitchesPerDay;
    if (value === 0) value = 1;
    return value;
  }

  let sections = [];

  /**
   * Calculates and generates sections for the RowsPreview component based on the provided data and settings.
   * @param {number} STITCH_SIZE - The size of each stitch.
   * @param {string} additionalStitchesColor - The color for additional stitches section.
   * @param {number} countOfAdditionalStitches - The count of additional stitches needed.
   * @param {Array} activeParams - The selected target parameters.
   * @param {number} width - The width of the preview.
   * @param {Array} weather - The weather data.
   * @param {Array} $settings - The settings data.
   */
  $: if (projectStatus.state.liveURL) {
    // Setup constants
    const stitchSize = STITCH_SIZE; // Size of each stitch
    const additionalStitchesColor = $settings.extrasColor; // Color for additional stitches section
    const additionalLengthNeeded = countOfAdditionalStitches; // Count of additional stitches needed
    const activeParams = $settings.selectedTargets; // Selected target parameters
    const totalSections =
      countOfAdditionalStitches > 0
        ? weather.data?.length + 1
        : weather.data?.length; // Total number of sections
    let columnIndex = 0; // Current column index
    let stitchYRow = 0; // Current row position
    let isWeatherSection: boolean; // Flag indicating if it's a weather section
    let lineWidth: number; // Width of the current line
    let remainderLineCount: number; // Count of remaining stitches in the line
    const daysCount = weather.data?.length; // Total number of days in the weather data
    sections = []; // Array to store the generated sections

    // Loop through each section
    for (
      let sectionIndex = 0, dayIndex = 0;
      sectionIndex < totalSections;
      sectionIndex++, dayIndex++
    ) {
      let section = []; // Array to store stitches in the section
      let sectionStitchesCount: number; // Count of stitches in the section

      // Check if the current section index is greater than or equal to the total number of days
      if (sectionIndex >= daysCount) {
        // If so, it means we are in the additional stitches section
        isWeatherSection = false;
        // Set the section stitches count to the number of additional stitches needed
        sectionStitchesCount = additionalLengthNeeded;
      } else {
        // Otherwise, we are in the weather section
        isWeatherSection = true;
        // Get the section stitches count based on the day index using the getSectionStitchesCount function
        sectionStitchesCount = getSectionStitchesCount(dayIndex);
      }

      // Loop through each stitch in the section
      for (
        let sectionStitchIndex = 0;
        sectionStitchIndex < sectionStitchesCount;

      ) {
        if (remainderLineCount > 0) {
          // If there are remaining stitches from the previous line, reset the stitch index and adjust the stitch count
          sectionStitchIndex = 0;
          sectionStitchesCount = remainderLineCount;
        }

        if (columnIndex === width / STITCH_SIZE) {
          // If the current column index reaches the width limit, reset the column index and move to the next row
          columnIndex = 0;
          stitchYRow += stitchSize * activeParams.length;
        }

        if (sectionStitchesCount <= width / STITCH_SIZE - columnIndex) {
          // If the remaining stitches fit within the current row, set the line width and reset the remainder count
          lineWidth = sectionStitchesCount;
          remainderLineCount = 0;
        } else {
          // If the remaining stitches exceed the current row, set the line width to the remaining space and update the remainder count
          lineWidth = width / STITCH_SIZE - columnIndex;
          remainderLineCount = sectionStitchesCount - lineWidth;
        }

        // Loop through each target parameter
        for (
          let paramIndex = 0, y2 = stitchYRow, x = columnIndex * STITCH_SIZE;
          paramIndex < activeParams.length;
          paramIndex++, y2 += stitchSize
        ) {
          let color: string;

          if (isWeatherSection) {
            // If it's a weather section, determine the color based on the weather value and gauge ID
            let param = activeParams[paramIndex];
            let value = weather.data[dayIndex][param][units.value];
            let gaugeId = getTargetParentGaugeId(param);
            color = getColorInfo(gaugeId, value).hex;
          } else {
            // If it's an additional stitches section, use the specified color
            color = additionalStitchesColor;
          }

          // Push the stitch object to the section array
          section.push({
            width: lineWidth * stitchSize,
            height: stitchSize,
            color,
            x,
            y: y2,
            isWeatherSection,
            dayIndex,
          });
        }

        columnIndex += lineWidth;
        sectionStitchIndex += lineWidth;

        // Push the section to the sections array
        sections.push(section);
      }
    }

    sections = sections; // Update the sections variable
  }
</script>

<svg
  id="preview-svg-image"
  class="max-h-[80svh] mx-auto"
  aria-hidden="true"
  viewBox="0 0 {width} {height}"
  bind:this={svg}
  on:click={async (e) => {
    if (e.target.tagName !== 'rect') return;
    const group = e.target.parentElement;
    if (group.tagName !== 'g') return;

    if (group.dataset.isweathersection === 'true') {
      $activeWeatherElementIndex = +group.dataset.dayindex;
      showPreviewImageWeatherDetails(targets);
    }
  }}
>
  {#each sections as section}
    {@const isWeather = section[0].isWeatherSection}
    <g data-isweathersection={isWeather} data-dayindex={section[0].dayIndex}>
      {#each section as { width, height, color, x, y }}
        <rect {width} {height} fill={color} {x} {y} />
      {/each}
    </g>
  {/each}
</svg>

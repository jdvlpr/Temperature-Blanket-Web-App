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
  import { rowsPreview } from '$lib/components/previews/rows/state.svelte';
  import Spinner from '$lib/components/Spinner.svelte';
  import { gauges, localState, project, weather } from '$lib/state';
  import { getColorInfo, showPreviewImageWeatherDetails } from '$lib/utils';

  let width = $state(rowsPreview.width);

  let height = $state(rowsPreview.height);

  function getSectionStitchesCount(dayIndex: number) {
    if (rowsPreview.settings.lengthTarget === 'none')
      return rowsPreview.settings.stitchesPerRow;
    if (rowsPreview.settings.lengthTarget === 'custom')
      return rowsPreview.settings.stitchesPerDay;
    let value = Math.abs(
      weather.data[dayIndex][rowsPreview.settings.lengthTarget][project.units],
    );
    if (isNaN(value)) value = rowsPreview.settings.stitchesPerDay;
    if (value === 0) value = 1;
    return value;
  }

  let debounceTimer;
  const debounce = (callback, time) => {
    window.clearTimeout(debounceTimer);
    debounceTimer = window.setTimeout(callback, time);
  };

  $effect(() => {
    project.url.href;
    if (!weather.data.length || !gauges.allCreated.length) return;
    debounce(() => {
      // Setup constants
      let columnIndex = 0; // Current column index
      let stitchYRow = 0; // Current row position
      let isWeatherSection: boolean; // Flag indicating if it's a weather section
      let lineWidth: number; // Width of the current line
      let remainderLineCount: number; // Count of remaining stitches in the line
      // Loop through each section
      const sections = [];

      for (
        let sectionIndex = 0, dayIndex = 0;
        sectionIndex < rowsPreview.totalSections;
        sectionIndex++, dayIndex++
      ) {
        let section = []; // Array to store stitches in the section
        let sectionStitchesCount: number; // Count of stitches in the section

        // Check if the current section index is greater than or equal to the total number of days
        if (sectionIndex >= weather.data.length) {
          // If so, it means we are in the additional stitches section
          isWeatherSection = false;
          // Set the section stitches count to the number of additional stitches needed
          sectionStitchesCount = rowsPreview.countOfAdditionalStitches;
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

          if (columnIndex === rowsPreview.width / rowsPreview.stitchSize) {
            // If the current column index reaches the width limit, reset the column index and move to the next row
            columnIndex = 0;
            stitchYRow +=
              rowsPreview.stitchSize *
              rowsPreview.settings.selectedTargets.length;
          }

          if (
            sectionStitchesCount <=
            rowsPreview.width / rowsPreview.stitchSize - columnIndex
          ) {
            // If the remaining stitches fit within the current row, set the line width and reset the remainder count
            lineWidth = sectionStitchesCount;
            remainderLineCount = 0;
          } else {
            // If the remaining stitches exceed the current row, set the line width to the remaining space and update the remainder count
            lineWidth =
              rowsPreview.width / rowsPreview.stitchSize - columnIndex;
            remainderLineCount = sectionStitchesCount - lineWidth;
          }

          // Loop through each target parameter
          for (
            let paramIndex = 0,
              y2 = stitchYRow,
              x = columnIndex * rowsPreview.stitchSize;
            paramIndex < rowsPreview.settings.selectedTargets.length;
            paramIndex++, y2 += rowsPreview.stitchSize
          ) {
            let color: string;

            if (isWeatherSection) {
              // If it's a weather section, determine the color based on the weather value and gauge ID
              let param = rowsPreview.settings.selectedTargets[paramIndex];
              let value = weather.data[dayIndex][param][localState.value.units];

              // Get the color based on the gauge ID and value
              color = getColorInfo({ param, value }).hex;
            } else {
              // If it's an additional stitches section, use the specified color
              color = rowsPreview.settings.extrasColor;
            }

            // Push the stitch object to the section array
            section.push({
              width: lineWidth * rowsPreview.stitchSize,
              height: rowsPreview.stitchSize,
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
        width = rowsPreview.width;
        height = rowsPreview.height;
        rowsPreview.sections = sections;
      }
    }, 10);
  });
</script>

{#if !rowsPreview.sections.length}
  <div class="inline-flex h-[80svh] w-full items-center justify-center">
    <Spinner />
  </div>
{:else}
  <svg
    id="preview-svg-image"
    class="mx-auto max-h-[80svh]"
    aria-hidden="true"
    viewBox="0 0 {width} {height}"
    bind:this={rowsPreview.svg}
    onclick={async (e) => {
      if (e.target.tagName !== 'rect') return;
      const group = e.target.parentElement;
      if (group.tagName !== 'g') return;

      if (group.dataset.isweathersection === 'true') {
        weather.currentIndex = +group.dataset.dayindex;
        showPreviewImageWeatherDetails(rowsPreview.targets);
      }
    }}
  >
    {#each rowsPreview.sections as section}
      {@const isWeather = section[0].isWeatherSection}
      <g data-isweathersection={isWeather} data-dayindex={section[0].dayIndex}>
        {#each section as { width, height, color, x, y }}
          <rect {width} {height} fill={color} {x} {y} />
        {/each}
      </g>
    {/each}
  </svg>
{/if}

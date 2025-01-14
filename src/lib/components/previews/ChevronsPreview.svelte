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
  import { gauges, projectStatus, units, weather } from '$lib/state';
  import {
    getColorInfo,
    getTargetParentGaugeId,
    showPreviewImageWeatherDetails,
  } from '$lib/utils';
  import { details, settings } from './ChevronsSettings.svelte';
  import { previewsData } from './previews.svelte';

  let svg;
  const previewIndex = previewsData.findIndex((n) => n.id === 'chev');
  $: previewsData[previewIndex].width = width;
  $: previewsData[previewIndex].height = height;
  $: previewsData[previewIndex].svg = svg;

  const ROW_HEIGHT = 5;
  $: width = $settings.chevronsPerRow * chevronSideLength;
  $: height =
    ROW_HEIGHT * weather.data?.length +
    ROW_HEIGHT * $settings.selectedTargets.length +
    $settings.chevronSideLength;
  $: chevronHeight = chevronSideLength / 2;
  $: chevronSideLength = $settings.chevronSideLength * Math.sqrt(2);

  $: targets = gauges.allCreated
    .map((n) => n.targets)
    .flat()
    .filter((n) => $settings.selectedTargets.includes(n.id));

  $: $details = {
    rows: weather.data?.length * $settings.selectedTargets.length,
  };

  let sections = [];

  $: if (projectStatus.state.liveURL) {
    let total = weather.data?.length;
    sections = [];
    for (let dayIndex = 0, line = ROW_HEIGHT; dayIndex < total; dayIndex++) {
      let section = [];
      for (
        let paramIndex = 0;
        paramIndex < $settings.selectedTargets.length;
        paramIndex++, line += ROW_HEIGHT / $settings.selectedTargets.length
      ) {
        let points = '';
        for (
          let i2 = 0, x = 0;
          i2 < width / chevronSideLength;
          i2++, x += chevronSideLength
        ) {
          points += `${x},${line} ${x + chevronHeight},${line + chevronHeight} ${
            x + chevronSideLength
          },${line} `;
        }
        const target = $settings.selectedTargets[paramIndex];
        let value = weather.data[dayIndex][target][units.value];
        let gaugeId = getTargetParentGaugeId(target);
        let color = getColorInfo(gaugeId, value).hex;
        section.push({ color, p: points, dayIndex });
        // elPolyline.setAttributeNS(null, "points", points);
        // elPolyline.setAttributeNS(null, "stroke", color);
        // elPolyline.setAttributeNS(null, "stroke-width", this._CHEV_ROW_HEIGHT / this.activeParams.length);
        // elPolyline.setAttributeNS(null, "fill", "none");
        // daySection.appendChild(elPolyline);
      }
      // daySection.classList = "pattern-group";
      // daySection.dataset.index = dayIndex;
      // daySection.dataset.total = total;
      // daySection.dataset.dayIndex = dayIndex;
      // svg.appendChild(daySection);
      // daySection = null;
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
    if (e.target.tagName !== 'polyline') return;
    const group = e.target.parentElement;
    if (group.tagName !== 'g') return;

    weather.currentIndex = +group.dataset.dayindex;

    showPreviewImageWeatherDetails(targets);
  }}
>
  {#each sections as section}
    <g data-dayindex={section[0].dayIndex}>
      {#each section as { color, p }}
        <polyline
          points={p}
          fill="none"
          stroke={color}
          stroke-width={ROW_HEIGHT / $settings.selectedTargets.length}
        />
      {/each}
    </g>
  {/each}
</svg>

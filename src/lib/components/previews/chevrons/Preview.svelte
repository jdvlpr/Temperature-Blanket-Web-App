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
  import { chevronsPreview } from './state.svelte';

  let width = $state(chevronsPreview.width);

  let height = $state(chevronsPreview.height);

  let sections = [];

  let debounceTimer;
  const debounce = (callback, time) => {
    window.clearTimeout(debounceTimer);
    debounceTimer = window.setTimeout(callback, time);
  };

  $effect(() => {
    project.url.href;
    // chevronsPreview.settings.chevronSideLength;
    // chevronsPreview.settings.chevronsPerRow;
    if (!weather.data.length || !gauges.allCreated.length) return;
    debounce(() => {
      let total = weather.data?.length;
      sections = [];
      for (
        let dayIndex = 0, line = chevronsPreview.ROW_HEIGHT;
        dayIndex < total;
        dayIndex++
      ) {
        let section = [];
        for (
          let paramIndex = 0;
          paramIndex < chevronsPreview.settings.selectedTargets.length;
          paramIndex++,
            line +=
              chevronsPreview.ROW_HEIGHT /
              chevronsPreview.settings.selectedTargets.length
        ) {
          let points = '';
          for (
            let i2 = 0, x = 0;
            i2 < chevronsPreview.width / chevronsPreview.chevronSideLength;
            i2++, x += chevronsPreview.chevronSideLength
          ) {
            points += `${x},${line} ${x + chevronsPreview.chevronHeight},${line + chevronsPreview.chevronHeight} ${
              x + chevronsPreview.chevronSideLength
            },${line} `;
          }
          const target = chevronsPreview.settings.selectedTargets[paramIndex];
          let value = weather.data[dayIndex][target][project.units];
          let gaugeId = getTargetParentGaugeId(target);
          let color = getColorInfo(gaugeId, value).hex;
          section.push({ color, p: points, dayIndex });
          // elPolyline.setAttributeNS(null, "points", points);
          // elPolyline.setAttributeNS(null, "stroke", color);
          // elPolyline.setAttributeNS(null, "stroke-width", this._CHEV_chevronsPreview.ROW_HEIGHT / this.activeParams.length);
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
      width = chevronsPreview.width;
      height = chevronsPreview.height;
      chevronsPreview.sections = sections;
    }, 10);
  });
</script>

<svg
  id="preview-svg-image"
  class="max-h-[80svh] mx-auto"
  aria-hidden="true"
  viewBox="0 0 {width} {height}"
  bind:this={chevronsPreview.svg}
  onclick={(e) => {
    if (e.target.tagName !== 'polyline') return;
    const group = e.target.parentElement;
    if (group.tagName !== 'g') return;

    weather.currentIndex = +group.dataset.dayindex;

    showPreviewImageWeatherDetails(chevronsPreview.targets);
  }}
>
  {#each chevronsPreview.sections as section}
    <g data-dayindex={section[0].dayIndex}>
      {#each section as { color, p }}
        <polyline
          points={p}
          fill="none"
          stroke={color}
          stroke-width={chevronsPreview.ROW_HEIGHT /
            chevronsPreview.settings.selectedTargets.length}
        />
      {/each}
    </g>
  {/each}
</svg>

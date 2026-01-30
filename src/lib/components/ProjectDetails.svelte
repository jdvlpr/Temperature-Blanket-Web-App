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
  import ColorPalette from '$lib/components/ColorPalette.svelte';
  import { MAXIMUM_YARN_DETAILS_DESCRIPTIONS } from '$lib/constants';
  import { getColorsFromInput, pluralize } from '$lib/utils';
  import { Trash2Icon } from '@lucide/svelte';

  /**
   * @typedef {Object} Props
   * @property {any} project
   * @property {boolean} [canRemove]
   * @property {() => void} [onclick]
   */

  /** @type {Props} */
  let { project, canRemove = true, onclick } = $props();

  const href = $derived(project.href);
  const title = $derived(project.title);
  const date = $derived(project.date);
  const isCustomWeatherData = $derived(project.isCustomWeatherData);

  let colors = $derived(getColorsFromInput({ string: href }));

  function getProjectDescription({ colors, date }) {
    let schemeName =
      "<p class='flex flex-wrap justify-start items-center gap-x-4'>";
    schemeName += `<span class="inline-flex items-center justify-center gap-1"> Saved ${date}</span>`;
    if (isCustomWeatherData)
      schemeName += `<span class="">Custom Weather Data</span>`;
    schemeName += `<span class="">${colors.length} ${pluralize('color', colors.length)}</span>`;

    let yarnDetails = colors
      .filter((color) => color?.brandId && color?.yarnId)
      .map((color) => {
        return color.brandName + ' - ' + color.yarnName;
      });
    if (yarnDetails.length) {
      yarnDetails = [...new Set([...yarnDetails])];
      let hasMore = false;
      if (yarnDetails.length > MAXIMUM_YARN_DETAILS_DESCRIPTIONS) {
        yarnDetails.length = MAXIMUM_YARN_DETAILS_DESCRIPTIONS;
        hasMore = true;
      }
      yarnDetails.forEach((yarnDetail) => {
        schemeName += `<span class="">${yarnDetail}</span>`;
      });

      if (hasMore) schemeName += `<span>...</span>`;
    }

    schemeName += '</p>';
    return schemeName;
  }
</script>

<div
  class="bg-surface-100 dark:bg-surface-900 rounded-container flex w-full items-center justify-start gap-2 p-4"
>
  <div class="flex w-full flex-col">
    <a
      {href}
      target="_blank"
      rel="noopener noreferrer"
      class="line-clamp-4 underline">{title}</a
    >
    <ColorPalette
      {colors}
      height="24px"
      schemeName={getProjectDescription({ colors, date })}
    />
  </div>
  {#if canRemove}
    <button class="btn-icon hover:preset-tonal-surface" {onclick}>
      <Trash2Icon />
    </button>
  {/if}
</div>

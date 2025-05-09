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
  import Tooltip from '$lib/components/Tooltip.svelte';
  import { getTextColor } from '$lib/utils';
  import { fade } from 'svelte/transition';

  /**
   * @typedef {Object} Props
   * @property {any} colors
   * @property {string} [schemeName]
   * @property {string} [height]
   */

  /** @type {Props} */
  let { colors, schemeName = 'Palette Preview', height = '70px' } = $props();

  $effect(() => {
    if (schemeName === 'Custom') schemeName = 'Color Palette';
  });
</script>

<div class="flex w-full flex-col gap-y-1 text-left">
  <div
    class="rounded-container flex w-full overflow-hidden"
    style="height:{height}"
    in:fade
  >
    {#if colors}
      {#each colors as { hex, brandName, yarnName, name }}
        {#key hex}
          <!-- <div class="flex-1" style="background:{hex}" in:fade /> -->
          <Tooltip
            tooltipStyle="background:{hex};"
            tooltipClass=""
            tooltipBg=""
            fullWidth={true}
            classNames="w-full h-full"
            minWidth="260px"
          >
            <div
              class="flex h-full flex-auto items-center justify-center"
              style="background:{hex}"
              title={brandName && yarnName && name
                ? `${brandName} - ${yarnName}: ${name}`
                : hex}
            ></div>
            {#snippet tooltip()}
              <div style="background:{hex}" class="rounded-container p-2">
                <div
                  class="flex flex-col items-center justify-center text-center text-wrap"
                  style="color:{getTextColor(hex)}"
                >
                  {#if brandName && yarnName && name}
                    <p class="text-xs">
                      {brandName}
                      -
                      {yarnName}
                    </p>
                    <p class="text-lg leading-tight">
                      {name}
                    </p>
                  {:else}
                    <p class="text-lg">
                      {hex}
                    </p>
                  {/if}
                </div>
              </div>
            {/snippet}
          </Tooltip>
        {/key}
      {/each}
    {/if}
  </div>
  <p class="line-clamp-2 text-xs">{@html schemeName}</p>
</div>

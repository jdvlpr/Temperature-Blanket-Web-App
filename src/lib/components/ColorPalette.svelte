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

  export let colors;
  export let schemeName = 'Palette Preview';
  export let height = '70px';

  $: if (schemeName === 'Custom') schemeName = 'Color Palette';
</script>

<div class="flex flex-col text-left gap-y-1 w-full">
  <div
    class="w-full flex rounded-container-token overflow-hidden"
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
            class="w-full h-full"
            minWidth="260px"
          >
            <div
              class="flex-auto flex justify-center items-center h-full"
              style="background:{hex}"
              title={brandName && yarnName && name
                ? `${brandName} - ${yarnName}: ${name}`
                : hex}
            ></div>
            <div
              slot="tooltip"
              style="background:{hex}"
              class="p-2 rounded-container-token"
            >
              <div
                class="flex flex-col justify-center items-center text-wrap text-center"
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
          </Tooltip>
        {/key}
      {/each}
    {/if}
  </div>
  <p class="text-xs line-clamp-2">{@html schemeName}</p>
</div>

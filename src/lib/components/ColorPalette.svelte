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
  import { PopoverInstance } from '$lib/state';
  import { getTextColor } from '$lib/utils';
  import { fade, scale, slide } from 'svelte/transition';

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
        {@const popover = new PopoverInstance({
          interaction: 'hover',
          placement: 'top',
        })}
        {#key hex}
          <button
            {...popover.reference()}
            class="flex h-full w-full max-w-[90vw] cursor-pointer flex-wrap items-center justify-center"
            style="background:{hex}"
            title={brandName && yarnName && name
              ? `${brandName} - ${yarnName}: ${name}`
              : hex}
            aria-label={brandName && yarnName && name
              ? `${brandName} - ${yarnName}: ${name}`
              : hex}
            aria-haspopup="dialog"
            aria-expanded={popover.isOpen()}
          ></button>
          {#if popover.isOpen()}
            <div
              role="dialog"
              aria-label="Color details"
              style="background:{hex}"
              class="rounded-container z-10 min-w-[260px] p-4"
              {...popover.floating()}
              in:scale={{ duration: 150, delay: 150 }}
              data-floating
              tabindex="-1"
            >
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
              <div style="background:{hex}" {...popover.arrow()}></div>
            </div>
          {/if}
        {/key}
      {/each}
    {/if}
  </div>
  <p class="line-clamp-2 text-xs">{@html schemeName}</p>
</div>

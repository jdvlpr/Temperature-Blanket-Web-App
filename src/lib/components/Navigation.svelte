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
  import { pageSections, weather } from '$lib/state';
  import { goToProjectSection } from '$lib/utils';
</script>

<div
  class="sticky bottom-0 flex justify-center z-10 gap-2 w-full bg-surface-50 dark:bg-surface-950 backdrop-blur-md lg:rounded-t-container overflow-hidden"
>
  <div class="flex justify-around w-full">
    {#each pageSections.items as { title, icon, index, active, pinned, tooltipText }}
      {#if index !== 0}
        <button
          title={tooltipText}
          disabled={!weather.data.length && index !== 1}
          onclick={() => goToProjectSection(index)}
          data-pinned={pinned}
          data-active={active}
          data-no-weather={!weather.data}
          class={[
            `flex flex-col justify-center items-center disabled:opacity-30 p-2 pb-4 md:pb-2 w-full 
                                data-[active=false]:data-[no-weather=true]:opacity-50 
                                dark:data-[pinned=false]:data-[active=true]:data-[no-weather=false]:bg-primary-900
                                dark:data-[pinned=false]:data-[active=true]:data-[no-weather=false]:text-surface-50!
                                data-[pinned=false]:data-[active=true]:data-[no-weather=false]:bg-primary-300
                                data-[pinned=false]:data-[active=true]:data-[no-weather=false]:!text-surface-900
                                hover:data-[no-weather=false]:data-[active=false]:bg-primary-hover-token`,
            !weather.data && 'bg-none backdrop-blur-none',
          ]}
        >
          <span>
            {@html icon}
          </span><span class="text-xs flex gap-1 items-center">{title} </span>
        </button>
      {/if}
    {/each}
  </div>
</div>

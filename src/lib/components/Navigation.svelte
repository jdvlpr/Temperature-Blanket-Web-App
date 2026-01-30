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
  import { APP_NAVIGATION_SIDEBAR_WIDTH } from '$lib/constants';
  import { pageSections, showNavigationSideBar, weather } from '$lib/state';
  import { goToProjectSection } from '$lib/utils';
</script>

<div
  class={[
    'bg-surface-50 dark:bg-surface-950 lg:rounded-t-container fixed bottom-0 z-10 flex h-16 w-full justify-center gap-2 overflow-hidden backdrop-blur-md transition-all',
    showNavigationSideBar.value
      ? `lg:left-[284px] lg:max-w-[calc(min(100vw,var(--breakpoint-xl))-302px)] xl:left-[calc(50%-(var(--breakpoint-xl)/2)+278px)] xl:max-w-[calc(min(100vw,var(--breakpoint-xl))-278px)]`
      : 'lg:left-[78px] lg:max-w-[calc(min(100vw,var(--breakpoint-xl))-96px)] xl:left-[calc(50%-(var(--breakpoint-xl)/2)+78px)]',
  ]}
  id="bottom-section-nav"
>
  <div class="flex w-full justify-around">
    {#each pageSections.items as { title, icon, index, active, tooltipText }}
      {#if index !== 0}
        <button
          title={tooltipText}
          disabled={!weather.data.length && index !== 1}
          onclick={() => goToProjectSection(index)}
          data-active={active}
          data-no-weather={!weather.data}
          class={[
            `dark:data-[active=true]:data-[no-weather=false]:bg-primary-900 dark:data-[active=true]:data-[no-weather=false]:text-surface-50! data-[active=true]:data-[no-weather=false]:bg-primary-300 data-[active=true]:data-[no-weather=false]:text-surface-900! hover:data-[no-weather=false]:data-[active=false]:preset-tonal-primary flex w-full flex-col items-center justify-center 
                                p-2 
                                pb-4
                                disabled:opacity-30
                                data-[active=false]:data-[no-weather=true]:opacity-50
                                md:pb-2`,
            !weather.data && 'bg-none backdrop-blur-none',
          ]}
        >
          <span>
            {@html icon}
          </span><span class="flex items-center gap-1 text-xs">{title} </span>
        </button>
      {/if}
    {/each}
  </div>
</div>

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
  import { pageSections, showNavigationSideBar, weather } from '$lib/state';
  import { goToProjectSection } from '$lib/utils';
  import { onMount } from 'svelte';

  let indicator = $state({ left: 0, width: 0 });
  let activeIndex = $derived(
    pageSections.items.find((section) => section.active === true)?.index || 1,
  );
  // 3. Element References
  let containerFn = $state();
  let buttonRefs = $state([]);

  // 4. Logic to calculate position
  function updateIndicator() {
    // Find the active button element based on ID
    const index = activeIndex;
    const activeBtn = buttonRefs[index];

    if (activeBtn && containerFn) {
      // Calculate relative position inside the container
      const btnRect = activeBtn.getBoundingClientRect();
      const containerRect = containerFn.getBoundingClientRect();

      indicator = {
        left: btnRect.left - containerRect.left,
        width: btnRect.width,
      };
    }
  }

  // 5. Reactive Effect: Re-run when activeId changes
  $effect(() => {
    // Just referencing activeId makes this effect run when it changes
    activeIndex;
    updateIndicator();
  });

  // 6. Handle Window Resizing
  onMount(() => {
    // Initial calculation after mount
    updateIndicator();

    const observer = new ResizeObserver(() => updateIndicator());
    if (containerFn) observer.observe(containerFn);

    return () => observer.disconnect();
  });
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
  <div class="relative flex w-full justify-around" bind:this={containerFn}>
    <div
      class="bg-primary-300-700 rounded-container absolute top-1.5 bottom-1.5 z-0 shadow-sm transition-all duration-300 ease-[cubic-bezier(0.23,1,0.32,1)]"
      style="left: calc({indicator.left}px + 0.5rem); width: calc({indicator.width}px - 1rem);"
    ></div>

    {#each pageSections.items as { title, icon, index, active, tooltipText }}
      {#if index !== 0}
        <button
          bind:this={buttonRefs[index]}
          title={tooltipText}
          disabled={!weather.data.length && index !== 1}
          onclick={() => goToProjectSection(index)}
          data-active={active}
          data-no-weather={!weather.data}
          class={[
            'hover:data-[no-weather=false]:data-[active=false]:bg-primary-50/50 dark:hover:data-[no-weather=false]:data-[active=false]:bg-primary-950/30 hover:data-[no-weather=false]:data-[active=false]:text-surface-900-100 z-10 flex w-full flex-col items-center justify-center p-2 transition-colors duration-200 disabled:opacity-30 data-[active=false]:data-[no-weather=true]:opacity-50',
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

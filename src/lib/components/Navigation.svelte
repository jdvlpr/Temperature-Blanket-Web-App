<!-- Copyright (c) 2024 - 2026, Thomas (https://github.com/jdvlpr)

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
  import {
    pageSections,
    showNavigationSideBar,
    goToProjectSection,
  } from '$lib/state/page-state.svelte';
  import { weather } from '$lib/state/weather-state.svelte';
  import { onMount } from 'svelte';

  let indicator = $state({ left: 0, width: 0 });
  let activeIndex = $derived(
    pageSections.items.find((section) => section.active === true)?.index || 1,
  );
  // element references
  let containerFn = $state<HTMLDivElement | undefined>();
  let buttonRefs = $state<(HTMLButtonElement | undefined)[]>([]);

  // Room around the active button's icon and label, so they never run into
  // the indicator's (possibly pill-shaped) ends
  const INDICATOR_PADDING = 16;
  // Its usual inset from the button's sides
  const INDICATOR_INSET = 8;
  // Wide enough to stay a rounded rectangle, not a circle, with just an icon
  const INDICATOR_MIN_WIDTH = 64;
  // How far it may reach past the button, into the space beside the
  // neighbors' (centered) labels, on narrow screens
  const INDICATOR_OVERLAP = 4;

  // The indicator nearly fills the active button, centered on it, but
  // always leaves that room around its content
  function updateIndicator() {
    const activeBtn = buttonRefs[activeIndex];
    const content = activeBtn?.querySelector('[data-nav-content]');

    if (activeBtn && content && containerFn) {
      const btnRect = activeBtn.getBoundingClientRect();
      const containerRect = containerFn.getBoundingClientRect();
      const width = Math.min(
        btnRect.width + INDICATOR_OVERLAP * 2,
        Math.max(
          // As wide as the button, less an inset, as long as that leaves
          // room around its content
          btnRect.width - INDICATOR_INSET * 2,
          INDICATOR_MIN_WIDTH,
          content.getBoundingClientRect().width + INDICATOR_PADDING * 2,
        ),
      );

      indicator = {
        left: btnRect.left - containerRect.left + (btnRect.width - width) / 2,
        width,
      };
    }
  }

  // Reactive Effect: Re-run when activeId changes
  $effect(() => {
    // Just referencing activeId makes this effect run when it changes
    activeIndex;
    updateIndicator();
  });

  // Handle Window Resizing
  onMount(() => {
    // Initial calculation after mount
    updateIndicator();

    // The bar resizing, or the labels (e.g. a new text size)
    const observer = new ResizeObserver(() => updateIndicator());
    if (containerFn) observer.observe(containerFn);
    containerFn
      ?.querySelectorAll('[data-nav-content]')
      .forEach((content) => observer.observe(content));

    return () => observer.disconnect();
  });
</script>

<div
  class={[
    'bg-surface-50/80 dark:bg-surface-950/80 lg:rounded-t-container fixed bottom-0 z-10 flex h-18 w-full justify-center gap-2 overflow-hidden backdrop-blur-md transition-all',
    showNavigationSideBar.value
      ? `lg:left-[284px] lg:max-w-[calc(min(100vw,var(--breakpoint-xl))-302px)] xl:left-[calc(50%-(var(--breakpoint-xl)/2)+278px)] xl:max-w-[calc(min(100vw,var(--breakpoint-xl))-278px)]`
      : 'lg:left-[78px] lg:max-w-[calc(min(100vw,var(--breakpoint-xl))-96px)] xl:left-[calc(50%-(var(--breakpoint-xl)/2)+78px)]',
  ]}
  id="bottom-section-nav"
>
  <div
    class="relative flex w-full justify-around max-lg:mx-2 max-lg:mb-2"
    bind:this={containerFn}
  >
    <div
      class="bg-primary-500/60 rounded-container absolute top-1.5 bottom-2 z-0 shadow-sm
        transition-all duration-300 ease-[cubic-bezier(0.23,1,0.32,1)]"
      style="left: {indicator.left}px; width: {indicator.width}px;"
    ></div>

    {#each pageSections.items as { title, icon, index, active, tooltipText } (index)}
      {#if index !== 0}
        <button
          bind:this={buttonRefs[index]}
          title={tooltipText}
          disabled={!weather.data.length && index !== 1}
          onclick={() => goToProjectSection(index)}
          data-active={active}
          data-no-weather={!weather.data}
          class="hover:data-[no-weather=false]:data-[active=false]:text-surface-950-50 data-[active=true]:text-surface-950-50 text-surface-700-300 z-10 flex w-full min-w-0 flex-col items-center justify-center p-2 transition-colors duration-200 disabled:opacity-30 data-[active=false]:data-[no-weather=true]:opacity-50"
        >
          <!-- Measured for the indicator. Below 300px wide, just the icons,
          so all four still fit (the labels still name them) -->
          <span data-nav-content class="flex flex-col items-center">
            <span>
              {@html icon}
            </span><span class="text-xs whitespace-nowrap max-[300px]:sr-only"
              >{title}</span
            >
          </span>
        </button>
      {/if}
    {/each}
  </div>
</div>

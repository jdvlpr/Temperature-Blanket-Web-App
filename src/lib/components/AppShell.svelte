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
  import AppNavigation from '$lib/components/AppNavigation.svelte';
  import { modal, pageSections, showNavigationSideBar } from '$lib/state';
  import { slide } from 'svelte/transition';
  import { weatherChart } from './WeatherChart.svelte';
  import { Modal } from '@skeletonlabs/skeleton-svelte';
  import AppLogo from './AppLogo.svelte';
  import { page } from '$app/state';

  /**
   * @typedef {Object} Props
   * @property {string} [pageName]
   * @property {import('svelte').Snippet} [stickyHeader]
   * @property {import('svelte').Snippet} [main]
   * @property {import('svelte').Snippet} [footer]
   */

  /** @type {Props} */
  let { pageName = 'Menu', stickyHeader, main, footer } = $props();

  let sidebarWidth = $state(0);

  let debounceTimer;
  const debounce = (callback, time) => {
    window.clearTimeout(debounceTimer);
    debounceTimer = window.setTimeout(callback, time);
  };

  $effect(() => {
    sidebarWidth;
    debounce(() => {
      if (weatherChart.current) weatherChart.update();
    }, 101);
  });
</script>

<div
  data-vaul-drawer-wrapper="true"
  class={[
    'min-h-[100svh]',
    (page.route.id === '/' &&
      Array(0, 1).includes(pageSections.items.find((p) => p.active)?.index)) ||
    page.route.id !== '/'
      ? 'gradient-background'
      : '',
  ]}
>
  <div
    class="sticky top-0 bg-surface-50/90 dark:bg-surface-950/90 backdrop-blur-md z-20 [view-transition-name:sticky-header]"
    class:lg:py-2={stickyHeader}
    id="top-navbar"
  >
    <div
      class="max-w-(--breakpoint-xl) flex justify-between items-center m-auto px-2 gap-2"
    >
      <div class="lg:hidden">
        <Modal
          bind:open={modal.drawer.leftNavigation}
          triggerBase="{pageName ? 'btn' : 'btn-icon'} hover:preset-tonal my-2"
          contentBase="bg-surface-50-950 p-4 space-y-4 shadow-xl w-fit h-screen overflow-auto"
          positionerJustify="justify-start"
          positionerAlign=""
          positionerPadding=""
          transitionsPositionerIn={{ x: -480, duration: 200 }}
          transitionsPositionerOut={{ x: -480, duration: 200 }}
        >
          {#snippet trigger()}
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke-width="1.5"
              stroke="currentColor"
              class="size-6"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"
              />
            </svg>

            {#if pageName}
              <span class="max-[355px]:hidden">
                {pageName}
              </span>
            {/if}{/snippet}
          {#snippet content()}
            <div class="mb-20 min-w-[265px]">
              <AppLogo />
              <AppNavigation />
            </div>
          {/snippet}
        </Modal>
      </div>

      {@render stickyHeader?.()}
    </div>
  </div>

  <div class="flex justify-start max-w-(--breakpoint-xl) mx-auto">
    <div
      class="flex flex-col justify-start items-start h-fit [view-transition-name:sidebar-navigation]"
      bind:clientWidth={sidebarWidth}
    >
      <button
        class="btn hover:preset-tonal mx-2 lg:flex justify-center hidden mt-2 gap-1"
        title={`${showNavigationSideBar.value ? 'Hide' : 'Show'} Sidebar`}
        onclick={async () => {
          showNavigationSideBar.value = !showNavigationSideBar.value;
        }}
      >
        {#if showNavigationSideBar.value}
          <svg
            xmlns="http://www.w3.org/2000/svg"
            class="size-6"
            viewBox="0 0 24 24"
            ><g
              fill="none"
              stroke="currentColor"
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              ><rect width="18" height="18" x="3" y="3" rx="2" ry="2" /><path
                d="M9 3v18m7-6l-3-3l3-3"
              /></g
            ></svg
          >
          <span in:slide={{ axis: 'x', duration: 90 }}>Hide Sidebar</span>
        {:else}
          <svg
            xmlns="http://www.w3.org/2000/svg"
            class="size-6"
            viewBox="0 0 24 24"
            ><g
              fill="none"
              stroke="currentColor"
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              ><rect width="18" height="18" x="3" y="3" rx="2" ry="2" /><path
                d="M9 3v18m5-12l3 3l-3 3"
              /></g
            ></svg
          >
        {/if}
      </button>
      {#if showNavigationSideBar.value}
        <div
          class="hidden lg:flex flex-col w-fit"
          transition:slide={{ axis: 'x', duration: 100 }}
        >
          <div class="w-fit">
            <AppNavigation />
          </div>
        </div>
      {/if}
    </div>

    <div class="w-full">
      <div class="lg:m-2 xl:mx-0">{@render main?.()}</div>
      {@render footer?.()}
    </div>
  </div>
</div>

<style>
  .gradient-background {
    background-size: cover;
    background-image: radial-gradient(
        at 0% 95%,
        color-mix(in oklab, var(--color-tertiary-500) 10%, transparent) 0px,
        transparent 50%
      ),
      radial-gradient(
        at 53% 40%,
        color-mix(in oklab, var(--color-surface-500) 16%, transparent) 0px,
        transparent 60%
      ),
      radial-gradient(
        at 85% 8%,
        color-mix(in oklab, var(--color-primary-500) 8%, transparent) 0px,
        transparent 50%
      ),
      radial-gradient(
        at 100% 100%,
        color-mix(in oklab, var(--color-surface-500) 9%, transparent) 0px,
        transparent 50%
      );
  }
</style>

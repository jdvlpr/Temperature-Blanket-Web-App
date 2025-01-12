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
  import { showNavigationSideBar } from '$lib/stores';
  import {
    Drawer,
    TableOfContents,
    getDrawerStore,
  } from '@skeletonlabs/skeleton';
  import { slide } from 'svelte/transition';

  /**
   * @typedef {Object} Props
   * @property {string} [pageName]
   * @property {import('svelte').Snippet} [stickyHeader]
   * @property {import('svelte').Snippet} [main]
   * @property {import('svelte').Snippet} [footer]
   */

  /** @type {Props} */
  let { pageName = 'Menu', stickyHeader, main, footer } = $props();

  const drawerStore = getDrawerStore();
</script>

<Drawer
  position="left"
  rounded="rounded-none"
  height="h-auto"
  width="w-fit"
  regionDrawer="pb-4"
  bgDrawer="bg-surface-50-900-token"
>
  {#if $drawerStore.id === 'menu'}
    <AppNavigation {drawerStore} />
  {:else if $drawerStore.id === 'documentation'}
    <TableOfContents class="p-4 max-w-[60vw]" />
  {/if}
</Drawer>

<div data-vaul-drawer-wrapper="true">
  <div
    class="sticky top-0 bg-surface-50/90 dark:bg-surface-800/90 backdrop-blur-md z-20 text-token [view-transition-name:sticky-header]"
    class:lg:py-2={stickyHeader}
    id="top-navbar"
  >
    <div
      class="max-w-screen-xl flex justify-between items-center m-auto px-2 gap-2"
    >
      <button
        class="btn bg-secondary-hover-token lg:hidden my-2 flex items-center"
        class:btn-icon={!pageName}
        title="Open Navigation Sidebar"
        onclick={() => drawerStore.open({ id: 'menu' })}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          stroke-width="1.5"
          stroke="currentColor"
          class="w-6 h-6"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"
          />
        </svg>
        <!-- <img src="/images/icon.png" class="w-6 h-6" alt="Logo" /> -->

        {#if pageName}
          <span class="max-[355px]:hidden">
            {pageName}
          </span>
        {/if}
      </button>
      {@render stickyHeader?.()}
    </div>
  </div>

  <div class="flex justify-start max-w-screen-xl mx-auto">
    <div
      class="flex flex-col justify-start items-start h-fit [view-transition-name:sidebar-navigation]"
    >
      <button
        class="btn bg-surface-hover-token mx-2 lg:flex justify-center hidden mt-2"
        title={`${showNavigationSideBar.value ? 'Hide' : 'Show'} Sidebar`}
        onclick={() =>
          (showNavigationSideBar.value = !showNavigationSideBar.value)}
      >
        {#if showNavigationSideBar.value}
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
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
          <span in:slide={{ axis: 'x' }}>Hide Sidebar</span>
        {:else}
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
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
          transition:slide={{ axis: 'x' }}
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

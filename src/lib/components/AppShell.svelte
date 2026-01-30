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
  import { page } from '$app/state';
  import AppNavigation from '$lib/components/AppNavigation.svelte';
  import {
    drawerState,
    pageSections,
    showNavigationSideBar,
    weather,
  } from '$lib/state';
  import { safeSlide } from '$lib/features/transitions/safeSlide';
  import {
    MenuIcon,
    PanelLeftClose,
    PanelRightCloseIcon,
  } from '@lucide/svelte';
  import { Dialog, Portal } from '@skeletonlabs/skeleton-svelte';
  import AppLogo from './AppLogo.svelte';
  import { weatherChart } from './WeatherChart.svelte';

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
      if (weatherChart?.current && weather.data.length) weatherChart.update();
    }, 101);
  });
</script>

<div data-vaul-drawer-wrapper="true">
  <div
    class={[
      'bg-surface-50/90 dark:bg-surface-950/90 sticky top-0 z-20 backdrop-blur-md [view-transition-name:sticky-header]',
      stickyHeader && 'lg:py-2',
    ]}
    id="top-navbar"
  >
    <div
      class="m-auto flex max-w-(--breakpoint-xl) items-center justify-between gap-2 px-2"
    >
      <div class="lg:hidden">
        <Dialog
          onOpenChange={(e) => {
            drawerState.appNavigation = e.open;
          }}
          open={drawerState.appNavigation}
        >
          <Dialog.Trigger
            class="btn hover:preset-tonal-surface my-2"
            aria-label="Open menu"
          >
            <MenuIcon />
            <span class="max-[355px]:hidden">
              {#if pageName}
                {pageName}
              {:else}
                Menu
              {/if}
            </span>
          </Dialog.Trigger>
          <Portal>
            <Dialog.Backdrop
              class="bg-surface-50-950/50 fixed inset-0 z-50 opacity-0 transition transition-discrete data-[state=open]:opacity-100 starting:data-[state=open]:opacity-0"
            />
            <Dialog.Positioner class="fixed inset-0 z-50 flex justify-start">
              <Dialog.Content
                class="bg-surface-50 dark:bg-surface-950 relative h-screen w-fit -translate-x-full space-y-4 overflow-auto p-4 opacity-0 transition transition-discrete data-[state=open]:translate-x-0 data-[state=open]:opacity-100 starting:data-[state=open]:-translate-x-full starting:data-[state=open]:opacity-0"
              >
                <div class="mb-20 flex min-w-[265px] flex-col gap-2">
                  <AppLogo />
                  <AppNavigation />
                </div>
              </Dialog.Content>
            </Dialog.Positioner>
          </Portal>
        </Dialog>
      </div>

      {@render stickyHeader?.()}
    </div>
  </div>

  <div class="mx-auto flex max-w-(--breakpoint-xl) justify-start">
    <div
      class="flex h-fit flex-col items-start justify-start [view-transition-name:sidebar-navigation]"
      bind:clientWidth={sidebarWidth}
    >
      <button
        class="btn hover:preset-tonal-surface mx-2 mt-2 hidden justify-center lg:flex"
        title={`${showNavigationSideBar.value ? 'Hide' : 'Show'} Sidebar`}
        onclick={async () => {
          showNavigationSideBar.value = !showNavigationSideBar.value;
        }}
      >
        {#if showNavigationSideBar.value}
          <PanelLeftClose />
          <span in:safeSlide={{ axis: 'x' }}>Hide Sidebar</span>
        {:else}
          <PanelRightCloseIcon />
        {/if}
      </button>
      {#if showNavigationSideBar.value}
        <div
          class="hidden w-fit flex-col lg:flex"
          transition:safeSlide={{ axis: 'x' }}
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

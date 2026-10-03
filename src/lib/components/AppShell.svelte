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
  import AppNavigation from '$lib/components/AppNavigation.svelte';
  import AccountButton from '$lib/components/account/AccountButton.svelte';
  import { safeSlide } from '$lib/features/transitions/safeSlide';
  import { alignIconInk } from '$lib/state/attachments/align-icon-ink';
  import {
    drawerState,
    showNavigationSideBar,
  } from '$lib/state/page-state.svelte';
  import { weather } from '$lib/state/weather-state.svelte';
  import { motion } from '$lib/utils/feedback.svelte';
  import {
    MenuIcon,
    PanelLeftClose,
    PanelRightCloseIcon,
  } from '@lucide/svelte';
  import { Dialog, Portal } from '@skeletonlabs/skeleton-svelte';
  import { cubicOut } from 'svelte/easing';
  import type { TransitionConfig } from 'svelte/transition';
  import AppLogo from './AppLogo.svelte';
  import { weatherChart } from './WeatherChart.svelte';

  interface Props {
    pageName?: string;
    stickyHeader?: import('svelte').Snippet;
    main?: import('svelte').Snippet;
    footer?: import('svelte').Snippet;
  }

  let { pageName = 'Menu', stickyHeader, main, footer }: Props = $props();

  let sidebarWidth = $state(0);

  // The sidebar folds both ways at once, so the button under it glides to
  // its place rather than jumping when the navigation is gone
  function sidebarSlide(node: HTMLElement): TransitionConfig {
    if (motion.reduced) return { duration: 0 };
    const { width, height } = node.getBoundingClientRect();
    return {
      duration: 400,
      easing: cubicOut,
      css: (t) =>
        `overflow: hidden; width: ${t * width}px; height: ${t * height}px; opacity: ${Math.min(t * 3, 1)}`,
    };
  }

  let debounceTimer: number | undefined;
  const debounce = (callback: () => void, time: number) => {
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

<div>
  <div
    class={[
      'bg-surface-50/80 dark:bg-surface-950/80 sticky top-0 z-20 backdrop-blur-md [view-transition-name:sticky-header]',
      stickyHeader && 'lg:py-2',
    ]}
    id="top-navbar"
  >
    <div
      class="m-auto flex max-w-(--breakpoint-xl) items-center justify-between px-2 max-sm:gap-1 sm:gap-2"
    >
      <div class="lg:hidden">
        <Dialog
          onOpenChange={(e) => {
            drawerState.appNavigation = e.open;
          }}
          open={drawerState.appNavigation}
        >
          <Dialog.Trigger
            class="hover:preset-tonal-surface max-sm:btn-icon sm:btn my-2"
            aria-label="Open menu"
          >
            <MenuIcon />
            <span class="max-sm:hidden">{pageName || 'Menu'}</span>
          </Dialog.Trigger>
          <Portal>
            <Dialog.Backdrop
              class="bg-surface-950/35 fixed inset-0 z-50 opacity-0 transition transition-discrete data-[state=open]:opacity-100 dark:bg-black/55 starting:data-[state=open]:opacity-0"
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

      <!-- The page's own items sit on the right, next to the account link; the
      first (usually the logo, shown on wide screens) stays on the left -->
      <div
        class="flex min-w-0 flex-1 items-center justify-end max-sm:gap-1 sm:gap-2 [&>:first-child]:mr-auto"
      >
        {@render stickyHeader?.()}
      </div>

      <!-- Always the last item in the top bar -->
      <AccountButton />
    </div>
  </div>

  <div class="mx-auto flex max-w-(--breakpoint-xl) justify-start">
    <div
      class="flex h-fit flex-col items-start justify-start [view-transition-name:sidebar-navigation]"
      bind:clientWidth={sidebarWidth}
    >
      {#if showNavigationSideBar.value}
        <div class="hidden w-fit flex-col lg:flex" transition:sidebarSlide>
          <div class="w-fit">
            <AppNavigation />
          </div>
        </div>
      {/if}
      <!-- Below the navigation, so as it folds away (up as well as in) the
      button rises with it to the top -->
      <button
        class={[
          'hover:preset-tonal-surface mx-2 hidden justify-center lg:flex',
          // Open, it follows the menu at the menu's own spacing, with room
          // below it when the menu reaches the end of the page
          showNavigationSideBar.value
            ? 'btn mb-4'
            : 'btn-icon relative -top-0.5 mt-2 ml-4',
        ]}
        title={`${showNavigationSideBar.value ? 'Hide' : 'Show'} Sidebar`}
        {@attach alignIconInk}
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
    </div>

    <div class="min-w-0 flex-1">
      <div class="lg:m-2 xl:mx-0">{@render main?.()}</div>
      {@render footer?.()}
    </div>
  </div>
</div>

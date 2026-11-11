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
  import AppNavigation from '#lib/components/AppNavigation.svelte';
  import AccountButton from '#lib/components/account/AccountButton.svelte';
  import {
    drawerState,
    showNavigationSideBar,
  } from '#lib/state/page-state.svelte.js';
  import { weather } from '#lib/state/weather-state.svelte.js';
  import { motion } from '#lib/utils/feedback.svelte.js';
  import { openBetaWarning } from '#lib/utils/open-beta-warning.js';
  import { onRetiredBeta } from '#lib/constants/site.js';
  import { isThumbnailFrame } from '#lib/storage/thumbnails.js';
  import { dev } from '$app/env';
  import { page } from '$app/state';
  import { MenuIcon, PanelLeftClose, PanelLeftOpen } from '@lucide/svelte';
  import { Dialog, Portal } from '@skeletonlabs/skeleton-svelte';
  import { onMount } from 'svelte';
  import { cubicOut } from 'svelte/easing';
  import type { TransitionConfig } from 'svelte/transition';
  import AppLogo from './AppLogo.svelte';
  import BetaBanner from './BetaBanner.svelte';
  import RetiredBetaBanner from './RetiredBetaBanner.svelte';
  import { weatherChart } from './WeatherChart.svelte';
  import WhatsNewBanner from './WhatsNewBanner.svelte';

  interface Props {
    pageName?: string;
    stickyHeader?: import('svelte').Snippet;
    main?: import('svelte').Snippet;
    footer?: import('svelte').Snippet;
  }

  let { pageName = 'Menu', stickyHeader, main, footer }: Props = $props();

  // The beta's warning, on the first page of a visit, and its one question
  // after a few minutes (utils/beta-feedback-toast.ts)
  // At the beta's address after launch (only known in the browser)
  let retiredBeta = $state(false);

  onMount(() => {
    retiredBeta = onRetiredBeta() && !isThumbnailFrame();
    openBetaWarning(page.url.pathname);
    if (__SITE_BETA__)
      void import('#lib/utils/beta-feedback-toast.js').then((module) =>
        module.startBetaFeedbackToast(),
      );
  });

  // The sidebar's least width (AppNavigation's min-w) until it's measured,
  // so the server's page puts the logo where it will be
  let sidebarWidth = $state(278);
  let topBarHeight = $state(0);

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

  // The account button names itself when the top bar has room for that past
  // the page's own items. Measured, since pages' items differ: the name shows
  // once the free space would take it with some to spare, and goes once the
  // items no longer fit beside it
  let topBar: HTMLElement | undefined = $state();
  let pageItems: HTMLElement | undefined = $state();
  let showAccountLabel = $state(false);

  function fitAccountLabel() {
    if (!topBar || !pageItems) return;
    const name = topBar.querySelector<HTMLElement>('[data-account-label]');
    if (!name) return;
    const range = document.createRange();
    range.selectNodeContents(pageItems);
    const itemsWidth = range.getBoundingClientRect().width;
    // Less whatever the bar already spills past its edge
    const free =
      pageItems.clientWidth -
      parseFloat(getComputedStyle(pageItems).paddingLeft) -
      itemsWidth -
      Math.max(0, topBar.scrollWidth - topBar.clientWidth);
    // The name, its gap from the icon and the wider button's padding
    const needs = name.offsetWidth + 24;
    showAccountLabel = showAccountLabel ? free >= 0 : free >= needs + 16;
  }

  $effect(() => {
    if (!topBar || !pageItems) return;
    let frame = 0;
    const fit = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(fitAccountLabel);
    };
    const resized = new ResizeObserver(fit);
    resized.observe(topBar);
    resized.observe(pageItems);
    // A page's items, or the account's state, changing
    const changed = new MutationObserver(fit);
    changed.observe(topBar, {
      childList: true,
      subtree: true,
      characterData: true,
      attributes: true,
      attributeFilter: ['class', 'hidden', 'style'],
    });
    fit();
    return () => {
      cancelAnimationFrame(frame);
      resized.disconnect();
      changed.disconnect();
    };
  });

  let debounceTimer: number | undefined;
  const debounce = (callback: () => void, time: number) => {
    window.clearTimeout(debounceTimer);
    debounceTimer = window.setTimeout(callback, time);
  };

  $effect(() => {
    void sidebarWidth;
    debounce(() => {
      if (weatherChart?.current && weather.data.length) weatherChart.update();
    }, 101);
  });
</script>

<div
  style:--sidebar-width="{sidebarWidth}px"
  style:--top-bar-height="{topBarHeight}px"
>
  <!-- Above the top bar, the window's full width, scrolling away with the page -->
  {#if __SITE_BETA__ && !dev}
    <BetaBanner />
  {:else if retiredBeta}
    <RetiredBetaBanner />
  {/if}
  <div
    class="bg-surface-50/80 dark:bg-surface-950/80 sticky top-0 z-20 backdrop-blur-md [view-transition-name:sticky-header]"
    data-sticky-bar
    id="top-navbar"
    bind:clientHeight={topBarHeight}
  >
    <div
      bind:this={topBar}
      class="relative flex items-center justify-between px-2 max-sm:gap-1 sm:gap-2 xl:pr-[calc(max(0px,(100%-var(--breakpoint-xl))/2)+0.5rem)]"
    >
      <!-- The right padding is half of what the window has past
      --breakpoint-xl, as beside the page's centered column below -->
      <!-- Wide screens: the sidebar's header, the site's name then the
      button that shows or hides the sidebar, over half the name's inset so
      both fit the sidebar's width. Its box ends half a rem short of the
      sidebar's edge (with this bar's padding); it follows the sidebar as
      it folds, the name folding with it into the blanket mark -->
      <div
        class="hidden shrink-0 items-center justify-between lg:flex lg:min-w-[calc(var(--sidebar-width)-1rem)]"
      >
        <div class="-mr-2 flex shrink-0">
          <AppLogo small mark={!showNavigationSideBar.value} />
        </div>
        <button
          class="btn-icon hover:preset-tonal-surface my-2 opacity-60 hover:opacity-100"
          title={showNavigationSideBar.value ? 'Hide sidebar' : 'Show sidebar'}
          aria-label={showNavigationSideBar.value
            ? 'Hide sidebar'
            : 'Show sidebar'}
          aria-expanded={showNavigationSideBar.value}
          aria-controls="app-sidebar"
          onclick={() => {
            showNavigationSideBar.value = !showNavigationSideBar.value;
          }}
        >
          {#if showNavigationSideBar.value}
            <PanelLeftClose />
          {:else}
            <PanelLeftOpen />
          {/if}
        </button>
      </div>

      <div class="lg:hidden">
        <Dialog
          onOpenChange={(e) => {
            drawerState.appNavigation = e.open;
          }}
          open={drawerState.appNavigation}
        >
          <Dialog.Trigger
            class="hover:preset-tonal-surface max-sm:btn-icon sm:btn my-1"
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
                <div
                  class="mb-20 flex min-h-[calc(100%-5rem)] min-w-[265px] flex-col gap-2"
                >
                  <AppLogo viewTransition={false} />
                  <AppNavigation />
                </div>
              </Dialog.Content>
            </Dialog.Positioner>
          </Portal>
        </Dialog>
      </div>
      <!-- The page's own items sit on the right, next to the account link,
      which ends where the page's column does; anything at their left starts
      past the sidebar where a wide page's content does (the page's margin
      and PAGE's padding) -->
      <div
        bind:this={pageItems}
        class="flex min-w-0 flex-1 items-center justify-end max-sm:gap-1 sm:gap-2 lg:pl-6"
      >
        {@render stickyHeader?.()}
      </div>

      <!-- Always the last item in the top bar -->
      <AccountButton showLabel={showAccountLabel} />
    </div>
  </div>

  <!-- The sidebar keeps to the window's left edge; the page's column beside it
  is centered in the rest, as wide as the sidebar leaves of --breakpoint-xl -->
  <div class="flex justify-start">
    <!-- Stays in view under the top bar as the page scrolls, scrolling on its
    own when the window is too short for all of it -->
    <div
      id="app-sidebar"
      class="sticky flex h-fit [scrollbar-width:thin] flex-col items-start justify-start self-start overflow-y-auto [view-transition-name:sidebar-navigation]"
      style:top="{topBarHeight}px"
      style:max-height="calc(100dvh - {topBarHeight}px)"
      bind:clientWidth={sidebarWidth}
    >
      {#if showNavigationSideBar.value}
        <div
          class="hidden min-h-[calc(100dvh-var(--top-bar-height))] w-fit flex-col lg:flex"
          transition:sidebarSlide
        >
          <div class="mb-4 flex w-fit grow flex-col">
            <AppNavigation />
          </div>
        </div>
      {/if}
    </div>

    <div
      class="mx-auto min-w-0 flex-1 lg:max-w-[calc(var(--breakpoint-xl)-var(--sidebar-width))]"
    >
      <!-- Clear of the sidebar: with PAGE's gutter, 1.5rem -->
      <div class="lg:my-2 lg:mr-2 lg:ml-4 xl:mr-0">
        {#if !__SITE_BETA__ && !retiredBeta}
          <WhatsNewBanner />
        {/if}
        {@render main?.()}
        {@render footer?.()}
      </div>
    </div>
  </div>
</div>

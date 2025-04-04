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
  import {
    modal,
    pageSections,
    showNavigationSideBar,
    weather,
  } from '$lib/state';
  import { slide } from 'svelte/transition';
  import { weatherChart } from './WeatherChart.svelte';
  import { Modal } from '@skeletonlabs/skeleton-svelte';
  import AppLogo from './AppLogo.svelte';
  import { page } from '$app/state';
  import {
    MenuIcon,
    PanelLeftClose,
    PanelRightCloseIcon,
  } from '@lucide/svelte';

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
        <Modal
          onOpenChange={(e) => {
            modal.drawer.leftNavigation = e.open;
          }}
          open={modal.drawer.leftNavigation}
          triggerBase="btn hover:preset-tonal my-2"
          triggerAriaLabel="Open menu"
          contentBase="bg-surface-50 dark:bg-surface-950 p-4 space-y-4 shadow-xl w-fit h-screen overflow-auto"
          positionerJustify="justify-start"
          positionerAlign=""
          positionerPadding=""
          transitionsPositionerIn={{ x: -480, duration: 200 }}
          transitionsPositionerOut={{ x: -480, duration: 200 }}
        >
          {#snippet trigger()}
            <MenuIcon />

            <span class="max-[355px]:hidden">
              {#if pageName}
                {pageName}
              {:else}
                Menu
              {/if}
            </span>
          {/snippet}
          {#snippet content()}
            <div class="mb-20 flex min-w-[265px] flex-col gap-2">
              <AppLogo />
              <AppNavigation />
            </div>
          {/snippet}
        </Modal>
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
        class="btn hover:preset-tonal mx-2 mt-2 hidden justify-center lg:flex"
        title={`${showNavigationSideBar.value ? 'Hide' : 'Show'} Sidebar`}
        onclick={async () => {
          showNavigationSideBar.value = !showNavigationSideBar.value;
        }}
      >
        {#if showNavigationSideBar.value}
          <PanelLeftClose />
          <span in:slide={{ axis: 'x', duration: 90 }}>Hide Sidebar</span>
        {:else}
          <PanelRightCloseIcon />
        {/if}
      </button>
      {#if showNavigationSideBar.value}
        <div
          class="hidden w-fit flex-col lg:flex"
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
    background-image:
      radial-gradient(
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

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

<script module>
  import { localStorageStore } from '@skeletonlabs/skeleton';
  export const skeletonTheme = localStorageStore('skeletonTheme', 'classic');
  export const skeletonThemes = [
    {
      id: 'classic',
      name: 'Marble',
      colors: {
        primary: '#fcd34d',
        secondary: '#075985',
        surface: '#64748b',
      },
      rounded: '8px',
    },
    {
      id: 'crimson',
      name: 'Garnet',
      colors: {
        primary: '#d4163c',
        secondary: '#4685af',
        surface: '#2b2e40',
      },
      rounded: '24px',
    },
    {
      id: 'hamlindigo',
      name: 'Lapis Lazuli',
      colors: {
        primary: '#a8bef1',
        secondary: '#a48e5b',
        surface: '#6376a3',
      },
      rounded: '2px',
    },
    {
      id: 'modern',
      name: 'Jasper',
      colors: {
        primary: '#f27fb8',
        secondary: '#06b6d4',
        surface: '#6366f1',
      },
      rounded: '24px',
    },
    {
      id: 'rocket',
      name: 'Geode',
      colors: {
        primary: '#06b6d4',
        secondary: '#3b82f6',
        surface: '#64748b',
      },
      rounded: '0px',
    },
    {
      id: 'skeleton',
      name: 'Tufa',
      colors: {
        surface: '#495a8f',
        primary: '#0fba81',
        secondary: '#4f46e5',
      },
      rounded: '8px',
    },
  ];
</script>

<script>
  import { THEMES } from '$lib/constants';
  import { activeTheme, theme } from '$lib/state';
  import { setTheme } from '$lib/utils';
  import {
    ListBox,
    ListBoxItem,
    RadioGroup,
    RadioItem,
    popup,
  } from '@skeletonlabs/skeleton';

  /**
   * @typedef {Object} Props
   * @property {boolean} [showText]
   * @property {string} [target]
   */

  /** @type {Props} */
  let { showText = false, target = 'popupTheme' } = $props();

  const popupTheme = {
    // Represents the type of event that opens/closed the popup
    event: 'click',
    // Matches the data-popup value on your popup element
    target,
    // Defines which side of your trigger the popup will appear
    placement: 'bottom',
    closeQuery: '.close',
  };

  let skeletonThemeName = $derived(
    skeletonThemes.find((theme) => theme.id === $skeletonTheme)?.name,
  );
</script>

<div class="w-fit text-left">
  <button
    class="btn bg-secondary-hover-token"
    id="menu-button"
    title="Change Theme [t]"
    use:popup={popupTheme}
  >
    {#key theme.value}
      {#if showText}
        <span class="flex items-center">
          <span class="pr-2">{@html activeTheme.value.icon}</span>
          Theme
        </span>
      {:else}
        <span>{@html activeTheme.value.icon}</span>
      {/if}
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 20 20"
        fill="currentColor"
        class="w-5 h-5"
      >
        <path
          fill-rule="evenodd"
          d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
          clip-rule="evenodd"
        />
      </svg>
    {/key}
  </button>

  <!--
          Dropdown menu, show/hide based on menu state.
      
          Entering: "transition ease-out duration-100"
            From: "transform opacity-0 scale-95"
            To: "transform opacity-100 scale-100"
          Leaving: "transition ease-in duration-75"
            From: "transform opacity-100 scale-100"
            To: "transform opacity-0 scale-95"
        -->
  <div
    data-popup={target}
    class="bg-surface-300-600-token rounded-container-token shadow-lg p-2 z-30"
    aria-orientation="vertical"
    aria-labelledby="menu-button"
    tabindex="-1"
  >
    <div class="flex flex-col gap-2">
      <RadioGroup class="flex wrap gap-y-2" active="bg-secondary-active-token">
        {#each THEMES as { name, id, icon, description }}
          <RadioItem
            bind:group={theme.value}
            onclick={() => setTheme(id)}
            name="theme-{id}"
            value={id}
            title={description}
          >
            <span class="flex gap-1 justify-center items-center">
              {@html icon}
              <span class="hidden min-[360px]:inline">{name}</span>
            </span>
          </RadioItem>
        {/each}
      </RadioGroup>

      <ListBox active="bg-secondary-active-token">
        {#each skeletonThemes as { name, id, colors, rounded }}
          <ListBoxItem
            bind:group={$skeletonTheme}
            name="medium"
            value={id}
            regionLead="w-16"
          >
            {#snippet lead()}
              <div
                class="flex w-full h-6 overflow-hidden border-surface-50-900-token border"
                style="border-radius:{rounded}"
              >
                <div
                  class="flex-auto"
                  style="background:{colors.surface}"
                ></div>
                <div
                  class="flex-auto"
                  style="background:{colors.primary}"
                ></div>
                <div
                  class="flex-auto"
                  style="background:{colors.secondary}"
                ></div>
                <!-- <div class="flex-auto" style="background:{colors.tertiary}" /> -->
              </div>
            {/snippet}
            {name}
          </ListBoxItem>
        {/each}
      </ListBox>
      <button class="close" aria-label="Close"></button>
    </div>
    <div class="arrow bg-surface-300-600-token shadow-lg"></div>
  </div>
</div>

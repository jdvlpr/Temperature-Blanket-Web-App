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
  // export const skeletonTheme = persistedState('skeletonTheme', 'classic');
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
  import { browser } from '$app/environment';
  import { THEMES } from '$lib/constants';
  import { preferences } from '$lib/state';
  import { RadioGroup, RadioItem, popup } from '@skeletonlabs/skeleton';

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
    skeletonThemes.find((theme) => theme.id === preferences.value.theme.id)
      ?.name,
  );

  let activeTheme = $derived(
    THEMES.find((n) => n.id === preferences.value.theme.mode),
  );
</script>

<div class="w-fit text-left">
  <button
    class="btn bg-secondary-hover-token"
    id="menu-button"
    title="Change Theme [t]"
    use:popup={popupTheme}
  >
    {#key preferences.value?.theme.mode}
      {#if showText}
        <span class="flex items-center">
          <span class="pr-2"
            >{#if browser}{@html activeTheme?.icon}{:else}{@html THEMES.find(
                (t) => t.id === 'system',
              ).icon}{/if}</span
          >
          Theme
        </span>
      {:else}
        <span
          >{#if browser}{@html activeTheme?.icon}{:else}{@html THEMES.find(
              (t) => t.id === 'system',
            ).icon}{/if}</span
        >
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
            bind:group={preferences.value.theme.mode}
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

      <div class="flex flex-col items-start gap-2">
        {#each skeletonThemes as { name, id, colors, rounded }}
          <button
            onclick={() => {
              preferences.value.theme.id = id;
            }}
            class={[
              'btn bg-secondary-hover-token flex items-center gap-2 w-full justify-start',
              preferences.value.theme.id === id && 'bg-secondary-active-token',
            ]}
          >
            <div
              class="flex w-16 h-6 overflow-hidden border-surface-50-900-token border"
              style="border-radius:{rounded}"
            >
              <div class="flex-auto" style="background:{colors.surface}"></div>
              <div class="flex-auto" style="background:{colors.primary}"></div>
              <div
                class="flex-auto"
                style="background:{colors.secondary}"
              ></div>
            </div>
            {name}
          </button>
        {/each}
      </div>
      <button class="close" aria-label="Close"></button>
    </div>
    <div class="arrow bg-surface-300-600-token shadow-lg"></div>
  </div>
</div>

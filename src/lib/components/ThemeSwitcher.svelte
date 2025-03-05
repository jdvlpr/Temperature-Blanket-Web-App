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
      id: 'legacy',
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
  import { Popover, Segment } from '@skeletonlabs/skeleton-svelte';

  let openState = $state(false);

  let activeTheme = $derived(
    THEMES.find((n) => n.id === (preferences.value.theme.mode || 'system')),
  );
</script>

<div class="w-fit text-left">
  <Popover
    open={openState}
    onOpenChange={(e) => {
      openState = e.open;
    }}
    triggerBase="btn hover:preset-tonal"
    contentBase="card bg-surface-200-800 p-4 space-y-4 shadow-xl"
    positionerClasses="z-9999!"
    arrow
    arrowBackground="bg-surface-200! dark:bg-surface-800!"
    modal={true}
    autoFocus={false}
  >
    {#snippet trigger()}
      {#key preferences.value?.theme.mode}
        <span class="flex items-center">
          <span class="pr-2"
            >{#if browser}{@html activeTheme?.icon}{:else}{@html THEMES.find(
                (t) => t.id === 'system',
              ).icon}{/if}</span
          >
          Theme
        </span>
      {/key}
    {/snippet}
    {#snippet content()}
      <div class="flex flex-col gap-2">
        <Segment
          value={preferences.value.theme.mode}
          onValueChange={(e) => {
            preferences.value.theme.mode = e.value;
          }}
          classes="flex wrap gap-y-2 shadow-sm"
          background="bg-surface-100-900"
        >
          {#each THEMES as { name, id, icon, description }}
            <Segment.Item value={id}>
              <span class="flex gap-1 justify-center items-center">
                {@html icon}
                <span class="hidden min-[360px]:inline">{name}</span>
              </span>
            </Segment.Item>
          {/each}
        </Segment>

        <div class="flex flex-col items-start gap-2">
          {#each skeletonThemes as { name, id, colors, rounded }}
            <button
              onclick={(e) => {
                preferences.value.theme.id = id;
              }}
              class={[
                'btn hover:preset-tonal-secondary flex items-center gap-2 w-full justify-start',
                preferences.value.theme.id === id &&
                  'preset-filled-secondary-500',
              ]}
            >
              <div
                class="flex w-16 h-6 overflow-hidden border-surface-50-950 border"
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
              </div>
              {name}
            </button>
          {/each}
        </div>
        <button class="close" aria-label="Close"></button>
      </div>
    {/snippet}
  </Popover>
</div>

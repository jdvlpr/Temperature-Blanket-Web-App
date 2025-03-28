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
  import { localState } from '$lib/state';
  import { Popover, Segment } from '@skeletonlabs/skeleton-svelte';

  let openState = $state(false);

  let activeTheme = $derived(
    THEMES.find((n) => n.id === (localState.value.theme.mode || 'system')),
  );
</script>

<div class="w-fit text-left">
  <Popover
    open={openState}
    onOpenChange={(e) => {
      openState = e.open;
    }}
    triggerBase="btn  hover:preset-tonal"
    contentBase="card bg-surface-200 dark:bg-surface-800 p-4 space-y-4 shadow-xl"
    positionerClasses="z-9999!"
    arrow
    arrowBackground="bg-surface-200! dark:bg-surface-800!"
    modal={true}
    autoFocus={false}
  >
    {#snippet trigger()}
      {#key localState.value?.theme.mode}
        <span
          >{#if browser}{@html activeTheme?.icon}{:else}{@html THEMES.find(
              (t) => t.id === 'system',
            ).icon}{/if}</span
        >
        Theme
      {/key}
    {/snippet}
    {#snippet content()}
      <div class="flex flex-col gap-2">
        <Segment
          value={localState.value.theme.mode}
          onValueChange={(e) => {
            localState.value.theme.mode = e.value;
          }}
          classes="flex wrap gap-y-2 shadow-sm"
          background="bg-surface-100 dark:bg-surface-900"
        >
          {#each THEMES as { name, id, icon, description }}
            <Segment.Item value={id}>
              <span class="flex items-center justify-center gap-1">
                {@html icon}
                <span class="hidden min-[375px]:inline">{name}</span>
              </span>
            </Segment.Item>
          {/each}
        </Segment>

        <div class="flex flex-col items-start gap-2">
          {#each skeletonThemes as { name, id, colors, rounded }}
            <button
              onclick={(e) => {
                localState.value.theme.id = id;
              }}
              class={[
                'btn hover:preset-tonal-secondary flex w-full items-center justify-start gap-2',
                localState.value.theme.id === id &&
                  'preset-filled-secondary-500',
              ]}
            >
              <div
                class="border-surface-50-950 flex h-6 w-16 overflow-hidden border"
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

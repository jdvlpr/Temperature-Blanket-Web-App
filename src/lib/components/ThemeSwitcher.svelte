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
  import {
    Popover,
    Portal,
    SegmentedControl,
  } from '@skeletonlabs/skeleton-svelte';
  import { scale, slide } from 'svelte/transition';

  let activeTheme = $derived(
    THEMES.find((n) => n.id === (localState.value.theme.mode || 'system')),
  );
</script>

<div class="w-fit text-left">
  <Popover modal={true} autoFocus={true}>
    <Popover.Trigger class="btn hover:preset-tonal">
      {#key localState.value?.theme.mode}
        <span
          >{#if browser}{@html activeTheme?.icon}{:else}{@html THEMES.find(
              (t) => t.id === 'system',
            ).icon}{/if}</span
        >
        Theme
      {/key}
    </Popover.Trigger>
    <Portal>
      <Popover.Positioner>
        <Popover.Content
          class="card bg-surface-200-800 z-999 space-y-4 p-4 shadow-xl"
        >
          {#snippet element(attributes)}
            {#if !attributes.hidden}
              <div {...attributes} transition:slide={{ duration: 150 }}>
                <Popover.Description>
                  <div class="flex flex-col gap-2">
                    <SegmentedControl
                      value={localState.value.theme.mode}
                      onValueChange={(e) => {
                        if (localState.value?.theme.mode) {
                          localState.value.theme.mode = e.value;
                        }
                      }}
                    >
                      <SegmentedControl.Control
                        class="bg-surface-100 dark:bg-surface-900 card"
                      >
                        <SegmentedControl.Indicator />
                        {#each THEMES as { name, id, icon, description }}
                          <SegmentedControl.Item value={id} title={description}>
                            <SegmentedControl.ItemText>
                              <span
                                class="flex items-center justify-center gap-1"
                              >
                                {@html icon}
                                <span
                                  class="hidden text-sm min-[400px]:inline md:text-base"
                                  >{name}</span
                                >
                              </span>
                            </SegmentedControl.ItemText>
                            <SegmentedControl.ItemHiddenInput />
                          </SegmentedControl.Item>
                        {/each}
                      </SegmentedControl.Control>
                    </SegmentedControl>

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
                  </div>
                </Popover.Description>
                <Popover.Arrow
                  style="--arrow-size: calc(var(--spacing) * 2); --arrow-background: var(--color-surface-200-800);"
                >
                  <Popover.ArrowTip />
                </Popover.Arrow>
              </div>
            {/if}
          {/snippet}
        </Popover.Content>
      </Popover.Positioner>
    </Portal>
  </Popover>
</div>

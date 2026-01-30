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
      rounded: '0.375rem',
    },
    {
      id: 'crimson',
      name: 'Garnet',
      colors: {
        primary: '#d21d3d',
        secondary: '#4785ae',
        surface: '#353a50',
      },
      rounded: '0.75rem',
    },
    {
      id: 'hamlindigo',
      name: 'Lapis Lazuli',
      colors: {
        primary: '#a7bef3',
        secondary: '#a38e5e',
        surface: '#6476a1',
      },
      rounded: '0.063rem',
    },
    {
      id: 'modern',
      name: 'Jasper',
      colors: {
        primary: '#eb4999',
        secondary: '#00b7d6',
        surface: '#6367ef',
      },
      rounded: '9999rem',
    },
    {
      id: 'rocket',
      name: 'Geode',
      colors: {
        primary: '#00b7d6',
        secondary: '#3a82f7',
        surface: '#64748b',
      },
      rounded: '0.125rem',
    },
    {
      id: 'legacy',
      name: 'Tufa',
      colors: {
        surface: '#11ba81',
        primary: '#4f46e5',
        secondary: '#495a90',
      },
      rounded: '9999rem',
    },
  ];
</script>

<script>
  import { browser } from '$app/environment';
  import { THEMES } from '$lib/constants';
  import { preferences } from '$lib/storage/preferences.svelte';
  import { safeSlide } from '$lib/features/transitions/safeSlide';
  import {
    Popover,
    Portal,
    SegmentedControl,
  } from '@skeletonlabs/skeleton-svelte';

  let activeTheme = $derived(
    THEMES.find((n) => n.id === (preferences.value.theme.mode || 'system')),
  );
</script>

<div class="w-fit text-left">
  <Popover modal={true} autoFocus={true}>
    <Popover.Trigger class="btn hover:preset-tonal-surface">
      {#key preferences.value?.theme.mode}
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
              <div {...attributes} transition:safeSlide>
                <Popover.Description>
                  <div class="flex flex-col gap-2">
                    <SegmentedControl
                      value={preferences.value.theme.mode}
                      onValueChange={(e) => {
                        if (preferences.value?.theme.mode) {
                          preferences.value.theme.mode = e.value;
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
                            preferences.value.theme.id = id;
                          }}
                          class={[
                            'btn hover:preset-tonal-surface-secondary flex w-full items-center justify-start gap-2',
                            preferences.value.theme.id === id &&
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

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
    },
    {
      id: 'crimson',
      name: 'Garnet',
      colors: {
        primary: '#d21d3d',
        secondary: '#4785ae',
        surface: '#353a50',
      },
    },
    {
      id: 'hamlindigo',
      name: 'Lapis Lazuli',
      colors: {
        primary: '#a7bef3',
        secondary: '#a38e5e',
        surface: '#6476a1',
      },
    },
    {
      id: 'modern',
      name: 'Jasper',
      colors: {
        primary: '#eb4999',
        secondary: '#00b7d6',
        surface: '#6367ef',
      },
    },
    {
      id: 'rocket',
      name: 'Geode',
      colors: {
        primary: '#00b7d6',
        secondary: '#3a82f7',
        surface: '#64748b',
      },
    },
    {
      id: 'legacy',
      name: 'Tufa',
      colors: {
        surface: '#11ba81',
        primary: '#4f46e5',
        secondary: '#495a90',
      },
    },
  ];
</script>

<script>
  import {
    ICON_STROKE,
    ROUNDNESS,
    SPACING,
    TEXT_SCALE,
    THEMES,
  } from '$lib/constants/page-constants';
  import { safeSlide } from '$lib/features/transitions/safeSlide';
  import { preferences } from '$lib/storage/preferences.svelte';
  import { ContrastIcon } from '@lucide/svelte';
  import {
    Popover,
    Portal,
    SegmentedControl,
  } from '@skeletonlabs/skeleton-svelte';
</script>

<div class="w-fit text-left">
  <Popover modal={true} autoFocus={true}>
    <Popover.Trigger class="btn hover:preset-tonal-surface">
      {#key preferences.value?.theme.mode}
        <span><ContrastIcon /></span>
        Appearance
      {/key}
    </Popover.Trigger>
    <Portal>
      <Popover.Positioner>
        <Popover.Content
          class="card bg-surface-200-800 z-999 space-y-4 p-4 shadow-xl max-w-[90vw]! max-h-[80vh]! overflow-auto"
        >
          {#snippet element(attributes)}
            {#if !attributes.hidden}
              <div {...attributes} transition:safeSlide>
                <Popover.Description
                  class="max-s-screen max-h-screen overflow-auto"
                >
                  <div class="flex flex-col gap-4">
                    <!-- 1. Appearance (Light / Dark / System) -->
                    <div class="flex flex-col gap-1">
                      <p
                        class="text-xs font-semibold uppercase tracking-wider opacity-60"
                      >
                        Mode
                      </p>
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
                            <SegmentedControl.Item
                              value={id}
                              title={description}
                            >
                              <SegmentedControl.ItemText
                                class="flex items-center justify-center gap-1"
                              >
                                {@html icon}
                                <span
                                  class={[
                                    id !== preferences.value.theme.mode &&
                                      'hidden',
                                    'text-sm min-[400px]:inline md:text-base',
                                  ]}>{name}</span
                                >
                              </SegmentedControl.ItemText>
                              <SegmentedControl.ItemHiddenInput />
                            </SegmentedControl.Item>
                          {/each}
                        </SegmentedControl.Control>
                      </SegmentedControl>
                    </div>

                    <!-- 2. Color Theme -->
                    <div class="flex flex-col gap-1">
                      <p
                        class="text-xs font-semibold uppercase tracking-wider opacity-60"
                      >
                        Color Theme
                      </p>
                      <div class="grid grid-cols-3 items-center gap-4">
                        {#each skeletonThemes as { name, id, colors }}
                          <button
                            onclick={() => {
                              preferences.value.theme.id = id;
                            }}
                            class={[
                              'btn hover:preset-tonal-surface flex flex-col w-full items-center justify-start gap-0 text-xs p-0',
                              preferences.value.theme.id === id &&
                                'preset-filled-secondary-500',
                            ]}
                          >
                            <div
                              class="border-surface-50-950 flex h-10 w-full overflow-hidden rounded-base border"
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
                            <!-- {name} -->
                          </button>
                        {/each}
                      </div>
                    </div>

                    <!-- 3. Roundness -->
                    <div class="flex flex-col gap-1">
                      <p
                        class="text-xs font-semibold uppercase tracking-wider opacity-60"
                      >
                        Roundness
                      </p>

                      <SegmentedControl
                        value={preferences.value.theme.roundness ?? 'rounded'}
                        onValueChange={(e) => {
                          preferences.value.theme.roundness = e.value;
                        }}
                      >
                        <SegmentedControl.Control
                          class="bg-surface-100 dark:bg-surface-900 card"
                        >
                          <SegmentedControl.Indicator />
                          {#each ROUNDNESS as { name, id, description, IconComponent }}
                            <SegmentedControl.Item
                              value={id}
                              title={description}
                            >
                              <SegmentedControl.ItemText
                                class="flex items-center justify-center gap-1"
                              >
                                <!-- here -->
                                {#if IconComponent}
                                  <IconComponent />
                                {/if}
                                <span
                                  class={[
                                    id !== preferences.value.theme.roundness &&
                                      'hidden',
                                    'text-sm min-[400px]:inline md:text-base',
                                  ]}>{name}</span
                                >
                              </SegmentedControl.ItemText>
                              <SegmentedControl.ItemHiddenInput />
                            </SegmentedControl.Item>
                          {/each}
                        </SegmentedControl.Control>
                      </SegmentedControl>
                    </div>

                    <!-- 4. Spacing -->
                    <div class="flex flex-col gap-1">
                      <p
                        class="text-xs font-semibold uppercase tracking-wider opacity-60"
                      >
                        Spacing
                      </p>
                      <SegmentedControl
                        value={preferences.value.theme.spacing ?? 'normal'}
                        onValueChange={(e) => {
                          preferences.value.theme.spacing = e.value;
                        }}
                      >
                        <SegmentedControl.Control
                          class="bg-surface-100 dark:bg-surface-900 card"
                        >
                          <SegmentedControl.Indicator />
                          {#each SPACING as { name, id, description, IconComponent }}
                            <SegmentedControl.Item
                              value={id}
                              title={description}
                            >
                              <SegmentedControl.ItemText
                                class="flex items-center justify-center gap-1"
                              >
                                <!-- here -->
                                {#if IconComponent}
                                  <IconComponent />
                                {/if}
                                <span
                                  class={[
                                    id !== preferences.value.theme.spacing &&
                                      'hidden',
                                    'text-sm min-[400px]:inline md:text-base',
                                  ]}>{name}</span
                                >
                              </SegmentedControl.ItemText>
                              <SegmentedControl.ItemHiddenInput />
                            </SegmentedControl.Item>
                          {/each}
                        </SegmentedControl.Control>
                      </SegmentedControl>
                    </div>

                    <!-- 5. Text Size -->
                    <div class="flex flex-col gap-1">
                      <p
                        class="text-xs font-semibold uppercase tracking-wider opacity-60"
                      >
                        Text Size
                      </p>
                      <SegmentedControl
                        value={preferences.value.theme.textScale ?? 'normal'}
                        onValueChange={(e) => {
                          preferences.value.theme.textScale = e.value;
                        }}
                      >
                        <SegmentedControl.Control
                          class="bg-surface-100 dark:bg-surface-900 card"
                        >
                          <SegmentedControl.Indicator />
                          {#each TEXT_SCALE as { name, id, description, IconComponent }}
                            <SegmentedControl.Item
                              value={id}
                              title={description}
                            >
                              <SegmentedControl.ItemText
                                class="flex items-center justify-center gap-1"
                              >
                                <!-- here -->
                                {#if IconComponent}
                                  <IconComponent />
                                {/if}
                                <span
                                  class={[
                                    id !== preferences.value.theme.textScale &&
                                      'hidden',
                                    'text-sm min-[400px]:inline md:text-base',
                                  ]}>{name}</span
                                >
                              </SegmentedControl.ItemText>
                              <SegmentedControl.ItemHiddenInput />
                            </SegmentedControl.Item>
                          {/each}
                        </SegmentedControl.Control>
                      </SegmentedControl>
                    </div>

                    <!-- 6. Icon Stroke -->
                    <div class="flex flex-col gap-1">
                      <p
                        class="text-xs font-semibold uppercase tracking-wider opacity-60"
                      >
                        Icon Style
                      </p>
                      <SegmentedControl
                        value={preferences.value.theme.iconStroke ?? 'normal'}
                        onValueChange={(e) => {
                          preferences.value.theme.iconStroke = e.value;
                        }}
                      >
                        <SegmentedControl.Control
                          class="bg-surface-100 dark:bg-surface-900 card"
                        >
                          <SegmentedControl.Indicator />
                          {#each ICON_STROKE as { name, id, description }}
                            <SegmentedControl.Item
                              value={id}
                              title={description}
                            >
                              <SegmentedControl.ItemText
                                >{name}</SegmentedControl.ItemText
                              >
                              <SegmentedControl.ItemHiddenInput />
                            </SegmentedControl.Item>
                          {/each}
                        </SegmentedControl.Control>
                      </SegmentedControl>
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

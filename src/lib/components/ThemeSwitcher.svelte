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

<script>
  import {
    HEADING_STYLE,
    ROUNDNESS,
    SKELETON_THEMES,
    SPACING,
    TEXT_SCALE,
    THEMES,
  } from '$lib/constants/page-constants';
  import { safeSlide } from '$lib/features/transitions/safeSlide';
  import { preferences } from '$lib/storage/preferences.svelte';
  import { ContrastIcon, RotateCcwIcon } from '@lucide/svelte';
  import {
    Popover,
    Portal,
    SegmentedControl,
  } from '@skeletonlabs/skeleton-svelte';
</script>

<div class="w-fit text-left">
  <Popover modal={true} autoFocus={true}>
    <Popover.Trigger class="btn hover:preset-tonal-surface">
      <ContrastIcon />
      Appearance
    </Popover.Trigger>
    <Portal>
      <Popover.Positioner>
        <Popover.Content
          class="card bg-surface-200-800 z-999 space-y-4 p-4 shadow-xl max-w-[90vw]! max-h-[70vh]! overflow-auto"
        >
          {#snippet element(attributes)}
            {#if !attributes.hidden}
              <div {...attributes} transition:safeSlide>
                <Popover.Description>
                  <div class="flex flex-col gap-4">
                    <!-- Appearance (Light / Dark / System) -->
                    <div class="flex flex-col gap-1">
                      <p
                        class="text-xs font-semibold uppercase tracking-wider opacity-60"
                      >
                        Mode<span class="sm:hidden"
                          >: {preferences.value.theme.mode}</span
                        >
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
                                <span class="sm:inline hidden">{name}</span>
                              </SegmentedControl.ItemText>
                              <SegmentedControl.ItemHiddenInput />
                            </SegmentedControl.Item>
                          {/each}
                        </SegmentedControl.Control>
                      </SegmentedControl>
                    </div>

                    <!-- Theme -->
                    <div class="flex flex-col gap-1">
                      <p
                        class="text-xs font-semibold uppercase tracking-wider opacity-60"
                      >
                        Theme
                      </p>
                      <div class="grid grid-cols-3 items-center gap-4 p-1">
                        {#each SKELETON_THEMES as { name, id, colors, description }}
                          <button
                            onclick={() => {
                              preferences.value.theme.id = id;
                            }}
                            class="btn flex flex-col w-full items-center justify-start gap-0 p-0"
                            title={description}
                          >
                            <div
                              class={[
                                'flex h-10 w-full overflow-hidden rounded-base border',
                                id === preferences.value.theme.id &&
                                  'ring-2 ring-tertiary-500',
                              ]}
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
                            <!-- <span class="text-sm opacity-70">{name}</span> -->
                          </button>
                        {/each}
                      </div>
                    </div>

                    <!-- Roundness -->
                    <div class="flex flex-col gap-1">
                      <p
                        class="text-xs font-semibold uppercase tracking-wider opacity-60"
                      >
                        Buttons<span class="sm:hidden"
                          >: {preferences.value.theme.roundness}</span
                        >
                      </p>

                      <SegmentedControl
                        value={preferences.value.theme.roundness ?? 'pill'}
                        onValueChange={(e) => {
                          preferences.value.theme.roundness = e.value;
                        }}
                      >
                        <SegmentedControl.Control
                          class="bg-surface-100 dark:bg-surface-900 card"
                        >
                          <SegmentedControl.Indicator />
                          {#each ROUNDNESS as { name, id, description }}
                            <SegmentedControl.Item
                              value={id}
                              title={description}
                            >
                              <SegmentedControl.ItemText
                                class="flex items-center justify-center gap-1"
                              >
                                {#if id === 'sharp'}
                                  <div
                                    class="border-2 border-[currentColor] w-7 h-5 rounded-none"
                                  ></div>
                                {:else if id === 'rounded'}
                                  <div
                                    class="border-2 border-[currentColor] w-7 h-5 rounded-md"
                                  ></div>
                                {:else if id === 'pill'}
                                  <div
                                    class="border-2 border-[currentColor] w-7 h-5 rounded-full"
                                  ></div>
                                {/if}
                                <span class="sm:inline hidden">{name}</span>
                              </SegmentedControl.ItemText>
                              <SegmentedControl.ItemHiddenInput />
                            </SegmentedControl.Item>
                          {/each}
                        </SegmentedControl.Control>
                      </SegmentedControl>
                    </div>

                    <!-- Heading Style -->
                    <div class="flex flex-col gap-1">
                      <p
                        class="text-xs font-semibold uppercase tracking-wider opacity-60"
                      >
                        Heading Style<span class="sm:hidden"
                          >: {preferences.value.theme.headingStyle}</span
                        >
                      </p>
                      <SegmentedControl
                        value={preferences.value.theme.headingStyle ??
                          'classic'}
                        onValueChange={(e) => {
                          preferences.value.theme.headingStyle = e.value;
                        }}
                      >
                        <SegmentedControl.Control
                          class="bg-surface-100 dark:bg-surface-900 card"
                        >
                          <SegmentedControl.Indicator />
                          {#each HEADING_STYLE as { name, id, description, opsz, wght, SOFT, WONK }}
                            <SegmentedControl.Item
                              value={id}
                              title={description}
                            >
                              <SegmentedControl.ItemText
                                class="flex items-center justify-center gap-1"
                              >
                                <span
                                  class="text-xl"
                                  style="font-family:var(--heading-font-family);font-variation-settings:'opsz' {opsz},'wght' {wght},'SOFT' {SOFT},'WONK' {WONK};"
                                  >Abcd</span
                                >
                              </SegmentedControl.ItemText>
                              <SegmentedControl.ItemHiddenInput />
                            </SegmentedControl.Item>
                          {/each}
                        </SegmentedControl.Control>
                      </SegmentedControl>
                    </div>

                    <!-- Text Size -->
                    <div class="flex flex-col gap-1">
                      <p
                        class="text-xs font-semibold uppercase tracking-wider opacity-60"
                      >
                        Text Size<span class="sm:hidden"
                          >: {preferences.value.theme.textScale}</span
                        >
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
                                {#if IconComponent}
                                  <IconComponent />
                                {/if}
                                <span class="sm:inline hidden">{name}</span>
                              </SegmentedControl.ItemText>
                              <SegmentedControl.ItemHiddenInput />
                            </SegmentedControl.Item>
                          {/each}
                        </SegmentedControl.Control>
                      </SegmentedControl>
                    </div>

                    <!-- Spacing -->
                    <div class="flex flex-col gap-1">
                      <p
                        class="text-xs font-semibold uppercase tracking-wider opacity-60"
                      >
                        Spacing<span class="sm:hidden"
                          >: {preferences.value.theme.spacing}</span
                        >
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
                                {#if IconComponent}
                                  <IconComponent />
                                {/if}
                                <span class="sm:inline hidden">{name}</span>
                              </SegmentedControl.ItemText>
                              <SegmentedControl.ItemHiddenInput />
                            </SegmentedControl.Item>
                          {/each}
                        </SegmentedControl.Control>
                      </SegmentedControl>
                    </div>

                    <button
                      class="btn hover:preset-tonal-surface w-fit"
                      onclick={() => {
                        preferences.value.theme.mode = 'system';
                        preferences.value.theme.id = 'classic';
                        preferences.value.theme.roundness = 'pill';
                        preferences.value.theme.spacing = 'normal';
                        preferences.value.theme.textScale = 'normal';
                        preferences.value.theme.headingStyle = 'classic';
                      }}
                    >
                      <RotateCcwIcon />
                      Reset All
                    </button>
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

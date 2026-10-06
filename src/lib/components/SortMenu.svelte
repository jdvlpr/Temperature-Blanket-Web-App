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

<!-- @component
  A Sort menu for a palette: the usual sorts, plus a smooth blend from warm
  to cool (or back), Reverse, and Shuffle. Choosing one calls `onsort`. Without a
  `current` sort, the menu checks the sort the colors are already in.
-->
<script lang="ts">
  import type { Color } from '$lib/types/yarn-types';
  import {
    getSortedPalette,
    PALETTE_SORTS,
    type PaletteSort,
  } from '$lib/utils/color-utils';
  import {
    ArrowDownWideNarrowIcon,
    ArrowLeftRightIcon,
    CheckIcon,
    ChevronDownIcon,
    ShuffleIcon,
  } from '@lucide/svelte';
  import { Menu, Portal } from '@skeletonlabs/skeleton-svelte';

  interface Props {
    /** The palette, to tell whether sorting by name makes sense */
    colors: Color[];
    onsort: (
      sort: Exclude<PaletteSort, 'custom'> | 'reverse' | 'shuffle',
    ) => void;
    /** The palette's current sort, to check in the menu. Left out, the
     * menu works it out from the colors' order when it opens. */
    current?: PaletteSort | null;
    triggerClass?: string;
    disabled?: boolean;
    placement?: 'top' | 'bottom-start';
  }

  let {
    colors,
    onsort,
    current,
    triggerClass = 'btn hover:bg-surface-200-800 justify-start',
    disabled = false,
    placement = 'bottom-start',
  }: Props = $props();

  let allColorsHaveNames = $derived(
    colors.length > 0 && colors.every((color) => color?.name),
  );

  let open = $state(false);
  /** The sort last chosen here, preferred when the colors fit more than one */
  let lastChosen = $state<string | null>(null);

  /** The one sort the colors are already in, worked out only while the menu
   * is open, since some sorts take a moment on long palettes */
  let alreadySorted = $derived.by(() => {
    if (current !== undefined || !open || colors.length < 2) return null;
    const key = (list: Color[]) =>
      list.map((color) => `${color?.hex}|${color?.name ?? ''}`).join(',');
    const now = key(colors);
    const matches = PALETTE_SORTS.filter(
      (sort) =>
        (allColorsHaveNames || !sort.needsNames) &&
        key(
          getSortedPalette({ palette: [...colors], sortColors: sort.value }),
        ) === now,
    ).map((sort) => sort.value as string);
    if (lastChosen && matches.includes(lastChosen)) return lastChosen;
    return matches[0] ?? null;
  });

  const isCurrent = (sort: PaletteSort) =>
    current !== undefined ? current === sort : alreadySorted === sort;

  const itemClass =
    'data-highlighted:bg-surface-200-800 flex items-center justify-start gap-2 text-left whitespace-normal data-highlighted:text-inherit';
</script>

<Menu
  positioning={{ placement }}
  onOpenChange={(details) => (open = details.open)}
  onSelect={(details) => {
    lastChosen = details.value;
    onsort(
      details.value as Exclude<PaletteSort, 'custom'> | 'reverse' | 'shuffle',
    );
  }}
>
  <Menu.Trigger class={triggerClass} title="Sort Colors" {disabled}>
    <ArrowDownWideNarrowIcon />
    <span class="flex items-center gap-1"
      >Sort <ChevronDownIcon size={18} /></span
    >
  </Menu.Trigger>
  <Portal>
    <Menu.Positioner>
      <Menu.Content class="bg-surface-100-900 z-9999 max-w-[calc(100vw-2rem)]">
        {#each PALETTE_SORTS.filter((sort) => allColorsHaveNames || !sort.needsNames) as sort (sort.value)}
          <Menu.Item value={sort.value} class={itemClass}>
            <p class="min-w-0 flex-1 text-left">{sort.label}</p>
            {#if isCurrent(sort.value)}
              <CheckIcon class="shrink-0" aria-label="Current" />
            {/if}
          </Menu.Item>
        {/each}
        <Menu.Separator />
        <Menu.Item value="reverse" class={itemClass}>
          <ArrowLeftRightIcon class="shrink-0" />
          <p class="min-w-0 flex-1 text-left">Reverse</p>
        </Menu.Item>
        <Menu.Item value="shuffle" class={itemClass}>
          <ShuffleIcon class="shrink-0" />
          <p class="min-w-0 flex-1 text-left">Shuffle</p>
        </Menu.Item>
      </Menu.Content>
    </Menu.Positioner>
  </Portal>
</Menu>

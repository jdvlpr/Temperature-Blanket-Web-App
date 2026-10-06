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
  A Sort menu for a palette: Gradient, Hue, Lightness and Name, each one way
  round, then Reverse (for the other way) and Shuffle, each with a few words
  on what it does. Choosing one calls `onsort`. The menu checks the sort the
  colors are in, either way round: `current`, or else worked out from them.
-->
<script lang="ts">
  import type { Color } from '$lib/types/yarn-types';
  import {
    getSortedPalette,
    PALETTE_SORTS,
    reverseColors,
    reversedSort,
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
  import {
    menuContentClass,
    menuItemClass,
    menuTriggerClass,
  } from '$lib/components/menu-styles';

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
    triggerClass = `${menuTriggerClass} justify-start`,
    disabled = false,
    placement = 'bottom-start',
  }: Props = $props();

  let allColorsHaveNames = $derived(
    colors.length > 0 && colors.every((color) => color?.name),
  );

  let open = $state(false);
  /** The sort last chosen here, preferred when the colors fit more than one */
  let lastChosen = $state<string | null>(null);

  /** The one sort the colors are already in, either way round, worked out
   * only while the menu is open, since some sorts take a moment on long
   * palettes */
  let alreadySorted = $derived.by(() => {
    if (current !== undefined || !open || colors.length < 2) return null;
    const key = (list: Color[]) =>
      list.map((color) => `${color?.hex}|${color?.name ?? ''}`).join(',');
    const now = key(colors);
    const matches = PALETTE_SORTS.filter((sort) => {
      if (!allColorsHaveNames && sort.needsNames) return false;
      const sorted = getSortedPalette({
        palette: [...colors],
        sortColors: sort.value,
      });
      return key(sorted) === now || key(reverseColors(sorted)) === now;
    }).map((sort) => sort.value as string);
    if (lastChosen && matches.includes(lastChosen)) return lastChosen;
    return matches[0] ?? null;
  });

  const isCurrent = (sort: PaletteSort) =>
    current !== undefined
      ? current === sort ||
        (current !== 'custom' && current === reversedSort(sort))
      : alreadySorted === sort;
</script>

<!-- A label with a few words under it, as in the palette's other menus -->
{#snippet item(label: string, details: string)}
  <div class="flex min-w-0 flex-1 flex-col text-left">
    <p>{label}</p>
    <p class="text-surface-700-300 text-xs">{details}</p>
  </div>
{/snippet}

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
      <Menu.Content class={menuContentClass}>
        {#each PALETTE_SORTS.filter((sort) => allColorsHaveNames || !sort.needsNames) as sort (sort.value)}
          <Menu.Item value={sort.value} class={menuItemClass}>
            {@render item(sort.label, sort.details)}
            <CheckIcon
              class="shrink-0 {isCurrent(sort.value) ? '' : 'invisible'}"
              aria-label={isCurrent(sort.value) ? 'Current' : undefined}
              aria-hidden={isCurrent(sort.value) ? undefined : 'true'}
            />
          </Menu.Item>
        {/each}
        <Menu.Separator />
        <Menu.Item value="reverse" class={menuItemClass}>
          <ArrowLeftRightIcon class="shrink-0" aria-hidden="true" />
          {@render item('Reverse', 'The other way round')}
        </Menu.Item>
        <Menu.Item value="shuffle" class={menuItemClass}>
          <ShuffleIcon class="shrink-0" aria-hidden="true" />
          {@render item('Shuffle', 'A random order')}
        </Menu.Item>
      </Menu.Content>
    </Menu.Positioner>
  </Portal>
</Menu>

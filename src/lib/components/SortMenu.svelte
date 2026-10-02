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
  to cool (or back), and Reverse. Choosing one calls `onsort`.
-->
<script lang="ts">
  import type { Color } from '$lib/types/yarn-types';
  import { PALETTE_SORTS, type PaletteSort } from '$lib/utils/color-utils';
  import {
    ArrowDownWideNarrowIcon,
    ArrowLeftRightIcon,
    CheckIcon,
    ChevronDownIcon,
  } from '@lucide/svelte';
  import { Menu, Portal } from '@skeletonlabs/skeleton-svelte';

  interface Props {
    /** The palette, to tell whether sorting by name makes sense */
    colors: Color[];
    onsort: (sort: Exclude<PaletteSort, 'custom'> | 'reverse') => void;
    /** The palette's current sort, to check in the menu */
    current?: PaletteSort | null;
    triggerClass?: string;
    /** Show only the icon, as in a fullscreen palette's toolbar */
    hideLabel?: boolean;
    disabled?: boolean;
    placement?: 'top' | 'bottom-start';
  }

  let {
    colors,
    onsort,
    current = null,
    triggerClass = 'btn hover:bg-surface-200-800 justify-start',
    hideLabel = false,
    disabled = false,
    placement = 'bottom-start',
  }: Props = $props();

  let allColorsHaveNames = $derived(
    colors.length > 0 && colors.every((color) => color?.name),
  );

  const itemClass =
    'data-highlighted:bg-surface-200-800 flex items-center justify-start gap-2 text-left whitespace-normal data-highlighted:text-inherit';
</script>

<Menu
  positioning={{ placement }}
  onSelect={(details) =>
    onsort(details.value as Exclude<PaletteSort, 'custom'> | 'reverse')}
>
  <Menu.Trigger class={triggerClass} title="Sort Colors" {disabled}>
    <ArrowDownWideNarrowIcon />
    {#if !hideLabel}
      <span class="flex items-center gap-1"
        >Sort <ChevronDownIcon size={18} /></span
      >
    {/if}
  </Menu.Trigger>
  <Portal>
    <Menu.Positioner>
      <Menu.Content class="bg-surface-100-900 z-9999 max-w-[calc(100vw-2rem)]">
        {#each PALETTE_SORTS.filter((sort) => allColorsHaveNames || !sort.needsNames) as sort (sort.value)}
          <Menu.Item value={sort.value} class={itemClass}>
            <p class="min-w-0 flex-1 text-left">{sort.label}</p>
            {#if current === sort.value}
              <CheckIcon class="shrink-0" aria-label="Current" />
            {/if}
          </Menu.Item>
        {/each}
        <Menu.Separator />
        <Menu.Item value="reverse" class={itemClass}>
          <ArrowLeftRightIcon class="shrink-0" />
          <p class="min-w-0 flex-1 text-left">Reverse</p>
        </Menu.Item>
      </Menu.Content>
    </Menu.Positioner>
  </Portal>
</Menu>

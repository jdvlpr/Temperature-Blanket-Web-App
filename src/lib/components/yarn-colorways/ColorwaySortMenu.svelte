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
  How to order the yarn colorway finder's results: one sort, plus Reverse,
  which stays on across sorts (except Best match, where it doesn't apply).
  The button names the sort; its icon flips upside down when reversed. Best
  match is only offered during a color search.
-->
<script lang="ts">
  import {
    ArrowDownWideNarrowIcon,
    CheckIcon,
    ChevronDownIcon,
  } from '@lucide/svelte';
  import { Menu, Portal } from '@skeletonlabs/skeleton-svelte';
  import {
    canReverse,
    COLORWAY_SORTS,
    type ColorwaySort,
  } from './colorway-utils';

  interface Props {
    current: ColorwaySort;
    reversed: boolean;
    /** Whether there's a color search, which Best match needs */
    hasColor: boolean;
    onsort: (sort: ColorwaySort) => void;
    onreverse: (reversed: boolean) => void;
  }

  let { current, reversed, hasColor, onsort, onreverse }: Props = $props();

  let sorts = $derived(
    COLORWAY_SORTS.filter((sort) => hasColor || !('needsColor' in sort)),
  );
  let isReversed = $derived(reversed && canReverse(current));
  let currentLabel = $derived(
    COLORWAY_SORTS.find((sort) => sort.value === current)?.label ?? '',
  );

  const itemClass =
    'data-highlighted:bg-surface-200-800 flex items-center justify-start gap-2 text-left data-highlighted:text-inherit data-disabled:opacity-50';
</script>

<Menu positioning={{ placement: 'bottom-start' }}>
  <Menu.Trigger class="btn hover:preset-tonal-surface">
    <!-- Flipped upside down when reversed; screen readers hear "reversed" -->
    <ArrowDownWideNarrowIcon
      size={18}
      aria-hidden="true"
      class="transition-transform motion-reduce:transition-none {isReversed
        ? '-scale-y-100'
        : ''}"
    />
    <span
      >Sort: {currentLabel}{#if isReversed}<span class="sr-only"
          >, reversed</span
        >{/if}</span
    >
    <ChevronDownIcon size={18} aria-hidden="true" />
  </Menu.Trigger>
  <Portal>
    <Menu.Positioner>
      <Menu.Content class="bg-surface-100-900 z-9999 max-w-[calc(100vw-2rem)]">
        {#each sorts as sort (sort.value)}
          <Menu.OptionItem
            type="radio"
            value={sort.value}
            checked={sort.value === current}
            onCheckedChange={() => onsort(sort.value)}
            class={itemClass}
          >
            <span class="min-w-0 flex-1">{sort.label}</span>
            <CheckIcon
              size={18}
              class="shrink-0 {sort.value === current ? '' : 'invisible'}"
              aria-hidden="true"
            />
          </Menu.OptionItem>
        {/each}
        <Menu.Separator />
        <!-- Stays open, so the check shows it took -->
        <Menu.OptionItem
          type="checkbox"
          value="reverse"
          checked={isReversed}
          disabled={!canReverse(current)}
          closeOnSelect={false}
          onCheckedChange={(checked) => onreverse(checked)}
          class={itemClass}
        >
          <span class="min-w-0 flex-1">Reverse</span>
          <CheckIcon
            size={18}
            class="shrink-0 {isReversed ? '' : 'invisible'}"
            aria-hidden="true"
          />
        </Menu.OptionItem>
      </Menu.Content>
    </Menu.Positioner>
  </Portal>
</Menu>

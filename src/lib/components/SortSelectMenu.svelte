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
  How a list is ordered: one sort from `options`, and, when `onreverse` is
  given, Reverse, which stays on across sorts (except ones `canReverse` rules
  out). The button names the sort; its icon flips upside down when reversed.
  For a sort that stays chosen, unlike SortMenu, which reorders a palette once.
-->
<script lang="ts" generics="T extends string">
  import {
    menuContentClass,
    menuItemClass,
    menuTriggerClass,
  } from '$lib/components/menu-styles';
  import {
    ArrowDownWideNarrowIcon,
    CheckIcon,
    ChevronDownIcon,
  } from '@lucide/svelte';
  import { Menu, Portal } from '@skeletonlabs/skeleton-svelte';

  interface Props {
    options: readonly { value: T; label: string }[];
    current: T;
    onsort: (sort: T) => void;
    reversed?: boolean;
    /** Offers Reverse when given */
    onreverse?: (reversed: boolean) => void;
    /** Whether a sort can be reversed; all can by default */
    canReverse?: (sort: T) => boolean;
    disabled?: boolean;
    /** Names the menu on its button, e.g. "Sort: Newest" */
    label?: string;
  }

  let {
    options,
    current,
    onsort,
    reversed = false,
    onreverse,
    canReverse = () => true,
    disabled = false,
    label = 'Sort',
  }: Props = $props();

  let isReversed = $derived(!!onreverse && reversed && canReverse(current));
  let currentLabel = $derived(
    options.find((option) => option.value === current)?.label ?? '',
  );
</script>

<Menu positioning={{ placement: 'bottom-start' }}>
  <Menu.Trigger class={menuTriggerClass} {disabled}>
    <!-- Flipped upside down when reversed; screen readers hear "reversed" -->
    <ArrowDownWideNarrowIcon
      size={18}
      aria-hidden="true"
      class="transition-transform motion-reduce:transition-none {isReversed
        ? '-scale-y-100'
        : ''}"
    />
    <span
      >{label}: {currentLabel}{#if isReversed}<span class="sr-only"
          >, reversed</span
        >{/if}</span
    >
    <ChevronDownIcon size={18} aria-hidden="true" />
  </Menu.Trigger>
  <Portal>
    <Menu.Positioner>
      <Menu.Content class={menuContentClass}>
        {#each options as option (option.value)}
          <Menu.OptionItem
            type="radio"
            value={option.value}
            checked={option.value === current}
            onCheckedChange={() => onsort(option.value)}
            class={menuItemClass}
          >
            <span class="min-w-0 flex-1">{option.label}</span>
            <CheckIcon
              size={18}
              class="shrink-0 {option.value === current ? '' : 'invisible'}"
              aria-hidden="true"
            />
          </Menu.OptionItem>
        {/each}
        {#if onreverse}
          <Menu.Separator />
          <!-- Stays open, so the check shows it took -->
          <Menu.OptionItem
            type="checkbox"
            value="reverse"
            checked={isReversed}
            disabled={!canReverse(current)}
            closeOnSelect={false}
            onCheckedChange={(checked) => onreverse(checked)}
            class={menuItemClass}
          >
            <span class="min-w-0 flex-1">Reverse</span>
            <CheckIcon
              size={18}
              class="shrink-0 {isReversed ? '' : 'invisible'}"
              aria-hidden="true"
            />
          </Menu.OptionItem>
        {/if}
      </Menu.Content>
    </Menu.Positioner>
  </Portal>
</Menu>

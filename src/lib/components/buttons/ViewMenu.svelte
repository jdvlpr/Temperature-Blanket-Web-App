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
  Whether a list shows as a grid or as rows, as a menu styled like the Sort
  menu it often sits beside. The button names the view and shows its icon.
  With `fillOption`, it also has Fill with color, which fills each card or row
  with its yarn's color everywhere it's offered.
-->
<script lang="ts">
  import MenuCheckbox from '$lib/components/buttons/MenuCheckbox.svelte';
  import { fillWithColor } from '$lib/components/yarn-colorways/fill-with-color';
  import {
    menuContentClass,
    menuItemClass,
    menuTriggerClass,
  } from '$lib/components/menu-styles';
  import type { PageLayout } from '$lib/types/page-types';
  import {
    CheckIcon,
    ChevronDownIcon,
    LayoutGridIcon,
    LayoutListIcon,
  } from '@lucide/svelte';
  import { Menu, Portal } from '@skeletonlabs/skeleton-svelte';
  import type { Snippet } from 'svelte';

  let {
    value = $bindable('grid'),
    fillOption = false,
    children,
  }: {
    value: PageLayout;
    /** Offer Fill with color (one setting, shared by every list that offers it) */
    fillOption?: boolean;
    children?: Snippet;
  } = $props();

  const views = [
    { value: 'grid', label: 'Grid', icon: LayoutGridIcon },
    { value: 'list', label: 'List', icon: LayoutListIcon },
  ] as const;

  let current = $derived(
    views.find((view) => view.value === value) ?? views[0],
  );
</script>

<Menu positioning={{ placement: 'bottom-start' }}>
  <Menu.Trigger class={menuTriggerClass}>
    <current.icon size={18} aria-hidden="true" />
    <span>View: {current.label}</span>
    <ChevronDownIcon size={18} aria-hidden="true" />
  </Menu.Trigger>
  <Portal>
    <Menu.Positioner>
      <Menu.Content class={menuContentClass}>
        {#each views as view (view.value)}
          <Menu.OptionItem
            type="radio"
            value={view.value}
            checked={view.value === current.value}
            onCheckedChange={() => (value = view.value)}
            class={menuItemClass}
          >
            <view.icon size={18} class="shrink-0" aria-hidden="true" />
            <span class="min-w-0 flex-1">{view.label}</span>
            <CheckIcon
              size={18}
              class="shrink-0 {view.value === current.value ? '' : 'invisible'}"
              aria-hidden="true"
            />
          </Menu.OptionItem>
        {/each}
        {#if fillOption || children}
          <Menu.Separator />
        {/if}
        {#if fillOption}
          <!-- Stays open, so the check shows it took -->
          <Menu.OptionItem
            type="checkbox"
            value="fill"
            checked={fillWithColor.on}
            closeOnSelect={false}
            onCheckedChange={(checked) => (fillWithColor.on = checked)}
            class={menuItemClass}
          >
            <span class="flex min-w-0 flex-1 flex-col">
              <span>Fill with color</span>
              <span class="text-surface-700-300 text-xs"
                >Items with colored backgrounds</span
              >
            </span>
            <MenuCheckbox checked={fillWithColor.on} />
          </Menu.OptionItem>
        {/if}
        {@render children?.()}
      </Menu.Content>
    </Menu.Positioner>
  </Portal>
</Menu>

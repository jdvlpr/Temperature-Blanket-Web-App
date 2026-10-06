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
  Whether the yarn colorway finder shows its results as a grid of cards or a
  list of rows, as a menu styled like the Sort menu beside it. The button
  names the view and shows its icon.
-->
<script lang="ts">
  import {
    CheckIcon,
    ChevronDownIcon,
    LayoutGridIcon,
    LayoutListIcon,
  } from '@lucide/svelte';
  import { Menu, Portal } from '@skeletonlabs/skeleton-svelte';

  type View = 'grid' | 'list';

  let { value = $bindable('grid') }: { value: View } = $props();

  const views = [
    { value: 'grid', label: 'Grid', icon: LayoutGridIcon },
    { value: 'list', label: 'List', icon: LayoutListIcon },
  ] as const;

  let current = $derived(
    views.find((view) => view.value === value) ?? views[0],
  );

  const itemClass =
    'data-highlighted:bg-surface-200-800 flex items-center justify-start gap-2 text-left data-highlighted:text-inherit';
</script>

<Menu positioning={{ placement: 'bottom-start' }}>
  <Menu.Trigger class="btn hover:bg-surface-200-800">
    <current.icon size={18} aria-hidden="true" />
    <span>View: {current.label}</span>
    <ChevronDownIcon size={18} aria-hidden="true" />
  </Menu.Trigger>
  <Portal>
    <Menu.Positioner>
      <Menu.Content class="bg-surface-100-900 z-9999 max-w-[calc(100vw-2rem)]">
        {#each views as view (view.value)}
          <Menu.OptionItem
            type="radio"
            value={view.value}
            checked={view.value === value}
            onCheckedChange={() => (value = view.value)}
            class={itemClass}
          >
            <view.icon size={18} class="shrink-0" aria-hidden="true" />
            <span class="min-w-0 flex-1">{view.label}</span>
            <CheckIcon
              size={18}
              class="shrink-0 {view.value === value ? '' : 'invisible'}"
              aria-hidden="true"
            />
          </Menu.OptionItem>
        {/each}
      </Menu.Content>
    </Menu.Positioner>
  </Portal>
</Menu>

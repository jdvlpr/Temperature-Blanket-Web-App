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
  A weather table's View menu: Show Colors (one setting for every weather
  table), and with `values`, which weather values show — the same setting as
  the names under the Weather step's chart, so it changes the chart, the
  summary and every table.
-->
<script lang="ts">
  import MenuCheckbox from '#lib/components/buttons/MenuCheckbox.svelte';
  import {
    menuContentClass,
    menuItemClass,
    menuPositioning,
    menuTriggerClass,
  } from '#lib/components/menu-styles.js';
  import { weather } from '#lib/state/weather-state.svelte.js';
  import type { WeatherParam } from '#lib/types/gauge-types.js';
  import { ChevronDownIcon, EyeIcon, PaletteIcon } from '@lucide/svelte';
  import { Menu, Portal } from '@skeletonlabs/skeleton-svelte';
  import { showColors } from './grid-color.svelte.js';
  import { paramLabel } from './weather-columns.js';

  let {
    values,
  }: {
    /** The values it can show or hide; none for just Show Colors */
    values?: readonly WeatherParam['id'][];
  } = $props();

  const shownCount = $derived(
    values?.filter((id) => weather.table.showParameters[id]).length ?? 0,
  );
</script>

<Menu positioning={menuPositioning('bottom-start')}>
  <Menu.Trigger class={menuTriggerClass}>
    <EyeIcon aria-hidden="true" />
    <span>View</span>
    <ChevronDownIcon class="icon-sm" aria-hidden="true" />
  </Menu.Trigger>
  <Portal>
    <Menu.Positioner>
      <Menu.Content class={menuContentClass}>
        <!-- Each stays open, so the check shows it took -->
        <Menu.OptionItem
          type="checkbox"
          value="colors"
          checked={showColors.value}
          closeOnSelect={false}
          onCheckedChange={(checked) => (showColors.value = checked)}
          class={menuItemClass}
        >
          <span class="flex min-w-0 flex-1 items-center gap-2 text-left">
            <PaletteIcon class="shrink-0" aria-hidden="true" />
            <span class="flex min-w-0 flex-col">
              <span>Show Colors</span>
              <span class="text-surface-700-300 text-xs"
                >Each value's color, "Color 3"</span
              >
            </span>
          </span>
          <MenuCheckbox checked={showColors.value} />
        </Menu.OptionItem>
        {#if values?.length}
          <Menu.Separator />
          <Menu.ItemGroup>
            <Menu.ItemGroupLabel class="px-3 pt-1 text-xs font-bold opacity-70"
              >Values</Menu.ItemGroupLabel
            >
            {#each values as id (id)}
              {@const on = !!weather.table.showParameters[id]}
              <Menu.OptionItem
                type="checkbox"
                value={id}
                checked={on}
                closeOnSelect={false}
                disabled={on && shownCount === 1}
                onCheckedChange={(checked) =>
                  (weather.table.showParameters[id] = checked)}
                class={menuItemClass}
              >
                <span class="flex min-w-0 flex-1 items-center gap-2 text-left">
                  <!-- Its line in the chart -->
                  <span
                    class="inline-block h-0.5 w-4 shrink-0 rounded-full"
                    style:background-color={id === 'moon'
                      ? 'transparent'
                      : `var(--${id})`}
                    aria-hidden="true"
                  ></span>
                  {paramLabel(id)}
                </span>
                <MenuCheckbox checked={on} />
              </Menu.OptionItem>
            {/each}
            <p class="text-surface-700-300 max-w-56 px-3 pt-1 pb-2 text-xs">
              Also in the chart and the summary above.
            </p>
          </Menu.ItemGroup>
        {/if}
      </Menu.Content>
    </Menu.Positioner>
  </Portal>
</Menu>

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
  Whether weather is grouped by day or by week, and while it's by week, the
  day weeks start on.
-->
<script lang="ts">
  import ChoiceMenu from '#lib/components/buttons/ChoiceMenu.svelte';
  import MenuSubmenu from '#lib/components/buttons/MenuSubmenu.svelte';
  import { menuItemClass } from '#lib/components/menu-styles.js';
  import { DAYS_OF_THE_WEEK } from '#lib/constants/weather-constants.js';
  import { weather } from '#lib/state/weather-state.svelte.js';
  import { CalendarDaysIcon, CheckIcon } from '@lucide/svelte';
  import { Menu } from '@skeletonlabs/skeleton-svelte';

  const options = [
    { value: 'day', label: 'Daily' },
    { value: 'week', label: 'Weekly' },
  ] as const;

  let startDay = $derived(
    DAYS_OF_THE_WEEK.find((n) => n.value === weather.monthGroupingStartDay)
      ?.label ?? '',
  );
</script>

<ChoiceMenu
  {options}
  value={weather.grouping}
  onchange={(grouping) => weather.setGrouping(grouping)}
  label="Grouping"
  icon={CalendarDaysIcon}
>
  {#if weather.grouping === 'week'}
    <MenuSubmenu label="Weeks Start On" current={startDay}>
      {#each DAYS_OF_THE_WEEK as { value, label } (value)}
        <Menu.OptionItem
          type="radio"
          value="week-start-{value}"
          checked={value === weather.monthGroupingStartDay}
          onCheckedChange={() => (weather.monthGroupingStartDay = value)}
          class={menuItemClass}
        >
          <span class="min-w-0 flex-1">{label}</span>
          <CheckIcon
            class="shrink-0 {value === weather.monthGroupingStartDay
              ? ''
              : 'invisible'}"
            aria-hidden="true"
          />
        </Menu.OptionItem>
      {/each}
    </MenuSubmenu>
  {/if}
</ChoiceMenu>

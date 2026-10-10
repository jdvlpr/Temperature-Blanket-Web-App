<!-- Copyright (c) 2024 - 2026, Thomas (https://github.com/jdvlpr)

This file is part of Temperature-Blanket-Web-App.

Temperature-Blanket-Web-App is free software: you can redistribute it and/or modify it
under the terms of the GNU General Public License as published by the Free Software Foundation,
either version 3 of the License, or (at your option) any later version.

Temperature-Blanket-Web-App is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY;
without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.
See the GNU General Public License for more details.

You should have received a copy of the GNU General Public License along with Temperature-Blanket-Web-App.

<!-- @component
  Whether weather is grouped by day or by week.
-->
<script lang="ts">
  import ChoiceMenu from '#lib/components/buttons/ChoiceMenu.svelte';
  import { weather } from '#lib/state/weather-state.svelte.js';
  import { CalendarDaysIcon } from '@lucide/svelte';

  const options = [
    { value: 'day', label: 'Daily' },
    { value: 'week', label: 'Weekly' },
  ] as const;
</script>

<ChoiceMenu
  {options}
  value={weather.grouping}
  onchange={(grouping) => weather.setGrouping(grouping)}
  label="Grouping"
  icon={CalendarDaysIcon}
/>

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
  Which units weather is shown in, metric or imperial.
-->
<script lang="ts">
  import ChoiceMenu from '$lib/components/buttons/ChoiceMenu.svelte';
  import { UNIT_LABELS } from '$lib/constants/weather-constants';
  import { preferences } from '$lib/storage/preferences.svelte';
  import type { Unit } from '$lib/types/weather-types';
  import { RulerIcon } from '@lucide/svelte';

  const options = (['metric', 'imperial'] as const).map((unit) => {
    const labels = `${UNIT_LABELS.temperature[unit]} / ${UNIT_LABELS.height[unit]}`;
    return {
      value: unit,
      label: unit === 'metric' ? 'Metric' : 'Imperial',
      short: labels,
      details: labels,
    };
  });
</script>

<ChoiceMenu
  {options}
  value={preferences.value.units}
  onchange={(units: Unit) => (preferences.value.units = units)}
  label="Units"
  icon={RulerIcon}
/>

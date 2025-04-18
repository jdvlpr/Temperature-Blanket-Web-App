<!-- Copyright (c) 2024, Thomas (https://github.com/jdvlpr)

This file is part of Temperature-Blanket-Web-App.

Temperature-Blanket-Web-App is free software: you can redistribute it and/or modify it
under the terms of the GNU General Public License as published by the Free Software Foundation, 
either version 3 of the License, or (at your option) any later version.

Temperature-Blanket-Web-App is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; 
without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. 
See the GNU General Public License for more details.

You should have received a copy of the GNU General Public License along with Temperature-Blanket-Web-App. 
If not, see <https://www.gnu.org/licenses/>. -->

<script lang="ts">
  import NumberInputButton from '$lib/components/buttons/NumberInputButton.svelte';
  import ToggleSwitchGroup from '$lib/components/buttons/ToggleSwitchGroup.svelte';
  import { gauges, weather } from '$lib/state';
  import { capitalizeFirstLetter } from '$lib/utils/other-utils';
  import { pluralize } from '$lib/utils/string-utils';
  import { chevronsPreview } from './state.svelte';

  let targets = $derived(gauges.allCreated.map((n) => n.targets).flat());
</script>

{#if chevronsPreview.details.rows}
  <p class="w-full italic">
    {chevronsPreview.details.rows} rows. The length of the side of a chevron is {chevronsPreview
      .settings.chevronSideLength}
    {pluralize('stitch', chevronsPreview.settings.chevronSideLength, 'es')}.
  </p>
{/if}

<div
  class="preset-outlined-surface-300-700 card flex flex-col items-start gap-4 p-4"
>
  <p class="text-2xl font-bold">Settings</p>

  <div class="text-left">
    <ToggleSwitchGroup
      groupLabel={`Color Each Row Using the ${capitalizeFirstLetter(weather.grouping)}'s`}
      {targets}
      bind:value={chevronsPreview.settings.selectedTargets}
    />
  </div>

  <NumberInputButton
    bind:value={chevronsPreview.settings.chevronsPerRow}
    title="Chevrons Per Row"
    icon={true}
  />

  <NumberInputButton
    bind:value={chevronsPreview.settings.chevronSideLength}
    title="Chevron Side Length"
    icon={true}
  />
</div>

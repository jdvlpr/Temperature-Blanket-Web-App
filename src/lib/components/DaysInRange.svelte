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
  import WeatherTable from '$lib/components/modals/WeatherTable.svelte';
  import { dialog, weather } from '$lib/state';
  import type {
    GaugeAttributes,
    GaugeRange,
    GaugeSettingsType,
  } from '$lib/types';
  import { getDaysInRange, getDaysPercent, pluralize } from '$lib/utils';

  let isModal = $derived(dialog.opened);

  type Props = {
    range: GaugeRange;
    rangeOptions: GaugeSettingsType['rangeOptions'];
    targets: GaugeAttributes['targets'];
    gaugeUnitType: GaugeAttributes['unit']['type'];
  };
  let { range, rangeOptions, targets, gaugeUnitType }: Props = $props();

  let noDaysInRange = $derived(() =>
    targets.every(
      (n) =>
        !getDaysInRange({
          id: n.id,
          range,
          direction: rangeOptions?.direction,
          includeFromValue: rangeOptions?.includeFromValue,
          includeToValue: rangeOptions?.includeToValue,
          gaugeUnitType,
        })?.length,
    ),
  );
</script>

{#if !noDaysInRange()}
  {#each targets as { id, icon, gaugeLabel }}
    {@const daysInRange = getDaysInRange({
      id,
      range,
      direction: rangeOptions?.direction,
      includeFromValue: rangeOptions?.includeFromValue,
      includeToValue: rangeOptions?.includeToValue,
      gaugeUnitType,
    })}
    {#if !isModal}
      <button
        type="button"
        disabled={!daysInRange?.length}
        class="btn hover:preset-tonal-surface h-auto"
        onclick={() =>
          dialog.trigger({
            type: 'component',
            component: {
              ref: WeatherTable,
              props: {
                weatherData: daysInRange,
              },
            },
          })}
      >
        <span class="flex flex-col items-start justify-center">
          <p class="text-xs">
            {icon}
            {gaugeLabel}
          </p>
          <p>
            {daysInRange.length}
            {pluralize(weather.grouping, daysInRange.length)}
          </p>
          <p class="text-xs opacity-50">
            {getDaysPercent(daysInRange.length)}%
          </p>
        </span>
      </button>
    {:else}
      <div class="flex flex-col items-start justify-center">
        <p class="text-xs">
          {icon}
          {gaugeLabel}
        </p>
        <p>
          {daysInRange.length}
          {pluralize(weather.grouping, daysInRange.length)}
        </p>
        <p class="text-xs opacity-50">{getDaysPercent(daysInRange.length)}%</p>
      </div>
    {/if}
  {/each}
{:else}
  <p class="px-4 py-2 italic">No days in range</p>
{/if}

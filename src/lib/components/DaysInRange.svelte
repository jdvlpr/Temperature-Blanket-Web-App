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

<script>
  import WeatherTable from '$lib/components/modals/WeatherTable.svelte';
  import { modal, weatherGrouping } from '$lib/state';
  import { getDaysInRange, getDaysPercent, pluralize } from '$lib/utils';
  import { getModalStore } from '@skeletonlabs/skeleton';

  const modalStore = getModalStore();
  const isModal = !!$modalStore[0];

  let { range, rangeOptions, gaugeAttributes } = $props();

  let noDaysInRange = $derived(() =>
    gaugeAttributes.targets.every(
      (n) =>
        !getDaysInRange({
          id: n.id,
          range,
          direction: rangeOptions?.direction,
          includeFromValue: rangeOptions?.includeFromValue,
          includeToValue: rangeOptions?.includeToValue,
        })?.length,
    ),
  );
</script>

{#if !noDaysInRange()}
  {#each gaugeAttributes.targets as { id, icon, gaugeLabel }}
    {@const daysInRange = getDaysInRange({
      id,
      range,
      direction: rangeOptions.direction,
      includeFromValue: rangeOptions.includeFromValue,
      includeToValue: rangeOptions.includeToValue,
    })}
    {#if !isModal}
      <button
        type="button"
        disabled={!daysInRange?.length}
        class="btn bg-secondary-hover-token"
        onclick={() =>
          modal.state.trigger({
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
          <span class="text-xs">
            {icon}
            {gaugeLabel}
          </span>
          <span>
            {daysInRange.length}
            {pluralize(weatherGrouping.value, daysInRange.length)} ({getDaysPercent(
              daysInRange.length,
            )}%)
          </span>
        </span>
      </button>
    {:else}
      <div class="flex flex-col items-start justify-center">
        <span class="text-xs">
          {icon}
          {gaugeLabel}
        </span>
        <span>
          {daysInRange.length}
          {pluralize(weatherGrouping.value, daysInRange.length)} ({getDaysPercent(
            daysInRange.length,
          )}%)
        </span>
      </div>
    {/if}
  {/each}
{:else}
  <p class="italic py-2 px-4">No days in range</p>
{/if}

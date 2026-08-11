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

<script lang="ts">
  import type { GaugeRange, GaugeRangeOptions } from '$lib/types/gauge-types';
  import GaugeSettings from '$lib/components/modals/GaugeSettings.svelte';
  import { dialog } from '$lib/state/page-state.svelte';
  import { gauges } from '$lib/state/gauges-state.svelte';
  import { preferences } from '$lib/storage/preferences.svelte';

  let { index } = $props();

  function onSaveRangeOptinos(e: {
    ranges: GaugeRange[];
    rangeOptions: GaugeRangeOptions;
  }) {
    if (gauges.activeGauge) {
      gauges.activeGauge.ranges = e.ranges;
      gauges.activeGauge.rangeOptions = e.rangeOptions;
    }
  }
</script>

{#if gauges.activeGauge && gauges.activeGauge.rangeOptions && gauges.activeGauge.ranges}
  <span class="range-input-container">
    <button
      class="btn hover:preset-tonal-surface h-auto"
      title="Adjust Range"
      onclick={(e: Event) => {
        const target = e.target as HTMLElement;
        let currentElement: HTMLElement | null = target;
        let wasToClicked = false;

        while (currentElement) {
          if (currentElement.id === `range-${index}-to`) {
            wasToClicked = true;
            break;
          }
          currentElement = currentElement.parentElement;
        }

        const focusOn = wasToClicked ? 'to' : 'from';

        dialog.trigger({
          type: 'component',
          component: {
            ref: GaugeSettings,
            props: {
              index,
              focusOn,
              onSave: onSaveRangeOptinos,
            },
          },
          options: {
            size: 'large',
          },
        });
      }}
    >
      <span class="flex flex-col text-left" id="range-{index}-from">
        <div class="flex flex-col">
          <p class="text-xs">From</p>
          <p class="-mt-1 text-xs opacity-50">
            {gauges.activeGauge.rangeOptions.includeFromValue
              ? 'Including'
              : 'Excluding'}
          </p>
        </div>

        <span class="flex items-start"
          ><span class="text-lg">
            {#if 'from' in gauges.activeGauge.ranges[index]}
              {gauges.activeGauge.ranges[index].from}
            {/if}
          </span>
          <span class="text-xs"
            >{gauges.activeGauge.unit.label[
              preferences.value.units ?? 'metric'
            ]}</span
          ></span
        ></span
      >
      <span class="flex flex-col text-left" id="range-{index}-to">
        <div class="flex flex-col gap-0">
          <span class="text-xs">To </span>
          <span class="-mt-1 text-xs opacity-50"
            >{gauges.activeGauge.rangeOptions.includeToValue
              ? 'Including'
              : 'Excluding'}</span
          >
        </div>

        <span class="flex items-start"
          ><span class="text-lg">
            {#if 'to' in gauges.activeGauge.ranges[index]}
              {gauges.activeGauge.ranges[index].to}
            {/if}
          </span>
          <span class="text-xs"
            >{gauges.activeGauge.unit.label[
              preferences.value.units ?? 'metric'
            ]}</span
          ></span
        ></span
      ></button
    >
  </span>
{/if}

<style>
  .range-input-container {
    display: flex;
    align-items: center;
    flex: 1 0 auto;
    margin: 0 5px;
    justify-content: center;
    flex-basis: 110px;
  }
</style>

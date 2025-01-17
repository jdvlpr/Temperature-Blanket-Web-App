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
  import { allGaugesAttributes, gauges, project, weather } from '$lib/state';
  import { downloadPDF } from '$lib/utils';
  import { onMount } from 'svelte';
  import Gauge from './Gauge.svelte';
  import RangeOptionsButton from './buttons/RangeOptionsButton.svelte';
  import GaugeCustomizer from './GaugeCustomizer.svelte';

  onMount(() => {
    setupAvailableGauges();
  });

  function setupAvailableGauges() {
    allGaugesAttributes.forEach((gauge) => {
      gauge.targets.forEach((target) => {
        if (
          weather.data?.some((day) => day[target.id][project.units] !== null)
        ) {
          // For each of the gauge's weather parameter targets, check to see if there is any data, and if so setup the default gauge
          gauges.addToAvailable({
            id: gauge.id,
            label: gauge.label,
          });
        } else {
          // Otherwise remove the gauge. Weather data may no longer be available for a certain gauge if, for example, the user changes the location
          gauges.removeFromAvailable(gauge.id);
        }
      });
    });

    // If the active gauge is no longer available, set it to the first available
    if (!gauges.allCreated.find((gauge) => gauge.id === gauges.activeGaugeId))
      gauges.activeGaugeId = gauges.allCreated[0]?.id;
  }

  // If an initially empty weather parameter gets some user-created data, add the available gauge to the options
  $effect(() => {
    weather.data;
    setupAvailableGauges();
  });
</script>

<div class="inline-flex justify-center items-center gap-2 mb-2 mt-3">
  <label class="label">
    <select
      class="select w-fit"
      id="gauges-select"
      bind:value={gauges.activeGaugeId}
      onchange={(e) => {
        const id = e.target.value;

        if (!gauges.allCreated.map((gauge) => gauge.id).includes(id)) {
          // If the gauge is not created yet, then set it up
          gauges.addById(id);
        }
      }}
    >
      {#each gauges.allAvailable as { id, label }}
        <option value={id} selected={gauges.activeGaugeId === id}>
          {#if !gauges.allCreated.map((gauge) => gauge.id).includes(id)}
            Add
          {/if}
          {label}
        </option>
      {/each}
    </select>
  </label>
</div>

{#if gauges.activeGauge && !gauges.activeGauge.calculating}
  {#if gauges.activeGauge.id !== 'temp'}
    <!-- If this is not the default temperature gauge and we're on the project planner page -->
    <button
      class="btn bg-secondary-hover-token justify-start gap-1 top-2 relative max-sm:mb-2"
      title="Delete {gauges.activeGauge.label}"
      onclick={() => {
        gauges.remove(gauges.activeGauge.id);
      }}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        stroke-width="1.5"
        stroke="currentColor"
        class="w-6 h-6 mr-1"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"
        />
      </svg>
      Delete {gauges.activeGauge.label}
    </button>
  {/if}

  <Gauge bind:gauge={gauges.activeGauge} />

  <div class="mt-2 mb-4">
    <RangeOptionsButton />
  </div>

  {#key gauges.activeGauge.colors}
    <GaugeCustomizer bind:gauge={gauges.activeGauge} />
  {/key}
{/if}

<div
  class="flex flex-wrap gap-2 justify-center mt-4 mb-2 lg:mb-4 px-4 py-2 shadow-inner rounded-container-token variant-soft-surface"
>
  <button
    class="btn bg-secondary-hover-token whitespace-pre-wrap"
    onclick={downloadPDF}
    title="Download PDF File"
  >
    <span class="">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        stroke-width="1.5"
        stroke="currentColor"
        class="w-6 h-6 inline bottom-1 relative"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          d="M9 8.25H7.5a2.25 2.25 0 00-2.25 2.25v9a2.25 2.25 0 002.25 2.25h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25H15M9 12l3 3m0 0l3-3m-3 3V2.25"
        />
      </svg> Download Gauges and Weather Data (PDF)
    </span>
  </button>
</div>

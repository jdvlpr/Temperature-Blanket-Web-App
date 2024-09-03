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
  import DaytimeGauge from '$lib/components/gauges/DaytimeGauge.svelte';
  import RainGauge from '$lib/components/gauges/RainGauge.svelte';
  import SnowGauge from '$lib/components/gauges/SnowGauge.svelte';
  import TemperatureGauge from '$lib/components/gauges/TemperatureGauge.svelte';
  import { gaugeProperties, gaugesState, units, weather } from '$lib/stores';
  import { downloadPDF } from '$lib/utils';
  import { onMount } from 'svelte';

  onMount(() => {
    setupAvailableGauges();
  });

  // If an initially empty weather parameter gets some user-created data, add the available gauge to the options
  $: $weather, setupAvailableGauges();

  $: gaugesToAdd = $gaugesState.available.filter(
    (gauge) =>
      gauge !== $gaugesState.active && !$gaugesState.created.includes(gauge),
  );

  function setupAvailableGauges() {
    $gaugeProperties.forEach((gauge) => {
      gauge.targets.forEach((target) => {
        if ($weather?.some((day) => day[target.id][$units] !== null)) {
          gaugesState.addAvailable(gauge.id);
          $gaugesState.active ||= gauge.id;
        } else gaugesState.removeAvailable(gauge.id);
      });
    });
  }

  function getGaugeLabel(id) {
    return $gaugeProperties.find((gauge) => gauge.id === id)?.label;
  }
</script>

<div class="inline-flex justify-center items-center gap-2 mb-2 mt-3">
  {#key $gaugesState}
    <label class="label">
      <span />
      <select
        class="select w-fit"
        id="gauges-select"
        value={$gaugesState.active}
        on:change={(e) => {
          gaugesState.addCreated(e.target.value);
        }}
      >
        {#each $gaugesState.created as id}
          <option value={id} selected={$gaugesState.active === id}
            >{getGaugeLabel(id)}</option
          >
        {/each}
        {#each gaugesToAdd as id}
          <option value={id}>New {getGaugeLabel(id)}</option>
        {/each}
      </select>
    </label>
  {/key}
</div>

{#if $gaugesState.active === 'temp'}
  <TemperatureGauge />
{:else if $gaugesState.active === 'prcp'}
  <RainGauge />
{:else if $gaugesState.active === 'snow'}
  <SnowGauge />
{:else if $gaugesState.active === 'dayt'}
  <DaytimeGauge />
{/if}

<div
  class="flex flex-wrap gap-2 justify-center mt-4 mb-2 lg:mb-4 px-4 py-2 shadow-inner rounded-container-token variant-soft-surface"
>
  <button
    class="btn bg-secondary-hover-token whitespace-pre-wrap"
    on:click={downloadPDF}
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

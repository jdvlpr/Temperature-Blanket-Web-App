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
  import {
    allGaugesAttributes,
    gauges,
    localState,
    modal,
    weather,
  } from '$lib/state';
  import { downloadPDF } from '$lib/utils';
  import { CirclePlusIcon, DownloadIcon, Trash2Icon } from '@lucide/svelte';
  import { onMount, tick } from 'svelte';
  import RangeOptionsButton from './buttons/RangeOptionsButton.svelte';
  import Gauge from './Gauge.svelte';
  import GaugeCustomizer from './GaugeCustomizer.svelte';

  onMount(() => {
    setupAvailableGauges();
  });

  function setupAvailableGauges() {
    allGaugesAttributes.forEach((gauge) => {
      gauge.targets.forEach((target) => {
        if (
          weather.data?.some((day) => {
            if (target.type === 'category') return day[target.id] !== null;
            else return day[target.id][localState.value.units] !== null;
          })
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

  // If an initially empty weather parameter gets some user-created data, or if the user searches for a different location,
  // then add the available gauge to the options
  $effect(() => {
    weather.data;
    tick().then(() => {
      setupAvailableGauges();
    });
  });
</script>

<div class="relative w-full overflow-auto">
  <div
    class="rounded-container flex w-full justify-around gap-2 py-2 max-md:overflow-x-scroll"
  >
    {#each gauges.allAvailable as { id, label }}
      <button
        class={[
          'btn ',
          gauges.activeGaugeId === id ? 'preset-filled' : 'hover:preset-tonal',
        ]}
        onclick={() => {
          if (!gauges.allCreated.map((gauge) => gauge.id).includes(id)) {
            // If the gauge is not created yet, then set it up
            modal.trigger({
              type: 'confirm',
              title: `Add a ${label}?`,
              body: `This will add a new gauge to your project. You can delete it later.`,
              response: (response) => {
                if (response) gauges.addById(id);
              },
            });
          } else {
            gauges.activeGaugeId = id;
          }
        }}
      >
        {#if !gauges.allCreated.map((gauge) => gauge.id).includes(id)}
          <CirclePlusIcon />
        {/if}
        {label}

        {#if id === 'moon'}
          <div
            class={[
              'badge bg-tertiary-50-950',
              gauges.activeGaugeId === id && 'text-tertiary-contrast-50-950',
            ]}
          >
            Beta
          </div>
        {/if}
      </button>
    {/each}
  </div>
</div>
{#if gauges.activeGauge && !gauges.activeGauge?.calculating}
  {#if gauges.activeGauge.id !== 'temp'}
    <!-- If this is not the default temperature gauge and we're on the project planner page -->
    <div class="mb-4 flex w-full justify-center sm:mb-6">
      <button
        class="btn hover:preset-tonal relative top-2 justify-start max-sm:mb-2"
        title="Delete {gauges.activeGauge.label}"
        onclick={() => {
          gauges.remove(gauges.activeGauge.id);
        }}
      >
        <Trash2Icon />
        Delete {gauges.activeGauge.label}
      </button>
    </div>
  {/if}

  {#if gauges.activeGauge?.isStatic}
    <p class="text-sm">
      This gauge has a fixed number of colors for the eight phases of the moon.
      You can only edit the colors individually.
    </p>
  {/if}

  <Gauge bind:gauge={gauges.activeGauge} />

  <div class={['mt-4 mb-2', gauges.activeGauge?.isStatic && 'hidden']}>
    <RangeOptionsButton />
  </div>

  {#key gauges.activeGauge.colors}
    <GaugeCustomizer bind:gauge={gauges.activeGauge} />
  {/key}
{/if}

<div
  class="rounded-container bg-surface-100 dark:bg-surface-900 mt-4 flex flex-wrap justify-center gap-2 px-4 py-2 shadow-inner"
>
  <button
    class="btn hover:preset-tonal h-auto text-left whitespace-pre-wrap"
    onclick={downloadPDF}
    title="Download PDF File"
  >
    <DownloadIcon /> Download Gauges and Weather Data (PDF)
  </button>
</div>

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
  import { dialog, gauges, toast } from '$lib/state';
  import { FilePlusIcon, LoaderCircleIcon, XIcon } from '@lucide/svelte';
  import { exportToGoogleSheet } from './client';
  import type { ExportOptions } from './types';

  let isExporting = $state(false);

  // Data to include options
  let includeHighTemp = $state(true);
  let includeAvgTemp = $state(false);
  let includeLowTemp = $state(false);
  let includeRain = $state(false);
  let includeSnow = $state(false);
  let includeDayLength = $state(false);

  // Gauges to apply options
  let applyTempGauge = $state(true);
  let applyRainGauge = $state(false);
  let applySnowGauge = $state(false);
  let applyDaytimeGauge = $state(false);

  // Additional options
  let includeDayCounts = $state(true);

  // Check which gauges are available
  let hasTempGauge = $derived(gauges.allCreated.some((g) => g.id === 'temp'));
  let hasRainGauge = $derived(gauges.allCreated.some((g) => g.id === 'prcp'));
  let hasSnowGauge = $derived(gauges.allCreated.some((g) => g.id === 'snow'));
  let hasDaytimeGauge = $derived(
    gauges.allCreated.some((g) => g.id === 'dayt'),
  );

  async function handleExport() {
    isExporting = true;

    const options: ExportOptions = {
      dataToInclude: {
        tmax: includeHighTemp,
        tavg: includeAvgTemp,
        tmin: includeLowTemp,
        prcp: includeRain,
        snow: includeSnow,
        dayt: includeDayLength,
      },
      gaugesToApply: {
        temp: applyTempGauge && hasTempGauge,
        prcp: applyRainGauge && hasRainGauge,
        snow: applySnowGauge && hasSnowGauge,
        dayt: applyDaytimeGauge && hasDaytimeGauge,
      },
      includeDayCounts,
    };

    try {
      const url = await exportToGoogleSheet(options);

      // Try to open the spreadsheet
      const opened = window.open(url, '_blank');

      if (!opened) {
        // Popup was blocked - show clickable link
        toast.trigger({
          message: `<div class="flex flex-wrap items-center justify-center gap-2">Google Sheet created! <a href="${url}" target="_blank" class="link font-bold">Click here to open</a></div>`,
          category: 'success',
          autohide: false,
        });
      } else {
        toast.trigger({
          message: `<div class="flex flex-wrap items-center justify-center gap-2">Google Sheet created successfully! <a href="${url}" target="_blank" class="link ml-2">Open again</a></div>`,
          category: 'success',
          autohide: false,
        });
      }
      dialog.close();
    } catch (error) {
      toast.trigger({
        message: `Export failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        category: 'error',
        autohide: false,
      });
    } finally {
      isExporting = false;
    }
  }
</script>

<div class="flex flex-col gap-4 p-4">
  <h2 class="text-xl font-bold">Create Google Sheet</h2>

  <p class="text-sm">
    Automatically create a Google Sheet formatted with your weather data and
    gauges. <a href="" target="_blank" class="link"
      >Click here to see an example.</a
    > A popup will appear asking you to sign in to your Google account. Follow the
    instructions to authorize this web app to create a new Google Sheet, which will
    then show up in your Google Drive.
  </p>

  <div class="flex flex-col gap-2">
    <h3 class="font-semibold">Weather Data</h3>
    <label class="flex items-center gap-2">
      <input type="checkbox" class="checkbox" bind:checked={includeHighTemp} />
      <span>High Temperature</span>
    </label>
    <label class="flex items-center gap-2">
      <input type="checkbox" class="checkbox" bind:checked={includeAvgTemp} />
      <span>Average Temperature</span>
    </label>
    <label class="flex items-center gap-2">
      <input type="checkbox" class="checkbox" bind:checked={includeLowTemp} />
      <span>Low Temperature</span>
    </label>
    <label class="flex items-center gap-2">
      <input type="checkbox" class="checkbox" bind:checked={includeRain} />
      <span>Rain</span>
    </label>
    <label class="flex items-center gap-2">
      <input type="checkbox" class="checkbox" bind:checked={includeSnow} />
      <span>Snow</span>
    </label>
    <label class="flex items-center gap-2">
      <input type="checkbox" class="checkbox" bind:checked={includeDayLength} />
      <span>Day Length</span>
    </label>
  </div>

  <div class="flex flex-col gap-2">
    <h3 class="font-semibold">Gauges</h3>
    {#if hasTempGauge}
      <label class="flex items-center gap-2">
        <input type="checkbox" class="checkbox" bind:checked={applyTempGauge} />
        <span>Temperature Gauge</span>
      </label>
    {/if}
    {#if hasRainGauge}
      <label class="flex items-center gap-2">
        <input type="checkbox" class="checkbox" bind:checked={applyRainGauge} />
        <span>Rain Gauge</span>
      </label>
    {/if}
    {#if hasSnowGauge}
      <label class="flex items-center gap-2">
        <input type="checkbox" class="checkbox" bind:checked={applySnowGauge} />
        <span>Snow Gauge</span>
      </label>
    {/if}
    {#if hasDaytimeGauge}
      <label class="flex items-center gap-2">
        <input
          type="checkbox"
          class="checkbox"
          bind:checked={applyDaytimeGauge}
        />
        <span>Daytime Gauge</span>
      </label>
    {/if}
    {#if !hasTempGauge && !hasRainGauge && !hasSnowGauge && !hasDaytimeGauge}
      <p class="text-surface-500 text-sm">No gauges have been created yet.</p>
    {/if}
  </div>

  <div class="flex flex-col gap-2">
    <h3 class="font-semibold">Gauge Options</h3>
    <label class="flex items-center gap-2">
      <input type="checkbox" class="checkbox" bind:checked={includeDayCounts} />
      <span>Show number of days in ranges</span>
    </label>
  </div>

  <div class="mt-4 flex justify-center gap-2">
    <button
      class="btn hover:preset-tonal-surface"
      onclick={() => dialog.close()}
      disabled={isExporting}
    >
      <XIcon />
      Cancel
    </button>
    <button
      class="btn preset-filled-primary-500"
      onclick={handleExport}
      disabled={isExporting}
    >
      {#if isExporting}
        <LoaderCircleIcon class="animate-spin" />
        Creating...
      {:else}
        <FilePlusIcon />
        Create
      {/if}
    </button>
  </div>
</div>

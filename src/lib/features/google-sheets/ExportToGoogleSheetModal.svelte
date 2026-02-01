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
  import type { ExportOptions } from './types';
  import { exportToGoogleSheet } from './client';
  import { LoaderCircleIcon } from '@lucide/svelte';

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
  let includeDayCounts = $state(false);

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
          message: `Spreadsheet created! <a href="${url}" target="_blank" class="underline">Click here to open</a>`,
          category: 'success',
        });
      } else {
        toast.trigger({
          message: 'Spreadsheet created successfully!',
          category: 'success',
        });
      }

      dialog.close();
    } catch (error) {
      console.error('Export failed:', error);
      toast.trigger({
        message: `Export failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        category: 'error',
      });
    } finally {
      isExporting = false;
    }
  }
</script>

<div class="flex flex-col gap-4 p-4">
  <h2 class="text-xl font-bold">Export to Google Sheets</h2>

  <div class="flex flex-col gap-2">
    <h3 class="font-semibold">Data to Include</h3>
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
    <h3 class="font-semibold">Gauges to Apply (Conditional Formatting)</h3>
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
    <h3 class="font-semibold">Options</h3>
    <label class="flex items-center gap-2">
      <input type="checkbox" class="checkbox" bind:checked={includeDayCounts} />
      <span>Include Day Counts & Percentages in Gauge Tabs</span>
    </label>
  </div>

  <div class="mt-4 flex justify-end gap-2">
    <button
      class="btn hover:preset-tonal-surface"
      onclick={() => dialog.close()}
      disabled={isExporting}
    >
      Cancel
    </button>
    <button
      class="btn preset-filled-primary-500"
      onclick={handleExport}
      disabled={isExporting}
    >
      {#if isExporting}
        <LoaderCircleIcon class="animate-spin" />
        Exporting...
      {:else}
        Export
      {/if}
    </button>
  </div>
</div>

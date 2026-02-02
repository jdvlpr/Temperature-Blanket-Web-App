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
  import { CheckIcon, LoaderCircleIcon, XIcon } from '@lucide/svelte';
  import { exportToGoogleSheet } from './client';
  import type { ExportOptions } from './types';

  let isExporting = $state(false);

  let showPopupBlockedErrorMessage = $state(false);

  // Data to include options
  let includeHighTemp = $state(true);
  let includeAvgTemp = $state(false);
  let includeLowTemp = $state(false);
  let includeRain = $state(false);
  let includeSnow = $state(false);
  let includeDayLength = $state(false);
  let includeMoon = $state(false);

  // Gauges to apply options
  let applyTempGauge = $state(true);
  let applyRainGauge = $state(false);
  let applySnowGauge = $state(false);
  let applyDaytimeGauge = $state(false);
  let applyMoonGauge = $state(false);

  // Additional options
  let includeDayCounts = $state(true);

  // Check which gauges are available
  let hasTempGauge = $derived(gauges.allCreated.some((g) => g.id === 'temp'));
  let hasRainGauge = $derived(gauges.allCreated.some((g) => g.id === 'prcp'));
  let hasSnowGauge = $derived(gauges.allCreated.some((g) => g.id === 'snow'));
  let hasDaytimeGauge = $derived(
    gauges.allCreated.some((g) => g.id === 'dayt'),
  );
  let hasMoonGauge = $derived(gauges.allCreated.some((g) => g.id === 'moon'));

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
        moon: includeMoon,
      },
      gaugesToApply: {
        temp: applyTempGauge && hasTempGauge,
        prcp: applyRainGauge && hasRainGauge,
        snow: applySnowGauge && hasSnowGauge,
        dayt: applyDaytimeGauge && hasDaytimeGauge,
        moon: applyMoonGauge && hasMoonGauge,
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
      showPopupBlockedErrorMessage = false;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';

      if (errorMessage === 'POPUP_BLOCKED') {
        showPopupBlockedErrorMessage = true;
      } else {
        toast.trigger({
          message: `Export failed: ${errorMessage}`,
          category: 'error',
          autohide: false,
        });
        showPopupBlockedErrorMessage = true;
      }
    } finally {
      isExporting = false;
    }
  }
</script>

<div class="flex flex-col gap-4 p-4">
  <h2 class="h2">Create Google Sheet</h2>

  <div class="flex flex-col gap-1">
    <h3 class="font-semibold">Weather Data</h3>
    <div class="flex flex-col gap-1">
      <label class="flex items-center gap-2">
        <input
          type="checkbox"
          class="checkbox"
          bind:checked={includeHighTemp}
        />
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
        <input
          type="checkbox"
          class="checkbox"
          bind:checked={includeDayLength}
        />
        <span>Daytime</span>
      </label>
      <label class="flex items-center gap-2">
        <input type="checkbox" class="checkbox" bind:checked={includeMoon} />
        <span>Moon Phase</span>
      </label>
    </div>
  </div>

  <div class="flex flex-col gap-1">
    <div class="flex flex-col">
      <h3 class="font-semibold">Gauges</h3>
      <p class="text-surface-700-300 text-xs">Colors & Ranges</p>
    </div>
    <div class="flex flex-col gap-1">
      {#if hasTempGauge}
        <label class="flex items-center gap-2">
          <input
            type="checkbox"
            class="checkbox"
            bind:checked={applyTempGauge}
          />
          <span>Temperature Gauge</span>
        </label>
      {/if}
      {#if hasRainGauge}
        <label class="flex items-center gap-2">
          <input
            type="checkbox"
            class="checkbox"
            bind:checked={applyRainGauge}
          />
          <span>Rain Gauge</span>
        </label>
      {/if}
      {#if hasSnowGauge}
        <label class="flex items-center gap-2">
          <input
            type="checkbox"
            class="checkbox"
            bind:checked={applySnowGauge}
          />
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
      {#if hasMoonGauge}
        <label class="flex items-center gap-2">
          <input
            type="checkbox"
            class="checkbox"
            bind:checked={applyMoonGauge}
          />
          <span>Moon Gauge</span>
        </label>
      {/if}
      {#if !hasTempGauge && !hasRainGauge && !hasSnowGauge && !hasDaytimeGauge && !hasMoonGauge}
        <p class="text-surface-500 text-sm">No gauges have been created yet.</p>
      {/if}
    </div>
  </div>

  {#if (applyTempGauge || applyRainGauge || applySnowGauge || applyDaytimeGauge || applyMoonGauge) && (hasTempGauge || hasRainGauge || hasSnowGauge || hasDaytimeGauge || hasMoonGauge)}
    <div class="flex flex-col gap-1">
      <h3 class="font-semibold">Gauge Options</h3>
      <label class="flex items-center gap-2">
        <input
          type="checkbox"
          class="checkbox"
          bind:checked={includeDayCounts}
        />
        <span>Show number of days in ranges</span>
      </label>
    </div>
  {/if}

  <p class="max-w-md text-center text-sm italic">
    A new Google Sheet will be saved to your Google Drive. You may need to allow
    popups in order to authenticate with Google.
  </p>

  {#if showPopupBlockedErrorMessage}
    <p class="text-warning-500 text-center">
      It looks like the popup was blocked. Please allow popups for this site and
      try again.
    </p>
  {/if}

  <div class="flex justify-center gap-2">
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
      data-retry-export
    >
      {#if isExporting}
        <LoaderCircleIcon class="animate-spin" />
        Creating...
      {:else}
        <CheckIcon />
        Create
      {/if}
    </button>
  </div>
</div>

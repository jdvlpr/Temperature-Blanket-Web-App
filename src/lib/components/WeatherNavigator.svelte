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
  import WeatherTableView from '$lib/components/WeatherTableView.svelte';
  import ImportWeatherData from '$lib/components/modals/ImportWeatherData.svelte';
  import { ICONS } from '$lib/constants';
  import { modal, weather } from '$lib/state';
  import { downloadPDF, downloadWeatherCSV } from '$lib/utils';
  import { DownloadIcon, ImportIcon } from '@lucide/svelte';
  import { weatherChart } from './WeatherChart.svelte';

  let debounceTimer;
  const debounce = (callback, time) => {
    window.clearTimeout(debounceTimer);
    debounceTimer = window.setTimeout(callback, time);
  };
</script>

<svelte:window
  onresize={() => {
    debounce(() => {
      // when resizing the window, at certain widths the chart does not automatically resize
      // so force it to update
      if (weatherChart.current) weatherChart?.update();
    }, 101);
  }}
/>

<div class="">
  <WeatherTableView />

  <div
    class="flex max-sm:flex-col sm:flex-wrap gap-2 items-start justify-start sm:justify-center sm:items-center mt-4 mb-2 lg:mb-4 px-4 py-2 shadow-inner rounded-container bg-surface-100 dark:bg-surface-900"
  >
    <button
      class="btn hover:preset-tonal whitespace-pre-wrap h-auto text-left"
      onclick={downloadPDF}
      title="Download PDF File"
    >
      <DownloadIcon class="inline" /> Download Gauges and Weather Data (PDF)
    </button>

    <button
      class="btn hover:preset-tonal whitespace-pre-wrap h-auto text-left"
      onclick={downloadWeatherCSV}
      title="Download CSV File"
    >
      <DownloadIcon class="inline" /> Download Weather Data (CSV)
    </button>

    {#if weather.grouping !== 'week'}
      <button
        class="btn hover:preset-tonal whitespace-pre-wrap h-auto text-left"
        onclick={() => {
          modal.trigger({
            type: 'component',
            component: {
              ref: ImportWeatherData,
            },
          });
        }}
        title="Import Weather Data"
      >
        <ImportIcon class="inline" /> Import Weather Data
      </button>
    {/if}
  </div>
</div>

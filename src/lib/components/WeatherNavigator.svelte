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
    class="flex flex-wrap gap-2 justify-center mt-4 mb-2 lg:mb-4 px-4 py-2 shadow-inner rounded-container bg-surface-100 dark:bg-surface-900"
  >
    <button
      class="btn hover:preset-tonal whitespace-pre-wrap gap-1"
      onclick={downloadPDF}
      title="Download PDF File"
    >
      {@html ICONS.download} Download Gauges and Weather Data (PDF)
    </button>

    <button
      class="btn hover:preset-tonal whitespace-pre-wrap gap-1"
      onclick={downloadWeatherCSV}
      title="Download CSV File"
    >
      {@html ICONS.download} Download Weather Data (CSV)
    </button>

    {#if weather.grouping !== 'week'}
      <button
        class="btn hover:preset-tonal whitespace-pre-wrap gap-1"
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
        <span>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke-width="1.5"
            stroke="currentColor"
            class="w-6 h-6 inline"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75"
            />
          </svg> Import Weather Data
        </span>
      </button>
    {/if}
  </div>
</div>

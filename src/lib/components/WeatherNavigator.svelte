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
  import WeatherTableWrapper from '$lib/components/WeatherTableWrapper.svelte';
  import ImportWeatherData from '$lib/components/modals/ImportWeatherData.svelte';
  import { dialog, weather } from '$lib/state';
  import { FileUpIcon } from '@lucide/svelte';
  import { weatherChart } from './WeatherChart.svelte';
  import DownloadExportButton from './buttons/DownloadExportButton.svelte';

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
  <WeatherTableWrapper />

  <div
    class="rounded-container bg-surface-100 dark:bg-surface-900 mx-2 mt-4 mb-2 flex items-center justify-center gap-2 px-4 py-2 shadow-inner max-sm:flex-col sm:flex-wrap sm:items-center sm:justify-center lg:mb-4"
  >
    <DownloadExportButton />

    {#if weather.grouping !== 'week'}
      <button
        class="btn hover:preset-tonal-surface h-auto text-left whitespace-pre-wrap"
        onclick={() => {
          dialog.trigger({
            type: 'component',
            component: {
              ref: ImportWeatherData,
            },
          });
        }}
        title="Import Weather Data"
      >
        <FileUpIcon class="inline" /> Import Weather Data
      </button>
    {/if}
  </div>
</div>

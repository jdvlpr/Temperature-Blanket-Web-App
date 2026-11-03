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
  import { page } from '$app/state';
  import WeatherDaysTable from '#lib/components/weather-grid/WeatherDaysTable.svelte';
  import { project } from '#lib/state/project-state.svelte.js';
  import { weather } from '#lib/state/weather-state.svelte.js';
  import { ExternalLinkIcon } from '@lucide/svelte';
  import { weatherChart } from './WeatherChart.svelte';

  let debounceTimer: number | undefined;
  const debounce = (callback: () => void, time: number) => {
    window.clearTimeout(debounceTimer);
    debounceTimer = window.setTimeout(callback, time);
  };
</script>

<svelte:window
  onresize={() => {
    debounce(() => {
      // when resizing the window, at certain widths the chart does not automatically resize
      // so force it to update
      if (weatherChart && weatherChart.current) weatherChart.update();
    }, 101);
  }}
/>

<div class="my-4">
  <WeatherDaysTable scroll="window" />
</div>

<a
  href="/contact/forms/2025-03-weather-data?pageURL={encodeURIComponent(
    page.url.href,
  )}&projectURL={encodeURIComponent(project.url.href)}&data0={weather.data[0]
    ?.date}"
  class="link mx-auto mb-4 block w-fit text-sm"
  target="_blank"
>
  <ExternalLinkIcon class="icon-sm relative -top-[2px] inline" /> Weather Data Feedback
</a>

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

<script module>
  export let weatherDataUpdatedKey = $state({ value: false });
  export let showColorDetails = $state({ value: false });
</script>

<script>
  import { gauges, localState, project, weather } from '$lib/state';
  import { getTableData } from '$lib/utils';
  import { tick } from 'svelte';
  import ToggleSwitch from './buttons/ToggleSwitch.svelte';
  import WeatherTableData from './WeatherTableData.svelte';

  let tableData = $state(getTableData());

  function updateTable() {
    weatherDataUpdatedKey.value = true;
    tick().then(() => {
      tableData = getTableData();
      weatherDataUpdatedKey.value = false;
    });
  }

  // I don't think these $effect() blocks are ideal
  // but for now they seem to be the easiest solution to updating the table data when other state changes
  $effect(() => {
    // These three can be together because they don't all change near the same moment, unlike the next three $effect() blocks
    weather.data;
    localState.value.units;
    weather.tableWeatherTargets;
    tick().then(() => {
      updateTable();
    });
  });

  $effect(() => {
    gauges.activeGauge?.colors;
    tick().then(() => {
      updateTable();
    });
  });

  $effect(() => {
    gauges.activeGauge?.numberOfColors;
    tick().then(() => {
      updateTable();
    });
  });

  $effect(() => {
    gauges.activeGauge?.ranges;
    tick().then(() => {
      updateTable();
    });
  });
</script>

<div class="mx-auto mt-4 w-fit">
  <ToggleSwitch
    bind:checked={showColorDetails.value}
    label={'Show Color Details'}
  />
</div>

<div
  class="card bg-warning-50-950/50 mx-auto mt-4 flex max-w-screen-md flex-col p-2 text-left"
>
  <p>
    There may be an issue for some locations where weather data has shifted by
    one day. If the data below looks wrong to you, <a
      href="/contact/forms/2025-03-weather-data?projectURL={encodeURIComponent(
        project.url.href,
      )}"
      target="_blank"
      class="link">report an issue using this feedback form</a
    >. -Thomas
  </p>
  <div class="flex w-full justify-end">
    <p class="text-xs opacity-80">Updated March 27, 2025</p>
  </div>
</div>

<div class="my-4 inline-block w-full">
  {#key weatherDataUpdatedKey.value}
    <WeatherTableData {tableData} {updateTable} />
  {/key}
</div>

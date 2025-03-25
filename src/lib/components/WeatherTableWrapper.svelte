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
  import { gauges, localState, locations, project, weather } from '$lib/state';
  import { getTableData, stringToDate, stringToDateVersion2 } from '$lib/utils';
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

<div class="card bg-warning-50-950/50 mt-4 p-2">
  <p>
    There's a known issue for some locations where weather data has shifted by
    one day. If the data below looks wrong to you, <a
      class="link font-bold"
      href="mailto:hello@temperature-blanket.com?subject=Weather Data Issue Report&body=This is a report for a weather data issue on temperature-blanket.com. %0D%0A%0D%0A [--optionally include any other comments here--] %0D%0A%0D%0A Include the following information to help debug the issue: %0D%0A%0D%0A Project URL: {encodeURIComponent(
        project.url.href,
      )} %0D%0A Timezone: {encodeURIComponent(
        Intl.DateTimeFormat().resolvedOptions().timeZone,
      )} %0D%0A Loaded: {encodeURIComponent(
        JSON.stringify(
          $state.snapshot(
            locations.all.map((n) => n.wasLoadedFromSavedProject),
          ),
        ),
      )} %0D%0A Data (first 3 days): {encodeURIComponent(
        JSON.stringify(weather.data.slice(0, 3)),
      )} %0D%0A Data (last 3 days): {encodeURIComponent(
        JSON.stringify(weather.data.slice(-3)),
      )} %0D%0A stringToDate('2025-01-01'): {encodeURIComponent(
        JSON.stringify(stringToDate('2025-01-01')),
      )} %0D%0A stringToDateVersion2('2025-01-01'): {encodeURIComponent(
        JSON.stringify(stringToDateVersion2('2025-01-01')),
      )}">send an issue report</a
    >. I'm looking into the problem and hope to have it fixed soon. Sorry for
    any inconvenience! - Thomas
  </p>
</div>

<div class="my-4 inline-block w-full">
  {#key weatherDataUpdatedKey.value}
    <WeatherTableData {tableData} {updateTable} />
  {/key}
</div>

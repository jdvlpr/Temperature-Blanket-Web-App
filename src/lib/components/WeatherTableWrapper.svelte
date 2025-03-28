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
  let showIssueNotification = $state(true);
</script>

<script>
  import { dev, version } from '$app/environment';
  import { page } from '$app/state';
  import { gauges, localState, project, weather } from '$lib/state';
  import { supabase } from '$lib/supabaseClient';
  import {
    dateToISO8601String,
    dateToISO8601StringVersion2,
    getTableData,
    stringToDate,
    stringToDateVersion2,
  } from '$lib/utils';
  import { CheckIcon, ExternalLinkIcon, InfoIcon } from '@lucide/svelte';
  import { onMount, tick } from 'svelte';
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

  let diagnostics = $derived({
    dev,
    version,
    details: {
      href: page.url.href,
      projectHref: project.url.href,
      weatherTable: {
        a_dataDate: weather.data[0].date,
        b_tableDataDate: tableData[0].date,
      },
      dateTest: {
        a_stringToDate: stringToDate('2025-01-01'),
        b_stringToDateVersion2: stringToDateVersion2('2025-01-01'),
        c_dateToISO8601String: {
          stringToDate: dateToISO8601String(stringToDate('2025-01-01')),
          stringToDateVersion2: dateToISO8601String(
            stringToDateVersion2('2025-01-01'),
          ),
        },
        e_dateToISO8601StringVersion2: {
          stringToDate: dateToISO8601StringVersion2(stringToDate('2025-01-01')),
          stringToDateVersion2: dateToISO8601StringVersion2(
            stringToDateVersion2('2025-01-01'),
          ),
        },
      },
    },
  });

  onMount(async () => {
    tick().then(async () => {
      // diagnostics
      await supabase.from('Weather Data Feedback').insert(diagnostics);
    });
  });
</script>

<div class="mx-auto mt-4 w-fit">
  <ToggleSwitch
    bind:checked={showColorDetails.value}
    label={'Show Color Details'}
  />
</div>

{#if showIssueNotification}
  <div class="mx-auto mt-4 flex flex-col gap-4 text-center">
    <p>
      There may be an issue for some locations where weather data has shifted by
      one day. <a
        href="/contact/forms/2025-03-weather-data#info"
        onclick={async () => {
          await supabase
            .from('Weather Data Feedback')
            .insert({ is_data_ok: false, ...diagnostics });
        }}
        target="_blank"
        class="link"
        ><InfoIcon class="relative -top-[2px] inline size-4" /> More details.</a
      >
    </p>
    <div class="flex flex-wrap justify-center gap-4">
      <button
        class="btn preset-filled-success-50-950 text-success-contrast-50-950 text-left whitespace-pre-wrap shadow"
        onclick={async () => {
          showIssueNotification = false;
          await supabase
            .from('Weather Data Feedback')
            .insert({ is_data_ok: true, ...diagnostics });
        }}><CheckIcon /> The dates look ok</button
      >
      <a
        href="/contact/forms/2025-03-weather-data?projectURL={encodeURIComponent(
          project.url.href,
        )}&data0={weather.data[0].date}&table0={tableData[0].date}"
        class="btn hover:preset-filled"
        target="_blank"
      >
        <ExternalLinkIcon /> Report an issue
      </a>
    </div>
  </div>
{:else}
  <a
    href="/contact/forms/2025-03-weather-data?projectURL={encodeURIComponent(
      project.url.href,
    )}"
    class="link mt-4 inline-block text-sm"
    target="_blank"
  >
    <ExternalLinkIcon class="relative -top-[2px] inline size-4" /> Weather Data Feedback
  </a>
{/if}

<div class="my-4 inline-block w-full">
  {#key weatherDataUpdatedKey.value}
    <WeatherTableData {tableData} {updateTable} />
  {/key}
</div>

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
  import { TableHandler, ThSort } from '@vincjo/datatables';
  import { UNIT_LABELS } from '$lib/constants';
  import RecentWeatherDataTooltip from '$lib/components/RecentWeatherDataTooltip.svelte';
  import { modal, project, weather, gauges } from '$lib/state';
  import {
    millimetersToInches,
    inchesToMillimeters,
    celsiusToFahrenheit,
    fahrenheitToCelsius,
    convertTime,
    displayNumber,
    hoursToMinutes,
    dateToISO8601String,
    getIsRecentDate,
    getTargetParentGaugeId,
    getColorInfo,
    getTextColor,
  } from '$lib/utils';
  import ToggleSwitch from './buttons/ToggleSwitch.svelte';
  import DataTable from '$lib/components/datatable/DataTable.svelte';
  import NumberInput from '$lib/components/modals/NumberInput.svelte';
  import TextInput from '$lib/components/modals/TextInput.svelte';
  import { onMount } from 'svelte';

  let { weatherTargets } = $props();

  let showColorDetails = $state(true);

  let _rowsPerPage = $state(10);

  let _page = $state(1);

  const table = new TableHandler(weather.tableData, {
    rowsPerPage: 10,
  });

  function updateTable() {
    table.setRows(weather.tableData);
    table.setRowsPerPage(weather.tableData);
    table.setPage(weather.tableData);
  }
</script>

<ToggleSwitch bind:checked={showColorDetails} label={'Show Color Details'} />

<div class="w-full my-4 inline-block">
  <DataTable {table} search={true}>
    <table class="border-separate border-spacing-0 w-full mx-auto">
      <thead>
        <tr>
          <ThSort {table} field="date">
            <span class="flex flex-col items-center justify-center"
              >{weather.groupingHeading}
              <span class="text-xs whitespace-nowrap">(YYYY-MM-DD)</span></span
            >
          </ThSort>
          {#each weatherTargets as { id, pdfHeader }}
            {@const header = pdfHeader[project.units]}
            {@const headerLabel = header.slice(0, header.indexOf('('))}
            {@const headerUnits = header.slice(header.indexOf('('))}
            <ThSort {table} field={id}>
              <span class="flex flex-wrap gap-1 items-center justify-center"
                >{headerLabel}
                <span class="text-xs">{headerUnits}</span></span
              >
            </ThSort>
          {/each}
        </tr>
      </thead>
      <tbody
        class="[&>tr:nth-child(odd)]:bg-surface-100 [&>tr:nth-child(odd)]:dark:bg-surface-800"
      >
        {#if table.rows}
          {#each table.rows as row}
            {@const isRecentDate = getIsRecentDate(row.date)}

            <tr class:!variant-soft-warning={isRecentDate} class="!text-token">
              <td class="rounded-container-token overflow-hidden">
                {#if isRecentDate}
                  <RecentWeatherDataTooltip />
                {/if}
                {row.date}
              </td>
              {#each weatherTargets as { id, label, type }}
                <td
                  class={[showColorDetails && 'pb-2 border-2']}
                  style={row.color[id] && showColorDetails
                    ? `background-color:${row.color[id].hex};color:${getTextColor(row.color[id].hex)}`
                    : ''}
                >
                  <button
                    class={[
                      weather.grouping === 'day' &&
                        'bg-secondary-hover-token btn-icon',
                    ]}
                    disabled={weather.grouping === 'week'}
                    onclick={() => {
                      if (id === 'dayt') {
                        modal.state.trigger({
                          type: 'component',
                          component: {
                            ref: TextInput,
                            props: {
                              value: row[id],
                              title: `<div class="flex flex-col items-center justify-center"><span class="font-bold">${row.date}</span><span>${label}</span></div>`,
                              onOkay: (_value) => {
                                weather.isUserEdited = true;

                                const time = _value.split(':');

                                if (time.length !== 2) return;

                                _rowsPerPage = table.rowsPerPage;
                                _page = table.currentPage;

                                const hours = +time[0] + +time[1] / 60;
                                const mappedWeather = weather.rawData.map(
                                  (n) =>
                                    `${dateToISO8601String(n.date)}-${n.location}`,
                                );
                                const i = mappedWeather.indexOf(
                                  `${row.date}-${row.location}`,
                                );
                                weather.rawData[i][id].metric = hoursToMinutes(
                                  hours,
                                  4,
                                );
                                weather.rawData[i][id].imperial = displayNumber(
                                  +hours,
                                  4,
                                );
                                updateTable();
                              },
                            },
                          },
                        });
                      } else {
                        modal.state.trigger({
                          type: 'component',
                          component: {
                            ref: NumberInput,
                            props: {
                              max: 1000,
                              value: row[id],
                              title: `<div class="flex flex-col items-center justify-center"><span class="font-bold">${row.date}</span><span>${label} <span class="text-sm">(${UNIT_LABELS[type][project.units]})</span></span></div>`,
                              noMinMax: true,
                              showSlider: false,
                              onOkay: (_value) => {
                                weather.isUserEdited = true;
                                const mappedWeather = weather.rawData.map(
                                  (n) =>
                                    `${dateToISO8601String(n.date)}-${n.location}`,
                                );
                                const i = mappedWeather.indexOf(
                                  `${row.date}-${row.location}`,
                                );

                                _rowsPerPage = table.rowsPerPage;
                                _page = table.currentPage;

                                if (project.units === 'metric') {
                                  weather.rawData[i][id].metric = _value;
                                  if (type === 'temperature')
                                    weather.rawData[i][id].imperial =
                                      celsiusToFahrenheit(_value);
                                  if (type === 'height')
                                    weather.rawData[i][id].imperial =
                                      millimetersToInches(_value);
                                }
                                if (project.units === 'imperial') {
                                  weather.rawData[i][id].imperial = _value;
                                  if (type === 'temperature')
                                    weather.rawData[i][id].metric =
                                      fahrenheitToCelsius(_value);
                                  if (type === 'height')
                                    weather.rawData[i][id].metric =
                                      inchesToMillimeters(_value);
                                }

                                updateTable();
                              },
                            },
                          },
                        });
                      }
                    }}
                  >
                    {row[id]}
                  </button>
                  {#if row.color[id] && showColorDetails}
                    {@const {
                      hex,
                      name,
                      brandName,
                      yarnName,
                      index,
                      gaugeLength,
                    } = row.color[id]}
                    {#if typeof index === 'number'}
                      <div class="flex flex-col justify-center text-center">
                        {#if brandName && yarnName}
                          <p class="text-xs">
                            {brandName}
                            -
                            {yarnName}
                          </p>
                        {/if}
                        {#if name}
                          <p class="">
                            {name}
                          </p>
                          <p class="text-xs">
                            Color
                            {index + 1}
                            of
                            {gaugeLength}
                          </p>
                        {:else}
                          <p class="text-xs">
                            Color
                            {index + 1}
                            of
                            {gaugeLength}
                          </p>
                        {/if}
                      </div>
                    {:else}
                      <p class="text-xs">No Color Assigned</p>
                    {/if}
                  {/if}
                </td>
              {/each}
            </tr>
          {/each}
        {/if}
      </tbody>
    </table>
  </DataTable>
</div>

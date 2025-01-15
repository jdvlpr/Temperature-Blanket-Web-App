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
  import { modal, project, weather } from '$lib/state';
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
  } from '$lib/utils';
  import DataTable from '$lib/components/datatable/DataTable.svelte';
  import NumberInput from '$lib/components/modals/NumberInput.svelte';
  import TextInput from '$lib/components/modals/TextInput.svelte';

  let { weatherTargets } = $props();

  const tableData = $derived([
    ...weather.data.map((n) => {
      let weather = {};
      weatherTargets.forEach((target) => {
        if (target.id === 'dayt') {
          // make sure daytime is always in the same hr:mn format
          weather = {
            ...weather,
            [target.id]: convertTime(n[target.id][project.units], {
              displayUnits: false,
              padStart: true,
            }),
          };
        } else {
          let value =
            n[target.id][project.units] !== null
              ? n[target.id][project.units]
              : '-';
          weather = {
            ...weather,
            [target.id]: value,
          };
        }
      });
      return {
        date: dateToISO8601String(n.date),
        location: n.location,
        ...weather,
      };
    }),
  ]);

  const table = new TableHandler(tableData, {
    rowsPerPage: 10,
  });
</script>

<div class="w-full my-4">
  <DataTable {table} search={false}>
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
              <td>
                {#if isRecentDate}
                  <RecentWeatherDataTooltip />
                {/if}
                {row.date}
              </td>
              {#each weatherTargets as { id, label, type }}
                <td>
                  <button
                    class="transition-all"
                    disabled={weather.grouping === 'week'}
                    class:bg-secondary-hover-token={weather.grouping === 'day'}
                    class:btn={weather.grouping === 'day'}
                    class:hover:px-2={weather.grouping === 'day'}
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
                                weather.isUserEdited++;

                                const time = _value.split(':');
                                if (time.length !== 2) return;
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
                                weather.isUserEdited++;
                                const mappedWeather = weather.rawData.map(
                                  (n) =>
                                    `${dateToISO8601String(n.date)}-${n.location}`,
                                );
                                const i = mappedWeather.indexOf(
                                  `${row.date}-${row.location}`,
                                );
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
                              },
                            },
                          },
                        });
                      }
                    }}
                  >
                    {row[id]}
                  </button>
                </td>
              {/each}
            </tr>
          {/each}
        {/if}
      </tbody>
    </table>
  </DataTable>
</div>

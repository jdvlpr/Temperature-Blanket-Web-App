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
  import { DataHandler, Th } from '@vincjo/datatables';
  import { bind } from 'svelte-simple-modal';
  import { UNIT_LABELS } from '$lib/constants';
  import RecentWeatherDataTooltip from '$lib/components/RecentWeatherDataTooltip.svelte';
  import {
    isCustomWeather,
    modal,
    tablePage,
    tableRowsPerPage,
    tableSort,
    units,
    weatherGrouping,
    weatherItemHeading,
    weatherUngrouped,
  } from '$lib/stores';
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

  export let data;
  export let weatherTargets;

  const handler = new DataHandler(tableData, {
    rowsPerPage: $tableRowsPerPage,
  });
  const rows = handler.getRows();

  let page, perPage, sort;

  $: tableData = [
    ...data.map((n) => {
      let weather = {};
      weatherTargets.forEach((target) => {
        if (target.id === 'dayt') {
          // make sure daytime is always in the same hr:mn format
          weather = {
            ...weather,
            [target.id]: convertTime(n[target.id][$units], {
              displayUnits: false,
              padStart: true,
            }),
          };
        } else {
          let value =
            n[target.id][$units] !== null ? n[target.id][$units] : '-';
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
  ];

  $: if (tableData) {
    handler.setRows(tableData);
    handler.setPage($tablePage);
    const { identifier, direction } = $tableSort;
    handler.applySorting({ orderBy: identifier, direction });
  }
</script>

<div class="w-full my-4">
  <DataTable {handler} search={false}>
    <table class="border-separate border-spacing-0 w-full mx-auto">
      <thead>
        <tr>
          <Th {handler} orderBy={'date'}>
            <span class="flex flex-col items-center justify-center"
              >{$weatherItemHeading}
              <span class="text-xs whitespace-nowrap">(YYYY-MM-DD)</span></span
            >
          </Th>
          {#each weatherTargets as { id, pdfHeader }}
            {@const header = pdfHeader[$units]}
            {@const headerLabel = header.slice(0, header.indexOf('('))}
            {@const headerUnits = header.slice(header.indexOf('('))}
            <Th {handler} orderBy={id}>
              <span class="flex flex-wrap gap-1 items-center justify-center"
                >{headerLabel}
                <span class="text-xs">{headerUnits}</span></span
              ></Th
            >
          {/each}
        </tr>
      </thead>
      <tbody
        class="[&>tr:nth-child(odd)]:bg-surface-100 [&>tr:nth-child(odd)]:dark:bg-surface-800"
      >
        {#if $rows}
          {#each $rows as row}
            {@const isRecentDate = getIsRecentDate(row.date)}

            <tr class:!variant-soft-warning={isRecentDate} class="!text-token">
              <td
                >{#if isRecentDate}
                  <RecentWeatherDataTooltip />
                {/if}
                {row.date}</td
              >
              {#each weatherTargets as { id, label, type }}
                <td
                  ><button
                    class="transition-all"
                    disabled={$weatherGrouping === 'week'}
                    class:bg-secondary-hover-token={$weatherGrouping === 'day'}
                    class:btn={$weatherGrouping === 'day'}
                    class:hover:px-2={$weatherGrouping === 'day'}
                    on:click={() => {
                      if (id === 'dayt') {
                        modal.set(
                          bind(TextInput, {
                            value: row[id],
                            title: `<div class="flex flex-col items-center justify-center"><span class="font-bold">${row.date}</span><span>${label}</span></div>`,
                            onOkay: (_value) => {
                              $isCustomWeather = true;
                              const time = _value.split(':');
                              if (time.length !== 2) return;
                              const hours = +time[0] + +time[1] / 60;
                              page = handler.getPageNumber();
                              perPage = handler.getRowsPerPage();
                              sort = handler.getSorted();
                              $tablePage = $page;
                              $tableRowsPerPage = $perPage;
                              $tableSort = $sort;
                              const mappedWeather = $weatherUngrouped.map(
                                (n) =>
                                  `${dateToISO8601String(n.date)}-${n.location}`,
                              );
                              const i = mappedWeather.indexOf(
                                `${row.date}-${row.location}`,
                              );
                              $weatherUngrouped[i][id].metric = hoursToMinutes(
                                hours,
                                4,
                              );
                              $weatherUngrouped[i][id].imperial = displayNumber(
                                +hours,
                                4,
                              );
                            },
                          }),
                        );
                      } else {
                        modal.set(
                          bind(NumberInput, {
                            max: 1000,
                            value: row[id],
                            title: `<div class="flex flex-col items-center justify-center"><span class="font-bold">${row.date}</span><span>${label} <span class="text-sm">(${UNIT_LABELS[type][$units]})</span></span></div>`,
                            noMinMax: true,
                            showSlider: false,
                            onOkay: (_value) => {
                              $isCustomWeather = true;
                              page = handler.getPageNumber();
                              perPage = handler.getRowsPerPage();
                              sort = handler.getSorted();
                              $tablePage = $page;
                              $tableRowsPerPage = $perPage;
                              $tableSort = $sort;
                              const mappedWeather = $weatherUngrouped.map(
                                (n) =>
                                  `${dateToISO8601String(n.date)}-${n.location}`,
                              );
                              const i = mappedWeather.indexOf(
                                `${row.date}-${row.location}`,
                              );
                              if ($units === 'metric') {
                                $weatherUngrouped[i][id].metric = _value;
                                if (type === 'temperature')
                                  $weatherUngrouped[i][id].imperial =
                                    celsiusToFahrenheit(_value);
                                if (type === 'height')
                                  $weatherUngrouped[i][id].imperial =
                                    millimetersToInches(_value);
                              }
                              if ($units === 'imperial') {
                                $weatherUngrouped[i][id].imperial = _value;
                                if (type === 'temperature')
                                  $weatherUngrouped[i][id].metric =
                                    fahrenheitToCelsius(_value);
                                if (type === 'height')
                                  $weatherUngrouped[i][id].metric =
                                    inchesToMillimeters(_value);
                              }
                            },
                          }),
                        );
                      }
                    }}>{row[id]}</button
                  ></td
                >
              {/each}
            </tr>
          {/each}
        {/if}
      </tbody>
    </table>
  </DataTable>
  <!-- {#if $weatherGrouping === "day"}
        <p class="my-2 text-sm">To edit a value, select it from the table above.</p>
    {/if} -->
</div>

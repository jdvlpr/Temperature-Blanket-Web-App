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
  import DataTable from '$lib/components/datatable/DataTable.svelte';
  import { allGaugesAttributes, localState, weather } from '$lib/state';
  import { convertTime, dateToISO8601String } from '$lib/utils';
  import { TableHandler, ThSort } from '@vincjo/datatables';

  let { weatherData } = $props();

  let weatherTargets = allGaugesAttributes.map((gauge) => gauge.targets).flat();

  let tableData = $derived([
    ...weatherData.map((n) => {
      let weather = {};
      weatherTargets.forEach((target) => {
        if (target.id === 'dayt') {
          weather = {
            ...weather,
            [target.id]: convertTime(n[target.id][localState.value.units], {
              displayUnits: false,
              padStart: true,
            }),
          };
        } else {
          let value =
            n[target.id][localState.value.units] !== null
              ? n[target.id][localState.value.units]
              : '-';
          weather = {
            ...weather,
            [target.id]: value,
          };
        }
      });
      return {
        date: dateToISO8601String(n.date),
        ...weather,
      };
    }),
  ]);

  const table = $derived(new TableHandler(tableData, { rowsPerPage: 10 }));

  let dateHeader = $derived(weather.grouping === 'week' ? 'Week of' : 'Date');
</script>

<div
  class="inline-flex w-full max-w-(--breakpoint-sm) items-center justify-center p-4 text-center"
>
  <DataTable {table} search={false}>
    <table class="mx-auto w-fit border-separate border-spacing-0 self-center">
      <thead>
        <tr>
          <ThSort {table} field={'date'}>
            <span class="flex flex-col items-center"
              >{dateHeader}
              <span class="text-xs">(YYYY-MM-DD)</span></span
            >
          </ThSort>
          {#each weatherTargets as { id, pdfHeader }}
            {@const header = pdfHeader[localState.value.units]}
            {@const headerLabel = header.slice(0, header.indexOf('('))}
            {@const headerUnits = header.slice(header.indexOf('('))}
            <ThSort {table} field={id}>
              <span class="flex flex-col items-center"
                >{headerLabel}
                <span class="text-xs">{headerUnits}</span></span
              >
            </ThSort>
          {/each}
        </tr>
      </thead>
      <tbody
        class="[&>tr:nth-child(odd)]:bg-surface-100 dark:[&>tr:nth-child(odd)]:bg-surface-700"
      >
        {#if table.rows}
          {#each table.rows as row}
            <tr>
              <td>{row.date}</td>
              {#each weatherTargets as { id }}
                <td>{row[id]}</td>
              {/each}
            </tr>
          {/each}
        {/if}
      </tbody>
    </table>
  </DataTable>
</div>

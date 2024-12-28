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
  import { allGaugesAttributes, units, weatherGrouping } from '$lib/stores';
  import { convertTime, dateToISO8601String } from '$lib/utils';
  import { DataHandler, Th } from '@vincjo/datatables';
  import ModalShell from './ModalShell.svelte';

  let { weatherData, parent } = $props();

  let weatherTargets = allGaugesAttributes.map((gauge) => gauge.targets).flat();

  let tableData = $derived([
    ...weatherData.map((n) => {
      let weather = {};
      weatherTargets.forEach((target) => {
        if (target.id === 'dayt') {
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
        ...weather,
      };
    }),
  ]);

  const handler = $derived(new DataHandler(tableData, { rowsPerPage: 10 }));
  const rows = $derived(handler.getRows());

  let dateHeader = $derived($weatherGrouping === 'week' ? 'Week of' : 'Date');

  //TODO: Is this necessary?
  $effect(() => {
    if (tableData) {
      handler.setRows(tableData);
    }
  });
</script>

<ModalShell {parent}>
  <div class="w-full inline-flex text-center">
    <div class="w-[85vw] max-w-screen-sm">
      <DataTable {handler} search={false} hidePageLabel={true}>
        <table class="border-separate border-spacing-0 w-fit mx-auto">
          <thead>
            <tr>
              <Th {handler} orderBy={'date'}>
                <span class="flex flex-col items-center"
                  >{dateHeader}
                  <span class="text-xs">(YYYY-MM-DD)</span></span
                >
              </Th>
              {#each weatherTargets as { id, pdfHeader }}
                {@const header = pdfHeader[$units]}
                {@const headerLabel = header.slice(0, header.indexOf('('))}
                {@const headerUnits = header.slice(header.indexOf('('))}
                <Th {handler} orderBy={id}>
                  <span class="flex flex-col items-center"
                    >{headerLabel}
                    <span class="text-xs">{headerUnits}</span></span
                  ></Th
                >
              {/each}
            </tr>
          </thead>
          <tbody
            class="[&>tr:nth-child(odd)]:bg-surface-100 [&>tr:nth-child(odd)]:dark:bg-surface-700"
          >
            {#if $rows}
              {#each $rows as row}
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
  </div>
</ModalShell>

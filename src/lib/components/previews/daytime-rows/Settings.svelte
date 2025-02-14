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
  import NumberInputButton from '$lib/components/buttons/NumberInputButton.svelte';
  import DataTable from '$lib/components/datatable/DataTable.svelte';
  import Expand from '$lib/components/Expand.svelte';
  import { ICONS } from '$lib/constants';
  import { gauges, locations, weather } from '$lib/state';
  import { capitalizeFirstLetter } from '$lib/utils/other-utils';
  import { TableHandler } from '@vincjo/datatables';
  import { slide } from 'svelte/transition';
  import { daytimeRowsPreview } from './state.svelte';

  let targets = $derived(gauges.allCreated.map((n) => n.targets).flat());

  let isTableExpanded = $state(false);

  let table = $state();

  $effect(() => {
    daytimeRowsPreview.tableData;
    table = new TableHandler(daytimeRowsPreview.tableData, {
      rowsPerPage: 10,
    });
  });

  function downloadStitchesTableCSV() {
    const headers = ['Row', weather.groupingHeading];
    switch (daytimeRowsPreview.settings.daytimePosition) {
      case 'left':
        headers.push(`Daytime stitches (${daytimeRowsPreview.daytimeLabel})`);
        headers.push(`Night stitches (${daytimeRowsPreview.nightLabel})`);
        break;
      case 'right':
        headers.push(`Night stitches (${daytimeRowsPreview.nightLabel})`);
        headers.push(`Daytime stitches (${daytimeRowsPreview.daytimeLabel})`);
        break;
      case 'center':
        headers.push(`Night (left side) `);
        headers.push(`Daytime stitches (${daytimeRowsPreview.daytimeLabel})`);
        headers.push(`Night (right side) `);
        break;
      case 'sides':
        headers.push(`Daytime (left side) `);
        headers.push(`Night stitches (${daytimeRowsPreview.nightLabel})`);
        headers.push(`Daytime (right side) `);
        break;
      default:
        break;
    }
    const data = [
      headers,
      ...daytimeRowsPreview.tableData.map((n) => Object.values(n)),
    ];
    const csvContent = `data:text/csv;charset=utf-8,\uFEFF${data.map((e) => e.join(',')).join('\n')}`;
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute(
      'download',
      `Stitches Table for ${locations.projectFilename}`,
    );
    link.className = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
</script>

<div class="w-full">
  <div class="mx-auto max-w-screen-sm">
    <p class="">
      Each row is split according to the duration of sunlight that {weather.grouping}.
    </p>

    <div class="my-1 flex flex-col justify-center items-center italic">
      {#if daytimeRowsPreview.settings.daytimePosition === 'left'}
        <p>
          Daytime stitches (left side) = d × {daytimeRowsPreview.settings
            .stitchesPerRow}
          ∕ 24
        </p>
        <p>
          Night stitches (right side) = {daytimeRowsPreview.settings
            .stitchesPerRow}
          − Daytime stitches
        </p>
      {:else if daytimeRowsPreview.settings.daytimePosition === 'right'}
        <p>
          Daytime stitches (right side) = d × {daytimeRowsPreview.settings
            .stitchesPerRow}
          ∕ 24
        </p>
        <p>
          Night stitches (left side) = {daytimeRowsPreview.settings
            .stitchesPerRow}
          − Daytime stitches
        </p>
      {:else if daytimeRowsPreview.settings.daytimePosition === 'center'}
        <p>
          Daytime stitches = d × {daytimeRowsPreview.settings.stitchesPerRow}
          ∕ 24
        </p>
        <p>
          Night stitches = {daytimeRowsPreview.settings.stitchesPerRow}
          − Daytime stitches
        </p>
        <div class="my-1">
          <p>
            Left and Right side stitches = Night stitches / 2 (rounded up if not
            an integer)
          </p>
          <p>
            Center stitches = Daytime stitches (minus one stitch if the left and
            right sides' stitches were rounded up)
          </p>
        </div>
      {:else if daytimeRowsPreview.settings.daytimePosition === 'sides'}
        <p>
          Daytime stitches = d × {daytimeRowsPreview.settings.stitchesPerRow}
          ∕ 24
        </p>
        <p>
          Night stitches = {daytimeRowsPreview.settings.stitchesPerRow}
          − Daytime stitches
        </p>
        <div class="my-1">
          <p>
            Left and Right side stitches = Daytime stitches / 2 (rounded up if
            not an integer)
          </p>
          <p>
            Center stitches = Night stitches (minus one stitch if the left and
            right sides' stitches were rounded up)
          </p>
        </div>
      {/if}
    </div>

    <p class="text-sm italic">
      d = Daytime (time from the {weather.grouping}'s sunrise to sunset in
      hours). {daytimeRowsPreview.settings.stitchesPerRow}
      is the total stitches per row. 24 is the number of hours in a day. Stitches
      are rounded to the nearest integer.
    </p>
  </div>
</div>

<label class="label">
  <span>Position of Daytime Stitches</span>
  <select
    class="select w-fit"
    id="rsun-daytime-position"
    bind:value={daytimeRowsPreview.settings.daytimePosition}
  >
    <option value={'left'}>← Left Side</option>
    <option value={'right'}>→ Right Side</option>
    <option value={'center'}>→← Center</option>
    <option value={'sides'}>←→ Sides</option>
  </select>
</label>

<label class="label">
  <span
    >Color Daytime ({daytimeRowsPreview.daytimeLabel}) Using the {capitalizeFirstLetter(
      weather.grouping,
    )}'s</span
  >
  <select
    class="select w-fit"
    id="rsun-left-params"
    bind:value={daytimeRowsPreview.settings.daytimeTarget}
  >
    {#each targets as { id, label, icon }}
      <option value={id}>{icon} {label}</option>
    {/each}
  </select>
</label>

<label class="label">
  <span
    >Color Night ({daytimeRowsPreview.nightLabel}) Using the {capitalizeFirstLetter(
      weather.grouping,
    )}'s</span
  >
  <select
    class="select w-fit"
    id="rsun-right-params"
    bind:value={daytimeRowsPreview.settings.nightTarget}
  >
    {#each targets as { id, label, icon }}
      <option value={id}>{icon} {label}</option>
    {/each}
  </select>
</label>

<NumberInputButton
  bind:value={daytimeRowsPreview.settings.stitchesPerRow}
  title="Stitches Per Row"
  icon={true}
/>

<div class="w-full">
  <Expand
    bind:isExpanded={isTableExpanded}
    more="Show Stitches Table"
    less="Hide Stitches Table"
  />
</div>
{#if isTableExpanded}
  <div in:slide out:slide class="w-full max-w-[90vw] mx-auto relative">
    <DataTable {table} search={false}>
      <table class="border-separate border-spacing-0 w-full">
        <thead>
          <tr>
            <th>Row</th>
            <th
              >{weather.groupingHeading}
              <span class="text-xs">(YYYY-MM-DD)</span></th
            >
            {#if daytimeRowsPreview.settings.daytimePosition === 'left'}
              <th>Daytime stitches <br />({daytimeRowsPreview.daytimeLabel})</th
              >
              <th>Night stitches<br />({daytimeRowsPreview.nightLabel})</th>
            {:else if daytimeRowsPreview.settings.daytimePosition === 'right'}
              <th>Night stitches<br />({daytimeRowsPreview.nightLabel})</th>
              <th>Daytime stitches<br />({daytimeRowsPreview.daytimeLabel})</th>
            {:else if daytimeRowsPreview.settings.daytimePosition === 'center'}
              <th>Night stitches<br />(left side)</th>
              <th>Daytime stitches<br />(center)</th>
              <th>Night stitches<br />(right side)</th>
            {:else if daytimeRowsPreview.settings.daytimePosition === 'sides'}
              <th>Daytime stitches<br />(left side)</th>
              <th>Night stitches<br />(center)</th>
              <th>Daytime stitches<br />(right side)</th>
            {/if}
          </tr>
        </thead>
        <tbody
          class="[&>tr:nth-child(odd)]:bg-surface-100 [&>tr:nth-child(odd)]:dark:bg-surface-800"
        >
          {#if table.rows}
            {#each table.rows as row}
              <tr>
                <td>{row.row}</td>
                <td>{row.date}</td>
                <td>{row.left}</td>
                {#if row.center}
                  <td>{row.center}</td>
                {/if}
                <td>{row.right}</td>
              </tr>
            {/each}
          {/if}
        </tbody>
      </table>
    </DataTable>
    <div class="mt-4">
      <button
        class="btn hover:preset-tonal gap-1"
        onclick={downloadStitchesTableCSV}
        title="Download CSV File"
      >
        {@html ICONS.download}
        Download Stitches Table (CSV File)</button
      >
    </div>
  </div>
{/if}

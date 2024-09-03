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

<script context="module">
  import {
    activePreview,
    weatherGrouping,
    weatherItemHeading,
  } from '$lib/stores';
  import { derived, writable } from 'svelte/store';

  const id = 'rsun';

  const defaultSettings = {
    daytimeTarget: 'tmax',
    nightTarget: 'tmin',
    stitchesPerRow: 300,
    daytimePosition: 'left', // 'left' || 'right' || 'center' || 'sides'
  };

  export const settings = writable(JSON.parse(JSON.stringify(defaultSettings)));

  export const hash = derived(settings, ($settings) => {
    let hash = '&';
    hash += `${id}=`;
    hash += `${$settings.daytimeTarget}${$settings.nightTarget}(${$settings.stitchesPerRow})`;
    switch ($settings.daytimePosition) {
      case 'left':
        hash += '0';
        break;
      case 'right':
        hash += '1';
        break;
      case 'center':
        hash += '2';
        break;
      case 'sides':
        hash += '3';
        break;
      default:
        break;
    }
    return hash;
  });

  export const load = (hash) => {
    let _settings = JSON.parse(JSON.stringify(defaultSettings));

    let startIndex, lengthEndIndex;

    for (let i = 0; i < hash.length; i++) {
      if (hash[i] === '(') startIndex = i;
      if (hash[i] === ')') lengthEndIndex = i;
    }

    if (!startIndex || !lengthEndIndex) return; // format of hash was wrong, so stop processing
    // targets
    let targets = hash.substring(0, startIndex);
    targets = targets.match(/.{1,4}/g);
    _settings.daytimeTarget = targets[0];
    _settings.nightTarget = targets[1];

    // stitches per row
    _settings.stitchesPerRow = +hash.substring(startIndex + 1, lengthEndIndex);

    // Added daytimePosition from v1.815
    if (hash.length > lengthEndIndex + 1) {
      switch (hash.substring(lengthEndIndex + 1, lengthEndIndex + 2)) {
        case '0':
          _settings.daytimePosition = 'left';
          break;
        case '1':
          _settings.daytimePosition = 'right';
          break;
        case '2':
          _settings.daytimePosition = 'center';
          break;
        case '3':
          _settings.daytimePosition = 'sides';
          break;

        default:
          break;
      }
    }

    settings.set(_settings);
    activePreview.setId(id);
  };
</script>

<script>
  import NumberInputButton from '$lib/components/buttons/NumberInputButton.svelte';
  import DataTable from '$lib/components/datatable/DataTable.svelte';
  import Expand from '$lib/components/Expand.svelte';
  import { HOURS_PER_DAY } from '$lib/constants';
  import { createdGauges, projectFilename, weather } from '$lib/stores';
  import {
    capitalizeFirstLetter,
    displayNumber,
    setTargets,
    dateToISO8601String,
  } from '$lib/utils';
  import { DataHandler, Th } from '@vincjo/datatables';
  import { slide } from 'svelte/transition';

  const handler = new DataHandler(tableData, { rowsPerPage: 10 });
  const rows = handler.getRows();

  let isExpanded = false;
  let daytimeLabel, nightLabel;

  $: targets = $createdGauges.map((n) => n.targets).flat();

  $: tableData = $weather?.map((n, i) => {
    let left, center, right, divided;
    let daytimeStitches = displayNumber(
      (n.dayt['imperial'] * $settings.stitchesPerRow) / HOURS_PER_DAY,
      0,
    );
    let nightStitches = displayNumber(
      $settings.stitchesPerRow - daytimeStitches,
      0,
    );
    switch ($settings.daytimePosition) {
      case 'left':
        left = daytimeStitches;
        right = nightStitches;
        break;
      case 'right':
        left = nightStitches;
        right = daytimeStitches;
        break;
      case 'center':
        divided = nightStitches / 2;
        if (!Number.isInteger(divided)) {
          divided = Math.ceil(divided);
          daytimeStitches -= 1;
        }
        left = divided;
        center = daytimeStitches;
        right = divided;
        break;
      case 'sides':
        divided = daytimeStitches / 2;
        if (!Number.isInteger(divided)) {
          divided = Math.ceil(divided);
          nightStitches -= 1;
        }
        left = divided;
        center = nightStitches;
        right = divided;
        break;
      default:
        break;
    }
    return {
      row: i + 1,
      date: dateToISO8601String(n.date),
      left,
      center,
      right,
    };
  });

  $: if ($createdGauges) {
    $settings.daytimeTarget = setTargets($settings.daytimeTarget);
    $settings.nightTarget = setTargets($settings.nightTarget);
  }

  $: if (tableData) {
    handler.setRows(tableData);
  }

  $: if ($settings.daytimePosition) {
    switch ($settings.daytimePosition) {
      case 'left':
        daytimeLabel = 'left side';
        nightLabel = 'right side';
        break;
      case 'right':
        daytimeLabel = 'right side';
        nightLabel = 'left side';
        break;
      case 'center':
        daytimeLabel = 'center';
        nightLabel = 'sides';
        break;
      case 'sides':
        daytimeLabel = 'sides';
        nightLabel = 'center';
        break;
      default:
        break;
    }
  }

  function downloadStitchesTableCSV() {
    const headers = ['Row', $weatherItemHeading];
    switch ($settings.daytimePosition) {
      case 'left':
        headers.push(`Daytime stitches (${daytimeLabel})`);
        headers.push(`Night stitches (${nightLabel})`);
        break;
      case 'right':
        headers.push(`Night stitches (${nightLabel})`);
        headers.push(`Daytime stitches (${daytimeLabel})`);
        break;
      case 'center':
        headers.push(`Night (left side) `);
        headers.push(`Daytime stitches (${daytimeLabel})`);
        headers.push(`Night (right side) `);
        break;
      case 'sides':
        headers.push(`Daytime (left side) `);
        headers.push(`Night stitches (${nightLabel})`);
        headers.push(`Daytime (right side) `);
        break;
      default:
        break;
    }
    const data = [headers, ...tableData.map((n) => Object.values(n))];
    const csvContent = `data:text/csv;charset=utf-8,\uFEFF${data.map((e) => e.join(',')).join('\n')}`;
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Stitches Table for ${$projectFilename}`);
    link.className = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
</script>

<div class="w-full">
  <div class="mx-auto max-w-screen-sm">
    <p class="">
      Each row is split according to the duration of sunlight that {$weatherGrouping}.
    </p>

    <div class="my-1 flex flex-col justify-center items-center italic">
      {#if $settings.daytimePosition === 'left'}
        <p>
          Daytime stitches (left side) = d × {$settings.stitchesPerRow}
          ∕ 24
        </p>
        <p>
          Night stitches (right side) = {$settings.stitchesPerRow}
          − Daytime stitches
        </p>
      {:else if $settings.daytimePosition === 'right'}
        <p>
          Daytime stitches (right side) = d × {$settings.stitchesPerRow}
          ∕ 24
        </p>
        <p>
          Night stitches (left side) = {$settings.stitchesPerRow}
          − Daytime stitches
        </p>
      {:else if $settings.daytimePosition === 'center'}
        <p>
          Daytime stitches = d × {$settings.stitchesPerRow}
          ∕ 24
        </p>
        <p>
          Night stitches = {$settings.stitchesPerRow}
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
      {:else if $settings.daytimePosition === 'sides'}
        <p>
          Daytime stitches = d × {$settings.stitchesPerRow}
          ∕ 24
        </p>
        <p>
          Night stitches = {$settings.stitchesPerRow}
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
      d = Daytime (time from the {$weatherGrouping}'s sunrise to sunset in
      hours). {$settings.stitchesPerRow}
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
    bind:value={$settings.daytimePosition}
  >
    <option value={'left'}>← Left Side</option>
    <option value={'right'}>→ Right Side</option>
    <option value={'center'}>→← Center</option>
    <option value={'sides'}>←→ Sides</option>
  </select>
</label>

<label class="label">
  <span
    >Color Daytime ({daytimeLabel}) Using the {capitalizeFirstLetter(
      $weatherGrouping,
    )}'s</span
  >
  <select
    class="select w-fit"
    id="rsun-left-params"
    bind:value={$settings.daytimeTarget}
  >
    {#each targets as { id, label, icon }}
      <option value={id}>{icon} {label}</option>
    {/each}
  </select>
</label>

<label class="label">
  <span
    >Color Night ({nightLabel}) Using the {capitalizeFirstLetter(
      $weatherGrouping,
    )}'s</span
  >
  <select
    class="select w-fit"
    id="rsun-right-params"
    bind:value={$settings.nightTarget}
  >
    {#each targets as { id, label, icon }}
      <option value={id}>{icon} {label}</option>
    {/each}
  </select>
</label>

<NumberInputButton
  bind:value={$settings.stitchesPerRow}
  title="Stitches Per Row"
  icon={true}
/>

<div class="w-full">
  <Expand
    bind:isExpanded
    more="Show Stitches Table"
    less="Hide Stitches Table"
  />
</div>
{#if isExpanded}
  <div in:slide out:slide class="w-full max-w-[90vw] mx-auto relative">
    <DataTable {handler} search={false}>
      <table class="border-separate border-spacing-0 w-full">
        <thead>
          <tr>
            <Th {handler} orderBy={'row'}>Row</Th>
            <Th {handler} orderBy={'date'}
              >{$weatherItemHeading}
              <span class="text-xs">(YYYY-MM-DD)</span></Th
            >
            {#if $settings.daytimePosition === 'left'}
              <Th {handler} orderBy={'left'}
                >Daytime stitches <br />({daytimeLabel})</Th
              >
              <Th {handler} orderBy={'right'}
                >Night stitches<br />({nightLabel})</Th
              >
            {:else if $settings.daytimePosition === 'right'}
              <Th {handler} orderBy={'left'}
                >Night stitches<br />({nightLabel})</Th
              >
              <Th {handler} orderBy={'right'}
                >Daytime stitches<br />({daytimeLabel})</Th
              >
            {:else if $settings.daytimePosition === 'center'}
              <Th {handler} orderBy={'left'}>Night stitches<br />(left side)</Th
              >
              <Th {handler} orderBy={'center'}
                >Daytime stitches<br />(center)</Th
              >
              <Th {handler} orderBy={'right'}
                >Night stitches<br />(right side)</Th
              >
            {:else if $settings.daytimePosition === 'sides'}
              <Th {handler} orderBy={'left'}
                >Daytime stitches<br />(left side)</Th
              >
              <Th {handler} orderBy={'center'}>Night stitches<br />(center)</Th>
              <Th {handler} orderBy={'right'}
                >Daytime stitches<br />(right side)</Th
              >
            {/if}
          </tr>
        </thead>
        <tbody
          class="[&>tr:nth-child(odd)]:bg-surface-100 [&>tr:nth-child(odd)]:dark:bg-surface-800"
        >
          {#if $rows}
            {#each $rows as row}
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
        class="btn bg-secondary-hover-token gap-1"
        on:click={downloadStitchesTableCSV}
        title="Download CSV File"
        ><svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          stroke-width="1.5"
          stroke="currentColor"
          class="w-6 h-6"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            d="M9 8.25H7.5a2.25 2.25 0 00-2.25 2.25v9a2.25 2.25 0 002.25 2.25h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25H15M9 12l3 3m0 0l3-3m-3 3V2.25"
          />
        </svg>
        Download Stitches Table (CSV File)</button
      >
    </div>
  </div>
{/if}

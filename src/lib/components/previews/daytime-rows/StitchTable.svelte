<!-- Copyright (c) 2024 - 2026, Thomas (https://github.com/jdvlpr)

This file is part of Temperature-Blanket-Web-App.

Temperature-Blanket-Web-App is free software: you can redistribute it and/or modify it
under the terms of the GNU General Public License as published by the Free Software Foundation,
either version 3 of the License, or (at your option) any later version.

Temperature-Blanket-Web-App is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY;
without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.
See the GNU General Public License for more details.

You should have received a copy of the GNU General Public License along with Temperature-Blanket-Web-App.
If not, see <https://www.gnu.org/licenses/>. -->

<!-- @component
  The Daytime Rows preview's stitches, row by row, in a dialog: the weather
  grid (components/weather-grid/) with each row's day, its daytime (with its
  color) and its stitches on each side. Made / Not made and Dates filters,
  Go to a row or a date, and Download (CSV).
-->
<script lang="ts">
  import DayCell from '#lib/components/weather-grid/DayCell.svelte';
  import DayFilterSetting from '#lib/components/weather-grid/DayFilterSetting.svelte';
  import {
    DayFilters,
    locationName,
  } from '#lib/components/weather-grid/day-filters.svelte.js';
  import {
    gridColor,
    hasGauge,
    showColors,
  } from '#lib/components/weather-grid/grid-color.svelte.js';
  import {
    CELL,
    type GridColumn,
  } from '#lib/components/weather-grid/grid-styles.js';
  import GridToolbar from '#lib/components/weather-grid/GridToolbar.svelte';
  import ValueCell from '#lib/components/weather-grid/ValueCell.svelte';
  import { weatherColumn } from '#lib/components/weather-grid/weather-columns.js';
  import WeatherGrid from '#lib/components/weather-grid/WeatherGrid.svelte';
  import { locations } from '#lib/state/location-state.svelte.js';
  import { progress } from '#lib/state/progress-state.svelte.js';
  import { weather } from '#lib/state/weather-state.svelte.js';
  import { preferences } from '#lib/storage/preferences.svelte.js';
  import { dateToISO8601String } from '#lib/utils/date-utils.js';
  import { openProgress } from '#lib/utils/open-progress.js';
  import { convertTime } from '#lib/utils/unit-utils.svelte.js';
  import {
    applyFilters,
    chipsOf,
    rowForDate,
  } from '#lib/utils/weather-grid.js';
  import { DownloadIcon } from '@lucide/svelte';
  import { daytimeRowsPreview } from './state.svelte';

  type Row = {
    index: number;
    key: string;
    date: string;
    location: number;
    left: number;
    center: number;
    right: number;
  };

  const units = $derived(preferences.value.units ?? 'metric');
  const several = $derived(locations.all.length > 1);
  const position = $derived(daytimeRowsPreview.settings.daytimePosition);

  const all: Row[] = $derived(
    daytimeRowsPreview.tableData.map((stitches, index) => {
      const day = weather.data[index];
      const date = day ? dateToISO8601String(day.date) : '';
      return {
        index,
        key: `${day?.location ?? 0}|${date}`,
        date,
        location: day?.location ?? 0,
        left: +(stitches.left ?? 0),
        center: +(stitches.center ?? 0),
        right: +(stitches.right ?? 0),
      };
    }),
  );

  const daytime = (row: Row) =>
    (weather.getWeatherValue({ dayIndex: row.index, param: 'dayt' }) as
      | number
      | null) ?? null;

  // The stitch columns, by where the daytime goes
  const stitchColumns: (GridColumn & { side: 'left' | 'center' | 'right' })[] =
    $derived.by(() => {
      const day = `(${daytimeRowsPreview.daytimeLabel})`;
      const night = `(${daytimeRowsPreview.nightLabel})`;
      switch (position) {
        case 'right':
          return [
            { id: 'left', side: 'left', label: 'Night stitches', unit: night.slice(1, -1) },
            { id: 'right', side: 'right', label: 'Daytime stitches', unit: day.slice(1, -1) },
          ];
        case 'center':
          return [
            { id: 'left', side: 'left', label: 'Night', unit: 'left side' },
            { id: 'center', side: 'center', label: 'Daytime', unit: 'center' },
            { id: 'right', side: 'right', label: 'Night', unit: 'right side' },
          ];
        case 'sides':
          return [
            { id: 'left', side: 'left', label: 'Daytime', unit: 'left side' },
            { id: 'center', side: 'center', label: 'Night', unit: 'center' },
            { id: 'right', side: 'right', label: 'Daytime', unit: 'right side' },
          ];
        default:
          return [
            { id: 'left', side: 'left', label: 'Daytime stitches', unit: day.slice(1, -1) },
            { id: 'right', side: 'right', label: 'Night stitches', unit: night.slice(1, -1) },
          ];
      }
    });

  const columns: GridColumn[] = $derived([
    weatherColumn('dayt', units),
    ...stitchColumns,
  ]);

  const filters = new DayFilters<Row>(
    () => all,
    () => ({
      key: (row) => row.key,
      date: (row) => row.date,
      location: (row) => row.location,
      ...(progress.madeThrough && {
        made: (row: Row) => progress.rowOf(row.key)?.made ?? null,
      }),
    }),
  );
  const chips = $derived(chipsOf(all, filters.filters, filters.on));
  const shown = $derived(applyFilters(all, filters.filters, filters.on));

  const lines = $derived(showColors.value || several ? 2 : 1);

  // ***************
  // Go to a row or a date
  // ***************

  let grid: ReturnType<typeof WeatherGrid<Row>> | undefined = $state();
  let goToRow = $state<number | null>(null);
  let goToDate = $state('');

  async function goTo(at: number) {
    if (at < 0 || !grid) return;
    await grid.scrollToRow(at);
    grid.flashRow(at);
  }
  const goRow = (number: number | null) => {
    if (!number) return;
    // The shown row nearest to that row number
    let at = shown.findIndex((row) => row.index + 1 >= number);
    if (at < 0) at = shown.length - 1;
    void goTo(at);
  };

  // ***************
  // Download
  // ***************

  function download() {
    const headers = [
      'Row',
      weather.groupingHeading,
      ...stitchColumns.map((c) => `${c.label} (${c.unit})`),
    ];
    const data = [
      headers,
      ...all.map((row) => [
        row.index + 1,
        row.date,
        ...stitchColumns.map((c) => row[c.side]),
      ]),
    ];
    const csvContent = `data:text/csv;charset=utf-8,\uFEFF${data.map((e) => e.join(',')).join('\n')}`;
    const link = document.createElement('a');
    link.setAttribute('href', encodeURI(csvContent));
    link.setAttribute(
      'download',
      `Stitches Per Row for ${locations.projectFilename}`,
    );
    link.className = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
</script>

<div class="flex flex-col gap-3 px-2 pb-2 text-left sm:px-4">
  <GridToolbar
    {chips}
    ontoggle={filters.toggle}
    shown={shown.length}
    total={all.length}
    noun="row"
  >
    {#snippet setting(id)}
      <DayFilterSetting {id} {filters} />
    {/snippet}
    <label class="flex items-center gap-2 text-sm">
      Go to row
      <input
        type="number"
        class="input field-sm w-20"
        min="1"
        max={all.length}
        bind:value={goToRow}
        onchange={() => goRow(goToRow)}
      />
    </label>
    <label class="flex items-center gap-2 text-sm">
      or {weather.grouping}
      <input
        type="date"
        class="input field-sm w-auto"
        min={all[0]?.date}
        max={all.at(-1)?.date}
        bind:value={goToDate}
        onchange={() =>
          goToDate &&
          void goTo(
            rowForDate(
              shown.map((r) => r.date),
              goToDate,
            ),
          )}
      />
    </label>
  </GridToolbar>

  <WeatherGrid
    bind:this={grid}
    rows={shown}
    key={(row) => `${row.index}`}
    {columns}
    {lines}
    scroll="box"
    label="Stitches per row"
    dayHeader={weather.groupingHeading}
    class="h-[min(65vh,40rem)]"
    lead={{ width: '3.5rem', header: rowHeader, cell: rowNumber }}
  >
    {#snippet day(row)}
      {@const made = progress.rowOf(row.key)}
      <DayCell
        date={row.date}
        location={several ? locationName(row.location) : ''}
        made={made ? made.made : null}
        onmade={made ? () => openProgress(made.day) : undefined}
      />
    {/snippet}
    {#snippet cell(row, column)}
      <div role="cell" class={CELL}>
        {#if column.id === 'dayt'}
          {@const value = daytime(row)}
          <ValueCell
            text={value === null
              ? ''
              : convertTime(value, { displayUnits: false, padStart: true })}
            color={showColors.value && hasGauge('dayt')
              ? gridColor('dayt', value)
              : undefined}
            swatchTitle="{row.date}, Daytime"
          />
        {:else}
          <ValueCell
            text={`${row[column.id as 'left' | 'center' | 'right']}`}
          />
        {/if}
      </div>
    {/snippet}
    {#snippet empty()}
      No rows match these filters.
    {/snippet}
  </WeatherGrid>

  <div class="flex justify-end">
    <button
      type="button"
      class="btn hover:preset-tonal-surface"
      onclick={download}
      title="Download CSV File"
    >
      <DownloadIcon /> Download (CSV)
    </button>
  </div>
</div>

{#snippet rowHeader()}
  <span class="text-sm font-bold">Row</span>
{/snippet}

{#snippet rowNumber(row: Row)}
  <span class="text-sm tabular-nums">{row.index + 1}</span>
{/snippet}

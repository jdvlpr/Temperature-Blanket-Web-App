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
  The project's weather, day by day (or week by week): the Weather step's
  table (`scroll="window"`, the page scrolling) and a range's days in a
  dialog (`startColor`: a range's day count in GaugeCustomizer). Filters,
  Sort by any column, Go to a date, Show Colors. Pressing a day's value opens
  Edit Weather Data on it.
-->
<script lang="ts">
  import KeptDay from '#lib/components/modals/KeptDay.svelte';
  import { MOON_PHASE_NAMES } from '#lib/constants/weather-constants.js';
  import { locations } from '#lib/state/location-state.svelte.js';
  import { dialog } from '#lib/state/page-state.svelte.js';
  import { progress } from '#lib/state/progress-state.svelte.js';
  import { weatherDays } from '#lib/state/weather-days.svelte.js';
  import { weather } from '#lib/state/weather-state.svelte.js';
  import { preferences } from '#lib/storage/preferences.svelte.js';
  import type { WeatherParam } from '#lib/types/gauge-types.js';
  import { dateToISO8601String, getIsRecentDate } from '#lib/utils/date-utils.js';
  import { openEditWeather } from '#lib/utils/open-edit-weather.js';
  import { openProgress } from '#lib/utils/open-progress.js';
  import { convertTime } from '#lib/utils/unit-utils.svelte.js';
  import type { DayKey } from '#lib/utils/weather-days.js';
  import type { EditableParam } from '#lib/utils/weather-edits.js';
  import {
    applyFilters,
    chipsOf,
    rowForDate,
    sortRows,
    type SortDirection,
  } from '#lib/utils/weather-grid.js';
  import { untrack } from 'svelte';
  import DayCell from './DayCell.svelte';
  import DayFilterSetting from './DayFilterSetting.svelte';
  import { DayFilters, locationName, type ColorSetting } from './day-filters.svelte.js';
  import { gridColor, hasGauge, showColors } from './grid-color.svelte.js';
  import { CELL, TINT, type GridColumn } from './grid-styles.js';
  import GridToolbar from './GridToolbar.svelte';
  import { ALL_VALUES as VALUES } from './weather-columns.js';
  import ValueCell from './ValueCell.svelte';
  import { weatherColumn } from './weather-columns.js';
  import WeatherGrid from './WeatherGrid.svelte';

  let {
    scroll = 'window',
    startColor,
  }: {
    scroll?: 'box' | 'window';
    /** Open showing a color's days (a range's days) */
    startColor?: ColorSetting;
  } = $props();

  type Row = { index: number; key: DayKey; date: string; location: number };

  const units = $derived(preferences.value.units ?? 'metric');
  const params = $derived(
    weather.tableWeatherTargets.map((t) => t.id as WeatherParam['id']),
  );
  const several = $derived(locations.all.length > 1);
  const byWeek = $derived(weather.grouping === 'week');

  const all: Row[] = $derived(
    weather.data.map((day, index) => {
      const date = dateToISO8601String(day.date);
      return {
        index,
        key: `${day.location}|${date}` as DayKey,
        date,
        location: day.location,
      };
    }),
  );

  /** A value as a number (minutes of daytime, the moon's phase), null when missing */
  const numberAt = (row: Row, param: WeatherParam['id']): number | null =>
    (weather.getWeatherValue({ dayIndex: row.index, param }) as
      | number
      | null
      | undefined) ?? null;

  const textAt = (row: Row, param: WeatherParam['id']) => {
    const value = numberAt(row, param);
    if (value === null) return '';
    if (param === 'moon') return MOON_PHASE_NAMES[value] ?? '';
    if (param === 'dayt')
      return convertTime(value, { displayUnits: false, padStart: true });
    return `${value}`;
  };

  const madeOf = (row: Row) => progress.rowOf(row.key);

  const filters = new DayFilters<Row>(
    () => all,
    () => ({
      key: (row) => row.key,
      date: (row) => row.date,
      location: (row) => row.location,
      missing: (row) =>
        params.some((param) => param !== 'moon' && numberAt(row, param) === null),
      ...(progress.madeThrough && {
        made: (row: Row) => madeOf(row)?.made ?? null,
      }),
      recent: (row) => getIsRecentDate(row.date),
      ...(!byWeek && {
        kept: (row: Row) => !!weatherDays.declined[row.key],
      }),
      color: {
        of: (row, param) => gridColor(param, numberAt(row, param)),
        params,
      },
    }),
  );
  // Only as it opens
  untrack(() => {
    if (startColor) filters.startWithColor(startColor);
  });

  const chips = $derived(chipsOf(all, filters.filters, filters.on));
  const filtered = $derived(applyFilters(all, filters.filters, filters.on));

  let sort = $state<{ id: string; direction: SortDirection } | null>(null);
  const shown = $derived(
    sortRows(
      filtered,
      sort
        ? sort.id === 'day'
          ? (row) => row.date
          : (row) => numberAt(row, sort!.id as WeatherParam['id'])
        : null,
      sort?.direction ?? 'ascending',
    ),
  );

  const columns: GridColumn[] = $derived(
    params.map((param) => weatherColumn(param, units, { sortable: true })),
  );
  const lines = $derived(showColors.value || several ? 2 : 1);

  // ***************
  // Go to a date
  // ***************

  let grid: ReturnType<typeof WeatherGrid<Row>> | undefined = $state();
  let goTo = $state('');
  const today = new Date().toISOString().slice(0, 10);
  const hasToday = $derived(!byWeek && all.some((row) => row.date === today));

  async function go(date: string) {
    const row = rowForDate(
      shown.map((r) => r.date),
      date,
    );
    if (row < 0 || !grid) return;
    await grid.scrollToRow(row);
    grid.flashRow(row);
  }

  function editAt(row: Row, param: WeatherParam['id']) {
    openEditWeather({
      day: { date: row.date, location: row.location, param: param as EditableParam },
    });
  }

  const editable = (param: WeatherParam['id']) => !byWeek && param !== 'moon';
</script>

<div class={['flex flex-col gap-3 text-left', scroll === 'box' && 'px-2 pb-2 sm:px-4']}>
  <GridToolbar
    {chips}
    ontoggle={filters.toggle}
    values={VALUES}
    shown={shown.length}
    total={all.length}
    noun={weather.grouping}
  >
    {#snippet setting(id)}
      <DayFilterSetting {id} {filters} />
    {/snippet}
    <form
      class="flex items-center gap-2"
      onsubmit={(e) => {
        e.preventDefault();
        void go(goTo);
      }}
    >
      <label class="flex items-center gap-2 text-sm">
        Go to
        <input
          type="date"
          class="input field-sm w-auto"
          min={all[0]?.date}
          max={all.at(-1)?.date}
          bind:value={goTo}
          onchange={() => goTo && void go(goTo)}
        />
      </label>
      {#if hasToday}
        <button
          type="button"
          class="btn btn-sm preset-tonal"
          onclick={() => void go(today)}>Today</button
        >
      {/if}
    </form>
  </GridToolbar>

  <WeatherGrid
    bind:this={grid}
    bind:sort
    rows={shown}
    key={(row) => row.key}
    {columns}
    {lines}
    {scroll}
    label="Weather data"
    dayHeader={weather.groupingHeading}
    daySortable
    class={scroll === 'box' ? 'h-[min(70vh,40rem)]' : ''}
    rowTint={(row) => getIsRecentDate(row.date) && TINT.recent}
  >
    {#snippet day(row)}
      {@const made = madeOf(row)}
      <DayCell
        date={row.date}
        location={several ? locationName(row.location) : ''}
        made={made ? made.made : null}
        onmade={made ? () => openProgress(made.day) : undefined}
        kept={!byWeek && !!weatherDays.declined[row.key]}
        onkept={() =>
          dialog.trigger({
            type: 'component',
            component: { ref: KeptDay, props: { key: row.key } },
            options: { title: row.date },
          })}
        recent={getIsRecentDate(row.date)}
      />
    {/snippet}
    {#snippet cell(row, column)}
      {@const param = column.id as WeatherParam['id']}
      {@const text = textAt(row, param)}
      <div role="cell" class={CELL}>
        {#if editable(param)}
          <button
            type="button"
            class="hover:preset-tonal-surface absolute inset-0"
            aria-label="Edit {row.date}, {column.label}: {text || 'missing'}"
            title="Edit"
            onclick={() => editAt(row, param)}
          ></button>
        {/if}
        <div class="pointer-events-none relative h-full [&_button]:pointer-events-auto">
          <ValueCell
            {text}
            color={showColors.value && hasGauge(param)
              ? gridColor(param, numberAt(row, param))
              : undefined}
            swatchTitle="{row.date}, {column.label}"
          />
        </div>
      </div>
    {/snippet}
    {#snippet empty()}
      No {weather.grouping}s match these filters.
    {/snippet}
  </WeatherGrid>
</div>

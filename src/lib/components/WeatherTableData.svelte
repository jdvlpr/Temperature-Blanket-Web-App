<script lang="ts">
  import { dialog } from '#lib/state/page-state.svelte.js';
  import { weather } from '#lib/state/weather-state.svelte.js';
  import { preferences } from '#lib/storage/preferences.svelte.js';
  import { getIsFutureDate, getIsRecentDate } from '#lib/utils/date-utils.js';
  import { openEditWeather } from '#lib/utils/open-edit-weather.js';
  import type { EditableParam } from '#lib/utils/weather-edits.js';
  import { getTextColor } from '#lib/utils/color-utils.js';
  import { TableHandler, ThSort } from '@vincjo/datatables';
  import { onMount } from 'svelte';
  import RecentWeatherDataTooltip from './RecentWeatherDataTooltip.svelte';
  import { showColorDetails } from './WeatherTableWrapper.svelte';
  import DataTable from './datatable/DataTable.svelte';
  import KeptDay from './modals/KeptDay.svelte';
  import { weatherDays } from '#lib/state/weather-days.svelte.js';
  import { CircleCheckIcon, CircleIcon, HistoryIcon } from '@lucide/svelte';
  import { progress } from '#lib/state/progress-state.svelte.js';
  import { openProgress } from '#lib/utils/open-progress.js';
  import type { DayKey } from '#lib/utils/weather-days.js';

  let { tableData, updateTable, uid } = $props();

  let table = $derived.by(() => {
    return new TableHandler(tableData, {
      rowsPerPage: weather.table.rowsPerPage,
    });
  });

  onMount(() => {
    table.setPage(weather.table.page);
  });
</script>

<DataTable {table} search={true} {uid}>
  <table class={'mx-auto w-full border-separate border-spacing-0'}>
    <thead>
      <tr>
        <ThSort {table} field="date">
          <span class="flex flex-col items-center justify-center"
            >{weather.groupingHeading}
            <span class="text-xs whitespace-nowrap">(YYYY-MM-DD)</span></span
          >
        </ThSort>
        {#each weather.tableWeatherTargets as { id, pdfHeader }}
          {@const header = pdfHeader[preferences.value.units ?? 'metric']}
          {@const hasHeaderUnits = header.includes('(')}
          {@const headerLabel = header.slice(0, header.indexOf('('))}
          {@const headerUnits = header.slice(header.indexOf('('))}
          <ThSort {table} field={id}>
            <span class="flex flex-wrap items-center justify-center gap-1">
              {#if hasHeaderUnits}
                {headerLabel}
                <span class="text-xs">{headerUnits}</span>
              {:else}
                {header}
              {/if}
            </span>
          </ThSort>
        {/each}
      </tr>
    </thead>
    <tbody
      class="[&>tr:nth-child(odd)]:bg-surface-100 dark:[&>tr:nth-child(odd)]:bg-surface-800"
    >
      {#each table.rows as row}
        {@const index = table.allRows.findIndex((r) => r.date === row.date)}
        {@const isRecentDate = getIsRecentDate(row.date)}
        {@const isFutureDate = getIsFutureDate(row.date)}
        {@const keptKey = `${row.location}|${row.date}` as DayKey}
        {@const made = progress.rowOf(keptKey)}
        <tr
          class={[
            isRecentDate && '!bg-warning-500/20',
            showColorDetails.value &&
              '!divide-surface-50 dark:!divide-surface-900 divide-x-2 divide-y-2',
            'scroll-mt-[78px] transition-colors duration-300 ease-in-out',
          ]}
          id="{uid}-{index}"
        >
          <td class={[showColorDetails.value && 'text-center']}>
            {#if isRecentDate}
              <RecentWeatherDataTooltip />
            {/if}
            <!-- Made or not (the project's progress), on every row so the
            dates line up: opens Progress, which sets it -->
            {#if made}
              <button
                type="button"
                class={[
                  'btn-icon btn-icon-sm hover:preset-tonal-surface align-middle',
                  made.made ? 'text-success-700-300' : 'opacity-35',
                ]}
                title={made.made
                  ? 'Made: set how far you’ve made it'
                  : 'Not made yet: set how far you’ve made it'}
                aria-label="{row.date}: {made.made
                  ? 'made'
                  : 'not made yet'}. Set progress"
                onclick={() => openProgress(made.day)}
                data-testid="table-made"
                data-made={made.made}
              >
                {#if made.made}
                  <CircleCheckIcon class="icon-sm" />
                {:else}
                  <CircleIcon class="icon-sm" />
                {/if}
              </button>
            {/if}
            {row.date}
            <!-- Saved values kept over newer ones Check for Updates got -->
            {#if weather.grouping === 'day' && weatherDays.declined[keptKey]}
              <button
                type="button"
                class="btn-icon btn-icon-sm hover:preset-tonal-surface align-middle"
                title="Kept saved values"
                aria-label="{row.date}: kept saved values. Show the new ones"
                onclick={() =>
                  dialog.trigger({
                    type: 'component',
                    component: {
                      ref: KeptDay,
                      props: {
                        key: keptKey,
                        onchange: updateTable,
                      },
                    },
                    options: { title: `${row.date}` },
                  })}
              >
                <HistoryIcon class="icon-sm" />
              </button>
            {/if}
          </td>
          {#each weather.tableWeatherTargets as { id }}
            <td
              class={[
                showColorDetails.value && 'text-center',
                showColorDetails.value && !isFutureDate && 'px-2 pb-2',
              ]}
              style={row.color[id] &&
              showColorDetails.value &&
              typeof row.color[id].index === 'number'
                ? `background-color:${row.color[id].hex};color:${getTextColor(row.color[id].hex)}`
                : ''}
            >
              <button
                class={[
                  weather.grouping === 'day' && 'hover-on-color btn',
                  (weather.grouping === 'week' || id === 'moon') &&
                    'disabled:opacity-100',
                  isRecentDate && 'opacity-65',
                ]}
                disabled={weather.grouping === 'week' || id === 'moon'}
                onclick={() => {
                  // So the table comes back on the same page after Apply
                  weather.table.rowsPerPage = table.rowsPerPage;
                  weather.table.page = table.currentPage;
                  openEditWeather({
                    day: {
                      date: row.date,
                      location: row.location,
                      param: id as EditableParam,
                    },
                  });
                }}
              >
                {row[id]}
              </button>
              {#if row.color[id] && showColorDetails.value}
                {@const { hex, name, brandName, yarnName, index, gaugeLength } =
                  row.color[id]}
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
                {:else if typeof gaugeLength === 'number'}
                  <p class="text-xs">No Color Assigned</p>
                {:else if !isFutureDate}
                  <p class="text-xs">No Gauge Created</p>
                {/if}
              {/if}
            </td>
          {/each}
        </tr>
      {/each}
    </tbody>
  </table>
</DataTable>

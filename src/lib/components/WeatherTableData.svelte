<script lang="ts">
  import { UNIT_LABELS } from '$lib/constants';
  import { dialog, weather } from '$lib/state';
  import { preferences } from '$lib/storage/preferences.svelte';
  import {
    celsiusToFahrenheit,
    dateToISO8601String,
    displayNumber,
    fahrenheitToCelsius,
    getIsFutureDate,
    getIsRecentDate,
    getTextColor,
    hoursToMinutes,
    inchesToMillimeters,
    millimetersToInches,
  } from '$lib/utils';
  import { TableHandler, ThSort } from '@vincjo/datatables';
  import { onMount } from 'svelte';
  import RecentWeatherDataTooltip from './RecentWeatherDataTooltip.svelte';
  import { showColorDetails } from './WeatherTableWrapper.svelte';
  import DataTable from './datatable/DataTable.svelte';
  import NumberInput from './modals/NumberInput.svelte';
  import TextInput from './modals/TextInput.svelte';

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
          {@const header = pdfHeader[preferences.value.units]}
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
        <tr
          class={[
            isRecentDate && '!bg-warning-500/20',
            showColorDetails.value &&
              '!divide-surface-50 dark:!divide-surface-900 divide-x-2 divide-y-2',
            'scroll-mt-[78px] transition-colors duration-300 ease-in-out',
          ]}
          id="{uid}-{index}"
        >
          <td>
            {#if isRecentDate}
              <RecentWeatherDataTooltip />
            {/if}
            {row.date}
          </td>
          {#each weather.tableWeatherTargets as { id, label, type }}
            <td
              class={[showColorDetails.value && !isFutureDate && 'px-2 pb-2']}
              style={row.color[id] &&
              showColorDetails.value &&
              typeof row.color[id].index === 'number'
                ? `background-color:${row.color[id].hex};color:${getTextColor(row.color[id].hex)}`
                : ''}
            >
              <button
                class={[
                  weather.grouping === 'day' && 'hover:preset-tonal-surfacebtn',
                  (weather.grouping === 'week' || id === 'moon') &&
                    'disabled:opacity-100',
                  isRecentDate && 'opacity-65',
                ]}
                disabled={weather.grouping === 'week' || id === 'moon'}
                onclick={() => {
                  if (id === 'dayt') {
                    dialog.trigger({
                      type: 'component',
                      component: {
                        ref: TextInput,
                        props: {
                          value: row[id],
                          title: `<div class="flex flex-col items-center justify-center"><span class="font-bold">${row.date}</span><span>${label}</span></div>`,
                          onOkay: async (_value) => {
                            weather.isUserEdited = true;

                            const time = _value.split(':');

                            if (time.length !== 2) return;

                            weather.table.rowsPerPage = table.rowsPerPage;
                            weather.table.page = table.currentPage;

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
                            await updateTable();
                          },
                        },
                      },
                    });
                  } else {
                    dialog.trigger({
                      type: 'component',
                      component: {
                        ref: NumberInput,
                        props: {
                          max: 1000,
                          value: row[id],
                          title: `<div class="flex flex-col items-center justify-center"><span class="font-bold">${row.date}</span><span>${label} <span class="text-sm">(${UNIT_LABELS[type][preferences.value.units]})</span></span></div>`,
                          noMinMax: true,
                          showSlider: false,
                          onOkay: async (_value) => {
                            weather.isUserEdited = true;
                            const mappedWeather = weather.rawData.map(
                              (n) =>
                                `${dateToISO8601String(n.date)}-${n.location}`,
                            );
                            const i = mappedWeather.indexOf(
                              `${row.date}-${row.location}`,
                            );

                            weather.table.rowsPerPage = table.rowsPerPage;
                            weather.table.page = table.currentPage;

                            if (preferences.value.units === 'metric') {
                              weather.rawData[i][id].metric = _value;
                              if (type === 'temperature')
                                weather.rawData[i][id].imperial =
                                  celsiusToFahrenheit(_value);
                              if (type === 'height')
                                weather.rawData[i][id].imperial =
                                  millimetersToInches(_value);
                            }
                            if (preferences.value.units === 'imperial') {
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

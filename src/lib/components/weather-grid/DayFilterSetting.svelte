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
  A day filter's setting, in its chip's popover (DayFilters): the dates
  (from, to), the location, or the color (which gauge, which of its values or
  any, and which of its colors).
-->
<script lang="ts" generics="Row">
  import { gauges } from '#lib/state/gauges-state.svelte.js';
  import { getTextColor } from '#lib/utils/color-utils.js';
  import { CheckIcon } from '@lucide/svelte';
  import { locationName, type DayFilters } from './day-filters.svelte.js';
  import { paramLabel } from './weather-columns.js';

  let { id, filters }: { id: string; filters: DayFilters<Row> } = $props();

  const setting = $derived(filters.color);
  const gauge = $derived(
    setting ? gauges.allCreated.find((g) => g.id === setting.gaugeId) : null,
  );
  const params = $derived(setting ? filters.paramsOf(setting.gaugeId) : []);
</script>

{#if id === 'dates'}
  <div class="flex flex-wrap items-end gap-3">
    <label class="flex flex-col gap-1">
      <span>From</span>
      <input
        type="date"
        class="input w-auto"
        min={filters.span.first}
        max={filters.span.last}
        bind:value={filters.from}
      />
    </label>
    <label class="flex flex-col gap-1">
      <span>Through</span>
      <input
        type="date"
        class="input w-auto"
        min={filters.span.first}
        max={filters.span.last}
        bind:value={filters.to}
      />
    </label>
  </div>
{:else if id === 'place'}
  <label class="flex flex-col gap-1">
    <span>Location</span>
    <select class="select w-auto" bind:value={filters.place}>
      {#each filters.places as index (index)}
        <option value={index}>{locationName(index)}</option>
      {/each}
    </select>
  </label>
{:else if id === 'color' && setting}
  <div class="flex w-72 max-w-full flex-col gap-3">
    {#if filters.colorGauges.length > 1}
      <label class="flex flex-col gap-1">
        <span>Gauge</span>
        <select
          class="select w-auto"
          value={setting.gaugeId}
          onchange={(e) => filters.setColor({ gaugeId: e.currentTarget.value })}
        >
          {#each filters.colorGauges as g (g.id)}
            <option value={g.id}>{g.label.replace(/ Gauge$/, '')}</option>
          {/each}
        </select>
      </label>
    {/if}
    {#if params.length > 1}
      <div class="flex flex-col gap-1">
        <span id="color-filter-value">Which value</span>
        <div
          class="flex flex-wrap gap-1"
          role="radiogroup"
          aria-labelledby="color-filter-value"
        >
          {#each ['any', ...params] as param (param)}
            {@const on = setting.param === param}
            <button
              type="button"
              role="radio"
              aria-checked={on}
              class={['btn btn-sm', on ? 'preset-filled' : 'preset-tonal']}
              onclick={() =>
                filters.setColor({
                  param: param as typeof setting.param,
                })}
            >
              {param === 'any'
                ? 'Any'
                : paramLabel(param as (typeof params)[number])}
            </button>
          {/each}
        </div>
      </div>
    {/if}
    {#if gauge}
      <div class="flex flex-col gap-1">
        <span id="color-filter-color">Color</span>
        <div
          class="flex flex-wrap gap-1.5"
          role="radiogroup"
          aria-labelledby="color-filter-color"
        >
          {#each gauge.colors as color, index (index)}
            {@const on = setting.index === index}
            <button
              type="button"
              role="radio"
              aria-checked={on}
              aria-label="Color {index + 1}{color.name
                ? `: ${color.name}`
                : ''}"
              title="Color {index + 1}{color.name ? `: ${color.name}` : ''}"
              class={[
                'flex size-8 items-center justify-center rounded-full ring-1 ring-black/25',
                on &&
                  'ring-primary-500 ring-offset-surface-100-900 ring-2 ring-offset-2',
              ]}
              style:background-color={color.hex}
              style:color={color.hex ? getTextColor(color.hex) : undefined}
              onclick={() => filters.setColor({ index })}
            >
              {#if on}
                <CheckIcon class="icon-sm" aria-hidden="true" />
              {:else}
                <span class="text-xs tabular-nums">{index + 1}</span>
              {/if}
            </button>
          {/each}
        </div>
      </div>
    {/if}
  </div>
{/if}

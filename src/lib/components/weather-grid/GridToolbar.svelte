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
  Above every weather table, the same as the site's other lists: Filters (a
  panel of the table's filters (chipsOf), each with how many days it alone
  matches and, when on, its setting below it; while closed, the ones on as
  removable chips, FilterChips, starting right below it), View
  (GridViewMenu), and the table's own (`children`, e.g. Go to a date) at the
  end, first on phones. Then "Showing 12 of 365 days", and with `pick`,
  Select Shown / Clear Shown / Invert.
-->
<script lang="ts">
  import FiltersButton from '#lib/components/buttons/FiltersButton.svelte';
  import FilterChips from '#lib/components/FilterChips.svelte';
  import type { WeatherParam } from '#lib/types/gauge-types.js';
  import { pluralize } from '#lib/utils/string-utils.js';
  import type { GridChip } from '#lib/utils/weather-grid.js';
  import type { Snippet } from 'svelte';
  import GridViewMenu from './GridViewMenu.svelte';

  let {
    chips,
    ontoggle,
    setting,
    values,
    shown,
    total,
    noun = 'day',
    picked,
    pick,
    open = $bindable(false),
    children,
  }: {
    chips: GridChip[];
    /** Turns a filter on or off */
    ontoggle: (id: string, on: boolean) => void;
    /** A filter's setting, below it while it's on */
    setting?: Snippet<[string]>;
    /** The values View can show or hide (GridViewMenu) */
    values?: readonly WeatherParam['id'][];
    shown: number;
    total: number;
    /** What a row is: day, week, row */
    noun?: string;
    /** How many are picked, where rows have checkboxes */
    picked?: number;
    pick?: {
      pickedShown: number;
      select: () => void;
      clear: () => void;
      invert: () => void;
    };
    /** The filter panel is open */
    open?: boolean;
    children?: Snippet;
  } = $props();

  const panelId = $props.id();
  let filtersButton = $state<FiltersButton>();

  const on = $derived(chips.filter((chip) => chip.on));
</script>

<div class="flex flex-col gap-3 text-left">
  <!-- Filters at the left edge, its chips starting right below it; the
    table's own (Go to) is first on phones, so it never comes between
    Filters and its panel or chips -->
  <div class="flex flex-wrap items-center justify-between gap-2">
    <div class="flex flex-wrap items-center gap-2">
      {#if chips.length}
        <FiltersButton
          bind:this={filtersButton}
          bind:open
          count={on.length}
          controls={panelId}
        />
      {/if}
      <GridViewMenu {values} />
    </div>
    {#if children}
      <div class="flex flex-wrap items-center gap-2 max-md:order-first">
        {@render children()}
      </div>
    {/if}
  </div>

  {#if chips.length}
    <div
      id={panelId}
      hidden={!open}
      class="card bg-surface-100-900 border-surface-200-800 flex flex-col gap-2 border p-3"
    >
      <div class="flex items-center justify-between gap-2">
        <span class="text-sm font-bold">Show only</span>
        <button
          type="button"
          class="btn btn-sm hover:preset-tonal-surface"
          disabled={!on.length}
          onclick={() => on.forEach((chip) => ontoggle(chip.id, false))}
          >Clear all</button
        >
      </div>
      <!-- minmax(0, 1fr) columns and min-w-0 items: a setting wider than the
      screen (a long location name) can't push the panel past it -->
      <ul class="flex flex-col gap-2">
        {#each chips as chip (chip.id)}
          <li
            class={[
              'flex min-w-0 flex-col gap-2',
              chip.setting && chip.on && 'sm:col-span-2',
            ]}
          >
            <label class="flex w-fit cursor-pointer items-center gap-2 text-sm">
              <input
                type="checkbox"
                class="checkbox"
                checked={chip.on}
                onchange={(e) => ontoggle(chip.id, e.currentTarget.checked)}
              />
              <span>{chip.label}</span>
              {#if chip.counted}
                <span class="tabular-nums opacity-70">{chip.count}</span>
              {/if}
            </label>
            {#if chip.setting && chip.on && setting}
              <div class="min-w-0 pl-7 text-sm">{@render setting(chip.id)}</div>
            {/if}
          </li>
        {/each}
      </ul>
    </div>

    {#if !open}
      <FilterChips
        chips={on.map((chip) => ({
          label: chip.label,
          remove: () => ontoggle(chip.id, false),
        }))}
        onremove={() => filtersButton?.focus()}
        start
      />
    {/if}
  {/if}

  <p class="text-sm" role="status">
    {shown === total
      ? `${total} ${pluralize(noun, total)}`
      : `Showing ${shown} of ${total} ${pluralize(noun, total)}`}{#if picked !== undefined}
      · {picked} picked{/if}
  </p>

  {#if pick}
    <div class="flex flex-wrap gap-2">
      <button
        type="button"
        class="btn btn-sm preset-tonal"
        disabled={!shown || pick.pickedShown === shown}
        onclick={pick.select}>Select Shown</button
      >
      <button
        type="button"
        class="btn btn-sm preset-tonal"
        disabled={!pick.pickedShown}
        onclick={pick.clear}>Clear Shown</button
      >
      <button
        type="button"
        class="btn btn-sm preset-tonal"
        disabled={!shown}
        onclick={pick.invert}>Invert</button
      >
    </div>
  {/if}
</div>

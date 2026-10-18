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

<!-- The saved days a search of every day got differently: a summary, then a
table of them by month (each month folds, with a box for all its days). The
saved values stay unless a day's box is checked. Save keeps the choices
(values kept aren't shown again unless they change again, or Show them);
closing changes nothing, so they're asked about next time. -->
<script lang="ts">
  import ColorSwatch from '#lib/components/ColorSwatch.svelte';
  import ToggleSwitch from '#lib/components/buttons/ToggleSwitch.svelte';
  import SaveAndCloseButtons from '#lib/components/modals/SaveAndCloseButtons.svelte';
  import { UNIT_LABELS } from '#lib/constants/weather-constants.js';
  import { gauges } from '#lib/state/gauges-state.svelte.js';
  import { locations } from '#lib/state/location-state.svelte.js';
  import { dialog, toast } from '#lib/state/page-state.svelte.js';
  import { weather } from '#lib/state/weather-state.svelte.js';
  import { weatherDays } from '#lib/state/weather-days.svelte.js';
  import { projectChanged } from '#lib/storage/autosave.svelte.js';
  import { preferences } from '#lib/storage/preferences.svelte.js';
  import type { WeatherDay } from '#lib/types/weather-types.js';
  import { getColorInfo } from '#lib/utils/color-utils.js';
  import { pluralize } from '#lib/utils/string-utils.js';
  import {
    applyChanges,
    dayKey,
    localToday,
    updateDeclined,
    type ComparedParam,
    type DayChange,
    type DayKey,
  } from '#lib/utils/weather-days.js';
  import { ChevronDownIcon } from '@lucide/svelte';
  import { SvelteSet } from 'svelte/reactivity';
  import { onMount } from 'svelte';
  import { galleryPageOf, loadShareState } from '#lib/accounts/share-rows.js';
  import { project } from '#lib/state/project-state.svelte.js';
  import {
    changesFor,
    onlyColorChanges,
    type SearchAgainResult,
  } from './search-again.js';

  let { result }: { result: SearchAgainResult } = $props();

  // Days kept before, shown again for now
  let showKept = $state(false);
  const changes = $derived(changesFor(result, { showKept }));
  // What the settings leave out, to say so
  const keptCount = $derived(
    showKept
      ? 0
      : changesFor(result, { showKept: true }).length - changes.length,
  );
  const colorsOnly = $derived(onlyColorChanges());
  const sameColorCount = $derived(
    colorsOnly
      ? changesFor(result, { showKept, colorsOnly: false }).length -
          changes.length
      : 0,
  );

  // Its gallery page, if published, to update with the new values
  onMount(() => {
    if (__ACCOUNTS_ENABLED__) loadShareState('project');
  });
  const published = $derived(
    __ACCOUNTS_ENABLED__ && !!galleryPageOf('project', project.id),
  );
  let updatePage = $state(true);
  // Days to take the new values of; none to start
  const use = new SvelteSet<DayKey>();

  const savedByKey = $derived(new Map(result.saved.map((d) => [dayKey(d), d])));
  const gotByKey = $derived(new Map(result.got.map((d) => [dayKey(d), d])));

  const units = $derived(preferences.value.units ?? 'metric');
  const several = $derived(locations.all.length > 1);

  const LABELS: Record<ComparedParam, string> = {
    tmax: 'High',
    tavg: 'Average',
    tmin: 'Low',
    prcp: 'Rain',
    snow: 'Snow',
  };

  const isTemperature = (param: ComparedParam) =>
    param !== 'prcp' && param !== 'snow';
  const unitOf = (param: ComparedParam) =>
    isTemperature(param)
      ? UNIT_LABELS.temperature[units]
      : ` ${UNIT_LABELS.height[units]}`;
  const valueOf = (day: WeatherDay | undefined, param: ComparedParam) =>
    day?.[param]?.[units] ?? null;
  const show = (value: number | null, param: ComparedParam) =>
    value === null ? 'no data' : `${value}${unitOf(param)}`;
  // How much it changed, signed, as precise as the values
  function difference(param: ComparedParam, from: number, to: number) {
    const places = Math.max(
      ...[from, to].map((n) => `${n}`.split('.')[1]?.length ?? 0),
    );
    const diff = +(to - from).toFixed(places);
    return `${diff > 0 ? '+' : diff < 0 ? '−' : ''}${Math.abs(diff)}${unitOf(param)}`;
  }

  const utcDate = (iso: string, options: Intl.DateTimeFormatOptions) =>
    new Date(`${iso}T00:00:00Z`).toLocaleDateString(undefined, {
      timeZone: 'UTC',
      ...options,
    });
  const fullDate = (iso: string) =>
    utcDate(iso, {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });

  // Who has the new values, and when the saved ones were got: each changed
  // location's source, and its date when every one has the same
  const changedLocations = $derived([
    ...new Set(changes.map((c) => c.location)),
  ]);
  const sources = $derived(
    [
      ...new Set(
        changedLocations.map(
          (index) => locations.all[index]?.source ?? weather.source.name,
        ),
      ),
    ].join(' and '),
  );
  const savedOn = $derived.by(() => {
    const dates = new Set(
      changedLocations.map((index) => result.fetchedAt[index] ?? null),
    );
    const [date] = dates;
    if (dates.size !== 1 || !date) return '';
    return date === localToday()
      ? 'earlier today'
      : `on ${utcDate(date, { month: 'short', day: 'numeric', year: 'numeric' })}`;
  });

  // The biggest change: temperature's if any changed, else rain or snow's
  const largest = $derived.by(() => {
    let best: {
      change: DayChange;
      param: ComparedParam;
      size: number;
      text: string;
    } | null = null;
    for (const change of changes)
      for (const { param } of change.changes) {
        const from = valueOf(savedByKey.get(change.key), param);
        const to = valueOf(gotByKey.get(change.key), param);
        if (from === null || to === null) continue;
        const size = Math.abs(to - from);
        const better =
          !best ||
          (isTemperature(param) && !isTemperature(best.param)) ||
          (isTemperature(param) === isTemperature(best.param) &&
            size > best.size);
        if (better)
          best = { change, param, size, text: difference(param, from, to) };
      }
    return best;
  });

  // The months, in order, each with its changed days
  const months = $derived.by(() => {
    const byMonth: Record<string, DayChange[]> = {};
    for (const change of changes)
      (byMonth[change.date.slice(0, 7)] ??= []).push(change);
    return Object.entries(byMonth).map(([month, days]) => ({
      month,
      label: utcDate(`${month}-01`, { month: 'long', year: 'numeric' }),
      days,
    }));
  });

  // Months shown open: every one, unless there are many days
  const open = new SvelteSet<string>();
  let opened = false;
  $effect(() => {
    if (opened || !months.length) return;
    opened = true;
    if (changes.length <= 40) months.forEach(({ month }) => open.add(month));
  });

  const usedIn = (days: DayChange[]) =>
    days.filter((day) => use.has(day.key)).length;

  function useMonth(days: DayChange[], checked: boolean) {
    for (const day of days)
      if (checked) use.add(day.key);
      else use.delete(day.key);
  }

  // A value's color before and after, when a gauge colors it and it changes
  function colors(change: DayChange, param: ComparedParam) {
    const before = getColorInfo({
      param,
      value: valueOf(savedByKey.get(change.key), param),
    });
    const after = getColorInfo({
      param,
      value: valueOf(gotByKey.get(change.key), param),
    });
    if (before.index === undefined && after.index === undefined) return null;
    if (before.index === after.index) return { before, after: null };
    return { before, after };
  }

  // Auto ranges were made from the weather as it was: updating days leaves
  // them as they are, and the gauge says when they're behind (GaugeCustomizer)
  const autoGauges = $derived.by(() => {
    const params = new Set(
      changes.flatMap((c) => c.changes.map((v) => v.param)),
    );
    return gauges.allCreated.filter(
      (gauge) =>
        gauge.rangeOptions?.mode !== 'manual' &&
        !gauge.rangeOptions?.isCustomRanges &&
        gauge.targets.some((t) => params.has(t.id as ComparedParam)),
    );
  });
  const autoNames = $derived(
    autoGauges.map((g) => g.label.replace(' Gauge', '')).join(' and '),
  );

  const compareGauges = $derived(
    preferences.value.weatherChanges?.compare === 'gauges',
  );
  function setPreference(
    field: 'compare' | 'show',
    value: 'all' | 'gauges' | 'colors',
  ) {
    preferences.value.weatherChanges = {
      ...preferences.value.weatherChanges,
      [field]: value,
    };
  }

  // Edit Gallery Page in this one's place, ready to save the new values
  async function editGalleryPage() {
    const { default: AddToGallery } = await import('./AddToGallery.svelte');
    dialog.trigger({
      type: 'component',
      component: { ref: AddToGallery },
      options: { title: 'Edit Gallery Page', size: 'medium' },
    });
  }

  function save() {
    const shown = changes;
    const chosen = new Set(
      [...use].filter((key) => shown.some((c) => c.key === key)),
    );
    if (chosen.size)
      weather.updateRawData(
        applyChanges(
          $state.snapshot(weather.rawData) as WeatherDay[],
          result.got,
          chosen,
        ),
      );
    weatherDays.declined = updateDeclined(
      $state.snapshot(weatherDays.declined),
      shown,
      chosen,
    );
    projectChanged({ weather: true });
    const kept = shown.length - chosen.size;
    if (chosen.size && published && updatePage) void editGalleryPage();
    else dialog.close();
    toast.trigger({
      category: 'success',
      message: chosen.size
        ? `Updated ${chosen.size} ${pluralize('day', chosen.size)}${kept ? `, kept ${kept}` : ''}.`
        : `Kept your saved ${pluralize('value', shown.length)}.`,
    });
  }
</script>

{#snippet alsoUpdate()}
  <label class="flex cursor-pointer items-center justify-center gap-2 text-sm">
    <input type="checkbox" class="checkbox" bind:checked={updatePage} />
    Also update my gallery page
  </label>
{/snippet}

<div class="flex flex-col gap-4 px-2 pt-2 text-left">
  <div class="flex flex-col gap-2">
    <p>
      {#if changes.length}
        {sources} now has different values for {changes.length}
        {pluralize('day', changes.length)} you saved{savedOn
          ? ` ${savedOn}`
          : ''}. Your saved values stay unless you choose new ones.
      {:else if colorsOnly && sameColorCount}
        {sources || weather.source.name} has different values for some days you saved,
        but none of them change a color.
      {:else}
        No changes to show with these settings.
      {/if}
      {#if result.added}
        {result.added} new {pluralize('day', result.added)}
        {result.added === 1 ? 'was' : 'were'} added.
      {/if}
    </p>
    {#if largest}
      <p class="text-sm">
        Largest change: {LABELS[largest.param]}
        <span class="font-bold">{largest.text}</span>
        on {utcDate(largest.change.date, { month: 'short', day: 'numeric' })}
      </p>
    {/if}
    {#if sameColorCount}
      <p class="text-surface-700-300 text-sm">
        {sameColorCount}
        {changes.length ? 'more' : ''}
        {pluralize('day', sameColorCount)}
        {sameColorCount === 1 ? 'differs' : 'differ'} without changing a color.
        <button
          type="button"
          class="anchor"
          onclick={() => setPreference('show', 'all')}>Show them</button
        >
      </p>
    {/if}
    {#if keptCount || showKept}
      <p class="text-surface-700-300 text-sm">
        {#if showKept}
          Showing days you kept before.
          <button
            type="button"
            class="anchor"
            onclick={() => (showKept = false)}>Hide them</button
          >
        {:else}
          {keptCount}
          {pluralize('day', keptCount)} you kept before {keptCount === 1
            ? "isn't"
            : "aren't"} shown.
          <button type="button" class="anchor" onclick={() => (showKept = true)}
            >Show them</button
          >
        {/if}
      </p>
    {/if}
  </div>

  <div
    class="bg-surface-100 dark:bg-surface-900 rounded-container divide-surface-200-800 flex flex-col divide-y border border-gray-300 dark:border-gray-700"
  >
    <ToggleSwitch
      bare
      label="Show Only Values My Gauges Use"
      details="Only show high, average, low, rain or snow changes if your project uses them"
      checked={compareGauges}
      onchange={(e) =>
        setPreference(
          'compare',
          (e.currentTarget as HTMLInputElement).checked ? 'gauges' : 'all',
        )}
    />
    <ToggleSwitch
      bare
      label="Show Only Days Whose Colors Change"
      details="Leave out days whose new values stay in the same ranges"
      checked={colorsOnly}
      onchange={(e) =>
        setPreference(
          'show',
          (e.currentTarget as HTMLInputElement).checked ? 'colors' : 'all',
        )}
    />
  </div>

  {#if autoGauges.length && changes.length}
    <p class="text-surface-700-300 text-sm">
      Your {autoNames}
      ranges are Auto. Updating days won't change them, so update the ranges afterward
      to keep them Auto.
    </p>
  {/if}

  {#if changes.length}
    <div class="flex flex-wrap justify-center gap-2">
      <button
        type="button"
        class="btn btn-sm preset-tonal"
        onclick={() => use.clear()}>Keep All</button
      >
      <button
        type="button"
        class="btn btn-sm preset-tonal"
        onclick={() => changes.forEach((c) => use.add(c.key))}
        >Update All</button
      >
    </div>

    <div class="flex flex-col gap-2">
      {#each months as { month, label, days } (month)}
        {@const used = usedIn(days)}
        {@const isOpen = open.has(month)}
        {@const panelId = `search-again-${month}`}
        <section
          class="bg-surface-100 dark:bg-surface-900 rounded-container card-border"
          aria-label={label}
        >
          <div class="flex items-center gap-2 py-1 pr-3 pl-1">
            <button
              type="button"
              class="hover:preset-tonal rounded-container flex min-w-0 flex-1 items-center gap-2 px-2 py-2 text-left font-bold"
              aria-expanded={isOpen}
              aria-controls={panelId}
              onclick={() => (isOpen ? open.delete(month) : open.add(month))}
            >
              <ChevronDownIcon
                class={[
                  'icon-sm shrink-0 transition-transform',
                  !isOpen && '-rotate-90',
                ]}
              />
              {label}
            </button>
            <label
              class="flex shrink-0 cursor-pointer items-center gap-2 text-sm"
            >
              <span class="tabular-nums opacity-70"
                >{used} of {days.length}</span
              >
              <input
                type="checkbox"
                class="checkbox"
                checked={used === days.length}
                {@attach (node) => {
                  node.indeterminate = used > 0 && used < days.length;
                }}
                onchange={(e) => useMonth(days, e.currentTarget.checked)}
              />
              <span class="sr-only"
                >Use new values for every day in {label}</span
              >
            </label>
          </div>
          {#if isOpen}
            <table
              id={panelId}
              class="border-surface-200-800 w-full border-t text-sm"
            >
              <thead class="sr-only">
                <tr>
                  <th scope="col">Day</th>
                  <th scope="col">Saved and new values</th>
                  <th scope="col">Use new values</th>
                </tr>
              </thead>
              <tbody class="divide-surface-200-800 divide-y">
                {#each days as change (change.key)}
                  {@const saved = savedByKey.get(change.key)}
                  {@const got = gotByKey.get(change.key)}
                  {@const checkboxId = `search-again-${change.key.replace('|', '-')}`}
                  <tr class={[use.has(change.key) && 'bg-primary-500/10']}>
                    <th
                      scope="row"
                      class="w-0 py-2 pr-2 pl-3 text-left align-top font-normal whitespace-nowrap"
                    >
                      <label for={checkboxId} class="cursor-pointer">
                        <span class="sr-only">{fullDate(change.date)}</span>
                        <span aria-hidden="true"
                          >{utcDate(change.date, {
                            weekday: 'short',
                            day: 'numeric',
                          })}</span
                        >
                        {#if several}
                          <span class="block text-xs opacity-70"
                            >{locations.all[change.location]?.label ?? ''}</span
                          >
                        {/if}
                      </label>
                    </th>
                    <td class="py-2 align-top">
                      <ul class="flex flex-col gap-1">
                        {#each change.changes as { param } (param)}
                          {@const from = valueOf(saved, param)}
                          {@const to = valueOf(got, param)}
                          {@const swatches = colors(change, param)}
                          <li class="flex flex-wrap items-center gap-x-1.5">
                            <span class="opacity-70">{LABELS[param]}</span>
                            <span>{show(from, param)}</span>
                            <span aria-hidden="true">→</span>
                            <span class="sr-only">now</span>
                            <span class="font-bold">{show(to, param)}</span>
                            {#if from !== null && to !== null}
                              <span class="tabular-nums opacity-70"
                                >({difference(param, from, to)})</span
                              >
                            {/if}
                            {#if swatches}
                              <span class="flex items-center gap-1">
                                <span aria-hidden="true" class="contents">
                                  <ColorSwatch tiny hex={swatches.before.hex} />
                                  {#if swatches.after}
                                    →
                                    <ColorSwatch
                                      tiny
                                      hex={swatches.after.hex}
                                    />
                                  {/if}
                                </span>
                                <span class="sr-only">
                                  {#if swatches.after}
                                    color
                                    {swatches.before.index === undefined
                                      ? 'none'
                                      : swatches.before.index + 1} to {swatches
                                      .after.index === undefined
                                      ? 'none'
                                      : swatches.after.index + 1}
                                  {:else}
                                    same color
                                  {/if}
                                </span>
                              </span>
                            {/if}
                          </li>
                        {/each}
                      </ul>
                    </td>
                    <td class="w-0 py-2 pr-3 pl-2 text-right align-top">
                      <input
                        id={checkboxId}
                        aria-label="Use new values for {fullDate(
                          change.date,
                        )}{several
                          ? `, ${locations.all[change.location]?.label ?? ''}`
                          : ''}"
                        type="checkbox"
                        class="checkbox"
                        checked={use.has(change.key)}
                        onchange={(e) =>
                          e.currentTarget.checked
                            ? use.add(change.key)
                            : use.delete(change.key)}
                      />
                    </td>
                  </tr>
                {/each}
              </tbody>
            </table>
          {/if}
        </section>
      {/each}
    </div>
  {/if}

  <SaveAndCloseButtons
    above={published && changes.length ? alsoUpdate : undefined}
    onSave={save}
    onClose={() => dialog.close()}
    disabled={!changes.length}
  />
</div>

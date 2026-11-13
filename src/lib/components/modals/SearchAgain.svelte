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

<!-- Check for Updates' choices, nothing changing until Save. New days lead
(Add N new days, on). Changed saved days are scaled to what they mean for this
blanket: when none changes color, a short note and Review changes; when some
do, the Update Past Days card (every changed saved day not kept before, off to
start), led by how many days change color. Either opens View All Changes: the
same dialog, full size, as a sheet of every changed day (new value over the
saved one, struck through), filtered by chips, its days picked one by one.
When a day would change color, how far it's made (the project's progress),
with Change… showing the Progress dialog in this one (saved as it's changed):
days already made aren't offered for update (still listed in View All
Changes, where they can be picked, with a note that the blanket won't match). Save says what it'll do; the changed days not updated are remembered as kept
(finishAgain). Cancel changes nothing. -->
<script lang="ts">
  import ToggleSwitch from '#lib/components/buttons/ToggleSwitch.svelte';
  import ProgressEditor from '#lib/components/modals/ProgressEditor.svelte';
  import { progress } from '#lib/state/progress-state.svelte.js';
  import { shortDay } from '#lib/utils/project-progress.js';
  import SaveAndCloseButtons from '#lib/components/modals/SaveAndCloseButtons.svelte';
  import {
    OPEN_METEO_LOCATION_DAYS_SINCE,
    UNIT_LABELS,
  } from '#lib/constants/weather-constants.js';
  import { gauges } from '#lib/state/gauges-state.svelte.js';
  import { locations } from '#lib/state/location-state.svelte.js';
  import { dialog, toast } from '#lib/state/page-state.svelte.js';
  import { weather } from '#lib/state/weather-state.svelte.js';
  import { weatherSearch } from '#lib/state/weather-search.svelte.js';
  import { preferences } from '#lib/storage/preferences.svelte.js';
  import type { WeatherDay } from '#lib/types/weather-types.js';
  import { pluralize } from '#lib/utils/string-utils.js';
  import {
    COMPARED_PARAMS,
    dayKey,
    differenceRange,
    fillsGap,
    isoOf,
    isTemperature,
    localToday,
    removesData,
    settledEarlyDays,
    type ComparedParam,
    type DayChange,
    type DayKey,
  } from '#lib/utils/weather-days.js';
  import { ChevronRightIcon, HistoryIcon } from '@lucide/svelte';
  import DayCell from '#lib/components/weather-grid/DayCell.svelte';
  import DayFilterSetting from '#lib/components/weather-grid/DayFilterSetting.svelte';
  import {
    DayFilters,
    locationName,
  } from '#lib/components/weather-grid/day-filters.svelte.js';
  import {
    gridColor,
    showColors,
  } from '#lib/components/weather-grid/grid-color.svelte.js';
  import {
    CELL,
    TINT,
    type GridColumn,
  } from '#lib/components/weather-grid/grid-styles.js';
  import GridToolbar from '#lib/components/weather-grid/GridToolbar.svelte';
  import ValueCell from '#lib/components/weather-grid/ValueCell.svelte';
  import { weatherColumn } from '#lib/components/weather-grid/weather-columns.js';
  import WeatherGrid from '#lib/components/weather-grid/WeatherGrid.svelte';
  import {
    CHIP,
    applyFilters,
    atLeastLabel,
    chipsOf,
    differenceText,
    type GridFilter,
  } from '#lib/utils/weather-grid.js';
  import { SvelteSet } from 'svelte/reactivity';
  import { onDestroy, onMount, untrack } from 'svelte';
  import { galleryPageOf, loadShareState } from '#lib/accounts/share-rows.js';
  import { project } from '#lib/state/project-state.svelte.js';
  import {
    changesColor,
    changesOf,
    projectParams,
    newDayCount,
    type SearchAgainResult,
  } from './search-again.js';

  let { result }: { result: SearchAgainResult } = $props();

  const { all, fresh, kept } = $derived(changesOf(result));
  const added = $derived(newDayCount(result));

  // Days to take the new values of; none to start (Update Past Days off)
  const use = new SvelteSet<DayKey>();
  let add = $state(true);

  // Its gallery page, if published, to update with the new values
  onMount(() => {
    if (__ACCOUNTS_ENABLED__) loadShareState('project');
  });
  const published = $derived(
    __ACCOUNTS_ENABLED__ && !!galleryPageOf('project', project.id),
  );
  let updatePage = $state(true);

  const savedByKey = $derived(new Map(result.saved.map((d) => [dayKey(d), d])));
  const gotByKey = $derived(new Map(result.got.map((d) => [dayKey(d), d])));

  const units = $derived(preferences.value.units ?? 'metric');
  const several = $derived(locations.all.length > 1);
  const used = $derived(projectParams());

  const valueOf = (day: WeatherDay | undefined, param: ComparedParam) =>
    day?.[param]?.[units] ?? null;

  const utcDate = (iso: string, options: Intl.DateTimeFormatOptions) =>
    new Date(`${iso}T00:00:00Z`).toLocaleDateString(undefined, {
      timeZone: 'UTC',
      ...options,
    });
  const shortDate = (iso: string) =>
    utcDate(iso, { month: 'short', day: 'numeric' });
  const fullDate = (iso: string) =>
    utcDate(iso, {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });

  // ***************
  // What each switch covers
  // ***************

  // Who has the new values, and when the saved ones were got: each changed
  // location's source, and its date when every one has the same
  const changedLocations = $derived([...new Set(fresh.map((c) => c.location))]);
  const sourcesOf = (indexes: number[]) =>
    [
      ...new Set(
        indexes.map(
          (index) => locations.all[index]?.source ?? weather.source.name,
        ),
      ),
    ].join(' and ') || weather.source.name;
  const sources = $derived(sourcesOf(changedLocations));
  // Open-Meteo days saved before 7.0.1 followed the searcher's time zone, not
  // the place's: that alone changes their values a little, so say so
  const placeDays = $derived(
    changedLocations.some((index) => {
      const source = locations.all[index]?.source ?? weather.source.name;
      const fetchedAt = result.fetchedAt[index];
      return (
        source === 'Open-Meteo' &&
        (!fetchedAt || fetchedAt < OPEN_METEO_LOCATION_DAYS_SINCE)
      );
    }),
  );
  const whyChanged = $derived(
    placeDays
      ? 'Open-Meteo’s days now run midnight to midnight where the place is, so days saved before can differ a little.'
      : 'Weather sources occasionally correct data.',
  );
  const newSources = $derived(
    sourcesOf([...new Set(result.newDays.map((day) => day.location))]),
  );
  const savedOn = $derived.by(() => {
    const dates = new Set(
      changedLocations.map((index) => result.fetchedAt[index] ?? null),
    );
    const [date] = dates;
    if (dates.size !== 1 || !date) return '';
    return date === localToday()
      ? 'earlier today'
      : `${utcDate(date, { month: 'short', day: 'numeric', year: 'numeric' })}`;
  });

  // Days already made (through the project's progress) aren't offered
  const isMade = (change: DayChange) =>
    !!progress.madeThrough && change.date <= progress.madeThrough;
  const offered = $derived(fresh.filter((c) => !isMade(c)));
  const colorChanges = $derived(
    fresh.filter((c) =>
      changesColor(c, savedByKey.get(c.key), gotByKey.get(c.key), used),
    ),
  );
  const colorCount = $derived(colorChanges.filter((c) => !isMade(c)).length);
  const madeColorCount = $derived(colorChanges.filter(isMade).length);

  // Made through a new day (in Progress, from Change…): those days leave
  // what's picked
  let madeThroughSeen = progress.madeThrough;
  $effect(() => {
    const madeThrough = progress.madeThrough;
    if (madeThrough === madeThroughSeen) return;
    madeThroughSeen = madeThrough;
    untrack(() => {
      for (const key of [...use]) {
        const change = all.find((c) => c.key === key);
        if (change && isMade(change)) use.delete(key);
      }
    });
  });

  /** Picked days already made: the blanket won't match them */
  const madePicked = $derived(
    all.filter((c) => use.has(c.key) && isMade(c)).length,
  );

  // Change…: the Progress dialog in this one, Back (or Done) returning here
  let editingProgress = $state(false);
  function openProgressView() {
    editingProgress = true;
    dialog.options.title = 'Progress';
    dialog.backAction = closeProgressView;
    dialog.escapeAction = closeProgressView;
  }
  function closeProgressView() {
    editingProgress = false;
    dialog.options.title = 'Update Weather Data';
    dialog.backAction = null;
    dialog.escapeAction = null;
  }
  const removedCount = $derived(fresh.filter(removesData).length);

  // Which saved days have newer values: "9 days saved on Mar 3"
  const savedDays = $derived(
    savedOn
      ? `${fresh.length} ${pluralize('day', fresh.length)}`
      : `${fresh.length} saved ${pluralize('day', fresh.length)}`,
  );
  // Nothing in the blanket changes color: a short note, not a card
  const quiet = $derived(colorChanges.length === 0 && use.size === 0);

  // What matters to the blanket first, then why, calmly (the sizes of the
  // changes are in View All Changes)
  const updateSummary = $derived(
    [
      colorCount
        ? `${colorCount} ${pluralize('day', colorCount)} ${madeColorCount ? 'not made yet ' : 'in the project '}would change color.`
        : madeColorCount
          ? 'No colors in the days not made yet would change.'
          : 'No colors in the project would change.',
      madeColorCount &&
        `${madeColorCount} ${madeColorCount === 1 ? 'day you’ve made stays' : 'days you’ve made stay'} as ${madeColorCount === 1 ? 'it is' : 'they are'}.`,
      `${sources} has newer values for ${savedDays}. ${whyChanged}`,
    ]
      .filter(Boolean)
      .map((line) => `<span class="mt-1 block first:mt-0">${line}</span>`)
      .join(''),
  );

  // Picked in the sheet: some, not just every day the switch covers
  const freshKeys = $derived(new Set(offered.map((c) => c.key)));
  const pickedByHand = $derived(
    use.size > 0 &&
      (use.size !== freshKeys.size || [...use].some((k) => !freshKeys.has(k))),
  );

  function setUpdate(on: boolean) {
    use.clear();
    if (on) offered.forEach((c) => use.add(c.key));
  }

  const newRange = $derived.by(() => {
    const dates = result.newDays.map((day) => isoOf(day.date)).sort();
    if (!dates.length) return '';
    const [first, last] = [dates[0], dates[dates.length - 1]];
    const sameYear = first.slice(0, 4) === last.slice(0, 4);
    const withYear = (iso: string) =>
      utcDate(iso, { month: 'short', day: 'numeric', year: 'numeric' });
    if (first === last) return shortDate(first);
    return sameYear
      ? `${shortDate(first)} – ${shortDate(last)}`
      : `${withYear(first)} – ${withYear(last)}`;
  });

  // Auto ranges were made from the weather as it was: updating days leaves
  // them as they are, and the gauge says when they're behind (GaugeCustomizer)
  const autoGauges = $derived.by(() => {
    const params = new Set(
      all
        .filter((c) => use.has(c.key))
        .flatMap((c) => c.changes.map((v) => v.param)),
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

  // ***************
  // Saving
  // ***************

  const adding = $derived(add && added > 0);
  const saveText = $derived(
    use.size && adding
      ? `Update ${use.size} & Add ${added}`
      : use.size
        ? `Update ${use.size} ${pluralize('Day', use.size)}`
        : adding
          ? `Add ${added} ${pluralize('Day', added)}`
          : 'Keep As Is',
  );

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
    const update = new Set(use);
    weatherSearch.finishAgain(result, {
      update,
      add: adding,
      considered: all,
    });
    const keptNow = fresh.filter((c) => !update.has(c.key)).length;
    const message = [
      adding && `Added ${added} new ${pluralize('day', added)}.`,
      update.size && `Updated ${update.size} ${pluralize('day', update.size)}.`,
      keptNow &&
        `Kept saved values for ${keptNow} ${pluralize('day', keptNow)}.`,
    ]
      .filter(Boolean)
      .join(' ');
    if ((update.size || adding) && published && updatePage)
      void editGalleryPage();
    else dialog.close();
    if (message) toast.trigger({ category: 'success', message });
  }

  // ***************
  // The sheet of every change
  // ***************

  let sheet = $state(false);

  function openSheet() {
    sheet = true;
    dialog.options.size = 'full';
    dialog.options.title = 'All Changes';
    dialog.backAction = closeSheet;
    dialog.escapeAction = closeSheet;
  }
  function closeSheet() {
    sheet = false;
    dialog.options.size = 'medium';
    dialog.options.title = 'Update Weather Data';
    dialog.backAction = null;
    dialog.escapeAction = null;
  }
  onDestroy(() => {
    for (const close of [closeSheet, closeProgressView]) {
      if (dialog.backAction === close) dialog.backAction = null;
      if (dialog.escapeAction === close) dialog.escapeAction = null;
    }
  });

  const sourceOf = (index: number) =>
    locations.all[index]?.source ?? weather.source.name;
  const settled = $derived(
    new Set(settledEarlyDays(result.early, localToday(), sourceOf)),
  );

  // The largest difference among a day's temperatures, and rain and snow
  function largest(change: DayChange, temperature: boolean) {
    const range = differenceRange(
      change.changes
        .filter(({ param }) => isTemperature(param) === temperature)
        .map(({ param }) => ({
          saved: valueOf(savedByKey.get(change.key), param),
          got: valueOf(gotByKey.get(change.key), param),
        })),
    );
    return range?.max ?? null;
  }

  type Row = {
    change: DayChange;
    saved: WeatherDay | undefined;
    got: WeatherDay | undefined;
    color: boolean;
    settled: boolean;
    gap: boolean;
    removed: boolean;
    kept: boolean;
    made: boolean;
    temperature: number | null;
    height: number | null;
  };
  const rows: Row[] = $derived(
    all.map((change) => {
      const saved = savedByKey.get(change.key);
      const got = gotByKey.get(change.key);
      return {
        change,
        saved,
        got,
        color: changesColor(change, saved, got, used),
        settled: settled.has(change.key),
        gap: fillsGap(change),
        removed: removesData(change),
        kept: kept.has(change.key),
        made: isMade(change),
        temperature: largest(change, true),
        height: largest(change, false),
      };
    }),
  );

  // The values any day changed, in order
  const columns = $derived(
    COMPARED_PARAMS.filter((param) =>
      all.some((c) => c.changes.some((v) => v.param === param)),
    ),
  );

  // ***************
  // The sheet's filters: what changed (each shown only when it matches a
  // day), then the shared ones (Kept, Made, dates, location)
  // ***************

  let biggerTemperature = $state(1);
  let biggerHeight = $state(preferences.value.units === 'imperial' ? 0.04 : 1);

  const dayFilters = new DayFilters<Row>(
    () => rows,
    () => ({
      key: (row) => row.change.key,
      date: (row) => row.change.date,
      location: (row) => row.change.location,
      kept: (row) => row.kept,
      ...(progress.madeThrough && { made: (row: Row) => row.made }),
    }),
  );

  const filters: GridFilter<Row>[] = $derived([
    {
      id: 'color',
      label: CHIP.newColor,
      matches: (row) => row.color,
      counted: true,
    },
    {
      id: 'settled',
      label: CHIP.settled,
      matches: (row) => row.settled,
      counted: true,
    },
    {
      id: 'gap',
      label: CHIP.wasMissing,
      matches: (row) => row.gap,
      counted: true,
    },
    {
      id: 'removed',
      label: CHIP.nowMissing,
      matches: (row) => row.removed,
      counted: true,
    },
    {
      id: 'biggerTemperature',
      label: atLeastLabel(
        'Temp changed',
        biggerTemperature,
        UNIT_LABELS.temperature[units],
      ),
      matches: (row) =>
        row.temperature !== null && row.temperature >= biggerTemperature - 1e-9,
      available: rows.some((r) => r.temperature !== null),
      setting: true,
    },
    {
      id: 'biggerHeight',
      label: atLeastLabel(
        'Rain/snow changed',
        biggerHeight,
        UNIT_LABELS.height[units],
      ),
      matches: (row) =>
        row.height !== null && row.height >= biggerHeight - 1e-9,
      available: rows.some((r) => r.height !== null),
      setting: true,
    },
    ...dayFilters.filters,
  ]);

  const chips = $derived(chipsOf(rows, filters, dayFilters.on));
  const shown = $derived(applyFilters(rows, filters, dayFilters.on));
  const pickedShown = $derived(
    shown.filter((row) => use.has(row.change.key)).length,
  );

  const selectShown = () => shown.forEach((r) => use.add(r.change.key));
  const clearShown = () => shown.forEach((r) => use.delete(r.change.key));
  const invertShown = () =>
    shown.forEach((r) =>
      use.has(r.change.key) ? use.delete(r.change.key) : use.add(r.change.key),
    );

  const gridColumns: GridColumn[] = $derived(
    columns.map((param) =>
      weatherColumn(param, units, { dimmed: !used.includes(param) }),
    ),
  );

  // A value's color, where the project shows it
  const swatch = (day: WeatherDay | undefined, param: ComparedParam) =>
    used.includes(param) ? gridColor(param, valueOf(day, param)) : undefined;

  const show = (day: WeatherDay | undefined, param: ComparedParam) => {
    const value = valueOf(day, param);
    return value === null ? '' : `${value}`;
  };

  const checkboxId = (row: Row) =>
    `search-again-${row.change.key.replace('|', '-')}`;
</script>

{#snippet footerNotes()}
  <div class="flex flex-col items-center gap-2">
    {#if madePicked && progress.madeThrough}
      <p
        class="text-warning-800-200 text-center text-sm"
        data-testid="again-made-note"
      >
        {madePicked}
        {madePicked === 1 ? 'picked day is one' : 'picked days are ones'} you've already
        made (through {shortDay(progress.madeThrough)}): the blanket won't match
        the new colors.
      </p>
    {/if}
    {#if published && (use.size || adding)}
      <label
        class="flex cursor-pointer items-center justify-center gap-2 text-sm"
      >
        <input type="checkbox" class="checkbox" bind:checked={updatePage} />
        Also update my gallery page
      </label>
    {/if}
    {#if fresh.some((c) => !use.has(c.key))}
      <p class="text-surface-700-300 text-center text-sm">
        Your saved values stay as they are, and we won't ask about these days
        again unless they change again. Review them anytime in the weather
        table, where they're marked with <HistoryIcon
          class="icon-sm inline align-text-bottom"
          aria-label="the kept-day icon"
        />.
      </p>
    {/if}
  </div>
{/snippet}

{#if editingProgress}
  <ProgressEditor ondone={closeProgressView} />
{:else if !sheet}
  <div class="flex flex-col gap-4 px-2 pt-2 text-left">
    {#if added}
      <div
        class="bg-surface-100 dark:bg-surface-900 rounded-container border border-gray-300 dark:border-gray-700"
      >
        <ToggleSwitch
          bare
          label={`Add ${added} new ${pluralize('day', added)}`}
          details={`${newSources} · ${newRange}`}
          bind:checked={add}
        />
      </div>
    {/if}

    {#snippet notes()}
      {#if (removedCount || kept.size) && !pickedByHand}
        <ul class="text-surface-700-300 flex flex-col gap-1 text-sm">
          {#if removedCount}
            <li>
              {removedCount}
              {removedCount === 1 ? 'day has' : 'days have'} a value the source no
              longer reports.
            </li>
          {/if}
          {#if kept.size}
            <li>
              {kept.size}
              {kept.size === 1 ? 'day' : 'days'} you kept before {kept.size ===
              1
                ? 'stays'
                : 'stay'} as {kept.size === 1 ? 'it is' : 'they are'}. You can
              still update {kept.size === 1 ? 'it' : 'them'} from the list of changes.
            </li>
          {/if}
        </ul>
      {/if}
    {/snippet}

    {#if quiet}
      <!-- Nothing in the blanket changes color: just say so -->
      <div
        class="flex flex-col items-start gap-2 px-2"
        data-testid="past-days-note"
      >
        <p class="text-sm">
          {sources} refined {savedDays}. No colors in the project change.
          {#if placeDays}{whyChanged}{/if}
        </p>
        {@render notes()}
        <button
          type="button"
          class="anchor inline-flex w-fit items-center gap-1 text-sm"
          onclick={openSheet}
        >
          Review changes <ChevronRightIcon class="icon-sm" />
        </button>
      </div>
    {:else}
      <div class=" flex flex-col gap-3 pb-4">
        <ToggleSwitch
          label="Update Past Days"
          details={pickedByHand
            ? `${use.size} of ${all.length} changed ${pluralize('day', all.length)} picked`
            : updateSummary}
          checked={use.size > 0}
          onchange={(e) =>
            setUpdate((e.currentTarget as HTMLInputElement).checked)}
        />
        <div class="">{@render notes()}</div>
        {#if colorChanges.length && progress.madeThrough}
          <div
            class="flex flex-wrap items-center justify-start gap-2 px-4 text-sm"
            data-testid="again-progress"
          >
            <span>
              Made through {shortDay(progress.madeThrough)}: those days stay as
              they are.
            </span>
            <button
              type="button"
              class="btn btn-sm preset-tonal"
              onclick={openProgressView}
            >
              Change…
            </button>
          </div>
        {/if}
        <button
          type="button"
          class="btn preset-tonal w-fit"
          onclick={openSheet}
        >
          Choose which days to update <ChevronRightIcon />
        </button>
      </div>
    {/if}

    {#if autoGauges.length}
      <p class="text-surface-700-300 mx-auto text-sm">
        Your {autoNames} ranges stay as they are. You can update them afterward.
      </p>
    {/if}

    <SaveAndCloseButtons
      above={footerNotes}
      {saveText}
      onSave={save}
      onClose={() => dialog.close()}
    />
  </div>
{:else}
  <div class="flex min-h-0 flex-1 flex-col gap-3 px-2 pt-2 text-left">
    <GridToolbar
      {chips}
      ontoggle={dayFilters.toggle}
      shown={shown.length}
      total={all.length}
      picked={use.size}
      pick={{
        pickedShown,
        select: selectShown,
        clear: clearShown,
        invert: invertShown,
      }}
    >
      {#snippet setting(id)}
        {#if id === 'biggerTemperature'}
          <label class="flex items-center gap-2">
            Changed by at least
            <input
              type="number"
              class="input w-20"
              min="0"
              step="0.1"
              bind:value={biggerTemperature}
            />
            {UNIT_LABELS.temperature[units]}
          </label>
        {:else if id === 'biggerHeight'}
          <label class="flex items-center gap-2">
            Changed by at least
            <input
              type="number"
              class="input w-20"
              min="0"
              step={units === 'imperial' ? 0.01 : 0.1}
              bind:value={biggerHeight}
            />
            {UNIT_LABELS.height[units]}
          </label>
        {:else}
          <DayFilterSetting {id} filters={dayFilters} />
        {/if}
      {/snippet}
    </GridToolbar>

    <WeatherGrid
      rows={shown}
      key={(row) => row.change.key}
      columns={gridColumns}
      lines={showColors.value ? 3 : 2}
      scroll="box"
      label="Changed days"
      class="min-h-60 flex-1"
      rowTint={(row) => use.has(row.change.key) && TINT.picked}
      lead={{ width: '2.75rem', header: pickAll, cell: pickOne }}
    >
      {#snippet day(row)}
        <DayCell
          date={row.change.date}
          location={several ? locationName(row.change.location) : ''}
          made={progress.madeThrough ? row.made : null}
          kept={row.kept}
          labelFor={checkboxId(row)}
        />
      {/snippet}
      {#snippet cell(row, column)}
        {@const param = column.id as ComparedParam}
        {@const changed = row.change.changes.some((v) => v.param === param)}
        <div role="cell" class={[CELL, column.dimmed && 'opacity-60']}>
          <ValueCell
            text={show(changed ? row.got : row.saved, param)}
            {changed}
            was={changed ? show(row.saved, param) : undefined}
            difference={changed
              ? differenceText(
                  valueOf(row.saved, param),
                  valueOf(row.got, param),
                )
              : ''}
            color={showColors.value
              ? swatch(changed ? row.got : row.saved, param)
              : undefined}
            wasColor={showColors.value && changed
              ? swatch(row.saved, param)
              : undefined}
            faint={!changed}
            swatchTitle="{row.change.date}, {column.label}"
          />
        </div>
      {/snippet}
      {#snippet empty()}
        No changed days match these filters.
      {/snippet}
    </WeatherGrid>

    <SaveAndCloseButtons
      above={footerNotes}
      {saveText}
      onSave={save}
      onClose={() => dialog.close()}
    />
  </div>
{/if}

{#snippet pickAll()}
  <input
    type="checkbox"
    class="checkbox"
    aria-label="Update every day shown"
    disabled={!shown.length}
    checked={!!shown.length && pickedShown === shown.length}
    {@attach (node) => {
      node.indeterminate = pickedShown > 0 && pickedShown < shown.length;
    }}
    onchange={(e) => (e.currentTarget.checked ? selectShown() : clearShown())}
  />
{/snippet}

{#snippet pickOne(row: Row)}
  {@const key = row.change.key}
  <input
    id={checkboxId(row)}
    type="checkbox"
    aria-label="Update {fullDate(row.change.date)}{several
      ? `, ${locationName(row.change.location)}`
      : ''}"
    class="checkbox"
    checked={use.has(key)}
    onchange={(e) => (e.currentTarget.checked ? use.add(key) : use.delete(key))}
  />
{/snippet}

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
<script module lang="ts">
  // Show Colors, for the rest of the visit (as the weather table's)
  const colorDetails = $state({ value: false });
</script>

<script lang="ts">
  import ToggleSwitch from '#lib/components/buttons/ToggleSwitch.svelte';
  import ProgressEditor from '#lib/components/modals/ProgressEditor.svelte';
  import { progress } from '#lib/state/progress-state.svelte.js';
  import { shortDay } from '#lib/utils/project-progress.js';
  import SaveAndCloseButtons from '#lib/components/modals/SaveAndCloseButtons.svelte';
  import { UNIT_LABELS } from '#lib/constants/weather-constants.js';
  import { gauges } from '#lib/state/gauges-state.svelte.js';
  import { locations } from '#lib/state/location-state.svelte.js';
  import { dialog, toast } from '#lib/state/page-state.svelte.js';
  import { weather } from '#lib/state/weather-state.svelte.js';
  import { weatherSearch } from '#lib/state/weather-search.svelte.js';
  import { preferences } from '#lib/storage/preferences.svelte.js';
  import type { WeatherDay } from '#lib/types/weather-types.js';
  import { pluralize } from '#lib/utils/string-utils.js';
  import type { ColorInfo } from '#lib/utils/color-utils.js';
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
  import { ChevronRightIcon, HistoryIcon, XIcon } from '@lucide/svelte';
  import { SvelteSet } from 'svelte/reactivity';
  import { onDestroy, onMount, untrack } from 'svelte';
  import { galleryPageOf, loadShareState } from '#lib/accounts/share-rows.js';
  import { project } from '#lib/state/project-state.svelte.js';
  import {
    changesColor,
    changesOf,
    colorOf,
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

  const LABELS: Record<ComparedParam, string> = {
    tmax: 'High',
    tavg: 'Average',
    tmin: 'Low',
    prcp: 'Rain',
    snow: 'Snow',
  };
  const unitOf = (param: ComparedParam) =>
    isTemperature(param)
      ? UNIT_LABELS.temperature[units]
      : UNIT_LABELS.height[units];
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
      : `on ${utcDate(date, { month: 'short', day: 'numeric', year: 'numeric' })}`;
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
      ? `${fresh.length} ${pluralize('day', fresh.length)} saved ${savedOn}`
      : `${fresh.length} saved ${pluralize('day', fresh.length)}`,
  );
  // Nothing in the blanket changes color: a short note, not a card
  const quiet = $derived(colorChanges.length === 0 && use.size === 0);

  // What matters to the blanket first, then why, calmly (the sizes of the
  // changes are in View All Changes)
  const updateSummary = $derived(
    [
      colorCount
        ? `${colorCount} ${pluralize('day', colorCount)} ${madeColorCount ? 'not made yet ' : 'in your blanket '}would change color.`
        : madeColorCount
          ? 'No colors in the days not made yet would change.'
          : 'No colors in your blanket would change.',
      madeColorCount &&
        `${madeColorCount} ${madeColorCount === 1 ? 'day you’ve made stays' : 'days you’ve made stay'} as ${madeColorCount === 1 ? 'it is' : 'they are'}.`,
      `${sources} has newer values for ${savedDays}. Weather sources correct readings as stations report in. This is normal.`,
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

  // Filters, each shown only when it matches a day
  let filters = $state({
    color: false,
    settled: false,
    gap: false,
    removed: false,
    biggerTemperature: false,
    biggerHeight: false,
    dates: false,
    kept: false,
    made: false,
    place: false,
  });
  type FilterId = keyof typeof filters;
  let biggerTemperature = $state(1);
  let biggerHeight = $state(preferences.value.units === 'imperial' ? 0.04 : 1);
  const firstDate = $derived(all[0]?.date ?? '');
  const lastDate = $derived(all[all.length - 1]?.date ?? '');
  let from = $state('');
  let to = $state('');
  let place = $state(0);

  const matches: Record<FilterId, (row: Row) => boolean> = {
    color: (row) => row.color,
    settled: (row) => row.settled,
    gap: (row) => row.gap,
    removed: (row) => row.removed,
    biggerTemperature: (row) =>
      row.temperature !== null && row.temperature >= biggerTemperature - 1e-9,
    biggerHeight: (row) =>
      row.height !== null && row.height >= biggerHeight - 1e-9,
    dates: (row) =>
      (!from || row.change.date >= from) && (!to || row.change.date <= to),
    kept: (row) => row.kept,
    made: (row) => row.made,
    place: (row) => row.change.location === place,
  };

  const chips = $derived(
    (
      [
        ['color', 'Color changes'],
        ['settled', 'Settled'],
        ['gap', 'Gaps filled'],
        ['removed', 'Data removed'],
        ['biggerTemperature', 'Temp changed'],
        ['biggerHeight', 'Rain or snow changed'],
        ['dates', 'Date range'],
        ['kept', 'Kept before'],
        ['made', 'Already made'],
        ['place', 'Location'],
      ] as [FilterId, string][]
    )
      .map(([id, label]) => ({
        id,
        label,
        // How many days it alone matches; the ones with settings, whether
        // they could match any
        count:
          id === 'biggerTemperature'
            ? rows.filter((r) => r.temperature !== null).length
            : id === 'biggerHeight'
              ? rows.filter((r) => r.height !== null).length
              : id === 'dates'
                ? firstDate !== lastDate
                  ? rows.length
                  : 0
                : id === 'place'
                  ? new Set(all.map((c) => c.location)).size > 1
                    ? rows.length
                    : 0
                  : rows.filter(matches[id]).length,
      }))
      .filter((chip) => chip.count > 0 || filters[chip.id]),
  );
  const counted: FilterId[] = [
    'color',
    'settled',
    'gap',
    'removed',
    'kept',
    'made',
  ];

  function toggleFilter(id: FilterId) {
    filters[id] = !filters[id];
    if (id === 'dates' && filters.dates && !from && !to) {
      from = firstDate;
      to = lastDate;
    }
    if (id === 'place' && filters.place) place = all[0]?.location ?? 0;
  }

  const shown = $derived(
    rows.filter((row) =>
      (Object.keys(filters) as FilterId[]).every(
        (id) => !filters[id] || matches[id](row),
      ),
    ),
  );
  const pickedShown = $derived(
    shown.filter((row) => use.has(row.change.key)).length,
  );

  const selectShown = () => shown.forEach((r) => use.add(r.change.key));
  const clearShown = () => shown.forEach((r) => use.delete(r.change.key));
  const invertShown = () =>
    shown.forEach((r) =>
      use.has(r.change.key) ? use.delete(r.change.key) : use.add(r.change.key),
    );

  // Only the rows in view are drawn
  const ROW_HEIGHT = 48;
  let scroller: HTMLDivElement | undefined = $state();
  let scrollTop = $state(0);
  let viewHeight = $state(600);
  const firstRow = $derived(
    Math.max(0, Math.floor(scrollTop / ROW_HEIGHT) - 8),
  );
  const lastRow = $derived(
    Math.min(
      shown.length,
      Math.ceil((scrollTop + viewHeight) / ROW_HEIGHT) + 8,
    ),
  );
  const visibleRows = $derived(
    Array.from(
      { length: Math.max(0, lastRow - firstRow) },
      (_, i) => firstRow + i,
    ),
  );
  const gridColumns = $derived(
    `2.75rem minmax(8rem, auto) repeat(${columns.length}, minmax(6.5rem, 1fr))`,
  );

  // How much a value changed, signed, as precise as the values: "+6.84"
  function difference(row: Row, param: ComparedParam) {
    const [from, to] = [valueOf(row.saved, param), valueOf(row.got, param)];
    if (from === null || to === null) return '';
    const places = Math.max(
      ...[from, to].map((n) => `${n}`.split('.')[1]?.length ?? 0),
    );
    const diff = +(to - from).toFixed(places);
    return diff ? `${diff > 0 ? '+' : '−'}${Math.abs(diff)}` : '';
  }

  const show = (day: WeatherDay | undefined, param: ComparedParam) => {
    const value = valueOf(day, param);
    return value === null ? '—' : `${value}`;
  };
</script>

<!-- A value's color, in the bar at its cell's left edge; hatched for none -->
{#snippet fill(color: ColorInfo | undefined)}
  <span
    class="block flex-1"
    style:background-color={color?.index !== undefined ? color?.hex : undefined}
    style:background-image={color?.index === undefined
      ? 'repeating-linear-gradient(45deg, transparent 0 2px, rgb(128 128 128 / 0.6) 2px 4px)'
      : undefined}
  ></span>
{/snippet}

<!-- The bar: one color, or the new color over the old one, crossed out -->
{#snippet colorBar(
  now: ColorInfo | undefined,
  was: ColorInfo | undefined,
  faint = false,
)}
  <span
    class={[
      'absolute top-1.5 bottom-1.5 left-1.5 flex w-3 flex-col overflow-hidden rounded-full ring-1 ring-black/25',
      faint && 'opacity-50',
    ]}
    aria-hidden="true"
  >
    {@render fill(now)}
    {#if now?.index !== was?.index}
      <span class="relative flex flex-1 flex-col border-t border-black/40">
        {@render fill(was)}
        <svg
          class="absolute inset-0 size-full"
          viewBox="0 0 10 10"
          preserveAspectRatio="none"
        >
          <path
            d="M2 2 8 8M8 2 2 8"
            stroke="rgb(0 0 0 / 0.6)"
            stroke-width="3.5"
            vector-effect="non-scaling-stroke"
          />
          <path
            d="M2 2 8 8M8 2 2 8"
            stroke="white"
            stroke-width="1.75"
            vector-effect="non-scaling-stroke"
          />
        </svg>
      </span>
    {/if}
  </span>
{/snippet}

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
      <p class="text-surface-700-300 text-center text-xs">
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
      <div class="flex flex-col gap-2 px-2" data-testid="past-days-note">
        <p class="text-sm">
          {sources} refined {savedDays}. No colors in your blanket change.
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
      <div
        class="bg-surface-100 dark:bg-surface-900 rounded-container flex flex-col gap-3 border border-gray-300 pb-4 dark:border-gray-700"
      >
        <ToggleSwitch
          bare
          label="Update Past Days"
          details={pickedByHand
            ? `${use.size} of ${all.length} changed ${pluralize('day', all.length)} picked`
            : updateSummary}
          checked={use.size > 0}
          onchange={(e) =>
            setUpdate((e.currentTarget as HTMLInputElement).checked)}
        />
        <div class="px-4">{@render notes()}</div>
        {#if colorChanges.length}
          <div
            class="flex flex-wrap items-center justify-between gap-2 px-4 text-sm"
            data-testid="again-progress"
          >
            <span>
              {#if progress.madeThrough}
                Made through {shortDay(progress.madeThrough)}: those days stay
                as they are.
              {:else}
                Not started: every day can be updated.
              {/if}
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
        <div class="flex justify-center">
          <button type="button" class="btn preset-tonal" onclick={openSheet}>
            View All Changes <ChevronRightIcon />
          </button>
        </div>
      </div>
    {/if}

    {#if autoGauges.length}
      <p class="text-surface-700-300 text-sm">
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
    <div class="flex flex-wrap items-center justify-between gap-2">
      <p class="text-sm" role="status">
        Showing {shown.length} of {all.length} · {use.size} picked
      </p>
      <label class="flex cursor-pointer items-center gap-2 text-sm">
        <input
          type="checkbox"
          class="checkbox"
          bind:checked={colorDetails.value}
        />
        Show Colors
      </label>
    </div>

    {#if chips.length}
      <div class="flex flex-wrap items-center gap-2" aria-label="Filters">
        {#each chips as chip (chip.id)}
          {@const on = filters[chip.id]}
          <button
            type="button"
            class={[
              'btn btn-sm rounded-full',
              on ? 'preset-filled' : 'preset-tonal',
            ]}
            aria-pressed={on}
            onclick={() => toggleFilter(chip.id)}
          >
            {chip.label}
            {#if counted.includes(chip.id)}
              <span class="tabular-nums opacity-70">{chip.count}</span>
            {/if}
            {#if on}<XIcon aria-hidden="true" />{/if}
          </button>
          {#if on && chip.id === 'biggerTemperature'}
            <label class="flex items-center gap-1 text-sm">
              at least
              <span class="sr-only">(temperature change)</span>
              <input
                type="number"
                class="input w-20"
                min="0"
                step="0.1"
                bind:value={biggerTemperature}
              />
              {UNIT_LABELS.temperature[units]}
            </label>
          {:else if on && chip.id === 'biggerHeight'}
            <label class="flex items-center gap-1 text-sm">
              at least
              <span class="sr-only">(rain or snow change)</span>
              <input
                type="number"
                class="input w-20"
                min="0"
                step={units === 'imperial' ? 0.01 : 0.1}
                bind:value={biggerHeight}
              />
              {UNIT_LABELS.height[units]}
            </label>
          {:else if on && chip.id === 'dates'}
            <span class="flex flex-wrap items-center gap-2 text-sm">
              <label class="flex items-center gap-1">
                <span class="sr-only">From</span>
                <input
                  type="date"
                  class="input w-auto"
                  min={firstDate}
                  max={lastDate}
                  bind:value={from}
                />
              </label>
              to
              <label class="flex items-center gap-1">
                <span class="sr-only">To</span>
                <input
                  type="date"
                  class="input w-auto"
                  min={firstDate}
                  max={lastDate}
                  bind:value={to}
                />
              </label>
            </span>
          {:else if on && chip.id === 'place'}
            <label class="text-sm">
              <span class="sr-only">Location</span>
              <select class="select w-auto" bind:value={place}>
                {#each [...new Set(all.map((c) => c.location))] as index (index)}
                  <option value={index}
                    >{locations.all[index]?.label ??
                      `Location ${index + 1}`}</option
                  >
                {/each}
              </select>
            </label>
          {/if}
        {/each}
      </div>
    {/if}

    <div class="flex flex-wrap gap-2">
      <button
        type="button"
        class="btn btn-sm preset-tonal"
        disabled={!shown.length || pickedShown === shown.length}
        onclick={selectShown}>Select Shown</button
      >
      <button
        type="button"
        class="btn btn-sm preset-tonal"
        disabled={!pickedShown}
        onclick={clearShown}>Clear Shown</button
      >
      <button
        type="button"
        class="btn btn-sm preset-tonal"
        disabled={!shown.length}
        onclick={invertShown}>Invert</button
      >
    </div>

    <div
      bind:this={scroller}
      bind:clientHeight={viewHeight}
      onscroll={() => (scrollTop = scroller?.scrollTop ?? 0)}
      class="rounded-container border-surface-200-800 min-h-60 flex-1 overflow-auto border"
    >
      <div
        role="table"
        aria-label="Changed days"
        aria-rowcount={shown.length + 1}
        class="relative w-max min-w-full"
      >
        <div
          role="row"
          class="bg-surface-100-900 border-surface-200-800 sticky top-0 z-20 grid border-b text-sm"
          style:grid-template-columns={gridColumns}
        >
          <div
            role="columnheader"
            class="bg-surface-100-900 sticky left-0 z-10 flex items-center justify-center py-1"
          >
            <input
              type="checkbox"
              class="checkbox"
              aria-label="Update every day shown"
              disabled={!shown.length}
              checked={!!shown.length && pickedShown === shown.length}
              {@attach (node) => {
                node.indeterminate =
                  pickedShown > 0 && pickedShown < shown.length;
              }}
              onchange={(e) =>
                e.currentTarget.checked ? selectShown() : clearShown()}
            />
          </div>
          <div
            role="columnheader"
            class="bg-surface-100-900 sticky left-11 z-10 px-2 py-1 font-bold"
          >
            Day
          </div>
          {#each columns as param (param)}
            <div
              role="columnheader"
              class={[
                'px-2 py-1 leading-tight font-bold',
                !used.includes(param) && 'opacity-60',
              ]}
            >
              {LABELS[param]}
              <span class="text-xs font-normal">({unitOf(param)})</span>
            </div>
          {/each}
        </div>

        <div
          role="rowgroup"
          class="relative"
          style:height="{shown.length * ROW_HEIGHT}px"
        >
          {#each visibleRows as index (shown[index].change.key)}
            {@const row = shown[index]}
            {@const key = row.change.key}
            {@const picked = use.has(key)}
            {@const checkboxId = `search-again-${key.replace('|', '-')}`}
            {@const stripe =
              index % 2 ? 'bg-surface-50-950' : 'bg-surface-100-900'}
            <div
              role="row"
              class={['absolute right-0 left-0 grid', stripe]}
              style:top="{index * ROW_HEIGHT}px"
              style:height="{ROW_HEIGHT}px"
              style:grid-template-columns={gridColumns}
            >
              <div
                role="cell"
                class={[
                  'sticky left-0 z-10 flex items-center justify-center',
                  picked ? 'bg-primary-500/15' : stripe,
                ]}
              >
                <input
                  id={checkboxId}
                  type="checkbox"
                  aria-label="Update {fullDate(row.change.date)}{several
                    ? `, ${locations.all[row.change.location]?.label ?? ''}`
                    : ''}"
                  class="checkbox"
                  checked={picked}
                  onchange={(e) =>
                    e.currentTarget.checked ? use.add(key) : use.delete(key)}
                />
              </div>
              <div
                role="rowheader"
                class={[
                  'border-surface-200-800 sticky left-11 z-10 flex flex-col justify-center border-r px-2 text-sm leading-tight',
                  picked ? 'bg-primary-500/15' : stripe,
                ]}
              >
                <label
                  for={checkboxId}
                  class="flex cursor-pointer items-center gap-1"
                >
                  <span class="tabular-nums">{row.change.date}</span>
                  {#if row.kept}
                    <HistoryIcon
                      class="icon-sm opacity-70"
                      aria-label="Kept before"
                    />
                  {/if}
                </label>
                {#if several}
                  <span class="truncate text-xs opacity-70"
                    >{locations.all[row.change.location]?.label ?? ''}</span
                  >
                {/if}
              </div>
              {#each columns as param (param)}
                {@const changed = row.change.changes.some(
                  (v) => v.param === param,
                )}
                {@const colored = colorDetails.value && used.includes(param)}
                {@const before = colorOf(row.saved, param, used)}
                {@const after = colorOf(row.got, param, used)}
                <div
                  role="cell"
                  class={[
                    'border-surface-200-800 relative flex flex-col justify-center border-r px-2 leading-tight tabular-nums',
                    colored && 'pl-6',
                    picked && 'bg-primary-500/10',
                    !used.includes(param) && 'opacity-60',
                  ]}
                >
                  {#if colored}
                    {@render colorBar(
                      changed ? after : before,
                      before,
                      !changed,
                    )}
                  {/if}
                  {#if changed}
                    <span class="font-semibold">
                      {show(row.got, param)}
                      {#if colored && before?.index !== after?.index}
                        <span class="sr-only">, color changes</span>
                      {/if}
                    </span>
                    <span class="flex items-center gap-1.5 text-xs">
                      <span class="sr-only">was</span>
                      <s class="opacity-70">{show(row.saved, param)}</s>
                      {#if difference(row, param)}
                        <span class="sr-only">, changed by</span>
                        <span class="opacity-70">{difference(row, param)}</span>
                      {/if}
                    </span>
                  {:else}
                    <span class="opacity-50">{show(row.saved, param)}</span>
                  {/if}
                </div>
              {/each}
            </div>
          {/each}
        </div>
      </div>
      {#if !shown.length}
        <p class="text-surface-700-300 p-4 text-center text-sm">
          No changed days match these filters.
        </p>
      {/if}
    </div>

    <SaveAndCloseButtons
      above={footerNotes}
      {saveText}
      onSave={save}
      onClose={() => dialog.close()}
    />
  </div>
{/if}

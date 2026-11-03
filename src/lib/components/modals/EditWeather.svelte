<!-- Copyright (c) 2026, Thomas (https://github.com/jdvlpr)

This file is part of Temperature-Blanket-Web-App.

Temperature-Blanket-Web-App is free software: you can redistribute it and/or modify it
under the terms of the GNU General Public License as published by the Free Software Foundation,
either version 3 of the License, or (at your option) any later version.

Temperature-Blanket-Web-App is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY;
without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.
See the GNU General Public License for more details.

You should have received a copy of the GNU General Public License along with Temperature-Blanket-Web-App.
If not, see <https://www.gnu.org/licenses/>. -->

<!-- Edit Weather Data: every day's values in a grid, like a spreadsheet.
Changes are a draft (`edits`, over a copy of the weather taken on opening)
with its own Undo, until Apply puts them in the project as one step of its
Undo/Redo (state/weather-edits.svelte.ts). Closing with changes asks first.
Type to change a value, select with Shift or by dragging, paste a block from
a spreadsheet (by date when it has dates), or Import a CSV file into it. Only
days are edited, whatever the table's grouping. Opened by
utils/open-edit-weather.ts. -->

<script lang="ts">
  import ImportWeatherData from '#lib/components/modals/ImportWeatherData.svelte';
  import { dialog, toast } from '#lib/state/page-state.svelte.js';
  import { project } from '#lib/state/project-state.svelte.js';
  import { allGaugesAttributes } from '#lib/state/gauges-state.svelte.js';
  import { locations } from '#lib/state/location-state.svelte.js';
  import { weather } from '#lib/state/weather-state.svelte.js';
  import { weatherEdits } from '#lib/state/weather-edits.svelte.js';
  import { preferences } from '#lib/storage/preferences.svelte.js';
  import type { Unit, WeatherDay } from '#lib/types/weather-types.js';
  import type { WeatherParam } from '#lib/types/gauge-types.js';
  import { getColorInfo, type ColorInfo } from '#lib/utils/color-utils.js';
  import { dateToISO8601String } from '#lib/utils/date-utils.js';
  import {
    loadFromHistory,
    updateHistory,
  } from '#lib/utils/history-utils.svelte.js';
  import {
    EDITABLE_PARAMS,
    changedDays,
    displayNumberOf,
    displayValue,
    fillGaps,
    parseClipboard,
    parseInput,
    placePaste,
    sameValue,
    valueInBothUnits,
    type EditRow,
    type EditableParam,
    type ImportedValue,
    type WeatherChange,
    type WeatherValue,
  } from '#lib/utils/weather-edits.js';
  import {
    CircleCheckIcon,
    FileUpIcon,
    RedoIcon,
    SearchIcon,
    SparklesIcon,
    UndoIcon,
    Undo2Icon,
  } from '@lucide/svelte';
  import { onDestroy, onMount, tick, untrack } from 'svelte';
  import { progress } from '#lib/state/progress-state.svelte.js';
  import { shortDay } from '#lib/utils/project-progress.js';

  let {
    start,
    startWith,
  }: {
    /** The value to start on: a day's place in the weather, and which value */
    start?: { row: number; param: EditableParam };
    /** `import`: open with Import File showing */
    startWith?: 'import';
  } = $props();

  const uid = $props.id();

  // Taken once: nothing else can change the weather, units or gauges while this is open
  const units: Unit = preferences.value.units ?? 'metric';
  const original = $state.snapshot(weather.rawData) as WeatherDay[];
  const epoch = weather.dataEpoch;
  const rows: EditRow[] = original.map((day) => ({
    date: dateToISO8601String(day.date),
    location: day.location,
  }));
  const locationCount = new Set(rows.map((r) => r.location)).size;

  const targets = allGaugesAttributes.flatMap((g) => g.targets);
  // The values the table shows, or all of them if it shows none that can be edited
  const shown = weather.tableWeatherTargets
    .map((t) => t.id)
    .filter((id): id is EditableParam =>
      (EDITABLE_PARAMS as readonly string[]).includes(id),
    );
  const columns: EditableParam[] = shown.length ? shown : [...EDITABLE_PARAMS];

  const UNIT_TEXT = {
    temperature: { metric: '°C', imperial: '°F' },
    height: { metric: 'mm', imperial: 'in' },
  } as const;
  const heading = (param: EditableParam) => {
    const target = targets.find((t) => t.id === param);
    const label = target?.label ?? param;
    if (param === 'dayt') return { label, unit: 'h:m' };
    const type = target?.type as keyof typeof UNIT_TEXT;
    return { label, unit: UNIT_TEXT[type]?.[units] ?? '' };
  };

  const locationLabel = (index: number) =>
    locations.all?.[index]?.label || `Location ${index + 1}`;

  const ROW_HEIGHT = 36;
  const gridColumns = [
    '8rem',
    locationCount > 1 ? '10rem' : null,
    ...columns.map(() => '7.5rem'),
  ]
    .filter(Boolean)
    .join(' ');

  // ***************
  // The draft
  // ***************

  /** Changed values, by `row|param`, in both units */
  let edits = $state.raw(new Map<string, WeatherValue>());
  let past: Map<string, WeatherValue>[] = $state.raw([]);
  let future: Map<string, WeatherValue>[] = $state.raw([]);

  const keyOf = (row: number, param: EditableParam) => `${row}|${param}`;

  const valueAt = (row: number, param: EditableParam): WeatherValue =>
    edits.get(keyOf(row, param)) ??
    original[row]?.[param] ?? { metric: null, imperial: null };

  const textAt = (row: number, param: EditableParam) =>
    displayValue(param, valueAt(row, param), units);

  // Find Missing and Fill In Missing show only when they'd do something:
  // a value is missing, and (to fill it) its column has a known value at its
  // location to fill it from
  const gaps = $derived.by(() => {
    let missing = false;
    let fillable = false;
    for (const param of columns) {
      const known: boolean[] = [];
      const empty: boolean[] = [];
      rows.forEach((r, row) => {
        if (valueAt(row, param).metric === null) empty[r.location] = true;
        else known[r.location] = true;
      });
      if (empty.some(Boolean)) missing = true;
      if (empty.some((isEmpty, location) => isEmpty && known[location])) {
        fillable = true;
        break;
      }
    }
    return { missing, fillable };
  });

  const editedDays = $derived(
    changedDays(
      [...edits.keys()].map((key) => ({ index: +key.split('|')[0] })),
    ),
  );

  // Days already made (through the project's progress): editing them is
  // fine, but the blanket won't match, so the footer says so
  const isMadeRow = (row: number) =>
    !!progress.madeThrough && (rows[row]?.date ?? '') <= progress.madeThrough;
  const madeEditedDays = $derived(
    new Set(
      [...edits.keys()]
        .map((key) => +key.split('|')[0])
        .filter(isMadeRow)
        .map((row) => rows[row].date),
    ).size,
  );

  /** Changes values, as one step of the draft's Undo. Returns how many changed. */
  function setValues(
    list: { row: number; param: EditableParam; value: WeatherValue }[],
  ) {
    // A new map each time, put in `edits` whole (the draft's Undo keeps the old ones)
    // eslint-disable-next-line svelte/prefer-svelte-reactivity
    const next = new Map(edits);
    let changed = 0;
    for (const { row, param, value } of list) {
      const key = keyOf(row, param);
      const before = next.get(key);
      // Back to what it was (as shown), as when a file has the same value
      if (
        displayValue(param, value, units) ===
        displayValue(param, original[row][param], units)
      ) {
        if (next.delete(key)) changed++;
      } else if (!before || !sameValue(before, value)) {
        next.set(key, value);
        changed++;
      }
    }
    if (changed) {
      past = [...past, edits];
      future = [];
      edits = next;
    }
    return changed;
  }

  function undoDraft() {
    if (!past.length) return;
    future = [edits, ...future];
    edits = past[past.length - 1];
    past = past.slice(0, -1);
    say('Undone');
  }

  function redoDraft() {
    if (!future.length) return;
    past = [...past, edits];
    edits = future[0];
    future = future.slice(1);
    say('Redone');
  }

  // ***************
  // Selection
  // ***************

  let anchor = $state({ row: 0, column: 0 });
  let cursor = $state({ row: 0, column: 0 });
  let dragging = false;

  const selection = $derived({
    rows: [
      Math.min(anchor.row, cursor.row),
      Math.max(anchor.row, cursor.row),
    ] as [number, number],
    columns: [
      Math.min(anchor.column, cursor.column),
      Math.max(anchor.column, cursor.column),
    ] as [number, number],
  });
  const selectedCount = $derived(
    (selection.rows[1] - selection.rows[0] + 1) *
      (selection.columns[1] - selection.columns[0] + 1),
  );
  const isSelected = (row: number, column: number) =>
    row >= selection.rows[0] &&
    row <= selection.rows[1] &&
    column >= selection.columns[0] &&
    column <= selection.columns[1];

  /** Each selected cell, row by row */
  function selectedCells() {
    const cells: { row: number; param: EditableParam }[] = [];
    for (let row = selection.rows[0]; row <= selection.rows[1]; row++)
      for (let c = selection.columns[0]; c <= selection.columns[1]; c++)
        cells.push({ row, param: columns[c] });
    return cells;
  }

  function select(row: number, column: number, extend = false) {
    cursor = {
      row: Math.max(0, Math.min(rows.length - 1, row)),
      column: Math.max(0, Math.min(columns.length - 1, column)),
    };
    if (!extend) anchor = { ...cursor };
    status = '';
    void reveal(cursor.row, cursor.column);
  }

  const cellId = (row: number, column: number) => `${uid}-${row}-${column}`;

  // ***************
  // Scrolling (only the rows in view are drawn)
  // ***************

  let scroller: HTMLDivElement | undefined = $state();
  let grid: HTMLDivElement | undefined = $state();
  let scrollTop = $state(0);
  let viewHeight = $state(600);

  const firstRow = $derived(
    Math.max(0, Math.floor(scrollTop / ROW_HEIGHT) - 8),
  );
  const lastRow = $derived(
    Math.min(rows.length, Math.ceil((scrollTop + viewHeight) / ROW_HEIGHT) + 8),
  );
  const visibleRows = $derived(
    Array.from({ length: lastRow - firstRow }, (_, i) => firstRow + i),
  );
  const pageRows = $derived(
    Math.max(1, Math.floor(viewHeight / ROW_HEIGHT) - 2),
  );

  async function reveal(row: number, column: number) {
    if (!scroller) return;
    if (row < firstRow || row >= lastRow)
      scroller.scrollTop = row * ROW_HEIGHT - viewHeight / 2;
    await tick();
    document
      .getElementById(cellId(row, column))
      ?.scrollIntoView({ block: 'nearest', inline: 'nearest' });
  }

  // ***************
  // Typing in a cell
  // ***************

  let editing: { row: number; column: number; text: string } | null =
    $state(null);
  let input: HTMLInputElement | undefined = $state();
  let problem = $state('');
  let status = $state('');

  const say = (message: string) => (status = message);

  const cantRead = (param: EditableParam) =>
    param === 'dayt'
      ? 'Type hours and minutes, like 08:12, or leave it empty'
      : 'Type a number, or leave it empty';

  async function startEditing(text?: string) {
    editing = {
      row: cursor.row,
      column: cursor.column,
      text: text ?? textAt(cursor.row, columns[cursor.column]),
    };
    anchor = { ...cursor };
    problem = '';
    dialog.escapeAction = cancelEditing;
    await reveal(cursor.row, cursor.column);
    input?.focus();
    if (text === undefined) input?.select();
  }

  /** Puts what was typed in; false (staying in the cell) when it can't be read */
  function finishEditing() {
    if (!editing) return true;
    const param = columns[editing.column];
    const value = parseInput(param, editing.text, units);
    if (!value) {
      problem = cantRead(param);
      input?.focus();
      return false;
    }
    setValues([{ row: editing.row, param, value }]);
    stopEditing();
    return true;
  }

  function cancelEditing() {
    stopEditing();
  }

  function stopEditing() {
    editing = null;
    problem = '';
    dialog.escapeAction = null;
    grid?.focus({ preventScroll: true });
  }

  // ***************
  // Keys, the pointer, the clipboard
  // ***************

  function onkeydown(ev: KeyboardEvent) {
    const mod = ev.metaKey || ev.ctrlKey;

    if (editing) {
      if (ev.key === 'Enter') {
        ev.preventDefault();
        if (finishEditing())
          select(cursor.row + (ev.shiftKey ? -1 : 1), cursor.column);
      } else if (ev.key === 'Tab') {
        ev.preventDefault();
        if (finishEditing())
          select(cursor.row, cursor.column + (ev.shiftKey ? -1 : 1));
      }
      return;
    }

    if (mod && ev.key.toLowerCase() === 'z') {
      ev.preventDefault();
      if (ev.shiftKey) redoDraft();
      else undoDraft();
      return;
    }
    if (mod && ev.key.toLowerCase() === 'y') {
      ev.preventDefault();
      redoDraft();
      return;
    }
    if (mod && ev.key.toLowerCase() === 'a') {
      ev.preventDefault();
      anchor = { row: 0, column: 0 };
      cursor = { row: rows.length - 1, column: columns.length - 1 };
      return;
    }

    const { row, column } = cursor;
    const extend = ev.shiftKey;
    switch (ev.key) {
      case 'ArrowUp':
        ev.preventDefault();
        select(mod ? 0 : row - 1, column, extend);
        return;
      case 'ArrowDown':
        ev.preventDefault();
        select(mod ? rows.length - 1 : row + 1, column, extend);
        return;
      case 'ArrowLeft':
        ev.preventDefault();
        select(row, mod ? 0 : column - 1, extend);
        return;
      case 'ArrowRight':
        ev.preventDefault();
        select(row, mod ? columns.length - 1 : column + 1, extend);
        return;
      case 'PageUp':
        ev.preventDefault();
        select(row - pageRows, column, extend);
        return;
      case 'PageDown':
        ev.preventDefault();
        select(row + pageRows, column, extend);
        return;
      case 'Home':
        ev.preventDefault();
        select(mod ? 0 : row, 0, extend);
        return;
      case 'End':
        ev.preventDefault();
        select(mod ? rows.length - 1 : row, columns.length - 1, extend);
        return;
      case 'Tab': {
        // Along the row; out of the grid past its ends
        const next = column + (ev.shiftKey ? -1 : 1);
        if (next < 0 || next >= columns.length) return;
        ev.preventDefault();
        select(row, next);
        return;
      }
      case 'Enter':
      case 'F2':
        ev.preventDefault();
        void startEditing();
        return;
      case 'Delete':
      case 'Backspace':
        ev.preventDefault();
        clearSelection();
        return;
    }

    // Typing a character starts a new value in the cell
    if (ev.key.length === 1 && !mod && !ev.altKey) {
      ev.preventDefault();
      void startEditing(ev.key);
    }
  }

  function onpointerdown(ev: PointerEvent, row: number, column: number) {
    if (ev.button !== 0) return;
    if (editing) {
      if (editing.row === row && editing.column === column) return;
      if (!finishEditing()) return;
    }
    if (ev.shiftKey) {
      cursor = { row, column };
    } else {
      anchor = { row, column };
      cursor = { row, column };
    }
    // Touch scrolls; a mouse drags out a selection
    dragging = ev.pointerType === 'mouse';
    grid?.focus({ preventScroll: true });
  }

  function onpointerenter(row: number, column: number) {
    if (dragging) cursor = { row, column };
  }

  function oncopy(ev: ClipboardEvent) {
    if (editing) return;
    ev.preventDefault();
    const lines: string[] = [];
    for (let row = selection.rows[0]; row <= selection.rows[1]; row++) {
      const cells: string[] = [];
      for (let c = selection.columns[0]; c <= selection.columns[1]; c++)
        cells.push(textAt(row, columns[c]));
      lines.push(cells.join('\t'));
    }
    ev.clipboardData?.setData('text/plain', lines.join('\n'));
    say(`Copied ${selectedCount} ${selectedCount === 1 ? 'value' : 'values'}`);
  }

  function onpaste(ev: ClipboardEvent) {
    const text = ev.clipboardData?.getData('text/plain') ?? '';
    // In a cell, one value is just typed there; a block goes to the grid
    if (editing) {
      if (!/[\t\n]/.test(text.trim())) return;
      cancelEditing();
    }
    ev.preventDefault();
    paste(text);
  }

  function paste(text: string) {
    const cells = placePaste(parseClipboard(text), {
      rows,
      columns: columns.length,
      anchor: { row: selection.rows[0], column: selection.columns[0] },
      selection,
      locations: locationCount,
    });
    if (!cells.length) {
      say('Nothing pasted: no values matched these days');
      return;
    }
    let unread = 0;
    const values = cells.flatMap(({ row, column, text }) => {
      const param = columns[column];
      const value = parseInput(param, text, units);
      if (!value) {
        unread++;
        return [];
      }
      return [{ row, param, value }];
    });
    const changed = setValues(values);
    // Select what was pasted
    const pastedRows = cells.map((c) => c.row);
    const pastedColumns = cells.map((c) => c.column);
    anchor = {
      row: Math.min(...pastedRows),
      column: Math.min(...pastedColumns),
    };
    cursor = {
      row: Math.max(...pastedRows),
      column: Math.max(...pastedColumns),
    };
    void reveal(anchor.row, anchor.column);
    say(
      `Pasted: ${changed} ${changed === 1 ? 'value' : 'values'} changed` +
        (unread ? `, ${unread} couldn't be read` : ''),
    );
  }

  // ***************
  // Tools for the selection
  // ***************

  /** The value bar: the selected value, and typing there sets every selected one */
  let barText = $state('');
  let barFocused = $state(false);
  $effect(() => {
    const text = textAt(cursor.row, columns[cursor.column]);
    if (!barFocused) barText = text;
  });

  function setSelection() {
    let unread = 0;
    const values = selectedCells().flatMap(({ row, param }) => {
      const value = parseInput(param, barText, units);
      if (!value) {
        unread++;
        return [];
      }
      return [{ row, param, value }];
    });
    if (!values.length) {
      problem = cantRead(columns[cursor.column]);
      return;
    }
    problem = '';
    const changed = setValues(values);
    say(
      `${changed} ${changed === 1 ? 'value' : 'values'} changed` +
        (unread ? `, ${unread} couldn't take it` : ''),
    );
  }

  function clearSelection() {
    const changed = setValues(
      selectedCells().map(({ row, param }) => ({
        row,
        param,
        value: { metric: null, imperial: null },
      })),
    );
    say(`${changed} ${changed === 1 ? 'value' : 'values'} cleared`);
  }

  let adjustBy = $state<number | null>(null);

  function adjustSelection() {
    if (!adjustBy) return;
    const by = adjustBy;
    const values = selectedCells().flatMap(({ row, param }) => {
      const now = displayNumberOf(param, valueAt(row, param), units);
      if (now === null) return [];
      let next = Math.round((now + by) * 100) / 100;
      if (param === 'dayt') next = Math.max(0, Math.min(24, next));
      else if (param === 'prcp' || param === 'snow') next = Math.max(0, next);
      return [{ row, param, value: valueInBothUnits(param, next, units) }];
    });
    const changed = setValues(values);
    say(`${changed} ${changed === 1 ? 'value' : 'values'} changed`);
  }

  /**
   * Missing values in the selection (or everywhere, with one cell selected),
   * each from the days on either side of its gap in the whole column, at its
   * location
   */
  function fillSelectionGaps() {
    const everywhere = selectedCount === 1;
    const [top, bottom] = everywhere ? [0, rows.length - 1] : selection.rows;
    const [left, right] = everywhere
      ? [0, columns.length - 1]
      : selection.columns;
    const values: { row: number; param: EditableParam; value: WeatherValue }[] =
      [];
    for (let c = left; c <= right; c++) {
      const param = columns[c];
      for (const location of new Set(rows.map((r) => r.location))) {
        const places: number[] = [];
        rows.forEach((r, row) => {
          if (r.location === location) places.push(row);
        });
        const numbers = places.map((row) =>
          displayNumberOf(param, valueAt(row, param), units),
        );
        fillGaps(numbers).forEach((filled, i) => {
          const row = places[i];
          if (
            row >= top &&
            row <= bottom &&
            numbers[i] === null &&
            filled !== null
          )
            values.push({
              row,
              param,
              value: valueInBothUnits(param, filled, units),
            });
        });
      }
    }
    const changed = setValues(values);
    say(
      changed
        ? `${changed} missing ${changed === 1 ? 'value' : 'values'} filled in`
        : 'No missing values to fill in',
    );
  }

  function findNextGap() {
    const total = rows.length * columns.length;
    const from = cursor.row * columns.length + cursor.column;
    for (let step = 1; step <= total; step++) {
      const at = (from + step) % total;
      const row = Math.floor(at / columns.length);
      const column = at % columns.length;
      if (valueAt(row, columns[column]).metric === null) {
        select(row, column);
        say(`Missing: ${rows[row].date}, ${heading(columns[column]).label}`);
        return;
      }
    }
    say('No missing values');
  }

  function revertSelection() {
    // A new map each time, put in `edits` whole (the draft's Undo keeps the old ones)
    // eslint-disable-next-line svelte/prefer-svelte-reactivity
    const next = new Map(edits);
    for (const { row, param } of selectedCells())
      next.delete(keyOf(row, param));
    const reverted = edits.size - next.size;
    if (!reverted) return;
    past = [...past, edits];
    future = [];
    edits = next;
    say(`${reverted} ${reverted === 1 ? 'value' : 'values'} back as they were`);
  }

  const selectionHasEdits = $derived.by(() => {
    for (const key of edits.keys()) {
      const [row, param] = key.split('|');
      if (isSelected(+row, columns.indexOf(param as EditableParam)))
        return true;
    }
    return false;
  });

  // ***************
  // Import File
  // ***************

  let showImport = $state(untrack(() => startWith === 'import'));

  function imported(values: ImportedValue[]) {
    const changed = setValues(values);
    say(
      `From the file: ${changed} ${changed === 1 ? 'value' : 'values'} changed`,
    );
  }

  // ***************
  // Colors (the gauges can't change while this is open)
  // ***************

  // A cache, never shown
  // eslint-disable-next-line svelte/prefer-svelte-reactivity
  const colors = new Map<string, ColorInfo>();
  function colorOf(param: EditableParam, value: WeatherValue) {
    const number = value[units];
    const key = `${param}|${number}`;
    let color = colors.get(key);
    if (!color) {
      color = getColorInfo({
        param: param as WeatherParam['id'],
        value: number,
      });
      colors.set(key, color);
    }
    if (typeof color.index === 'number') return color;
    // A value with a gauge but in none of its ranges, so no yarn
    if (number !== null && typeof color.gaugeLength === 'number')
      return 'outside' as const;
    return null;
  }

  // ***************
  // Apply, or close without
  // ***************

  let confirmingDiscard = $state(false);

  function apply() {
    if (editing && !finishEditing()) return;
    if (weather.dataEpoch !== epoch) {
      problem =
        'The weather data changed while this was open. Close this and open it again.';
      return;
    }
    const changes: WeatherChange[] = [...edits].map(([key, after]) => {
      const [row, param] = key.split('|');
      const index = +row;
      const p = param as EditableParam;
      return { index, param: p, before: original[index][p], after };
    });
    weatherEdits.apply(changes);
    updateHistory();
    const token = weatherEdits.historyToken;
    const undoable = Boolean(token) && project.history.current?.endsWith(token);
    const days = changedDays(changes);
    toast.trigger({
      category: 'success',
      message: `Weather data changed on ${days} ${days === 1 ? 'day' : 'days'}`,
      ...(undoable && {
        action: {
          label: 'Undo',
          response: () => {
            if (
              project.history.current?.endsWith(token) &&
              !project.history.isFirst &&
              !project.history.isUpdating
            )
              void loadFromHistory({ action: 'Undo' });
          },
        },
      }),
    });
    close();
  }

  function close() {
    dialog.beforeClose = null;
    dialog.close();
  }

  const beforeClose = () => {
    if (!edits.size) return true;
    confirmingDiscard = true;
    return false;
  };

  onMount(() => {
    dialog.beforeClose = beforeClose;
    if (start) {
      const column = Math.max(0, columns.indexOf(start.param));
      anchor = { row: start.row, column };
      cursor = { row: start.row, column };
    }
    // After the dialog has opened and placed the focus
    setTimeout(() => {
      void reveal(cursor.row, cursor.column);
      if (!showImport) grid?.focus({ preventScroll: true });
    }, 50);
  });

  onDestroy(() => {
    if (dialog.beforeClose === beforeClose) dialog.beforeClose = null;
  });
</script>

<svelte:window onpointerup={() => (dragging = false)} />

<div class="flex min-h-0 flex-1 flex-col gap-2 px-2 pb-2 sm:px-4">
  <!-- Tools -->
  <div class="flex flex-wrap items-center gap-2">
    <button
      type="button"
      class="btn btn-sm hover:preset-tonal-surface"
      aria-expanded={showImport}
      onclick={() => (showImport = !showImport)}
    >
      <FileUpIcon /> Import File
    </button>
    {#if gaps.missing}
      <button
        type="button"
        class="btn btn-sm hover:preset-tonal-surface"
        onclick={findNextGap}
        title="Go to the next missing value"
      >
        <SearchIcon /> Find Missing
      </button>
    {/if}
    {#if gaps.fillable}
      <button
        type="button"
        class="btn btn-sm hover:preset-tonal-surface"
        onclick={fillSelectionGaps}
        title="Fill in missing values from the days on either side: in the selected cells, or everywhere with one cell selected"
      >
        <SparklesIcon /> Fill In Missing
      </button>
    {/if}
    <div class="ml-auto flex gap-1">
      <button
        type="button"
        class="btn-icon btn-icon-sm hover:preset-tonal-surface"
        aria-label="Undo in this editor"
        title="Undo [Cmd ⌘]+[z] or [Ctrl]+[z]"
        disabled={!past.length}
        onclick={undoDraft}
      >
        <UndoIcon />
      </button>
      <button
        type="button"
        class="btn-icon btn-icon-sm hover:preset-tonal-surface"
        aria-label="Redo in this editor"
        title="Redo [Cmd ⌘]+[Shift ⇧]+[z] or [Ctrl]+[Shift ⇧]+[z]"
        disabled={!future.length}
        onclick={redoDraft}
      >
        <RedoIcon />
      </button>
    </div>
  </div>

  {#if showImport}
    <div class="rounded-container bg-surface-100-900 shadow-inner">
      <ImportWeatherData {rows} onvalues={imported} />
    </div>
  {/if}

  <!-- The value bar: what's selected, and a value for all of it -->
  <div class="flex flex-wrap items-center gap-2">
    <label class="flex min-w-0 grow items-center gap-2">
      <span class="shrink-0 text-sm">
        {#if selectedCount === 1}
          {rows[cursor.row]?.date}{locationCount > 1
            ? `, ${locationLabel(rows[cursor.row]?.location ?? 0)}`
            : ''}: {heading(columns[cursor.column]).label}
        {:else}
          {selectedCount} selected
        {/if}
      </span>
      <input
        class="input field-sm max-w-40 min-w-24 grow"
        type="text"
        inputmode={columns[cursor.column] === 'dayt' ? 'text' : 'decimal'}
        bind:value={barText}
        placeholder="Missing"
        onfocus={() => (barFocused = true)}
        onblur={() => (barFocused = false)}
        onkeydown={(ev) => {
          if (ev.key === 'Enter') {
            ev.preventDefault();
            setSelection();
          }
        }}
      />
      <button
        type="button"
        class="btn btn-sm preset-tonal-surface"
        onclick={setSelection}
        title="Set the selected values to this"
      >
        Set
      </button>
    </label>
    <label class="flex items-center gap-2">
      <span class="text-sm">Add</span>
      <input
        class="input field-sm w-20"
        type="number"
        step="any"
        bind:value={adjustBy}
        placeholder="±0"
        title="Add to each selected value (daytime in hours); negative to take away"
        onkeydown={(ev) => {
          if (ev.key === 'Enter') {
            ev.preventDefault();
            adjustSelection();
          }
        }}
      />
      <button
        type="button"
        class="btn btn-sm preset-tonal-surface"
        disabled={!adjustBy}
        onclick={adjustSelection}
      >
        Add
      </button>
    </label>
    <button
      type="button"
      class="btn btn-sm hover:preset-tonal-surface"
      disabled={!selectionHasEdits}
      onclick={revertSelection}
      title="Put the selected values back as they were"
    >
      <Undo2Icon /> Revert
    </button>
  </div>

  {#if problem}
    <p class="text-error-700-300 text-sm" role="alert">{problem}</p>
  {/if}

  <!-- The grid -->
  <div
    bind:this={scroller}
    bind:clientHeight={viewHeight}
    onscroll={() => (scrollTop = scroller?.scrollTop ?? 0)}
    class="rounded-container border-surface-200-800 min-h-60 flex-1 overflow-auto border"
  >
    <div
      bind:this={grid}
      role="grid"
      tabindex="0"
      aria-label="Weather data by day"
      aria-rowcount={rows.length + 1}
      aria-colcount={columns.length + (locationCount > 1 ? 2 : 1)}
      aria-multiselectable="true"
      aria-activedescendant={editing
        ? undefined
        : cellId(cursor.row, cursor.column)}
      class="relative w-max min-w-full outline-none select-none"
      {onkeydown}
      {oncopy}
      {onpaste}
    >
      <div
        role="row"
        aria-rowindex={1}
        class="bg-surface-100-900 border-surface-200-800 sticky top-0 z-20 grid border-b text-sm"
        style:grid-template-columns={gridColumns}
      >
        <div
          role="columnheader"
          class="bg-surface-100-900 sticky left-0 z-10 px-2 py-1 font-bold"
        >
          Day
        </div>
        {#if locationCount > 1}
          <div role="columnheader" class="px-2 py-1 font-bold">Location</div>
        {/if}
        {#each columns as param (param)}
          {@const { label, unit } = heading(param)}
          <div role="columnheader" class="px-2 py-1 leading-tight font-bold">
            {label} <span class="text-xs font-normal">({unit})</span>
          </div>
        {/each}
      </div>

      <div
        role="rowgroup"
        class="relative"
        style:height="{rows.length * ROW_HEIGHT}px"
      >
        {#each visibleRows as row (row)}
          {@const day = rows[row]}
          <div
            role="row"
            aria-rowindex={row + 2}
            class={[
              'absolute right-0 left-0 grid',
              row % 2 ? 'bg-surface-50-950' : 'bg-surface-100-900',
            ]}
            style:top="{row * ROW_HEIGHT}px"
            style:height="{ROW_HEIGHT}px"
            style:grid-template-columns={gridColumns}
          >
            <div
              role="rowheader"
              class={[
                'border-surface-200-800 sticky left-0 z-10 flex items-center border-r px-2 text-sm tabular-nums',
                row % 2 ? 'bg-surface-50-950' : 'bg-surface-100-900',
              ]}
            >
              {day.date}
              {#if isMadeRow(row)}
                <CircleCheckIcon
                  class="icon-sm text-success-700-300 ml-1 shrink-0"
                  aria-label="made"
                />
              {/if}
            </div>
            {#if locationCount > 1}
              <div
                class="flex items-center truncate px-2 text-sm"
                title={locationLabel(day.location)}
              >
                {locationLabel(day.location)}
              </div>
            {/if}
            {#each columns as param, column (param)}
              {@const value = valueAt(row, param)}
              {@const changed = edits.has(keyOf(row, param))}
              {@const selected = isSelected(row, column)}
              {@const isCursor = cursor.row === row && cursor.column === column}
              {@const color = colorOf(param, value)}
              <!-- The grid keeps the focus and points to the cell (aria-activedescendant) -->
              <!-- svelte-ignore a11y_interactive_supports_focus -->
              <div
                role="gridcell"
                id={cellId(row, column)}
                aria-selected={selected}
                class={[
                  'border-surface-200-800 flex scroll-mt-10 scroll-ml-32 items-center gap-1.5 border-r px-2 tabular-nums',
                  'cursor-cell',
                  changed && !selected && 'bg-warning-500/20',
                  selected && 'bg-primary-500/20',
                  isCursor && 'outline-primary-500 outline-2 -outline-offset-2',
                ]}
                title={changed
                  ? `Was ${displayValue(param, original[row][param], units) || 'missing'}`
                  : undefined}
                onpointerdown={(ev) => onpointerdown(ev, row, column)}
                onpointerenter={() => onpointerenter(row, column)}
                ondblclick={() => void startEditing()}
              >
                {#if editing && editing.row === row && editing.column === column}
                  <input
                    bind:this={input}
                    bind:value={editing.text}
                    class="w-full min-w-0 bg-transparent outline-none select-text"
                    inputmode={param === 'dayt' ? 'text' : 'decimal'}
                    aria-label="{day.date}, {heading(param).label}"
                    aria-invalid={Boolean(problem)}
                    oninput={() => (problem = '')}
                  />
                {:else}
                  {#if color === 'outside'}
                    <span
                      class="border-surface-500 size-3 shrink-0 rounded-full border border-dashed"
                      title="In none of the gauge's ranges: no color"
                    ></span>
                  {:else}
                    <span
                      class="size-3 shrink-0 rounded-full shadow-[inset_0_0_0_1px_rgb(0_0_0/0.25)]"
                      style:background-color={color?.hex}
                      style:visibility={color ? 'visible' : 'hidden'}
                      aria-hidden="true"
                    ></span>
                  {/if}
                  {#if value.metric === null && value.imperial === null}
                    <span class="opacity-50" aria-label="missing">–</span>
                  {:else}
                    <span class={[changed && 'font-semibold']}
                      >{displayValue(param, value, units)}</span
                    >
                  {/if}
                  {#if changed}
                    <span class="sr-only">, changed</span>
                  {/if}
                {/if}
              </div>
            {/each}
          </div>
        {/each}
      </div>
    </div>
  </div>

  <!-- What the last action did, else how to use the grid -->
  <p class="min-h-4 text-xs" role="status">
    {#if status}
      {status}
    {:else}
      <span class="opacity-80 max-sm:hidden">
        Type to change a value. Enter, Tab and the arrow keys move; Shift or
        drag to select. Copy and paste with a spreadsheet; pasted rows that
        start with dates go to those days. Delete clears.
      </span>
    {/if}
  </p>

  <!-- Apply -->
  <div
    class="border-surface-200-800 flex flex-wrap items-center justify-end gap-2 border-t pt-2"
  >
    {#if confirmingDiscard}
      <p class="mr-auto text-sm" role="alert">
        Close without your {edits.size}
        {edits.size === 1 ? 'change' : 'changes'}?
      </p>
      <button
        type="button"
        class="btn hover:preset-tonal-surface"
        onclick={() => (confirmingDiscard = false)}
      >
        Keep Editing
      </button>
      <button type="button" class="btn preset-filled-error-500" onclick={close}>
        Discard Changes
      </button>
    {:else}
      <div class="mr-auto text-sm">
        {#if edits.size}
          <p aria-live="polite">
            {edits.size}
            {edits.size === 1 ? 'value' : 'values'} changed on {editedDays}
            {editedDays === 1 ? 'day' : 'days'}
          </p>
          {#if madeEditedDays && progress.madeThrough}
            <p class="text-warning-800-200" data-testid="edit-made-note">
              {madeEditedDays}
              {madeEditedDays === 1 ? 'is a day' : 'are days'} you've already made
              (through {shortDay(progress.madeThrough)}): the blanket won't
              match the new colors.
            </p>
          {/if}
        {:else}
          <p class="opacity-80">No changes yet</p>
        {/if}
      </div>
      <button
        type="button"
        class="btn hover:preset-tonal-surface"
        onclick={() => {
          if (beforeClose()) close();
        }}
      >
        Cancel
      </button>
      <button
        type="button"
        class="btn preset-filled-primary-500"
        disabled={!edits.size}
        onclick={apply}
      >
        Apply
      </button>
    {/if}
  </div>
</div>

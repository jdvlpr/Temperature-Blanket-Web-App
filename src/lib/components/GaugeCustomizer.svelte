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

<script lang="ts">
  import { page } from '$app/state';
  import ViewMenu from '$lib/components/buttons/ViewMenu.svelte';
  import { menuItemClass } from '$lib/components/menu-styles';
  import ChangeColor from '$lib/components/modals/ChangeColor.svelte';
  import WeatherTable from '$lib/components/modals/WeatherTable.svelte';
  import ColorwayMoreMenu from '$lib/components/yarn-colorways/ColorwayMoreMenu.svelte';
  import { iconColorOn } from '$lib/components/yarn-colorways/colorway-utils';
  import { dialog } from '$lib/state/page-state.svelte';
  import { previewHighlight } from '$lib/state/preview-state.svelte';
  import { gauges, showDaysInRange } from '$lib/state/gauges-state.svelte';
  import { weather } from '$lib/state/weather-state.svelte';
  import { preferences } from '$lib/storage/preferences.svelte';
  import type { GaugeRange } from '$lib/types/gauge-types';
  import type { Color } from '$lib/types/yarn-types';
  import {
    getDaysInRange,
    getDaysPercent,
    setRangeValue,
  } from '$lib/utils/range-utils.svelte';
  import { sameColorList } from '$lib/utils/color-utils';
  import { pluralize } from '$lib/utils/string-utils';
  import {
    growIn,
    historyChange,
    liftDraggedElement,
    markDragged,
    motionDuration,
    Pop,
    showHistoryChange,
  } from '$lib/utils/feedback.svelte';
  import {
    ArrowRightIcon,
    CheckIcon,
    GripVerticalIcon,
    SearchIcon,
    ShoppingCartIcon,
    XIcon,
  } from '@lucide/svelte';
  import { Menu } from '@skeletonlabs/skeleton-svelte';
  import {
    dragHandle,
    dragHandleZone,
    SOURCES,
    TRIGGERS,
  } from 'svelte-dnd-action';
  import { tick, untrack } from 'svelte';
  import { flip } from 'svelte/animate';
  import RangeOptionsButton from './buttons/RangeOptionsButton.svelte';

  const flipDurationMs = $derived(motionDuration(150));

  const isProjectPlannerPage = page.url.pathname === '/';

  let { gauge = $bindable() } = $props();

  let isStaticGauge = $derived(gauge.isStatic);

  let movable = $derived(gauge.colors?.length > 1);

  let hasAnyAffiliateURLs = $derived(
    gauge.colors?.some((color: Color) => color?.affiliate_variant_href),
  );

  let sortableColors: Color[] = $state(getSortableColors());

  // Follow colors changed elsewhere (undo, Get Colors, Sort, another gauge),
  // but not mid-drag, nor after a drop here (they're the same colors). The
  // list isn't rebuilt for them: rebuilding it under a drop made iOS jump
  // the page.
  let dragging = false;
  let listElement: HTMLElement | undefined = $state();
  $effect.pre(() => {
    const colors = gauge.colors;
    untrack(() => {
      if (!dragging && !sameColorList(colors, sortableColors))
        sortableColors = getSortableColors();
    });
  });

  // The color being moved with the keyboard, which stays in place instead of following a pointer
  let keyboardDragId: number | null = $state(null);

  // The swatch whose color just changed, for a little pop
  const pop = new Pop();

  // Pointing at or focusing a color highlights the days in that yarn on the
  // preview (on the project page, where there's one)
  let highlightIndex: number | null = $state(null);
  $effect.pre(() => {
    void gauge.colors;
    highlightIndex = null;
  });
  $effect(() => {
    if (!isProjectPlannerPage) return;
    previewHighlight.hex =
      highlightIndex === null || keyboardDragId !== null
        ? null
        : (gauge.colors[highlightIndex]?.hex ?? null);
    return () => (previewHighlight.hex = null);
  });

  // Ranges and days in them show on the project page, where there's weather
  let showRanges = $derived(isProjectPlannerPage && !!gauge.ranges);
  let isCategory = $derived(gauge.unit?.type === 'category');
  let unitLabel = $derived(
    gauge.unit?.label?.[preferences.value.units ?? 'metric'] ?? '',
  );
  let showDays = $derived(
    showRanges && showDaysInRange.value && !!weather.data?.length,
  );

  // A range being edited in place: its From and To as typed (null while
  // empty). Nothing is saved until Enter or leaving it, so one edit is one
  // undo step; until then, the numbers and days follow the draft.
  let editing: {
    index: number;
    edge: 'from' | 'to';
    from: number | null;
    to: number | null;
  } | null = $state(null);

  // The ranges with the draft applied, and which neighbors it moved
  let draft = $derived.by(() => {
    let ranges: GaugeRange[] = gauge.ranges ?? [];
    const moved: number[] = [];
    if (!editing || isCategory) return { ranges, moved };
    const original = ranges[editing.index];
    for (const edge of ['from', 'to'] as const) {
      const value = editing[edge];
      if (value === null || !Number.isFinite(value)) continue;
      if (value === original?.[edge]) continue;
      const result = setRangeValue({
        ranges,
        rangeOptions: { linked: !!gauge.rangeOptions?.linked },
        index: editing.index,
        edge,
        value,
      });
      ranges = result.ranges;
      if (result.neighbor !== null) moved.push(result.neighbor);
    }
    return { ranges, moved };
  });

  // Says what else an edit moved, for screen readers
  let announcement = $state('');

  function editRange(index: number, edge: 'from' | 'to') {
    const r = gauge.ranges?.[index];
    if (!r) return;
    editing = { index, edge, from: r.from, to: r.to };
  }

  function saveRange({ refocus }: { refocus: boolean }) {
    if (!editing) return;
    const { index } = editing;
    const { ranges, moved } = draft;
    const changed = ranges !== gauge.ranges;
    editing = null;
    if (changed) {
      gauge.ranges = ranges;
      // Set by hand, so they're kept when colors are added or removed
      gauge.rangeOptions = {
        ...$state.snapshot(gauge.rangeOptions),
        isCustomRanges: true,
      };
      if (moved.length)
        showHistoryChange({
          gaugeId: gauge.id,
          indices: moved,
          preview: false,
        });
      announcement = moved
        .map((n) =>
          n < index
            ? `Color ${n + 1} now ends at ${ranges[n].to} ${unitLabel}`
            : `Color ${n + 1} now starts at ${ranges[n].from} ${unitLabel}`,
        )
        .join('. ');
    }
    if (refocus) focusRange(index);
  }

  function cancelRange() {
    if (!editing) return;
    const { index } = editing;
    editing = null;
    focusRange(index);
  }

  function focusRange(index: number) {
    tick().then(() =>
      listElement
        ?.querySelector<HTMLElement>(
          `[data-color-id="${sortableColors[index]?.id}"] .range-button`,
        )
        ?.focus(),
    );
  }

  // Each color's days in its range, one list per target (e.g. high, average, low)
  let days = $derived.by(() => {
    if (!showDays) return [];
    return gauge.colors.map((_: Color, index: number) => {
      const range = draft.ranges[index];
      return gauge.targets.map(
        (target: { id: Parameters<typeof getDaysInRange>[0]['id'] }) =>
          range
            ? getDaysInRange({
                id: target.id,
                range,
                direction: gauge.rangeOptions?.direction,
                includeFromValue: gauge.rangeOptions?.includeFromValue,
                includeToValue: gauge.rangeOptions?.includeToValue,
                gaugeUnitType: gauge.unit.type,
              })
            : [],
      );
    });
  });

  let periods = $derived(pluralize(weather.grouping, 2));

  function openChangeColor(index: number, color: Color) {
    dialog.trigger({
      type: 'component',
      component: {
        ref: ChangeColor,
        props: { index, ...color, onChangeColor },
      },
      options: { title: `Color ${index + 1}`, size: 'large' },
    });
  }

  function removeColor(index: number) {
    gauge.updateColors({
      colors: gauge.colors.filter((_: Color, i: number) => i !== index),
    });
    sortableColors = getSortableColors();
    gauge.schemeId = 'Custom';
  }

  // Handle color change from ChangeColor modal
  function onChangeColor({
    index,
    hex,
    name,
    brandId,
    yarnId,
    brandName,
    yarnName,
    variant_href,
    affiliate_variant_href,
  }: {
    index: number;
    hex?: string;
    name?: string;
    brandId?: string;
    yarnId?: string;
    brandName?: string;
    yarnName?: string;
    variant_href?: string;
    affiliate_variant_href?: string | null;
  }) {
    gauge.schemeId = 'Custom';

    const _colors: Color[] = [];
    gauge.colors.forEach((color: Color, i: number) => {
      if (i === index) {
        _colors.push({
          hex,
          name,
          brandId,
          yarnId,
          brandName,
          yarnName,
          variant_href,
          affiliate_variant_href,
        });
      } else {
        _colors.push(color);
      }
      gauge.colors = _colors;
    });

    sortableColors = getSortableColors();
    dialog.close();
    pop.trigger(index);
  }

  // Handle drag and drop events
  function handleConsider(e: Event) {
    const event = e as CustomEvent<{
      items: Color[];
      info: { source: string; trigger: string; id: string };
    }>;
    sortableColors = event.detail.items as (Color & { id: number })[];
    markDragged();
    const { source, trigger, id } = event.detail.info;
    // A keyboard drop sends "drag stopped" after finalize
    dragging = trigger !== TRIGGERS.DRAG_STOPPED;
    if (source === SOURCES.KEYBOARD && trigger === TRIGGERS.DRAG_STARTED) {
      keyboardDragId = Number(id);
    } else if (trigger === TRIGGERS.DRAG_STOPPED) {
      keyboardDragId = null;
    }
  }

  // On drag end, update the gauge colors
  function handleFinalize(e: Event) {
    dragging = false;
    const event = e as CustomEvent<{ items: Color[] }>;
    const newItems = event.detail.items as (Color & { id: number })[];

    sortableColors = newItems;
    // A color moved with the keyboard keeps the focus, to move it again
    const movedId = keyboardDragId;
    keyboardDragId = null;
    markDragged();
    // After the drag library refocuses the row and the list settles, which
    // would otherwise leave the focus nowhere
    if (movedId !== null)
      setTimeout(
        () =>
          listElement
            ?.querySelector<HTMLElement>(`[data-color-id="${movedId}"] .handle`)
            ?.focus(),
        50,
      );

    gauge.colors = sortableColors.map((color) => {
      const { id, ...rest } = color;
      return rest as Color;
    });

    gauge.schemeId = 'Custom';
  }

  // Prepare sortable colors with IDs for svelte-dnd-action
  function getSortableColors() {
    const _sortableColors: (Color & { id: number })[] = [];
    gauge.colors.forEach((color: Color, i: number) => {
      _sortableColors.push({ ...color, id: i });
    });
    return _sortableColors;
  }
</script>

{#snippet handle(index: number, onColor = false)}
  <!-- Not a <button>: svelte-dnd-action ignores Space and Enter from buttons,
  so keyboard dragging only starts from an element like this -->
  <div
    role="button"
    tabindex="0"
    title="Move Color"
    aria-label="Drag handle to reorder color {index + 1}"
    class="handle rounded-tile flex h-9 w-7 shrink-0 cursor-grab items-center justify-center focus-visible:outline-2 focus-visible:outline-current {onColor
      ? 'hover-on-color'
      : 'hover:preset-tonal-surface'}"
    data-sheet-no-drag
    use:dragHandle
  >
    <GripVerticalIcon size={18} aria-hidden="true" />
  </div>
{/snippet}

<!-- The yarn: its name and "Brand · Yarn", or its hex code; opens Change Color -->
{#snippet yarn(index: number, color: Color, swatch: boolean)}
  <button
    type="button"
    class="btn rounded-tile hover:preset-tonal-surface h-auto w-fit max-w-full min-w-0 justify-start gap-3 px-2 py-1 text-left"
    title="Choose a Color"
    onclick={() => openChangeColor(index, gauge.colors[index])}
  >
    {#if swatch}
      <span
        class="rounded-base grid size-10 shrink-0 place-items-center text-sm font-semibold shadow-[inset_0_0_0_1px_rgb(0_0_0/0.12)]"
        class:feedback-pop={pop.index === index}
        class:history-flash={historyChange.gaugeId === gauge.id &&
          historyChange.indices.includes(index)}
        style:--pop-scale="1.12"
        style="background:{color.hex};color:{iconColorOn(color.hex ?? '#fff')}"
        ><span class="sr-only">Color</span> {index + 1}</span
      >
    {/if}
    <span class="flex min-w-0 flex-col">
      <span
        class="leading-tight font-semibold {swatch
          ? 'truncate'
          : 'text-pretty'}"
      >
        {color.name || color.hex}
      </span>
      <span
        class="text-surface-700-300 text-xs {swatch
          ? 'truncate'
          : 'text-pretty'}"
      >
        {#if color.brandName && color.yarnName}
          {color.brandName} · {color.yarnName}
        {:else}
          <SearchIcon size={12} class="inline" aria-hidden="true" /> Find matching
          yarn
        {/if}
      </span>
    </span>
  </button>
{/snippet}

<!-- e.g. "105 → 92"; the unit and what's included are said once, above -->
<!-- `column` pads the numbers so they line up down a list -->
{#snippet unit()}
  {#if unitLabel}<span class="text-xs opacity-70">{unitLabel}</span>{/if}
{/snippet}

{#snippet range(index: number, column: boolean)}
  {@const r = isCategory ? gauge.ranges?.[index] : draft.ranges[index]}
  {#if r}
    {#if isCategory}
      <span class="truncate px-2 text-sm">{r.label}</span>
    {:else if editing?.index === index}
      {@const label = (edge: string) =>
        `Color ${index + 1} ${edge}${unitLabel ? `, ${unitLabel}` : ''}`}
      <!-- Saved with ✓ or Enter, or on leaving it; ✕ or Escape puts it back.
      In a narrow card, To goes under From. -->
      <!-- svelte-ignore a11y_no_static_element_interactions -->
      <div
        class="flex flex-wrap items-center gap-1 px-1 @max-[13rem]:flex-col @max-[13rem]:items-start"
        onfocusout={(e) => {
          if (!e.currentTarget.contains(e.relatedTarget as Node | null))
            saveRange({ refocus: false });
        }}
        onkeydown={(e) => {
          // From the numbers; on the buttons, Enter presses them
          if (e.key === 'Enter' && e.target instanceof HTMLInputElement) {
            e.preventDefault();
            saveRange({ refocus: true });
          } else if (e.key === 'Escape') {
            // Only the edit, not a dialog around it
            e.preventDefault();
            e.stopPropagation();
            cancelRange();
          }
        }}
      >
        <!-- type="number" keeps the minus key on phones; 16px text keeps iOS from zooming in -->
        <input
          type="number"
          step="any"
          class="input h-9 w-20 px-2 text-base tabular-nums"
          aria-label={label('from')}
          bind:value={editing.from}
          {@attach (el) => {
            // Once, when it opens, not on every keystroke
            if (untrack(() => editing?.edge) === 'from') {
              el.focus();
              el.select();
            }
          }}
        />
        <ArrowRightIcon
          size={14}
          class="shrink-0 opacity-60 @max-[13rem]:mx-8 @max-[13rem]:rotate-90"
          aria-hidden="true"
        />
        <span class="flex items-center gap-1">
          <input
            type="number"
            step="any"
            class="input h-9 w-20 px-2 text-base tabular-nums"
            aria-label={label('to')}
            bind:value={editing.to}
            {@attach (el) => {
              // Once, when it opens, not on every keystroke
              if (untrack(() => editing?.edge) === 'to') {
                el.focus();
                el.select();
              }
            }}
          />
          {@render unit()}
        </span>
        <!-- Pressing them mustn't take the focus first: on iOS that would
        leave the numbers, which saves before Cancel is tapped -->
        <span class="flex items-center">
          <button
            type="button"
            class="btn-icon hover:preset-tonal-surface"
            title="Save Range"
            aria-label="Save range for color {index + 1}"
            onpointerdown={(e) => e.preventDefault()}
            onclick={() => saveRange({ refocus: true })}
          >
            <CheckIcon aria-hidden="true" />
          </button>
          <button
            type="button"
            class="btn-icon hover:preset-tonal-surface"
            title="Cancel"
            aria-label="Cancel editing range for color {index + 1}"
            onpointerdown={(e) => e.preventDefault()}
            onclick={cancelRange}
          >
            <XIcon aria-hidden="true" />
          </button>
        </span>
      </div>
    {:else}
      <button
        type="button"
        class="range-button btn rounded-tile hover:preset-tonal-surface h-9 gap-1 px-2 tabular-nums"
        class:history-flash={historyChange.gaugeId === gauge.id &&
          historyChange.indices.includes(index)}
        title="Edit Range"
        aria-label="Range for color {index +
          1}: from {r.from} to {r.to} {unitLabel}. Edit"
        onclick={(e) => {
          // Saves one being edited first
          saveRange({ refocus: false });
          editRange(
            index,
            (e.target as Element).closest('[data-to]') ? 'to' : 'from',
          );
        }}
      >
        <span class="whitespace-nowrap"
          ><span class={['inline-block', column && 'w-[5ch] text-right']}
            >{r.from}</span
          >{@render unit()}</span
        >
        <ArrowRightIcon
          size={14}
          class="shrink-0 opacity-60"
          aria-hidden="true"
        />
        <!-- Wide enough for a number and a unit, e.g. "105min", so every row's is the same width -->
        <span
          class={['text-left whitespace-nowrap', column && 'w-[8ch]']}
          data-to>{r.to}{@render unit()}</span
        >
      </button>
    {/if}
  {/if}
{/snippet}

<!-- Days in the range for each target: "↑ High", "20 days", "5.48%"; tapping one
lists them. In a narrow card (`fill`), each is a row instead: label, then days and share. -->
{#snippet daysCells(index: number, fill: boolean)}
  {#each gauge.targets as target, t (target.id)}
    {@const list = days[index]?.[t] ?? []}
    {@const count = `${list.length} ${pluralize(weather.grouping, list.length)}`}
    {@const percent = `${getDaysPercent(list.length)}%`}
    <button
      type="button"
      class="rounded-tile hover:preset-tonal-surface flex flex-col px-1.5 py-1 text-left tabular-nums disabled:opacity-50 {fill
        ? 'min-w-0 @max-[15rem]:flex-row @max-[15rem]:items-baseline @max-[15rem]:gap-2'
        : ''}"
      disabled={!list.length}
      title="{target.gaugeLabel}: {count}, {percent}"
      aria-label="{target.gaugeLabel}: {count}, {percent}"
      onclick={() =>
        dialog.trigger({
          type: 'component',
          component: { ref: WeatherTable, props: { weatherData: list } },
        })}
    >
      <span
        class="text-surface-700-300 text-xs whitespace-nowrap {fill
          ? '@max-[15rem]:flex-1'
          : ''}"
      >
        {target.icon}
        {target.gaugeLabel}
      </span>
      <span class="text-sm leading-tight font-semibold whitespace-nowrap"
        >{count}</span
      >
      <span class="text-surface-700-300 text-xs whitespace-nowrap"
        >{percent}</span
      >
    </button>
  {/each}
{/snippet}

{#snippet more(index: number, color: Color, on: 'swatch' | 'surface')}
  <ColorwayMoreMenu
    colorway={color}
    {on}
    onremove={movable && !isStaticGauge ? () => removeColor(index) : undefined}
    removeLabel="Remove color {index + 1}"
  />
{/snippet}

{#if hasAnyAffiliateURLs}
  <p class="mt-4 px-2 text-sm">
    Purchases via links with a shopping cart icon <ShoppingCartIcon
      class="relative -top-px inline size-4"
    /> (in each color's ⋮ menu) support the developer of this web app at no extra
    cost to you.
  </p>
{/if}

<div class={['mt-4 flex flex-wrap items-center justify-center gap-4']}>
  {#if isProjectPlannerPage}
    <div class={[gauges.activeGauge?.isStatic && 'hidden']}>
      <RangeOptionsButton />
    </div>
  {/if}
  <!-- Only the project page has more view options; elsewhere there's no separator -->
  {#if isProjectPlannerPage}
    <ViewMenu bind:value={preferences.value.layout}>
      <!-- Stays open, so the check shows it took -->
      <Menu.OptionItem
        type="checkbox"
        value="days"
        checked={showDaysInRange.value}
        closeOnSelect={false}
        onCheckedChange={(checked) => (showDaysInRange.value = checked)}
        class={menuItemClass}
      >
        <span class="flex min-w-0 flex-1 flex-col">
          <span>Days in ranges</span>
          <span class="text-surface-700-300 text-xs">How many fall in each</span
          >
        </span>
        <CheckIcon
          size={18}
          class="shrink-0 {showDaysInRange.value ? '' : 'invisible'}"
          aria-hidden="true"
        />
      </Menu.OptionItem>
    </ViewMenu>
  {:else}
    <ViewMenu bind:value={preferences.value.layout} />
  {/if}
</div>

{#if showRanges && !isCategory && gauge.rangeOptions}
  <!-- Says when hand-set numbers have replaced Automatic or Manual ones -->
  <p class="text-surface-700-300 mt-3 px-2 text-center text-xs">
    {gauge.rangeOptions.isCustomRanges ? 'Custom ranges' : 'Ranges'}: From is {gauge
      .rangeOptions.includeFromValue
      ? 'included'
      : 'excluded'}, To is {gauge.rangeOptions.includeToValue
      ? 'included'
      : 'excluded'}. Tap a range to change it{gauge.rangeOptions.linked
      ? '; the next or previous one follows'
      : ''}.{showDays ? ` Tap a count to see those ${periods}.` : ''}
  </p>
{/if}
<p class="sr-only" aria-live="polite">{announcement}</p>

<div
  class="mt-3 mb-2 lg:mb-4 {preferences.value.layout === 'grid'
    ? 'grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4'
    : // The end rows round their own corners, so nothing is clipped
      'rounded-container border-surface-200-800 bg-surface-50-950 flex flex-col border'}"
  bind:this={listElement}
  use:dragHandleZone={{
    items: sortableColors,
    flipDurationMs,
    type: 'gaugeCustomizer',
    transformDraggedElement: liftDraggedElement,
  }}
  onconsider={handleConsider}
  onfinalize={handleFinalize}
>
  {#each sortableColors as { id, ...color }, index (id)}
    <!-- Pointing at a color only highlights it on the preview; focusing it does the same from the keyboard -->
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <div
      data-color-id={id}
      class="color {preferences.value.layout === 'grid'
        ? 'card border-surface-200-800 bg-surface-50-950 flex min-w-0 flex-col overflow-hidden border'
        : 'bg-surface-50-950 border-surface-200-800 first:rounded-t-container last:rounded-b-container @container border-b last:border-b-0'}"
      class:dnd-keyboard-lifted={keyboardDragId === id}
      onpointerenter={(e) => {
        // A tap isn't a hover; it would only flash
        if (e.pointerType !== 'touch') highlightIndex = index;
      }}
      onpointerleave={() => (highlightIndex = null)}
      onfocusin={(e) => {
        // Keyboard focus only, not a click or tap
        if ((e.target as Element).matches(':focus-visible'))
          highlightIndex = index;
      }}
      onfocusout={() => (highlightIndex = null)}
      in:growIn
      animate:flip={{ duration: flipDurationMs }}
    >
      {#if preferences.value.layout === 'grid'}
        <!-- The color on top, with the handle and number left and ⋮ right, all on one line -->
        <div
          class="flex h-14 items-center justify-between px-2"
          class:feedback-pop={pop.index === index}
          class:history-flash={historyChange.gaugeId === gauge.id &&
            historyChange.indices.includes(index)}
          style:--pop-scale="1.03"
          style="background:{color.hex};color:{iconColorOn(
            color.hex ?? '#fff',
          )}"
        >
          <span class="flex items-center">
            {@render handle(index, true)}
            <span class="text-sm font-semibold">{index + 1}</span>
          </span>
          {@render more(index, color, 'swatch')}
        </div>
        <div class="@container flex flex-1 flex-col gap-1 p-2 text-left">
          {@render yarn(index, color, false)}
          <!-- At the bottom, so they line up with the cards beside it -->
          {#if showRanges}
            <div class="mt-auto flex">{@render range(index, false)}</div>
          {/if}
          {#if showDays}
            <div
              class="grid gap-1 @[15rem]:auto-cols-fr @[15rem]:grid-flow-col"
            >
              {@render daysCells(index, true)}
            </div>
          {/if}
        </div>
      {:else}
        <!-- One line where there's room; on a phone, the range and days go on
        a second line under the yarn. Every row has the same columns, so they line up. -->
        <div
          class="grid items-center gap-x-2 gap-y-1 p-2 text-left {showDays
            ? 'grid-cols-[1.75rem_minmax(0,1fr)_auto] @2xl:grid-cols-[1.75rem_minmax(0,1fr)_auto_auto_auto]'
            : showRanges
              ? 'grid-cols-[1.75rem_minmax(0,1fr)_auto] @lg:grid-cols-[1.75rem_minmax(0,1fr)_auto_auto]'
              : 'grid-cols-[1.75rem_minmax(0,1fr)_auto]'}"
        >
          <span class="col-start-1 row-start-1 flex justify-center">
            {@render handle(index)}
          </span>
          <span class="col-start-2 row-start-1 flex min-w-0">
            {@render yarn(index, color, true)}
          </span>
          {#if showRanges}
            <!-- Under the yarn's name on a phone; its own columns where there's room -->
            <span
              class="col-span-3 col-start-1 row-start-2 flex flex-wrap items-center gap-1 pl-1 @sm:pl-[5.5rem] {showDays
                ? '@2xl:contents'
                : '@lg:contents'}"
            >
              <span
                class="flex shrink-0 {showDays
                  ? '@2xl:col-start-3 @2xl:row-start-1'
                  : '@lg:col-start-3 @lg:row-start-1'}"
              >
                {@render range(index, true)}
              </span>
              {#if showDays}
                <span class="flex gap-1 @2xl:col-start-4 @2xl:row-start-1">
                  {@render daysCells(index, false)}
                </span>
              {/if}
            </span>
          {/if}
          <span
            class="col-start-3 row-start-1 flex justify-center {showDays
              ? '@2xl:col-start-5'
              : showRanges
                ? '@lg:col-start-4'
                : ''}"
          >
            {@render more(index, color, 'surface')}
          </span>
        </div>
      {/if}
    </div>
  {/each}
</div>

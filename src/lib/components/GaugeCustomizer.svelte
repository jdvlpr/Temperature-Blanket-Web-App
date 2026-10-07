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

<script module lang="ts">
  /** A color the palette's strip asked to go to: its gauge's list shows it */
  const colorRequest: { gaugeId: string | null; index: number } = $state({
    gaugeId: null,
    index: 0,
  });

  /** Scrolls to a color's row or card in its gauge's list, and focuses its yarn */
  export function focusGaugeColor(gaugeId: string, index: number) {
    colorRequest.gaugeId = gaugeId;
    colorRequest.index = index;
  }
</script>

<script lang="ts">
  import { page } from '$app/state';
  import ColorSwatch from '$lib/components/ColorSwatch.svelte';
  import {
    paletteCardClass,
    paletteGridClass,
    paletteListClass,
    paletteRowClass,
  } from '$lib/components/palette-item-styles';
  import ViewMenu from '$lib/components/buttons/ViewMenu.svelte';
  import MenuCheckbox from '$lib/components/buttons/MenuCheckbox.svelte';
  import { menuItemClass } from '$lib/components/menu-styles';
  import ChangeColor from '$lib/components/modals/ChangeColor.svelte';
  import WeatherTable from '$lib/components/modals/WeatherTable.svelte';
  import ColorwayMoreMenu from '$lib/components/yarn-colorways/ColorwayMoreMenu.svelte';
  import { iconColorOn } from '$lib/components/yarn-colorways/colorway-utils';
  import {
    fillFromSwatch,
    fillWithColor,
    mutedText,
  } from '$lib/components/yarn-colorways/fill-with-color';
  import { dialog } from '$lib/state/page-state.svelte';
  import { previewHighlight } from '$lib/state/preview-state.svelte';
  import {
    gauges,
    manualRangesEditor,
    showDaysInRange,
  } from '$lib/state/gauges-state.svelte';
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
  import { displayNumber } from '$lib/utils/number-utils';
  import {
    confirmGaugeChange,
    gaugeChangeState,
  } from '$lib/utils/history-utils.svelte';
  import {
    describeIncrement,
    insertRange,
    removeRange,
    withGeneratedRanges,
  } from '$lib/utils/gauge-utils.svelte';
  import { pluralize } from '$lib/utils/string-utils';
  import {
    growIn,
    historyChange,
    liftDraggedElement,
    markDragged,
    motion,
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
    DRAGGED_ELEMENT_ID,
    dragHandle,
    dragHandleZone,
    SHADOW_ITEM_MARKER_PROPERTY_NAME,
    SOURCES,
    TRIGGERS,
  } from 'svelte-dnd-action';
  import { tick, untrack } from 'svelte';
  import { flip } from 'svelte/animate';
  import RangesMenu from './buttons/RangesMenu.svelte';

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

  let flashTimer: ReturnType<typeof setTimeout> | undefined;

  // Pressing a color in the strip above goes to its row or card here, which
  // glows for a moment so it's easy to find
  $effect(() => {
    if (colorRequest.gaugeId !== gauge.id || !listElement) return;
    const index = colorRequest.index;
    colorRequest.gaugeId = null;
    const item =
      listElement.querySelectorAll<HTMLElement>(':scope > .color')[index];
    if (!item) return;
    item.scrollIntoView({
      block: 'nearest',
      behavior: motion.reduced ? 'auto' : 'smooth',
    });
    item.querySelector<HTMLElement>('.yarn-button')?.focus({
      preventScroll: true,
    });
    // Above the rows around it, so the next row doesn't cover its outline.
    // Taken off after the glow's 1.4s on a timer: with reduced motion
    // there's no animation to end.
    const flash = ['history-flash-card', 'z-10'];
    clearTimeout(flashTimer);
    listElement
      .querySelectorAll('.history-flash-card')
      .forEach((el) => el.classList.remove(...flash));
    void item.offsetWidth; // restarts the glow
    item.classList.add(...flash);
    flashTimer = setTimeout(() => item.classList.remove(...flash), 1400);
  });
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
  // View › Fill with color: each color's card or row takes its color
  let filled = $derived(fillWithColor.on);
  // A hover tint that shows on the page's surface, or on a color
  let hoverTint = $derived(
    filled ? 'hover-on-color' : 'hover:preset-tonal-surface',
  );
  // A changed number: in the primary color, or underlined on a color, where
  // the primary color might not stand out
  let changedText = $derived(
    filled
      ? 'underline decoration-2 underline-offset-2'
      : 'text-primary-700-300',
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

  // Manual steps (every, from), opened from the Ranges menu. As with a
  // range, the list follows what's typed, and only Save keeps it: one undo
  // step. Cancel, Escape, or tapping or tabbing anywhere else puts it back.
  let showManual = $derived(
    manualRangesEditor.gaugeId === gauge.id && !isCategory,
  );
  let manualDraft: { increment: number | null; start: number | null } = $state({
    increment: null,
    start: null,
  });
  let manualValid = $derived(
    Number.isFinite(manualDraft.increment) &&
      (manualDraft.increment ?? 0) > 0 &&
      Number.isFinite(manualDraft.start),
  );

  // Opening it starts from the manual steps, or else from the first range,
  // so the list doesn't jump
  $effect.pre(() => {
    if (!showManual) return;
    untrack(() => {
      const options = gauge.rangeOptions;
      const first = (gauge.ranges as GaugeRange[] | undefined)?.[0];
      manualDraft =
        options?.mode === 'manual' && !options.isCustomRanges
          ? { ...options.manual }
          : {
              increment: first
                ? displayNumber(Math.abs(first.to - first.from))
                : (options?.manual.increment ?? null),
              start: first?.from ?? options?.manual.start ?? null,
            };
      editing = null;
    });
  });

  // Closed when this gauge or the list goes away, so it never reopens itself
  $effect(() => {
    const id = gauge.id;
    return () => {
      if (manualRangesEditor.gaugeId === id) manualRangesEditor.gaugeId = null;
    };
  });

  function cancelManualOnEscape(e: KeyboardEvent) {
    if (e.key !== 'Escape') return;
    // Only the strip, not a dialog around it
    e.preventDefault();
    e.stopPropagation();
    closeManual({ save: false });
  }

  function closeManual({ save }: { save: boolean }) {
    if (!showManual) return;
    if (save) {
      if (!manualValid) return;
      const result = withGeneratedRanges(gauge, {
        mode: 'manual',
        manual: {
          increment: manualDraft.increment as number,
          start: manualDraft.start as number,
        },
      });
      const before = gaugeChangeState(gauge);
      gauge.rangeOptions = result.rangeOptions;
      gauge.ranges = result.ranges;
      confirmGaugeChange(gauge.id, before, gaugeChangeState(gauge));
    }
    manualRangesEditor.gaugeId = null;
    tick().then(() =>
      document
        .querySelector<HTMLElement>('[data-ranges-menu-trigger]')
        ?.focus(),
    );
  }

  // The ranges with the draft applied, and which neighbors it moved
  let draft = $derived.by(() => {
    let ranges: GaugeRange[] = gauge.ranges ?? [];
    const moved: number[] = [];
    if (showManual && manualValid)
      return {
        ranges: withGeneratedRanges(gauge, {
          mode: 'manual',
          manual: {
            increment: manualDraft.increment as number,
            start: manualDraft.start as number,
          },
        }).ranges,
        moved,
      };
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

  // The colors whose days show the draft but aren't saved yet: the one
  // being edited and any neighbor it moves. They're colored until saved.
  let unsaved: number[] = $derived.by(() => {
    const index = editing?.index;
    if (index === undefined || draft.ranges === gauge.ranges) return [];
    return [index, ...draft.moved];
  });

  // Whether a neighbor's number moved with the edit: the previous color's To,
  // or the next one's From. The other number beside it hasn't changed.
  function movedValue(index: number, edge: 'from' | 'to') {
    if (!editing || !draft.moved.includes(index)) return false;
    return edge === (index < editing.index ? 'to' : 'from');
  }

  function editRange(index: number, edge: 'from' | 'to') {
    const r = gauge.ranges?.[index];
    if (!r) return;
    editing = { index, edge, from: r.from, to: r.to };
  }

  function saveRange({ refocus }: { refocus: boolean }) {
    if (!editing) return;
    const { index, edge } = editing;
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
    if (refocus) focusRange(index, edge);
  }

  // A tap or click outside an editor puts it back, but not a scroll: a
  // touch that scrolls ends in pointercancel, and a drag (the scrollbar, a
  // mouse) moves too far to count as a press
  function cancelOnOutsidePress(cancel: () => void) {
    return (el: HTMLElement) => {
      let press: { id: number; x: number; y: number } | null = null;
      const onPointerDown = (e: PointerEvent) => {
        press = el.contains(e.target as Node)
          ? null
          : { id: e.pointerId, x: e.clientX, y: e.clientY };
      };
      const onPointerUp = (e: PointerEvent) => {
        if (
          press?.id === e.pointerId &&
          Math.hypot(e.clientX - press.x, e.clientY - press.y) < 10
        )
          cancel();
        press = null;
      };
      const onPointerCancel = () => (press = null);
      document.addEventListener('pointerdown', onPointerDown, true);
      document.addEventListener('pointerup', onPointerUp, true);
      document.addEventListener('pointercancel', onPointerCancel, true);
      return () => {
        document.removeEventListener('pointerdown', onPointerDown, true);
        document.removeEventListener('pointerup', onPointerUp, true);
        document.removeEventListener('pointercancel', onPointerCancel, true);
      };
    };
  }

  function cancelRange({ refocus }: { refocus: boolean }) {
    if (!editing) return;
    const { index, edge } = editing;
    editing = null;
    if (refocus) focusRange(index, edge);
  }

  // On a phone, the keyboard opening can cover the number being edited. The
  // page doesn't shrink for it, only the visible part does, so once that
  // happens the number is scrolled to the middle of what's left, if it's hidden.
  function keepAboveKeyboard(el: HTMLElement) {
    const viewport = window.visualViewport;
    if (!viewport) return;
    const reveal = () => {
      const rect = el.getBoundingClientRect();
      const top = viewport.offsetTop + 16;
      const bottom = viewport.offsetTop + viewport.height - 16;
      if (rect.top >= top && rect.bottom <= bottom) return;
      window.scrollBy({
        top:
          rect.top +
          rect.height / 2 -
          (viewport.offsetTop + viewport.height / 2),
        behavior: motion.reduced ? 'auto' : 'smooth',
      });
    };
    viewport.addEventListener('resize', reveal, { once: true });
    // If no keyboard opens (a hardware one, or a computer), stop waiting
    setTimeout(() => viewport.removeEventListener('resize', reveal), 1000);
  }

  function focusRange(index: number, edge: 'from' | 'to') {
    tick().then(() =>
      listElement
        ?.querySelector<HTMLElement>(
          `[data-color-id="${sortableColors[index]?.id}"] .range-${edge}`,
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

  // The gauge's range options aren't reactive state, but they only change
  // along with its ranges (a save here, the Ranges menu, undo), so they're
  // read again whenever the ranges change
  let rules = $derived.by(() => {
    void gauge.ranges;
    const options = gauge.rangeOptions;
    return options ? { ...options } : null;
  });

  // How the ranges were made, said above the list
  let generatedAs = $derived.by(() => {
    if (!rules || isCategory) return '';
    if (rules.isCustomRanges) return 'Custom ranges';
    if (rules.mode === 'manual')
      return `Manual steps: every ${rules.manual.increment} ${unitLabel} from ${rules.manual.start} ${unitLabel}`;
    if (rules.auto.optimization === 'ranges')
      return gauge.autoRangeOptions
        ? `Even steps of ${describeIncrement(rules, gauge.autoRangeOptions)} ${unitLabel}`
        : 'Even steps';
    const target = gauge.targets?.find(
      (t: { id: string }) => t.id === rules?.auto.optimization,
    );
    return `Even days by ${target?.label.toLowerCase() ?? 'temperature'}`;
  });

  // With both ends included or neither, rounded or manual steps can't make
  // ranges that meet exactly
  let endsDontMeet = $derived(
    !!rules &&
      !rules.isCustomRanges &&
      rules.includeFromValue === rules.includeToValue &&
      (rules.mode !== 'auto' || rules.auto.roundIncrement),
  );

  // In the list, every row's From and To are as wide as the widest of them,
  // so the ranges line up and their buttons are no wider than the numbers.
  // Digits are about 1ch each (tabular), and the small unit's letters less.
  // From the saved numbers, so typing a long one doesn't widen every row.
  let rangeChars = $derived.by(() => {
    if (isCategory) return { from: 0, to: 0 };
    const ranges = (gauge.ranges ?? []) as GaugeRange[];
    const widest = (edge: 'from' | 'to') =>
      Math.max(0, ...ranges.map((r) => String(r[edge]).length));
    return {
      from: widest('from') + unitLabel.length,
      to: widest('to') + unitLabel.length,
    };
  });

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

  /** The most colors a palette can have, as in the number of colors menu */
  const MAX_COLORS = 99;

  /** Opens the color picker for a new color next to this one, starting on its
   * yarn; the new color goes in only when it's saved */
  function insertColor(index: number, where: 'before' | 'after') {
    const at = where === 'before' ? index : index + 1;
    dialog.trigger({
      type: 'component',
      component: {
        ref: ChangeColor,
        props: {
          index: at,
          ...gauge.colors[index],
          onChangeColor: ({ index: at, ...color }: { index: number } & Color) =>
            addColor(at, index, color),
        },
      },
      options: { title: `New Color ${at + 1}`, size: 'large' },
    });
  }

  function addColor(at: number, splitIndex: number, color: Color) {
    const colors = [...gauge.colors];
    colors.splice(at, 0, color);
    // Custom ranges stay: the color's neighbor shares its range with it. With
    // as many ranges as colors, updateColors keeps them.
    const ranges =
      gauge.rangeOptions?.isCustomRanges &&
      insertRange(gauge.ranges, splitIndex);
    if (ranges) gauge.ranges = ranges;
    gauge.updateColors({ colors });
    sortableColors = getSortableColors();
    gauge.schemeId = 'Custom';
    // The focus goes to the new color's yarn, not back to the ⋮ button
    dialog.finalFocus = () =>
      listElement
        ?.querySelectorAll<HTMLElement>(':scope > .color')
        [at]?.querySelector<HTMLElement>('.yarn-button') ?? null;
    dialog.close();
    pop.trigger(at);
    announcement = `Added color ${at + 1}`;
    // Scrolled to and glowing, like a color picked in the strip, once the
    // dialog has let go of the focus
    setTimeout(() => focusGaugeColor(gauge.id, at));
  }

  function removeColor(index: number) {
    // Custom ranges stay: a neighbor takes over this color's range
    if (gauge.rangeOptions?.isCustomRanges)
      gauge.ranges = removeRange(gauge.ranges, index);
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
    // The card under the pointer is a copy made when the drag started; give
    // it the number, range and days of the slot it would drop into, which
    // the hidden placeholder there already shows
    if (source !== SOURCES.KEYBOARD && dragging)
      tick().then(() => {
        const at = sortableColors.findIndex(
          (color) => SHADOW_ITEM_MARKER_PROPERTY_NAME in color,
        );
        const shadow = at < 0 ? null : listElement?.children[at];
        const lifted = document.getElementById(DRAGGED_ELEMENT_ID);
        if (shadow && lifted) lifted.innerHTML = shadow.innerHTML;
      });
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

<!-- The color's number, on its drag handle: its place in the palette, which
dragging changes. Fill with color grows from here, and when filled (with no
swatch) it pops when the color changes and glows on undo or redo. -->
{#snippet handle(index: number, onColor = false)}
  <!-- Not a <button>: svelte-dnd-action ignores Space and Enter from buttons,
  so keyboard dragging only starts from an element like this -->
  <div
    role="button"
    tabindex="0"
    title="Move Color"
    aria-label="Drag handle to reorder color {index + 1}"
    class={[
      'handle flex h-8 w-12 shrink-0 cursor-grab items-center justify-center gap-0.5 rounded-full text-sm font-semibold tabular-nums focus-visible:outline-2 focus-visible:outline-current',
      onColor ? 'hover-on-color' : 'hover:preset-tonal-surface',
      onColor && pop.index === index && 'feedback-pop',
      onColor &&
        historyChange.gaugeId === gauge.id &&
        historyChange.indices.includes(index) &&
        'history-flash',
    ]}
    style:--pop-scale="1.12"
    data-sheet-no-drag
    data-fill-origin
    use:dragHandle
  >
    <GripVerticalIcon size={16} aria-hidden="true" />
    <span aria-hidden="true">{index + 1}</span>
  </div>
{/snippet}

<!-- The color itself; its number is on the drag handle -->
{#snippet colorSwatch(index: number, color: Color)}
  <ColorSwatch
    hex={color.hex}
    origin={false}
    {filled}
    pop={pop.index === index}
    flash={historyChange.gaugeId === gauge.id &&
      historyChange.indices.includes(index)}
  />
{/snippet}

<!-- The yarn: its name and "Brand · Yarn", or its hex code; opens Change Color -->
{#snippet yarn(index: number, color: Color, swatch: boolean)}
  <button
    type="button"
    class="yarn-button btn rounded-tile {hoverTint} h-auto w-fit max-w-full min-w-0 justify-start gap-3 px-2 py-1 text-left"
    title="Choose a Color"
    onclick={() => openChangeColor(index, gauge.colors[index])}
  >
    {#if swatch}
      {@render colorSwatch(index, color)}
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
        class="{mutedText(filled)} text-xs {swatch
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
<!-- A temperature's unit lines up with the top of the number, as in 72°F (its caps are about a quarter of its size shorter); others sit on its baseline -->
{#snippet unit()}
  {#if unitLabel}<span
      class={[
        'text-xs font-normal',
        // Dimmed only on the surface: on a color it could lose its contrast
        !filled && 'opacity-70',
        gauge.unit?.type === 'temperature' && 'align-[0.25em] leading-none',
      ]}>{unitLabel}</span
    >{/if}
{/snippet}

{#snippet rangeValue(
  index: number,
  r: GaugeRange,
  edge: 'from' | 'to',
  column: boolean,
)}
  <span
    class="flex {edge === 'from' ? 'justify-end' : ''}"
    style:width={column ? `calc(${rangeChars[edge]}ch + 1rem)` : undefined}
  >
    <button
      type="button"
      class="range-{edge} btn rounded-tile {hoverTint} h-9 min-w-9 gap-0 px-2 font-semibold whitespace-nowrap tabular-nums {movedValue(
        index,
        edge,
      )
        ? changedText
        : ''}"
      title="Edit {edge === 'from' ? 'From' : 'To'}"
      aria-label="Color {index + 1} {edge} {r[edge]} {unitLabel}{movedValue(
        index,
        edge,
      )
        ? ', not saved'
        : ''}. Edit"
      onclick={() => {
        // Drops one being edited first: only Save keeps it
        cancelRange({ refocus: false });
        editRange(index, edge);
      }}
    >
      <!-- One inline run, so the unit can sit up by the number -->
      <span>{r[edge]}{@render unit()}</span>
    </button>
  </span>
{/snippet}

<!-- The number being edited, in its own field like the search fields: the
number (its unit is only in its label, to leave the number room) and ✕ to
cancel, then Save -->
{#snippet rangeInput(index: number, edge: 'from' | 'to')}
  {#if editing}
    <span class="flex flex-wrap items-center gap-1.5">
      <!-- On the surface, even in a card filled with its color -->
      <span
        class="input-group bg-surface-50-950 text-surface-950-50 w-fit grid-cols-[minmax(0,1fr)_auto]"
      >
        <!-- type="number" keeps the minus key on phones; 16px text keeps iOS
      from zooming in. Room for the up and down buttons a computer shows. -->
        <input
          type="number"
          step="any"
          class="ig-input w-[calc(7ch+1.25rem)] px-2 text-base tabular-nums @max-[13rem]:w-[calc(6ch+1.25rem)] @max-[13rem]:px-1.5"
          aria-label="Color {index + 1} {edge}{unitLabel
            ? `, ${unitLabel}`
            : ''}"
          bind:value={editing[edge]}
          {@attach (el) => {
            el.focus();
            el.select();
            keepAboveKeyboard(el);
          }}
        />
        <!-- Pressing it, or Save, keeps the focus in the number, so the keyboard stays up -->
        <button
          type="button"
          class="ig-btn"
          title="Cancel"
          aria-label="Cancel editing range for color {index + 1}"
          onmousedown={(e) => e.preventDefault()}
          onclick={() => cancelRange({ refocus: true })}
        >
          <XIcon size={18} aria-hidden="true" />
        </button>
      </span>
      <!-- Filled, like Save elsewhere: right after the number, or under it in a narrow card -->
      <button
        type="button"
        class="btn preset-filled-primary-500 h-9 px-3 @max-[13rem]:w-full"
        title="Save Range"
        aria-label="Save range for color {index + 1}"
        onmousedown={(e) => e.preventDefault()}
        onclick={() => saveRange({ refocus: true })}
      >
        <CheckIcon size={18} aria-hidden="true" />
        Save
      </button>
    </span>
  {/if}
{/snippet}

{#snippet range(index: number, column: boolean)}
  {@const r = isCategory ? gauge.ranges?.[index] : draft.ranges[index]}
  {#if r}
    {#if isCategory}
      <span class="truncate px-2 text-sm">{r.label}</span>
    {:else}
      {@const isEditing = editing?.index === index}
      <!-- From and To are each a button, just around the number. In the
      list, each sits in a slot as wide as the widest, so they line up.
      Tapping one turns just it into a field, with Save right after it.
      Only Save (or Enter, from the keyboard) keeps it; ✕, Escape, or
      tapping or tabbing anywhere else (the other number too) puts it back;
      scrolling doesn't. -->
      <!-- svelte-ignore a11y_no_static_element_interactions -->
      <span
        class="flex flex-wrap items-center gap-x-0.5 gap-y-2 rounded-[inherit]"
        class:history-flash={historyChange.gaugeId === gauge.id &&
          historyChange.indices.includes(index)}
        onfocusout={(e) => {
          if (!isEditing) return;
          // Tabbing away puts it back. Focus going nowhere is left to the
          // press that caused it: that's also what pressing Save does in
          // some browsers, before its click.
          const to = e.relatedTarget as Node | null;
          if (to && !e.currentTarget.contains(to))
            cancelRange({ refocus: false });
        }}
        onkeydown={(e) => {
          if (!isEditing) return;
          // From the number; on the buttons, Enter presses them
          if (e.key === 'Enter' && e.target instanceof HTMLInputElement) {
            e.preventDefault();
            saveRange({ refocus: true });
          } else if (e.key === 'Escape') {
            // Only the edit, not a dialog around it
            e.preventDefault();
            e.stopPropagation();
            cancelRange({ refocus: true });
          }
        }}
        {@attach isEditing
          ? cancelOnOutsidePress(() => cancelRange({ refocus: false }))
          : null}
      >
        {#if isEditing && editing?.edge === 'from'}
          {@render rangeInput(index, 'from')}
        {:else}
          {@render rangeValue(index, r, 'from', column)}
        {/if}
        <ArrowRightIcon
          size={14}
          class="mx-0.5 shrink-0 opacity-60"
          aria-hidden="true"
        />
        {#if isEditing && editing?.edge === 'to'}
          {@render rangeInput(index, 'to')}
        {:else}
          {@render rangeValue(index, r, 'to', column)}
        {/if}
      </span>
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
      class="rounded-tile {hoverTint} flex flex-col px-1.5 py-1 text-left tabular-nums disabled:opacity-50 {fill
        ? 'min-w-0 @max-[15rem]:flex-row @max-[15rem]:items-baseline @max-[15rem]:gap-2'
        : // Room for the longest count, e.g. "365 days", so a short one doesn't shift the range beside it
          'min-w-[calc(8ch+0.75rem)]'}"
      disabled={!list.length}
      title="{target.gaugeLabel}: {count}, {percent}"
      aria-label="{target.gaugeLabel}: {count}, {percent}{unsaved.includes(
        index,
      )
        ? ', not saved'
        : ''}"
      onclick={() =>
        dialog.trigger({
          type: 'component',
          component: { ref: WeatherTable, props: { weatherData: list } },
        })}
    >
      <span
        class="{mutedText(filled)} text-xs whitespace-nowrap {fill
          ? '@max-[15rem]:flex-1'
          : ''}"
      >
        {target.icon}
        {target.gaugeLabel}
      </span>
      <span
        class="text-sm leading-tight font-semibold whitespace-nowrap {unsaved.includes(
          index,
        )
          ? changedText
          : ''}">{count}</span
      >
      <span class="{mutedText(filled)} text-xs whitespace-nowrap"
        >{percent}</span
      >
    </button>
  {/each}
{/snippet}

{#snippet more(index: number, color: Color)}
  <ColorwayMoreMenu
    colorway={color}
    on={filled ? 'color' : 'surface'}
    oninsert={!isStaticGauge && !isCategory && gauge.colors.length < MAX_COLORS
      ? (where: 'before' | 'after') => insertColor(index, where)
      : undefined}
    insertAxis={preferences.value.layout === 'grid' ? 'row' : 'column'}
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
      <RangesMenu />
    </div>
  {/if}
  <!-- The project page also has Days in ranges -->
  {#if isProjectPlannerPage}
    <ViewMenu bind:value={preferences.value.layout} fillOption>
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
        <MenuCheckbox checked={showDaysInRange.value} />
      </Menu.OptionItem>
    </ViewMenu>
  {:else}
    <ViewMenu bind:value={preferences.value.layout} fillOption />
  {/if}
</div>

{#if showRanges && !isCategory && rules}
  {#if showManual}
    <!-- Manual steps: the list below follows what's typed until Save. Like
    a range: Enter saves; ✕, Escape, or tapping or tabbing anywhere else
    puts it back; scrolling doesn't. -->
    <form
      class="mt-3 flex flex-wrap items-end justify-center gap-2 px-2"
      aria-label="Manual steps"
      onsubmit={(e) => {
        e.preventDefault();
        closeManual({ save: true });
      }}
      onfocusout={(e) => {
        const to = e.relatedTarget as Node | null;
        if (to && !e.currentTarget.contains(to)) closeManual({ save: false });
      }}
      {@attach cancelOnOutsidePress(() => closeManual({ save: false }))}
    >
      <label class="label w-fit">
        <span class="label-text text-xs">Every ({unitLabel})</span>
        <!-- 16px text keeps iOS from zooming in -->
        <input
          type="number"
          step="any"
          min="0"
          class="input w-[calc(7ch+1.25rem)] px-2 text-base tabular-nums"
          bind:value={manualDraft.increment}
          onkeydown={cancelManualOnEscape}
          {@attach (el) => {
            // After the Ranges menu closes and focuses its button
            const timer = setTimeout(() => {
              el.focus();
              el.select();
              keepAboveKeyboard(el);
            });
            return () => clearTimeout(timer);
          }}
        />
      </label>
      <label class="label w-fit">
        <span class="label-text text-xs">From ({unitLabel})</span>
        <input
          type="number"
          step="any"
          class="input w-[calc(7ch+1.25rem)] px-2 text-base tabular-nums"
          aria-describedby="manual-start-hint"
          bind:value={manualDraft.start}
          onkeydown={cancelManualOnEscape}
        />
      </label>
      <!-- Pressing either keeps the focus in a number, so the keyboard stays up -->
      <button
        type="button"
        class="btn preset-tonal h-9 px-3"
        onmousedown={(e) => e.preventDefault()}
        onclick={() => closeManual({ save: false })}
      >
        <XIcon size={18} aria-hidden="true" />
        Cancel
      </button>
      <button
        type="submit"
        class="btn preset-filled-primary-500 h-9 px-3"
        disabled={!manualValid}
        onmousedown={(e) => e.preventDefault()}
      >
        <CheckIcon size={18} aria-hidden="true" />
        Save
      </button>
      <p
        id="manual-start-hint"
        class="text-surface-700-300 w-full text-center text-xs"
      >
        {manualValid
          ? `From is usually the ${rules.direction === 'high-to-low' ? 'highest' : 'lowest'} value in your weather.`
          : 'Every needs a number above 0, and From a number.'}
      </p>
    </form>
  {/if}
  <!-- How the ranges were made, and how to change one -->
  <p class="text-surface-700-300 mt-3 px-2 text-center text-xs">
    {generatedAs}. From is {rules.includeFromValue ? 'included' : 'excluded'},
    To is {rules.includeToValue ? 'included' : 'excluded'}. Tap a range to
    change it{rules.linked
      ? '; the next or previous one follows'
      : ''}.{showDays
      ? ` Tap a count to see those ${periods}.`
      : ''}{endsDontMeet
      ? ' With both ends included or neither, these steps leave gaps or overlaps: try Round numbers off or another choice in the Ranges menu.'
      : ''}
  </p>
{/if}
<p class="sr-only" aria-live="polite">{announcement}</p>

<div
  class="mt-3 mb-2 lg:mb-4 {preferences.value.layout === 'grid'
    ? paletteGridClass
    : paletteListClass}"
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
      class="color relative isolate overflow-hidden {preferences.value
        .layout === 'grid'
        ? paletteCardClass
        : paletteRowClass}"
      style:color={filled ? iconColorOn(color.hex ?? '#fff') : undefined}
      data-fillable
      data-filled={filled || undefined}
      use:fillFromSwatch={filled}
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
      <span class="fill-layer" style:background={color.hex} aria-hidden="true"
      ></span>
      {#if preferences.value.layout === 'grid'}
        <!-- The handle, the color (as in the list), and ⋮ on one line at the top, so the yarn and range below get the card's full width -->
        <div class="flex items-center gap-1 px-2 pt-2">
          {@render handle(index, filled)}
          <!-- Opens Change Color, as the swatch does in a row. For a pointer
          only: the yarn button below does the same from the keyboard.
          Filled, the card is the color, so there's no swatch. -->
          {#if !filled}
            <button
              type="button"
              class="rounded-full {hoverTint} p-0.5"
              tabindex="-1"
              aria-hidden="true"
              title="Choose a Color"
              onclick={() => openChangeColor(index, gauge.colors[index])}
            >
              {@render colorSwatch(index, color)}
            </button>
          {/if}
          <span class="ml-auto">{@render more(index, color)}</span>
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
            ? 'grid-cols-[3rem_minmax(0,1fr)_auto] @2xl:grid-cols-[3rem_minmax(0,1fr)_auto_auto_auto]'
            : showRanges
              ? 'grid-cols-[3rem_minmax(0,1fr)_auto] @lg:grid-cols-[3rem_minmax(0,1fr)_auto_auto]'
              : 'grid-cols-[3rem_minmax(0,1fr)_auto]'}"
        >
          <span class="col-start-1 row-start-1 flex justify-center">
            {@render handle(index, filled)}
          </span>
          <span class="col-start-2 row-start-1 flex min-w-0">
            {@render yarn(index, color, !filled)}
          </span>
          {#if showRanges}
            <!-- Under the yarn's name on a phone; its own columns where there's room -->
            <span
              class="col-span-3 col-start-1 row-start-2 flex flex-wrap items-center gap-1 pl-1 {filled
                ? '@sm:pl-[3.5rem]'
                : '@sm:pl-[7.25rem]'} {showDays
                ? '@2xl:contents'
                : '@lg:contents'}"
            >
              <span
                class="flex max-w-full min-w-0 {showDays
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
            {@render more(index, color)}
          </span>
        </div>
      {/if}
    </div>
  {/each}
</div>

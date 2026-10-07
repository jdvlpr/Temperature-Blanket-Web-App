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
  import SegmentsScroller from '$lib/components/SegmentsScroller.svelte';
  import ChooseRangeDirection from '$lib/components/ChooseRangeDirection.svelte';
  import Expand from '$lib/components/Expand.svelte';
  import ToggleSwitch from '$lib/components/buttons/ToggleSwitch.svelte';
  import SaveAndCloseButtons from '$lib/components/modals/SaveAndCloseButtons.svelte';
  import StickyPart from '$lib/components/modals/StickyPart.svelte';
  import { safeSlide } from '$lib/features/transitions/safeSlide';
  import { dialog } from '$lib/state/page-state.svelte';
  import { gauges, getRanges } from '$lib/state/gauges-state.svelte';
  import { weather } from '$lib/state/weather-state.svelte';
  import { preferences } from '$lib/storage/preferences.svelte';
  import { displayNumber } from '$lib/utils/number-utils';
  import {
    getDaysInRange,
    getIncrement,
    getRangeExample,
    getStart,
  } from '$lib/utils/range-utils.svelte';
  import { iconColorOn } from '$lib/components/yarn-colorways/colorway-utils';
  import { pluralize } from '$lib/utils/string-utils';
  import { targetArrow } from '@lucide/lab';
  import {
    ArrowRightIcon,
    CalculatorIcon,
    ChevronUpIcon,
    CogIcon,
    Icon,
    ListStartIcon,
    MoveVerticalIcon,
    TriangleAlertIcon,
    WandIcon,
    WandSparklesIcon,
    WrenchIcon,
  } from '@lucide/svelte';
  import { SegmentedControl } from '@skeletonlabs/skeleton-svelte';
  import { onMount, tick } from 'svelte';
  import { fade } from 'svelte/transition';
  import type {
    GaugeAttributes,
    GaugeRange,
    GaugeRangeOptions,
    GaugeStateInterface,
  } from '$lib/types/gauge-types';
  import type { Color } from '$lib/types/yarn-types';

  // GaugeSettings is only ever opened for range-type gauges (see
  // GaugeCustomizer.svelte, which hides RangeOptionsButton for
  // `isStatic` gauges - only the moon gauge is static), so these
  // range-related fields are always populated here.
  type RangeGaugeSnapshot = Omit<GaugeStateInterface, 'id'> & {
    id: 'temp' | 'prcp' | 'snow' | 'dayt';
    rangeOptions: GaugeRangeOptions;
    autoRangeOptions: GaugeRangeOptions;
    ranges: GaugeRange[];
    colors: Color[];
  };

  interface Props {
    onSave: (data: {
      ranges: GaugeRange[];
      rangeOptions: GaugeRangeOptions;
    }) => void;
  }

  let { onSave }: Props = $props();

  let _gauge = $state(
    gauges.getSnapshot(
      gauges.activeGaugeId as GaugeAttributes['id'],
    ) as RangeGaugeSnapshot,
  );

  let unitLabel = $derived(
    _gauge.unit.label[preferences.value.units ?? 'metric'],
  );

  // A temperature's unit sits up by the top of the number, as in 72°F
  let unitClass = $derived([
    'text-xs font-normal opacity-70',
    _gauge.unit.type === 'temperature' && 'align-[0.25em] leading-none',
  ]);

  // The preview's From and To are as wide as the widest, so they line up
  let rangeChars = $derived.by(() => {
    const widest = (edge: 'from' | 'to') =>
      Math.max(0, ..._gauge.ranges.map((r) => String(r[edge]).length)) +
      (unitLabel?.length ?? 0);
    return { from: widest('from'), to: widest('to') };
  });

  let incrementMode = $state<GaugeRangeOptions['mode'] | null>(
    _gauge.rangeOptions?.isCustomRanges ? null : _gauge.rangeOptions.mode,
  );

  let customRanges = $state(_gauge.ranges);

  let showAdvancedControls = $state(true);

  let changedGaugeDirectionOnCustomRanges = $state(false);

  let initialValueSelectRangeCalculationMethod = `${_gauge.rangeOptions.includeFromValue.toString()}-${_gauge.rangeOptions.includeToValue.toString()}`;

  let start = $derived.by(() => {
    _gauge.rangeOptions.mode;
    _gauge.rangeOptions?.direction;
    _gauge.rangeOptions?.manual.start;
    return getStart(_gauge.rangeOptions);
  });

  let increment = $derived.by(() => {
    _gauge.rangeOptions.mode;
    _gauge.rangeOptions?.direction;
    _gauge.rangeOptions?.isCustomRanges;
    _gauge.rangeOptions.manual.increment;

    return getIncrement(_gauge.rangeOptions, _gauge.autoRangeOptions);
  });

  let dontIncludeFromAndTo = $derived(
    !_gauge.rangeOptions.includeFromValue &&
      !_gauge.rangeOptions.includeToValue,
  );

  let includeFromAndTo = $derived(
    _gauge.rangeOptions.includeFromValue && _gauge.rangeOptions.includeToValue,
  );

  let calculatedIncrement = $derived(
    dontIncludeFromAndTo
      ? (increment ?? 0) - 0.01
      : includeFromAndTo
        ? (increment ?? 0) + 0.01
        : (increment ?? 0),
  );

  let displayedIncrement = $derived(Math.abs(calculatedIncrement));

  let rangeExample = $derived(
    getRangeExample({
      direction: _gauge.rangeOptions.direction,
      includeFromValue: _gauge.rangeOptions.includeFromValue,
      includeToValue: _gauge.rangeOptions.includeToValue,
    }),
  );

  let isNotAutoIncrements = $derived(
    _gauge.rangeOptions.mode !== 'auto' || _gauge.rangeOptions.isCustomRanges,
  );

  let isRangeCalculationUnavailable = $derived(
    (_gauge.rangeOptions.includeFromValue ===
      _gauge.rangeOptions.includeToValue &&
      _gauge.rangeOptions.auto.roundIncrement &&
      _gauge.rangeOptions.mode === 'auto') ||
      (_gauge.rangeOptions.includeFromValue ===
        _gauge.rangeOptions.includeToValue &&
        _gauge.rangeOptions.mode !== 'auto'),
  );

  let setupContainer: HTMLElement | undefined;

  let showScrollToTopButton = $state(false);

  let scrollObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach((entry) => {
      showScrollToTopButton =
        !entry.isIntersecting && entry.boundingClientRect.top < 0;
    });
  });

  function onChangeIncrementMode() {
    if (incrementMode === 'auto') {
      _gauge.rangeOptions.mode = 'auto';
      _gauge.rangeOptions.isCustomRanges = false;
    } else if (incrementMode === 'manual') {
      _gauge.rangeOptions.mode = 'manual';
      _gauge.rangeOptions.isCustomRanges = false;
    }
    autoUpdateRanges();
  }

  function _onSave() {
    onSave({
      ranges: _gauge.ranges,
      rangeOptions: _gauge.rangeOptions,
    });
    dialog.close();
  }

  function autoUpdateRanges() {
    const { ranges, mustUpdateCustomRanges } = getRanges({
      rangeOptions: _gauge.rangeOptions,
      ranges: customRanges,
      start,
      increment,
      colors: _gauge.colors,
      includeFromAndTo,
      dontIncludeFromAndTo,
      gaugeId: _gauge.id,
    });
    _gauge.ranges = ranges;
    if (mustUpdateCustomRanges) customRanges = ranges;
  }

  $effect(() => {
    incrementMode;
    tick().then(() => {
      onChangeIncrementMode();
    });
  });

  onMount(() => {
    if (setupContainer) scrollObserver.observe(setupContainer);
  });
</script>

<div class="p-4">
  <div class="flex w-full items-start justify-center gap-2 max-lg:flex-col">
    <div
      class="flex max-w-full flex-col items-start justify-start lg:max-w-[400px]"
      bind:this={setupContainer}
    >
      <h3 class="mb-2 text-base font-bold">Setup Ranges</h3>

      <div class="rounded-container flex w-full flex-col gap-2">
        <div class="flex max-w-full flex-col items-start justify-start">
          <ChooseRangeDirection
            direction={_gauge.rangeOptions.direction}
            onchange={(e: { value: GaugeRangeOptions['direction'] }) => {
              _gauge.rangeOptions.direction = e.value;

              changedGaugeDirectionOnCustomRanges =
                _gauge.rangeOptions.isCustomRanges;
              if (changedGaugeDirectionOnCustomRanges) {
                _gauge.ranges = customRanges
                  .map((n) => {
                    return {
                      from: n.to,
                      to: n.from,
                    };
                  })
                  .reverse();
                customRanges = _gauge.ranges;
              } else {
                autoUpdateRanges();
              }
            }}
          />
        </div>

        <div
          class="card preset-filled-surface-200-800 flex flex-col items-start justify-start gap-2 p-4"
        >
          <div class="flex max-w-full flex-col items-start justify-start">
            <SegmentsScroller collapse>
              {#snippet children(iconsOnly)}
                <SegmentedControl
                  value={incrementMode}
                  onValueChange={(e) => {
                    incrementMode = e.value as GaugeRangeOptions['mode'] | null;
                  }}
                >
                  <SegmentedControl.Label class="text-xs"
                    >Generate Ranges{#if iconsOnly}<span aria-hidden="true"
                        >: {incrementMode === 'manual'
                          ? 'Manual'
                          : 'Automatic'}</span
                      >{/if}</SegmentedControl.Label
                  >
                  <SegmentedControl.Control
                    class="bg-surface-100 dark:bg-surface-900 min-w-max"
                  >
                    <SegmentedControl.Indicator />
                    <SegmentedControl.Item value="auto">
                      <SegmentedControl.ItemText
                        class="flex items-center gap-1"
                        title="Automatically Set the Gauge Values"
                        ><WandIcon />
                        <span class={{ 'sr-only': iconsOnly }}>Automatic</span>
                      </SegmentedControl.ItemText>
                      <SegmentedControl.ItemHiddenInput />
                    </SegmentedControl.Item>
                    <SegmentedControl.Item value="manual">
                      <SegmentedControl.ItemText
                        class="flex items-center gap-1"
                        title="Manually Set the Gauge Values"
                        ><WrenchIcon />
                        <span class={{ 'sr-only': iconsOnly }}>Manual</span
                        ></SegmentedControl.ItemText
                      >
                      <SegmentedControl.ItemHiddenInput />
                    </SegmentedControl.Item>
                  </SegmentedControl.Control>
                </SegmentedControl>
              {/snippet}
            </SegmentsScroller>

            {#if !incrementMode}
              <p class="card bg-warning-300-700/80 mt-2 p-4 text-left">
                <TriangleAlertIcon class="inline" />

                Choosing Automatic or Manual will override the current ranges
                with generated values.
              </p>
            {/if}
          </div>

          {#if _gauge.rangeOptions.isCustomRanges === false}
            <div class="flex flex-col items-start justify-start gap-2">
              {#if _gauge.rangeOptions.mode === 'auto'}
                <div class="flex flex-col items-start justify-start gap-2">
                  {#if _gauge.id === 'temp'}
                    <label class="label">
                      <span class="label-text"> Balance Focus </span>
                      <div class="relative flex items-center">
                        <Icon
                          iconNode={targetArrow}
                          class="pointer-events-none absolute left-2"
                        />
                        <select
                          bind:value={_gauge.rangeOptions.auto.optimization}
                          onchange={() => {
                            autoUpdateRanges();
                          }}
                          class="select bg-surface-100 dark:bg-surface-900 pl-10"
                        >
                          <option value="ranges">Range Increments</option>
                          {#each _gauge.targets as { id, label, icon }}
                            <option value={id}>
                              {icon}
                              {label}
                              Days</option
                            >
                          {/each}
                        </select>
                      </div>
                    </label>
                    <div
                      class="card preset-tonal-success border-success-500 border p-4 text-left"
                    >
                      <p>
                        <WandSparklesIcon class="inline" />

                        {#if _gauge.rangeOptions.auto.optimization === 'ranges'}
                          Range increments are as even as possible.
                        {:else}
                          Ranges contain a similar number of days, based on the
                          <span class="font-bold">
                            {#if _gauge.rangeOptions.auto.optimization === 'tmax'}
                              high
                            {:else if _gauge.rangeOptions.auto.optimization === 'tavg'}
                              average
                            {:else if _gauge.rangeOptions.auto.optimization === 'tmin'}
                              low
                            {/if}
                          </span>
                          temperature of each {weather.grouping}.
                        {/if}
                        {#if _gauge.rangeOptions.auto.optimization === 'ranges'}
                          Increment:
                          {#if _gauge.rangeOptions.auto.roundIncrement && Math.floor(displayedIncrement) !== Math.ceil(displayedIncrement)}
                            <span class="font-bold">
                              {Math.floor(displayedIncrement)}</span
                            >
                            or
                            <span class="font-bold"
                              >{Math.ceil(displayedIncrement)}</span
                            >
                            {unitLabel}
                          {:else}
                            <span class="font-bold">
                              {_gauge.rangeOptions.auto.roundIncrement
                                ? Math.round(displayedIncrement)
                                : displayNumber(displayedIncrement)}
                            </span>
                            {unitLabel}
                          {/if}

                          <span class="block text-sm">
                            This was calculated based on your weather data and
                            the number of colors in this gauge.
                          </span>
                        {/if}
                      </p>
                    </div>
                  {/if}

                  {#if Math.floor(_gauge.rangeOptions.auto.increment) !== Math.ceil(_gauge.rangeOptions.auto.increment) && _gauge.rangeOptions.mode === 'auto'}
                    <div class="mt-2">
                      <ToggleSwitch
                        bind:checked={_gauge.rangeOptions.auto.roundIncrement}
                        label="Round Numbers"
                        onchange={() => {
                          autoUpdateRanges();
                        }}
                      />
                    </div>
                  {/if}
                </div>
              {/if}

              {#if _gauge.rangeOptions.mode === 'manual'}
                <div class="flex flex-col justify-start gap-2">
                  <label for="manual-increment" class="label">
                    <span class="label-text">Increment ({unitLabel})</span>
                    <div
                      class="input-group bg-surface-100 dark:bg-surface-900 w-fit grid-cols-[auto_1fr]"
                    >
                      <span class="ig-cell"><MoveVerticalIcon /></span>
                      <input
                        id="manual-increment"
                        type="number"
                        class="ig-input"
                        onchange={() => {
                          autoUpdateRanges();
                        }}
                        onfocus={() => {
                          // _gauge.rangeOptions.mode = 'manual';
                          // _gauge.rangeOptions.isCustomRanges = false;
                        }}
                        bind:value={_gauge.rangeOptions.manual.increment}
                      />
                    </div>
                  </label>

                  <label for="startFrom" class="label">
                    <span class="label-text">Start From ({unitLabel})</span>

                    <div
                      class="input-group bg-surface-100 dark:bg-surface-900 w-fit grid-cols-[auto_1fr]"
                    >
                      <span class="ig-cell"><ListStartIcon /></span>
                      <input
                        id="startFrom"
                        type="number"
                        class="ig-input"
                        onfocus={() => {
                          _gauge.rangeOptions.mode = 'manual';
                          autoUpdateRanges();
                        }}
                        onchange={() => {
                          autoUpdateRanges();
                        }}
                        onkeyup={() => {
                          autoUpdateRanges();
                        }}
                        bind:value={_gauge.rangeOptions.manual.start}
                      />
                    </div>
                    <p class="text-surface-700-300 text-sm">
                      This should usually be the
                      {_gauge.rangeOptions.direction === 'high-to-low'
                        ? 'highest'
                        : 'lowest'}
                      possible value from your weather data.
                    </p>
                  </label>
                </div>
              {/if}
            </div>
          {/if}
        </div>

        <div class="mx-auto">
          <Expand
            bind:isExpanded={showAdvancedControls}
            label="Advanced Controls"
          />
        </div>
        {#if showAdvancedControls}
          <div
            transition:safeSlide
            class="rounded-container bg-surface-200 dark:bg-surface-800 flex w-full flex-col items-start justify-start gap-4 p-4 text-left"
          >
            <ToggleSwitch
              bind:checked={_gauge.rangeOptions.linked}
              label="Linked Ranges"
              details="When editing an individual range's From or To value, update the next or previous range's corresponding value."
            />
            <div
              class="bg-surface-100 dark:bg-surface-900 rounded-container p-2"
            >
              <label class="label">
                <span class="label-text">
                  Range Calculation Method:<span>{@html rangeExample}</span>
                </span>

                <div class="relative flex items-center">
                  <CalculatorIcon class="pointer-events-none absolute left-2" />
                  <select
                    class="select max-w-[500px] truncate pl-10"
                    value={initialValueSelectRangeCalculationMethod}
                    onchange={(e) => {
                      switch ((e.target as HTMLSelectElement).value) {
                        case 'true-false':
                          _gauge.rangeOptions.includeFromValue = true;
                          _gauge.rangeOptions.includeToValue = false;
                          break;
                        case 'false-true':
                          _gauge.rangeOptions.includeFromValue = false;
                          _gauge.rangeOptions.includeToValue = true;
                          break;
                        case 'true-true':
                          _gauge.rangeOptions.includeFromValue = true;
                          _gauge.rangeOptions.includeToValue = true;
                          break;
                        case 'false-false':
                          _gauge.rangeOptions.includeFromValue = false;
                          _gauge.rangeOptions.includeToValue = false;
                          break;

                        default:
                          break;
                      }
                      autoUpdateRanges();
                    }}
                    title="Change Range Calculation Method"
                    id="select-range-calculation-method"
                  >
                    <option value="true-false"
                      >Include From, don't include To (default)</option
                    >
                    <option value="false-true"
                      >Include To, don't include From
                    </option>
                    <option value="true-true">Include both From and To</option>
                    <option value="false-false"
                      >Don't include From and To</option
                    >
                  </select>
                </div>
                <p class="text-surface-700-300 text-sm">
                  If you change this setting,
                  <a
                    href="/documentation/#range-calculation-methods"
                    target="_blank"
                    class="link"
                    rel="noopener noreferrer"
                    >make sure your ranges are set up correctly.</a
                  >
                </p>
              </label>
            </div>
          </div>
        {/if}
        {#if isRangeCalculationUnavailable}
          <p class="card bg-warning-50 dark:bg-warning-950 px-4 py-4 text-left">
            <TriangleAlertIcon class="inline" />
            The Ranges Preview below doesn't yet auto-calculate optimal From and To
            values using these options and this range calculation method ({@html rangeExample}).
            To show the optimal From and To values, {#if isNotAutoIncrements}
              set Automatic Ranges above, then
            {/if} uncheck Round Numbers {#if !isNotAutoIncrements}
              above{/if}, or change the Range Calculation Method.
          </p>
        {/if}
      </div>
    </div>

    <div
      class="flex w-full max-w-(--breakpoint-md) flex-col items-start justify-start max-lg:mb-10"
    >
      <h3 class="mb-2 text-base font-bold">Preview</h3>
      <p class="text-surface-700-300 mb-2 text-left text-sm">
        To change one range, save and tap it in the list of colors.
      </p>

      <!-- Laid out like the list of colors, without the controls -->
      {#if _gauge.ranges.length && _gauge.colors.length}
        <ol
          class="rounded-container border-surface-200-800 bg-surface-50-950 flex w-full flex-col border"
        >
          {#each _gauge.ranges as range, index (index)}
            {@const color = _gauge.colors[index]}
            <li
              class="border-surface-200-800 flex flex-wrap items-center gap-x-3 gap-y-1 border-b p-2 text-left last:border-b-0"
            >
              <span
                class="rounded-base grid size-10 shrink-0 place-items-center text-sm font-semibold shadow-[inset_0_0_0_1px_rgb(0_0_0/0.12)]"
                style="background:{color?.hex};color:{iconColorOn(
                  color?.hex ?? '#fff',
                )}"><span class="sr-only">Color</span> {index + 1}</span
              >
              <span class="min-w-[8rem] flex-1 truncate text-sm font-semibold"
                >{color?.name || color?.hex}</span
              >
              <!-- Like the numbers in the list of colors: semibold, with a regular
              unit, each as wide as the widest so they line up -->
              <span
                class="flex items-center gap-1 font-semibold whitespace-nowrap tabular-nums"
              >
                <span class="text-right" style:width="{rangeChars.from}ch"
                  >{range.from}<span class={unitClass}>{unitLabel}</span></span
                >
                <ArrowRightIcon
                  size={14}
                  class="shrink-0 opacity-60"
                  aria-hidden="true"
                />
                <span class="sr-only">to</span>
                <span style:width="{rangeChars.to}ch"
                  >{range.to}<span class={unitClass}>{unitLabel}</span></span
                >
              </span>
              <span class="flex gap-3 text-xs tabular-nums">
                {#each _gauge.targets as target (target.id)}
                  {@const count = getDaysInRange({
                    id: target.id,
                    range,
                    direction: _gauge.rangeOptions.direction,
                    includeFromValue: _gauge.rangeOptions.includeFromValue,
                    includeToValue: _gauge.rangeOptions.includeToValue,
                    gaugeUnitType: _gauge.unit.type,
                  }).length}
                  <span class="whitespace-nowrap" class:opacity-50={!count}>
                    <span class="text-surface-700-300"
                      >{target.icon} {target.gaugeLabel}</span
                    >
                    <span class="font-semibold"
                      >{count} {pluralize(weather.grouping, count)}</span
                    >
                  </span>
                {/each}
              </span>
            </li>
          {/each}
        </ol>
      {/if}
    </div>
  </div>
</div>
<StickyPart position="bottom">
  {#if showScrollToTopButton}
    <button
      transition:fade
      class="btn bg-surface-50-950/70 absolute right-2 bottom-[5.4rem] z-20 m-2 inline-flex w-fit items-center justify-center px-4 py-2 shadow-sm backdrop-blur transition-all lg:hidden"
      onclick={() =>
        setupContainer?.scrollIntoView({
          behavior: 'smooth',
          block: 'start',
        })}
    >
      <CogIcon />
      Setup
      <ChevronUpIcon />
    </button>
  {/if}
  <div class="pt-2 pb-2 max-sm:p-4">
    <SaveAndCloseButtons onSave={_onSave} onClose={dialog.close} />
  </div>
</StickyPart>

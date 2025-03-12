<!-- Copyright (c) 2024, Thomas (https://github.com/jdvlpr)

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
  import ChooseRangeDirection from '$lib/components/ChooseRangeDirection.svelte';
  import DaysInRange from '$lib/components/DaysInRange.svelte';
  import Expand from '$lib/components/Expand.svelte';
  import Tooltip from '$lib/components/Tooltip.svelte';
  import ToggleSwitch from '$lib/components/buttons/ToggleSwitch.svelte';
  import SaveAndCloseButtons from '$lib/components/modals/SaveAndCloseButtons.svelte';
  import StickyPart from '$lib/components/modals/StickyPart.svelte';
  import { gauges, modal, project } from '$lib/state';
  import {
    displayNumber,
    getIncrement,
    getRangeExample,
    getRanges,
    getStart,
    getTextColor,
  } from '$lib/utils';
  import { targetArrow } from '@lucide/lab';
  import {
    CalculatorIcon,
    ChevronUpIcon,
    Icon,
    InfoIcon,
    ListStartIcon,
    Settings2Icon,
    TriangleAlertIcon,
    WandIcon,
    WandSparklesIcon,
  } from '@lucide/svelte';
  import { Segment } from '@skeletonlabs/skeleton-svelte';
  import { onMount, tick } from 'svelte';
  import { fade, slide } from 'svelte/transition';
  interface Props {
    onSave: any;
    index?: any;
    focusOn?: any;
  }

  let { onSave, index = null, focusOn = null }: Props = $props();

  let _gauge = $state(gauges.getSnapshot(gauges.activeGaugeId));

  let unitLabel = $derived(_gauge.unit.label[project.units]);

  let incrementMode = $state(
    _gauge.rangeOptions?.isCustomRanges ? null : _gauge.rangeOptions.mode,
  );

  let customRanges = $state(gauges.getSnapshot(gauges.activeGaugeId).ranges);

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

    return getIncrement(_gauge.rangeOptions);
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
      ? increment - 0.01
      : includeFromAndTo
        ? increment + 0.01
        : increment,
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
    modal.close();
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
    scrollObserver.observe(setupContainer);

    if (index !== null) {
      setTimeout(() => {
        // small delay to allow the modal to open
        // then scroll to and focus on the number input
        if (focusOn === 'to') {
          document
            .getElementById(`settings-range-${index}-to`)
            ?.scrollIntoView({
              behavior: 'smooth',
            });
          document
            .getElementById(`settings-range-${index}-to`)
            ?.getElementsByTagName('input')[0]
            .focus();
        } else {
          document
            .getElementById(`settings-range-${index}-from`)
            ?.scrollIntoView({ behavior: 'smooth' });
          document
            .getElementById(`settings-range-${index}-from`)
            ?.getElementsByTagName('input')[0]
            .focus();
        }
      }, 0);
    }
  });
</script>

<div class="p-4">
  <div class="flex max-lg:flex-col justify-center items-start gap-2 w-full">
    <div
      class="flex flex-col justify-start items-start lg:max-w-[500px]"
      bind:this={setupContainer}
    >
      <h2 class="font-bold text-xl flex flex-wrap items-start mb-2">
        Setup Ranges
      </h2>

      <div class="rounded-container gap-2 flex flex-col w-full">
        <div class="flex flex-col justify-start items-start gap-1">
          <ChooseRangeDirection
            direction={_gauge.rangeOptions.direction}
            onchange={(e) => {
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
          class="flex flex-col justify-start items-start gap-2 card preset-filled-surface-200-800 p-4"
        >
          <div class="flex flex-col items-start justify-start gap-1">
            <p class="flex justify-start items-center gap-1">
              <WandIcon class="size-4" />
              <span>Generate Ranges</span>
            </p>

            <Segment
              classes="flex-wrap gap-y-2 shadow-sm"
              background="bg-surface-100 dark:bg-surface-900"
              value={incrementMode}
              onValueChange={(e) => {
                incrementMode = e.value;
              }}
            >
              <Segment.Item value="auto">Automatic</Segment.Item>
              <Segment.Item value="manual">Manual</Segment.Item>
            </Segment>

            {#if !incrementMode}
              <p class="card p-4 preset-tonal-warning text-left mt-2">
                <TriangleAlertIcon class="inline" />

                Choosing Automatic or Manual will override the current ranges
                with generated values.
              </p>
            {/if}
          </div>

          {#if _gauge.rangeOptions.isCustomRanges === false}
            <div class="flex flex-col gap-2 justify-start items-start">
              {#if _gauge.rangeOptions.mode === 'auto'}
                <div class="flex flex-col gap-2 justify-start items-start">
                  {#if _gauge.id === 'temp'}
                    <label class="label">
                      <span class="flex flex-wrap items-center gap-1">
                        <Icon iconNode={targetArrow} class="size-4" />

                        <span>Balance Focus</span>
                      </span>
                      <select
                        bind:value={_gauge.rangeOptions.auto.optimization}
                        onchange={() => {
                          autoUpdateRanges();
                        }}
                        class="select bg-surface-100 dark:bg-surface-900"
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
                    </label>
                    <p
                      class="card p-4 preset-tonal-success border border-success-500 text-left"
                    >
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
                        temperature of each day.
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

                        <Tooltip>
                          <InfoIcon class="size-4" />
                          {#snippet tooltip()}
                            <p>
                              This was calculated based on your weather data and
                              the number of colors in this activeGauge.
                            </p>
                          {/snippet}
                        </Tooltip>
                      {/if}
                    </p>
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
                <div class="flex flex-wrap gap-2 justify-start">
                  <div
                    class="tex-left flex flex-col items-start justify-end w-fit"
                  >
                    <label for="manual-increment" class="label"
                      >Increment ({unitLabel})</label
                    >
                    <input
                      id="manual-increment"
                      type="number"
                      min="0"
                      class="input w-fit bg-surface-100 dark:bg-surface-900"
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

                  <div class="tex-left flex flex-col items-start w-fit">
                    <label
                      for="startFrom"
                      class="label flex flex-wrap items-center gap-2"
                    >
                      <ListStartIcon class="size-4" />
                      Start From ({unitLabel})
                      <Tooltip>
                        <InfoIcon class="size-4" />
                        {#snippet tooltip()}
                          <p>
                            This should usually be the
                            {_gauge.rangeOptions.direction === 'high-to-low'
                              ? 'highest'
                              : 'lowest'}
                            possible value from your weather data.
                          </p>
                        {/snippet}
                      </Tooltip>
                    </label>
                    <input
                      id="startFrom"
                      type="number"
                      class="input w-fit bg-surface-100 dark:bg-surface-900"
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
                </div>
              {/if}
            </div>
          {/if}
        </div>

        <div class="mx-auto">
          <Expand
            bind:isExpanded={showAdvancedControls}
            more="Advanced Controls"
            less="Advanced Controls"
          />
        </div>
        {#if showAdvancedControls}
          <div
            transition:slide
            class="flex flex-col gap-4 justify-start items-start rounded-container bg-surface-200 dark:bg-surface-800 p-4 text-left w-full"
          >
            <ToggleSwitch
              bind:checked={_gauge.rangeOptions.linked}
              label="Linked Ranges"
              details="When editing an individual range's From or To value, update the next or previous range's corresponding value."
            />
            <div
              class="p-2 bg-surface-100 dark:bg-surface-900 rounded-container"
            >
              <label class="label">
                <span
                  class="flex flex-col justify-center items-center gap-2 my-2"
                >
                  <span
                    class="flex flex-wrap gap-1 justify-center items-center"
                  >
                    <CalculatorIcon class="size-4" />
                    Range Calculation Method:<span>{@html rangeExample}</span>
                    <Tooltip>
                      <InfoIcon class="size-4" />
                      {#snippet tooltip()}
                        <div>
                          If you change this setting,
                          <a
                            href="/documentation/#range-calculation-methods"
                            target="_blank"
                            class="link"
                            rel="noopener noreferrer"
                            >make sure your ranges are set up correctly.</a
                          >
                        </div>
                      {/snippet}
                    </Tooltip>
                  </span>

                  <select
                    class="select max-w-[500px] truncate"
                    value={initialValueSelectRangeCalculationMethod}
                    onchange={(e) => {
                      switch (e.target.value) {
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
                </span>
              </label>
            </div>
          </div>
        {/if}
        {#if isRangeCalculationUnavailable}
          <p class="card bg-warning-50 dark:bg-warning-950 text-left py-4 px-4">
            <TriangleAlertIcon class="inline" />
            The Ranges Preview below doesn't yet auto-calculate optimal From and
            To values using these options and this range calculation method ({@html rangeExample}).
            To show the optimal From and To values, {#if isNotAutoIncrements}
              set Automatic Ranges above, then
            {/if} uncheck Round Numbers{#if !isNotAutoIncrements}
              above{/if}, or change the Range Calculation Method.
          </p>
        {/if}
      </div>
    </div>

    <div
      class="flex flex-col justify-start items-start w-full max-w-(--breakpoint-md) max-lg:mb-10"
    >
      <h2 class="font-bold text-xl flex flex-wrap items-start mb-2">
        Edit Ranges
      </h2>

      <div class=" rounded-container w-full">
        <div class="rounded-container overflow-hidden flex flex-col">
          {#if _gauge.ranges.length && _gauge.colors.length}
            {#each _gauge.ranges as { from, to }, index}
              {@const { hex } = _gauge.colors[index]}
              <div
                class="max-xl:flex max-xl:flex-col max-xl:justify-center items-center xl:grid xl:grid-cols-12 gap-2 p-2 w-full"
                style="background:{hex};color:{getTextColor(hex)}"
              >
                <p class="text-xs col-span-2">
                  Color {index + 1}
                </p>

                <div
                  class="col-span-4 col-start-3 flex flex-wrap gap-2 min-w-[220px] max-xl:justify-center xl:justify-start items-start"
                >
                  <label
                    class="label flex flex-col justify-start items-start w-fit"
                    id="settings-range-{index}-from"
                  >
                    <span class="text-xs">From ({unitLabel})</span>
                    <input
                      type="number"
                      class="input text-lg max-w-[75px]"
                      value={from}
                      onchange={(e) => {
                        const value = +e.target.value;
                        _gauge.rangeOptions.isCustomRanges = true;

                        _gauge.ranges[index].from = value;
                        if (_gauge.rangeOptions.linked) {
                          if (index !== 0) _gauge.ranges[index - 1].to = value;
                        }
                        incrementMode = null;
                      }}
                      onkeyup={(e) => {
                        const value = +e.target.value;
                        _gauge.rangeOptions.isCustomRanges = true;

                        _gauge.ranges[index].from = value;
                        if (_gauge.rangeOptions.linked) {
                          if (index !== 0) _gauge.ranges[index - 1].to = value;
                        }
                        incrementMode = null;
                        // _ranges = customRanges;
                      }}
                    />
                  </label>
                  <label
                    class="label flex flex-col justify-start items-start w-fit"
                    id="settings-range-{index}-to"
                  >
                    <span class="text-xs">To ({unitLabel})</span>
                    <input
                      type="number"
                      class="input text-lg max-w-[75px]"
                      value={to}
                      onchange={(e) => {
                        const value = +e.target.value;

                        _gauge.rangeOptions.isCustomRanges = true;

                        _gauge.ranges[index].to = value;
                        if (
                          _gauge.rangeOptions.linked &&
                          index !== _gauge.ranges.length - 1
                        ) {
                          _gauge.ranges[index + 1].from = value;
                        }

                        incrementMode = null;
                      }}
                      onkeyup={(e) => {
                        const value = +e.target.value;

                        _gauge.rangeOptions.isCustomRanges = true;

                        _gauge.ranges[index].to = value;
                        if (
                          _gauge.rangeOptions.linked &&
                          index !== _gauge.ranges.length - 1
                        ) {
                          _gauge.ranges[index + 1].from = value;
                        }

                        incrementMode = null;
                      }}
                    />
                  </label>
                </div>

                <div
                  class="col-span-6 col-start-7 flex flex-wrap gap-2 justify-center"
                >
                  <DaysInRange
                    range={_gauge.ranges[index]}
                    rangeOptions={_gauge.rangeOptions}
                    targets={_gauge.targets}
                  />
                </div>
              </div>
            {/each}
          {/if}
        </div>
      </div>
    </div>
  </div>
</div>
<StickyPart position="bottom">
  {#if showScrollToTopButton}
    <button
      transition:fade
      class="btn px-4 bottom-[4rem] absolute -translate-x-1/2 left-1/2 w-fit py-2 m-2 z-20 shadow-sm preset-filled-surface-500 lg:hidden transition-all inline-flex justify-center items-center right-0"
      onclick={() =>
        setupContainer.scrollIntoView({
          behavior: 'smooth',
          block: 'start',
        })}
    >
      <Settings2Icon />
      Setup
      <ChevronUpIcon />
    </button>
  {/if}
  <div class="pb-2 pt-2 max-sm:p-4">
    <SaveAndCloseButtons onSave={_onSave} onClose={modal.close} />
  </div>
</StickyPart>

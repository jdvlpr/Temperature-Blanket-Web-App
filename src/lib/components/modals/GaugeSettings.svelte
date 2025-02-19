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
  import { Segment } from '@skeletonlabs/skeleton-svelte';
  import { onMount } from 'svelte';
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

  let debounceTimer;
  const debounce = (callback, time) => {
    window.clearTimeout(debounceTimer);
    debounceTimer = window.setTimeout(callback, time);
  };

  $effect(() => {
    incrementMode;
    debounce(() => {
      onChangeIncrementMode();
    }, 10);
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
            bind:direction={_gauge.rangeOptions.direction}
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
            <p class="flex justify-start items-start gap-1">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                class="w-6 h-6"
                viewBox="0 0 24 24"
                ><g
                  fill="none"
                  stroke="currentColor"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  ><path
                    d="M3 7V5c0-1.1.9-2 2-2h2m10 0h2c1.1 0 2 .9 2 2v2m0 10v2c0 1.1-.9 2-2 2h-2M7 21H5c-1.1 0-2-.9-2-2v-2"
                  /><rect width="7" height="5" x="7" y="7" rx="1" /><rect
                    width="7"
                    height="5"
                    x="10"
                    y="12"
                    rx="1"
                  /></g
                ></svg
              >

              <span>Generate Ranges</span>
            </p>

            <Segment
              classes="flex-wrap gap-y-2 shadow"
              background="bg-surface-100-900"
              bind:value={incrementMode}
            >
              <Segment.Item value="auto">Automatic</Segment.Item>
              <Segment.Item value="manual">Manual</Segment.Item>
            </Segment>

            {#if !incrementMode}
              <p class="card p-4 preset-tonal-warning text-left mt-2">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke-width="1.5"
                  stroke="currentColor"
                  class="w-6 h-6 inline"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
                  />
                </svg>

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
                      <span class="flex flex-wrap gap-1">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          class="w-6 h-6"
                          viewBox="0 0 256 256"
                          ><g fill="currentColor"
                            ><path
                              d="M176 128a48 48 0 1 1-48-48a48 48 0 0 1 48 48Z"
                              opacity=".2"
                            /><path
                              d="M221.87 83.16A104.1 104.1 0 1 1 195.67 49l22.67-22.68a8 8 0 0 1 11.32 11.32l-96 96a8 8 0 0 1-11.32-11.32l27.72-27.72a40 40 0 1 0 17.87 31.09a8 8 0 1 1 16-.9a56 56 0 1 1-22.38-41.65l22.75-22.75a87.88 87.88 0 1 0 23.13 29.67a8 8 0 0 1 14.44-6.9Z"
                            /></g
                          ></svg
                        >

                        <span>Balance Focus</span></span
                      >
                      <select
                        bind:value={_gauge.rangeOptions.auto.optimization}
                        onchange={() => {
                          autoUpdateRanges();
                        }}
                        class="select bg-surface-100-900"
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
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        class="size-6 inline"
                        viewBox="0 0 24 24"
                        ><path
                          fill="currentColor"
                          d="M7.5 5.6L5 7l1.4-2.5L5 2l2.5 1.4L10 2L8.6 4.5L10 7zm12 9.8L22 14l-1.4 2.5L22 19l-2.5-1.4L17 19l1.4-2.5L17 14zM22 2l-1.4 2.5L22 7l-2.5-1.4L17 7l1.4-2.5L17 2l2.5 1.4zm-8.66 10.78l2.44-2.44l-2.12-2.12l-2.44 2.44zm1.03-5.49l2.34 2.34c.39.37.39 1.02 0 1.41L5.04 22.71c-.39.39-1.04.39-1.41 0l-2.34-2.34c-.39-.37-.39-1.02 0-1.41L12.96 7.29c.39-.39 1.04-.39 1.41 0"
                        /></svg
                      >

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
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke-width="1.5"
                            stroke="currentColor"
                            class="w-6 h-6"
                          >
                            <path
                              stroke-linecap="round"
                              stroke-linejoin="round"
                              d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z"
                            />
                          </svg>
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
                      class="input w-fit bg-surface-100-900"
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
                      class="label flex flex-wrap items-start gap-2"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                        class="w-5 h-5"
                      >
                        <path
                          d="M2 4.5A2.5 2.5 0 014.5 2h11a2.5 2.5 0 010 5h-11A2.5 2.5 0 012 4.5zM2.75 9.083a.75.75 0 000 1.5h14.5a.75.75 0 000-1.5H2.75zM2.75 12.663a.75.75 0 000 1.5h14.5a.75.75 0 000-1.5H2.75zM2.75 16.25a.75.75 0 000 1.5h14.5a.75.75 0 100-1.5H2.75z"
                        />
                      </svg>
                      Start From ({unitLabel})
                      <Tooltip>
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke-width="1.5"
                          stroke="currentColor"
                          class="w-6 h-6"
                        >
                          <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z"
                          />
                        </svg>
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
                      class="input w-fit bg-surface-100-900"
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
            class="flex flex-col gap-4 justify-start items-start rounded-container bg-surface-200-800 p-4 text-left w-full"
          >
            <ToggleSwitch
              bind:checked={_gauge.rangeOptions.linked}
              label="Linked Ranges"
              details="When editing an individual range's From or To value, update the next or previous range's corresponding value."
            />
            <div class="p-2 bg-surface-100-900 rounded-container">
              <label class="label">
                <span
                  class="flex flex-col justify-center items-center gap-2 my-2"
                >
                  <span class="flex flex-wrap gap-1 justify-center items-center"
                    ><svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke-width="1.5"
                      stroke="currentColor"
                      class="w-6 h-6"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        d="M15.75 15.75V18m-7.5-6.75h.008v.008H8.25v-.008zm0 2.25h.008v.008H8.25V13.5zm0 2.25h.008v.008H8.25v-.008zm0 2.25h.008v.008H8.25V18zm2.498-6.75h.007v.008h-.007v-.008zm0 2.25h.007v.008h-.007V13.5zm0 2.25h.007v.008h-.007v-.008zm0 2.25h.007v.008h-.007V18zm2.504-6.75h.008v.008h-.008v-.008zm0 2.25h.008v.008h-.008V13.5zm0 2.25h.008v.008h-.008v-.008zm0 2.25h.008v.008h-.008V18zm2.498-6.75h.008v.008h-.008v-.008zm0 2.25h.008v.008h-.008V13.5zM8.25 6h7.5v2.25h-7.5V6zM12 2.25c-1.892 0-3.758.11-5.593.322C5.307 2.7 4.5 3.65 4.5 4.757V19.5a2.25 2.25 0 002.25 2.25h10.5a2.25 2.25 0 002.25-2.25V4.757c0-1.108-.806-2.057-1.907-2.185A48.507 48.507 0 0012 2.25z"
                      />
                    </svg>
                    Range Calculation Method:<span>{@html rangeExample}</span>
                    <Tooltip>
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke-width="1.5"
                        stroke="currentColor"
                        class="w-6 h-6"
                      >
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z"
                        />
                      </svg>
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
          <p class="card bg-warning-50-950 text-left py-4 px-4">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke-width="1.5"
              stroke="currentColor"
              class="w-6 h-6 inline"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
              />
            </svg>
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

    <div class="flex flex-col justify-start items-start w-full max-w-screen-md">
      <h2 class="font-bold text-xl flex flex-wrap items-start mb-2">
        Edit Ranges
      </h2>

      <div class=" rounded-container w-full">
        <div class="rounded-container overflow-hidden flex flex-col">
          {#if _gauge.ranges}
            {#each _gauge.ranges as { from, to }, index}
              {@const { hex, brandId, yarnId, name } = _gauge.colors[index]}
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

  {#if showScrollToTopButton}
    <button
      transition:fade
      class="btn px-4 bottom-[7rem] sm:bottom-[5rem] fixed -translate-x-1/2 left-1/2 w-fit py-2 m-2 z-20 shadow preset-filled-surface-500 lg:hidden transition-all inline-flex justify-center items-center gap-1 right-0"
      onclick={() =>
        setupContainer.scrollIntoView({
          behavior: 'smooth',
          block: 'start',
        })}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 20 20"
        fill="currentColor"
        class="w-5 h-5"
      >
        <path
          fill-rule="evenodd"
          d="M14.5 10a4.5 4.5 0 004.284-5.882c-.105-.324-.51-.391-.752-.15L15.34 6.66a.454.454 0 01-.493.11 3.01 3.01 0 01-1.618-1.616.455.455 0 01.11-.494l2.694-2.692c.24-.241.174-.647-.15-.752a4.5 4.5 0 00-5.873 4.575c.055.873-.128 1.808-.8 2.368l-7.23 6.024a2.724 2.724 0 103.837 3.837l6.024-7.23c.56-.672 1.495-.855 2.368-.8.096.007.193.01.291.01zM5 16a1 1 0 11-2 0 1 1 0 012 0z"
          clip-rule="evenodd"
        />
        <path
          d="M14.5 11.5c.173 0 .345-.007.514-.022l3.754 3.754a2.5 2.5 0 01-3.536 3.536l-4.41-4.41 2.172-2.607c.052-.063.147-.138.342-.196.202-.06.469-.087.777-.067.128.008.257.012.387.012zM6 4.586l2.33 2.33a.452.452 0 01-.08.09L6.8 8.214 4.586 6H3.309a.5.5 0 01-.447-.276l-1.7-3.402a.5.5 0 01.093-.577l.49-.49a.5.5 0 01.577-.094l3.402 1.7A.5.5 0 016 3.31v1.277z"
        />
      </svg>

      <span>Setup</span>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        stroke-width="1.5"
        stroke="currentColor"
        class="w-6 h-6"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          d="M4.5 15.75l7.5-7.5 7.5 7.5"
        />
      </svg>
    </button>
  {/if}
</div>
<StickyPart position="bottom">
  <div class="p-2">
    <SaveAndCloseButtons onSave={_onSave} onClose={modal.close} />
  </div>
</StickyPart>

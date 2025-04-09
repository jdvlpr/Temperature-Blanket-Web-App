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
  import WeatherItem from '$lib/components/WeatherItem.svelte';
  import ToggleSwitch from '$lib/components/buttons/ToggleSwitch.svelte';
  import { UNIT_LABELS } from '$lib/constants';
  import { localState, locations, weather } from '$lib/state';
  import {
    capitalizeFirstLetter,
    convertTime,
    exists,
    getColorInfo,
    getIsRecentDate,
  } from '$lib/utils';
  import { getTextColor } from '$lib/utils/color-utils';
  import { CircleArrowLeftIcon, CircleArrowRightIcon } from '@lucide/svelte';

  let {
    data = weather.data || [],
    viewGaugeInfo = $bindable(true),
    weatherTargets,
  } = $props();

  let rangeInput = $state();

  let navigatorElement = $state();

  let dayWeather = $derived(data[weather.currentIndex]);

  let dayLocation = $derived(
    locations.all.filter(
      (location) => location.index === dayWeather?.location,
    )[0],
  );

  let day = $derived({ ...dayWeather, ...dayLocation });

  let colorInfo = $derived((targetId, day) => {
    if (!exists(day)) return null;
    const value =
      targetId === 'moon'
        ? day[targetId]
        : day[targetId][localState.value.units];
    return getColorInfo({
      param: targetId,
      value,
    });
  });

  let isRecentDate = $derived(getIsRecentDate(day?.date));
</script>

<div
  class="inline-block w-full overflow-x-hidden text-center outline-hidden"
  bind:this={navigatorElement}
>
  <div class="text-lg font-semibold">
    {day?.date.toLocaleDateString(undefined, {
      timeZone: 'UTC',
    })}
  </div>

  <p class="mb-2 italic">
    {capitalizeFirstLetter(weather.grouping)}
    {weather.currentIndex + 1} of {data?.length}
  </p>

  <div class="range-select">
    <button
      aria-label="Show Previous {capitalizeFirstLetter(
        weather.grouping,
      )}'s Weather"
      class="prev btn-icon hover:preset-tonal scale-125"
      onclick={() => weather.currentIndex--}
      disabled={weather.currentIndex === 0}
      title="Show Previous {capitalizeFirstLetter(weather.grouping)}'s Weather"
    >
      <CircleArrowLeftIcon />
    </button>
    <input
      aria-label="Select {capitalizeFirstLetter(weather.grouping)}'s Weather"
      type="range"
      min="0"
      max={data?.length - 1}
      bind:this={rangeInput}
      bind:value={weather.currentIndex}
      onkeydown={(event) =>
        event.code === 'ArrowRight' || event.code === 'ArrowLeft'
          ? event.preventDefault()
          : null}
      class="range-slider-input"
      data-vaul-no-drag
    />

    <button
      aria-label="Show Next {capitalizeFirstLetter(weather.grouping)}'s Weather"
      class="next btn-icon hover:preset-tonal scale-125"
      onclick={() => weather.currentIndex++}
      disabled={weather.currentIndex === data?.length - 1}
      title="Show Next {capitalizeFirstLetter(weather.grouping)}'s Weather"
    >
      <CircleArrowRightIcon />
    </button>
  </div>

  <p class="my-2 text-lg font-bold">
    {@html day.result}
  </p>

  <div class="weather-details">
    <div class="my-2 flex flex-wrap items-start justify-center gap-x-4">
      {#each weatherTargets as { id, label, icon, type }}
        {@const { name, hex, index, gaugeLength, brandName, yarnName } =
          colorInfo(id, day)}
        {@const value =
          id === 'moon' ? day[id] : day[id][localState.value.units]}
        {#if exists(day) && value !== null}
          {#if id === 'dayt'}
            <WeatherItem {id} {label} {icon} value={convertTime(value)}>
              {#snippet details()}
                <span>
                  {#if viewGaugeInfo !== false && value !== null}
                    {#if typeof index === 'number'}
                      <div
                        class="rounded-container my-2 px-4 py-2 text-center"
                        style={viewGaugeInfo
                          ? `background:${hex};color:${getTextColor(hex)};`
                          : 'display:none'}
                      >
                        {#if brandName && yarnName}
                          <p class="text-xs">
                            {brandName}
                            -
                            {yarnName}
                          </p>
                        {/if}
                        {#if name}
                          <p class="text-lg">
                            {name}
                          </p>
                        {/if}
                        <p class="text-xs">
                          Color
                          {index + 1}
                          of
                          {gaugeLength}
                        </p>
                      </div>
                    {:else}
                      <p
                        class="border-surface-500 rounded-container my-2 border px-4 py-2 text-sm italic"
                      >
                        No Color Assigned
                      </p>
                    {/if}
                  {/if}
                </span>
              {/snippet}
            </WeatherItem>
          {:else}
            <WeatherItem
              {id}
              {label}
              {icon}
              {value}
              units={UNIT_LABELS[type][localState.value.units]}
              {isRecentDate}
            >
              {#snippet details()}
                <span>
                  {#if viewGaugeInfo !== false && value !== null}
                    {#if typeof index === 'number'}
                      <div
                        class="rounded-container my-2 px-4 py-2 text-center"
                        style={viewGaugeInfo
                          ? `background:${hex};color:${getTextColor(hex)};`
                          : 'display:none'}
                      >
                        {#if brandName && yarnName}
                          <p class="text-xs">
                            {brandName}
                            -
                            {yarnName}
                          </p>
                        {/if}
                        {#if name}
                          <p class="text-lg">
                            {name}
                          </p>
                        {/if}
                        <p class="text-xs">
                          Color
                          {index + 1}
                          of
                          {gaugeLength}
                        </p>
                      </div>
                    {:else}
                      <p
                        class="border-surface-500 rounded-container my-2 border px-4 py-2 text-sm italic"
                      >
                        No Color Assigned
                      </p>
                    {/if}
                  {/if}
                </span>
              {/snippet}
            </WeatherItem>
          {/if}
        {:else}
          <WeatherItem
            {id}
            {label}
            {icon}
            value="?"
            units={UNIT_LABELS[type][localState.value.units]}
          />
        {/if}
      {/each}
    </div>
  </div>
  <div class="mx-auto my-2 w-fit">
    <ToggleSwitch bind:checked={viewGaugeInfo} label={'Show Color Details'} />
  </div>
</div>

<style lang="scss">
  .range-select {
    display: flex;
    width: 100%;
    margin: 0 auto;
    align-items: center;
    button {
      transition: all 200ms;
      &.prev {
        margin: 0 10px 0 30px;
      }
      &.next {
        margin: 0 30px 0 10px;
      }
    }
    button:disabled {
      opacity: 0.08;
      cursor: inherit;
    }
    .range-slider-input {
      flex: 1;
      -webkit-appearance: none;
      appearance: none;
      cursor: pointer;
      border-radius: 25px;
      border: 1px solid #94a3b8;
      height: 20px;
      padding: 0;
      background: transparent;
      overflow: hidden;
      /***** Chrome, Safari, Opera, and Edge Chromium *****/
      &::-webkit-slider-runnable-track {
        background: transparent;
        height: 20px;
      }

      /******** Firefox ********/
      &::-moz-range-track {
        background: transparent;
        height: 20px;
      }
      /***** Chrome, Safari, Opera, and Edge Chromium *****/
      &::-webkit-slider-thumb {
        -webkit-appearance: none; /* Override default look */
        appearance: none;
        // margin-top: -15px; /* Centers thumb on the track */
        background-color: #94a3b8;
        height: 20px;
        width: 20px;
        border-radius: 10px;
        box-shadow: var(--box-shadow);
      }
      /******** Firefox ********/
      &::-moz-range-thumb {
        // border: none; /*Removes extra border that FF applies*/
        // border: 12px solid rgba(255, 255, 255, 0.6);
        border-radius: 0; /*Removes default border-radius that FF applies*/
        background-color: #94a3b8;
        height: 20px;
        width: 20px;
        border-radius: 10px;
        // box-shadow: var(--box-shadow);
      }
    }
  }
</style>

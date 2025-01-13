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
  import {
    activeWeatherElementIndex,
    gaugeSettings,
    locationsState,
    units,
    weather,
    weatherGrouping,
  } from '$lib/state';
  import {
    capitalizeFirstLetter,
    convertTime,
    exists,
    getColorInfo,
    getIsRecentDate,
    getTargetParentGaugeId,
  } from '$lib/utils';
  import { getTextColor } from '$lib/utils/color-utils';
  import { getModalStore } from '@skeletonlabs/skeleton';
  import ModalShell from './modals/ModalShell.svelte';

  const modalStore = getModalStore();

  let {
    data = weather.data || [],
    viewGaugeInfo = $bindable(true),
    weatherTargets,
    parent = null,
  } = $props();

  let rangeInput = $state();
  let navigatorElement = $state();

  let dayWeather = $derived(data[$activeWeatherElementIndex]);
  let dayLocation = $derived(
    locationsState.locations.filter(
      (location) => location.index === dayWeather?.location,
    )[0],
  );
  let day = $derived({ ...dayWeather, ...dayLocation });

  let colorInfo = $derived((targetId, day) => {
    if (!exists(day)) return null;
    let gaugeId = getTargetParentGaugeId(targetId);
    return getColorInfo(gaugeId, day[targetId][units.value]);
  });

  let isRecentDate = $derived(getIsRecentDate(day?.date));
</script>

{#if $modalStore[0]}
  <ModalShell {parent}>
    {@render content()}
  </ModalShell>
{:else}
  {@render content()}
{/if}

{#snippet content()}
  <div
    class="overflow-x-hidden outline-none text-center inline-block w-full"
    bind:this={navigatorElement}
  >
    <div class="font-semibold text-lg">
      {day?.date?.toLocaleDateString()}
    </div>

    <p class="italic mb-2">
      {capitalizeFirstLetter(weatherGrouping.value)}
      {$activeWeatherElementIndex + 1} of {data?.length}
    </p>

    <div class="range-select">
      <button
        aria-label="Show Previous {capitalizeFirstLetter(
          weatherGrouping.value,
        )}'s Weather"
        class="prev scale-125 btn-icon bg-secondary-hover-token"
        onclick={() => $activeWeatherElementIndex--}
        disabled={$activeWeatherElementIndex === 0}
        title="Show Previous {capitalizeFirstLetter(
          weatherGrouping.value,
        )}'s Weather"
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
            d="M11.25 9l-3 3m0 0l3 3m-3-3h7.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      </button>
      <input
        aria-label="Select {capitalizeFirstLetter(
          weatherGrouping.value,
        )}'s Weather"
        type="range"
        min="0"
        max={data?.length - 1}
        bind:this={rangeInput}
        bind:value={$activeWeatherElementIndex}
        onkeydown={(event) =>
          event.code === 'ArrowRight' || event.code === 'ArrowLeft'
            ? event.preventDefault()
            : null}
        class="range-slider-input"
        data-vaul-no-drag
      />

      <button
        aria-label="Show Next {capitalizeFirstLetter(
          weatherGrouping.value,
        )}'s Weather"
        class="next scale-125 btn-icon bg-secondary-hover-token"
        onclick={() => $activeWeatherElementIndex++}
        disabled={$activeWeatherElementIndex === data?.length - 1}
        title="Show Next {capitalizeFirstLetter(
          weatherGrouping.value,
        )}'s Weather"
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
            d="M12.75 15l3-3m0 0l-3-3m3 3h-7.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      </button>
    </div>

    <p class="font-bold text-lg my-2">
      {@html day.result}
    </p>

    {#key $gaugeSettings}
      <div class="weather-details">
        <div class="flex flex-wrap gap-x-4 items-start justify-center my-2">
          {#each weatherTargets as { id, label, icon, type }}
            {@const { name, hex, index, gaugeLength, brandName, yarnName } =
              colorInfo(id, day)}
            {#if exists(day) && day[id][units.value] !== null}
              {#if id === 'dayt'}
                <WeatherItem
                  {id}
                  {label}
                  {icon}
                  value={convertTime(day[id][units.value])}
                >
                  {#snippet details()}
                    <span>
                      {#if viewGaugeInfo !== false && day[id][units.value] !== null}
                        {#if typeof index === 'number'}
                          <div
                            class="my-2 rounded-container-token py-2 px-4 text-center"
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
                            class="text-sm italic my-2 py-2 px-4 border-token border-surface-400-500-token rounded-container-token"
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
                  value={day[id][units.value]}
                  units={UNIT_LABELS[type][units.value]}
                  {isRecentDate}
                >
                  {#snippet details()}
                    <span>
                      {#if viewGaugeInfo !== false && day[id][units.value] !== null}
                        {#if typeof index === 'number'}
                          <div
                            class="my-2 rounded-container-token py-2 px-4 text-center"
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
                            class="text-sm italic my-2 py-2 px-4 border-token border-surface-400-500-token rounded-container-token"
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
                units={UNIT_LABELS[type][units.value]}
              />
            {/if}
          {/each}
        </div>
      </div>
    {/key}
    <div class="my-2">
      <ToggleSwitch bind:checked={viewGaugeInfo} label={'Show Color Details'} />
    </div>
  </div>
{/snippet}

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

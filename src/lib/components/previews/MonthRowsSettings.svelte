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

<script context="module">
  import { CHARACTERS_FOR_URL_HASH } from '$lib/constants';
  import { gauges, preview } from '$lib/state';
  import {
    capitalizeFirstLetter,
    getMiddleValueOfArray,
    pluralize,
  } from '$lib/utils';
  import chroma from 'chroma-js';
  import { derived, writable } from 'svelte/store';

  const id = 'mrws';

  const defaultSettings = {
    selectedTargets: ['tmax'],
    dimensions: '2x6',
    direction: 'top-to-bottom',
    stitchesPerRow: 80,
    extrasColor: '#f0f3f3',
    borderStitches: 1,
    borderColor: '#f0f3f3',
  };

  export const settings = writable(JSON.parse(JSON.stringify(defaultSettings)));

  export const details = writable(null);

  export const hash = derived([settings, details], ([$settings, $details]) => {
    let hash = '&';
    hash += `${id}=`;
    hash += `${$settings.selectedTargets.join('')}`;
    hash += CHARACTERS_FOR_URL_HASH.separator;
    hash += `${$settings.dimensions}`;
    hash += CHARACTERS_FOR_URL_HASH.separator;
    hash += `${$settings.direction === 'left-to-right' ? '0' : '1'}`;
    hash += $settings.stitchesPerRow;
    // here's the rub...
    hash += `${CHARACTERS_FOR_URL_HASH.separator}${chroma($settings.extrasColor).hex().substring(1)}`;
    hash += $settings.borderStitches;
    hash += `${CHARACTERS_FOR_URL_HASH.separator}${chroma($settings.borderColor).hex().substring(1)}`;
    return hash;
  });

  export const load = (hash) => {
    let _settings = JSON.parse(JSON.stringify(defaultSettings));

    let separatorIndex = [];

    for (let i = 0; i < hash.length; i++) {
      if (
        hash[i] === CHARACTERS_FOR_URL_HASH.separator ||
        hash[i] == CHARACTERS_FOR_URL_HASH.separator_alt
      )
        separatorIndex.push(i);
    }

    if (!separatorIndex.length) return; // format of hash was wrong, so stop processing

    let position = 0;
    let targets = hash.substring(position, separatorIndex[0]);
    targets = targets.match(/.{1,4}/g);
    _settings.selectedTargets = targets;

    position = separatorIndex[0] + 1;
    _settings.dimensions = hash.substring(position, separatorIndex[1]); // dimensions
    _settings.dimensions = _settings.dimensions.replace('×', 'x'); // sometimes firefox formated this as multiplcation sign

    position = separatorIndex[1] + 1;
    _settings.direction =
      hash.substring(position, position + 1) === '0'
        ? 'left-to-right'
        : 'top-to-bottom';

    position += 1;
    _settings.stitchesPerRow = +hash.substring(position, separatorIndex[2]);

    position = separatorIndex[2] + 1;
    _settings.extrasColor = chroma.valid(hash.substring(position, position + 6))
      ? chroma(hash.substring(position, position + 6)).hex()
      : _settings.extrasColor;

    position += 6;
    _settings.borderStitches = +hash.substring(position, separatorIndex[3]);

    position = separatorIndex[3] + 1;
    _settings.borderColor = chroma.valid(hash.substring(position, position + 6))
      ? chroma(hash.substring(position, position + 6)).hex()
      : _settings.borderColor;

    settings.set(_settings);
    preview.setId(id);
  };
</script>

<script>
  import NumberInputButton from '$lib/components/buttons/NumberInputButton.svelte';
  import ToggleSwitchGroup from '$lib/components/buttons/ToggleSwitchGroup.svelte';
  import ChangeColor from '$lib/components/modals/ChangeColor.svelte';
  import { modal, weather } from '$lib/state';
  import {
    getFactors,
    getPossibleDimensions,
    setTargets,
    weatherMonthsData,
  } from '$lib/utils';

  $: targets = gauges.allCreated.map((n) => n.targets).flat();

  $: if (gauges.allCreated)
    $settings.selectedTargets = setTargets($settings.selectedTargets);

  $: months = weatherMonthsData({ weatherData: weather.data });

  $: factors = getFactors({ length: months.length });

  $: possibleDimensions = getPossibleDimensions({ factors });

  // If a new weather search happens, and the current dimensions are not possible, set new dimensions
  $: if (weather.data && !possibleDimensions.includes($settings.dimensions))
    $settings.dimensions = getMiddleValueOfArray(possibleDimensions);
</script>

{#if $details}
  <div class="w-full">
    <p class="max-w-screen-sm mx-auto">
      Rows are grouped by month from <span class="italic"
        >{#if $settings?.direction === 'left-to-right'}left to right{:else if $settings.direction === 'top-to-bottom'}top
          to bottom{/if}</span
      >. Months with fewer days have extra rows added, so that each month
      section has the same number of rows.
    </p>
    <p class="italic mt-2">
      Each month section has {$details.rowsPerMonth} total {pluralize(
        'row',
        $details.rowsPerMonth,
      )}.
    </p>
  </div>
{/if}

<label class="label">
  <span>Dimensions (W x H)</span>
  <select
    class="select w-fit"
    id="mrws-dimensions"
    bind:value={$settings.dimensions}
  >
    {#each possibleDimensions as value}
      <option {value}>{value}</option>
    {/each}
  </select>
</label>

<label class="label">
  <span>Direction</span>
  <select
    class="select w-fit"
    id="mrws-direction"
    bind:value={$settings.direction}
  >
    <option value="left-to-right">Left to Right</option>
    <option value="top-to-bottom">Top to Bottom</option>
  </select>
</label>

<div class="text-left">
  <ToggleSwitchGroup
    groupLabel={`Color Using the ${capitalizeFirstLetter(weather.grouping)}'s`}
    {targets}
    bind:value={$settings.selectedTargets}
  />
</div>

<NumberInputButton
  bind:value={$settings.stitchesPerRow}
  title="Stitches Per Row"
  icon={true}
/>

<button
  class="btn bg-secondary-hover-token gap-1"
  title="Choose a Color"
  on:click={() =>
    modal.state.trigger({
      type: 'component',
      component: {
        ref: ChangeColor,
        props: {
          hex: $settings.extrasColor,
          onChangeColor: ({ hex }) => ($settings.extrasColor = hex),
        },
      },
    })}
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
      d="M15 11.25l1.5 1.5.75-.75V8.758l2.276-.61a3 3 0 10-3.675-3.675l-.61 2.277H12l-.75.75 1.5 1.5M15 11.25l-8.47 8.47c-.34.34-.8.53-1.28.53s-.94.19-1.28.53l-.97.97-.75-.75.97-.97c.34-.34.53-.8.53-1.28s.19-.94.53-1.28L12.75 9M15 11.25L12.75 9"
    />
  </svg>
  Color of Extra Rows</button
>

<NumberInputButton
  bind:value={$settings.borderStitches}
  min="0"
  title="Border Stitches"
  icon={true}
/>

{#if $settings.borderStitches > 0}
  <button
    class="btn bg-secondary-hover-token gap-1"
    title="Choose a Color"
    on:click={() =>
      modal.state.trigger({
        type: 'component',
        component: {
          ref: ChangeColor,
          props: {
            hex: $settings.borderColor,
            onChangeColor: ({ hex }) => ($settings.borderColor = hex),
          },
        },
      })}
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
        d="M15 11.25l1.5 1.5.75-.75V8.758l2.276-.61a3 3 0 10-3.675-3.675l-.61 2.277H12l-.75.75 1.5 1.5M15 11.25l-8.47 8.47c-.34.34-.8.53-1.28.53s-.94.19-1.28.53l-.97.97-.75-.75.97-.97c.34-.34.53-.8.53-1.28s.19-.94.53-1.28L12.75 9M15 11.25L12.75 9"
      />
    </svg>
    Color of Border Stitches</button
  >
{/if}

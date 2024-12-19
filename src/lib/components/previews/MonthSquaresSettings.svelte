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
  import { activePreview } from '$lib/stores';
  import chroma from 'chroma-js';
  import { derived, writable } from 'svelte/store';

  const id = 'msqs';

  const defaultSettings = {
    selectedTarget: 'tmax',
    dimensions: '3x4',
    additionalRoundsColor: '#f0f3f3',
    additionalRoundsPerSquare: 1,
  };

  export const settings = writable(JSON.parse(JSON.stringify(defaultSettings)));

  export const details = writable(null);

  export const hash = derived(settings, ($settings) => {
    let hash = '&';
    hash += `${id}=`;
    hash += `${$settings.selectedTarget}(${$settings.dimensions}${CHARACTERS_FOR_URL_HASH.separator}${
      $settings.additionalRoundsPerSquare
    }${CHARACTERS_FOR_URL_HASH.separator}${chroma($settings.additionalRoundsColor).hex().substring(1)})`;
    return hash;
  });

  export const load = (hash) => {
    let _settings = JSON.parse(JSON.stringify(defaultSettings));

    let startIndex = [],
      endIndex = [];
    const separatorIndex = [];
    for (let i = 0; i < hash.length; i++) {
      if (hash[i] === '(') startIndex.push(i);
      if (
        hash[i] === CHARACTERS_FOR_URL_HASH.separator ||
        hash[i] === CHARACTERS_FOR_URL_HASH.separator_alt
      )
        separatorIndex.push(i);
      if (hash[i] === ')') endIndex.push(i);
    }
    if (!startIndex || !separatorIndex || !endIndex) return; // format of hash was wrong, so stop processing

    _settings.selectedTarget = hash.substring(0, startIndex[0]);
    _settings.dimensions = hash.substring(startIndex[0] + 1, separatorIndex[0]);
    _settings.dimensions = _settings.dimensions.replace('×', 'x'); // sometimes firefox formated this as multiplcation sign
    _settings.additionalRoundsPerSquare = +hash.substring(
      separatorIndex[0] + 1,
      separatorIndex[1],
    );
    _settings.additionalRoundsColor = chroma(
      hash.substring(separatorIndex[1] + 1, endIndex[0]),
    ).hex();
    settings.set(_settings);
    activePreview.setId(id);
  };
</script>

<script>
  import NumberInputButton from '$lib/components/buttons/NumberInputButton.svelte';
  import ChangeColor from '$lib/components/modals/ChangeColor.svelte';
  import { createdGauges, modal, weather, weatherGrouping } from '$lib/stores';
  import {
    capitalizeFirstLetter,
    getFactors,
    getMiddleValueOfArray,
    getPossibleDimensions,
    setTargets,
    weatherMonthsData,
  } from '$lib/utils';

  $: targets = $createdGauges.map((n) => n.targets).flat();

  $: if ($createdGauges)
    $settings.selectedTarget = setTargets($settings.selectedTarget);

  $: months = weatherMonthsData({ weatherData: $weather });

  $: factors = getFactors({ length: months.length });

  $: possibleDimensions = getPossibleDimensions({ factors });

  // If a new weather search happens, and the current dimensions are not possible, set new dimensions
  $: if ($weather && !possibleDimensions.includes($settings.dimensions))
    $settings.dimensions = getMiddleValueOfArray(possibleDimensions);
</script>

<p class="w-full">
  Each square represents one month. Each round in a square represents one day,
  starting with the first of the month in the center of the square. Months with
  fewer days have extra rounds added, so that each square has the same number of
  rounds.
</p>

{#if $details}
  <p class="italic w-full">
    Each square has {$details.roundsPerSquare} total rounds.
  </p>
{/if}

<label class="label">
  <span>Dimensions (W x H)</span>
  <select
    class="select w-fit"
    id="msqs-dimensions"
    bind:value={$settings.dimensions}
  >
    {#each possibleDimensions as value}
      <option {value}>{value}</option>
    {/each}
  </select>
</label>

<label class="label">
  <span>Color Using the {capitalizeFirstLetter($weatherGrouping)}'s</span>
  <select
    class="select w-fit"
    id="msqs-param"
    bind:value={$settings.selectedTarget}
  >
    {#each targets as { id, label, icon }}
      <option value={id}>{icon} {label} </option>
    {/each}
  </select>
</label>

<NumberInputButton
  bind:value={$settings.additionalRoundsPerSquare}
  title="Additional Rounds Per Square"
  min="0"
  icon={true}
/>

<button
  class="btn bg-secondary-hover-token gap-1"
  title="Choose a Color"
  on:click={() =>
    modal.state.trigger({
      type: 'component',
      component: ChangeColor,
      props: {
        hex: $settings.additionalRoundsColor,
        onChangeColor: ({ hex }) => ($settings.additionalRoundsColor = hex),
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
  Color of Additional Rounds
</button>

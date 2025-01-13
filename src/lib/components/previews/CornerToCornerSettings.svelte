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
  import { gaugesState, preview, weather } from '$lib/state';
  import { derived, writable } from 'svelte/store';

  const id = 'crnr';

  const defaultSettings = {
    selectedTarget: 'tmax',
    lineLength: 15,
    dimensions: '100x100',
  };

  export const settings = writable(JSON.parse(JSON.stringify(defaultSettings)));

  export const hash = derived([settings], ([$settings]) => {
    if (!$settings.dimensions) return '';
    let hash = '&';
    hash += `${id}=`;
    hash += `${$settings.selectedTarget}(${$settings.lineLength}${CHARACTERS_FOR_URL_HASH.separator}${$settings.dimensions})`;
    return hash;
  });

  export const load = (hash) => {
    let _settings = JSON.parse(JSON.stringify(defaultSettings));

    let startIndex, endIndex;
    const separatorIndex = [];
    for (let i = 0; i < hash.length; i++) {
      if (hash[i] === '(') startIndex = i;
      if (
        hash[i] === CHARACTERS_FOR_URL_HASH.separator ||
        hash[i] === CHARACTERS_FOR_URL_HASH.separator_alt
      )
        separatorIndex.push(i);
      if (hash[i] === ')') endIndex = i;
    }
    if (!startIndex || !separatorIndex[0] || !endIndex) return; // format of hash was wrong, so stop processing
    _settings.selectedTarget = hash.substring(0, startIndex);
    _settings.lineLength = +hash.substring(startIndex + 1, separatorIndex[0]);
    let dimensions;
    if (separatorIndex[1]) {
      // Legacy (before v1.700, to accomodate for total length, but it's not needed
      // _details.totalLength = +hash.substring(separatorIndex[0] + 1, separatorIndex[1]);
      dimensions = hash.substring(separatorIndex[1] + 1, endIndex);
    } else {
      dimensions = hash.substring(separatorIndex[0] + 1, endIndex);
    }
    _settings.dimensions = dimensions;
    _settings.dimensions = _settings.dimensions.replace('×', 'x'); // sometimes firefox formated this as multiplcation sign

    settings.set(_settings);
    preview.setId(id);
  };
</script>

<script>
  import NumberInputButton from '$lib/components/buttons/NumberInputButton.svelte';
  import { weatherGrouping } from '$lib/state';
  import { capitalizeFirstLetter, setTargets } from '$lib/utils';

  $: targets = gaugesState.gauges.map((n) => n.targets).flat();

  let lengthFactors, possibleDimensions, dimensionsOptions;

  $: if (gaugesState.gauges)
    $settings.selectedTarget = setTargets($settings.selectedTarget);

  $: totalLength = weather.data
    ? weather.data?.length * $settings.lineLength
    : 0;

  $: lengthFactors = getLengthFactors(totalLength);
  function getLengthFactors(_totalLength) {
    if (!_totalLength) return;
    const factors = [];
    for (let i = 0; i < _totalLength; i++) {
      if (_totalLength % i === 0) factors.push(i);
    }
    factors.push(_totalLength);
    return factors;
  }

  $: possibleDimensions = getPossibleDimensions(lengthFactors);
  function getPossibleDimensions(_lengthFactors) {
    if (!_lengthFactors) return;
    const dimensions = [];
    _lengthFactors.forEach((factor, index, factors) => {
      if (index < factors.length / 2) {
        dimensions.push([factor, factors[factors.length - index - 1]]);
      }
    });
    return dimensions;
  }

  $: dimensionsOptions = getDimensionsOptions(possibleDimensions);
  function getDimensionsOptions(_possibleDimensions) {
    if (!_possibleDimensions) return;
    const options = [];
    _possibleDimensions.forEach((item) => {
      options.push(item.join('x'));
    });
    if (!options.includes($settings.dimensions)) {
      $settings.dimensions = options[options.length - 1];
    }
    return options;
  }
</script>

<div class="w-full">
  <p class="">
    Days are represented by lines added in a back-and-forth pattern starting
    from the bottom right.
  </p>
</div>

<label class="label">
  <span>Color Using the {capitalizeFirstLetter(weatherGrouping.value)}'s</span>
  <select
    class="select w-fit"
    id="crnr-param"
    bind:value={$settings.selectedTarget}
  >
    {#each targets as { id, label, icon }}
      <option value={id}>{icon} {label} </option>
    {/each}
  </select>
</label>

<NumberInputButton
  bind:value={$settings.lineLength}
  title="Line Length"
  icon={true}
/>

{#if dimensionsOptions}
  <label class="label">
    <span>Dimensions (W x H)</span>
    <select
      class="select w-fit"
      id="crnr-dimensions"
      bind:value={$settings.dimensions}
    >
      {#each dimensionsOptions as value}
        <option {value}>{value}</option>
      {/each}
    </select>
  </label>
{/if}

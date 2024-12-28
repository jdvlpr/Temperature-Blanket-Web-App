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
  import { capitalizeFirstLetter, pluralize } from '$lib/utils';
  import chroma from 'chroma-js';
  import { derived, writable } from 'svelte/store';

  const id = 'rows';

  const defaultSettings = {
    selectedTargets: ['tmax'],
    stitchesPerRow: 300,
    stitchesPerDay: 300,
    lengthTarget: 'none',
    extrasColor: '#f0f3f3',
  };

  export const settings = writable(JSON.parse(JSON.stringify(defaultSettings)));

  export const details = writable(null);

  export const hash = derived([settings, details], ([$settings, $details]) => {
    let hash = '&';
    hash += `${id}=`;
    hash += `${$settings.selectedTargets.join('')}`;
    hash += '(';
    hash += $settings.stitchesPerRow;
    // here's the rub...
    if (
      $details &&
      $details.countOfAdditionalStitches > 0 &&
      $settings.lengthTarget !== 'none'
    )
      hash += `${CHARACTERS_FOR_URL_HASH.separator}${chroma($settings.extrasColor).hex().substring(1)}`;
    if ($settings.lengthTarget === 'custom')
      hash += `!${$settings.stitchesPerDay}`;
    else if ($settings.lengthTarget !== 'none')
      hash += `!${$settings.lengthTarget}`;
    hash += ')';
    return hash;
  });

  /**
   * Parses the hash parameter and updates the settings accordingly.
   *
   * @param {string} hash - The hash parameter to be parsed.
   */
  export const load = (hash) => {
    // Create a copy of the default settings
    let _settings = JSON.parse(JSON.stringify(defaultSettings));

    // Initialize variables
    let startIndex, separatorIndex, exclamationIndex, lengthEndIndex;

    // Iterate through the hash string to find the indices of specific characters
    for (let i = 0; i < hash.length; i++) {
      if (hash[i] === '(') startIndex = i;
      if (
        hash[i] === CHARACTERS_FOR_URL_HASH.separator ||
        hash[i] == CHARACTERS_FOR_URL_HASH.separator_alt
      )
        separatorIndex = i;
      if (hash[i] === '!') exclamationIndex = i;
      if (hash[i] === ')') lengthEndIndex = i;
    }

    // If the format of the hash is incorrect, stop processing
    if (!startIndex || !lengthEndIndex) return;

    // Extract the targets from the hash and update the settings
    let targets = hash.substring(0, startIndex);
    targets = targets.match(/.{1,4}/g);
    _settings.selectedTargets = targets;

    // Extract the stitches per row from the hash and update the settings
    let stitchesPerRow;
    if (separatorIndex) {
      stitchesPerRow = +hash.substring(startIndex + 1, separatorIndex);
    } else if (exclamationIndex) {
      stitchesPerRow = +hash.substring(startIndex + 1, exclamationIndex);
    } else if (lengthEndIndex) {
      stitchesPerRow = +hash.substring(startIndex + 1, lengthEndIndex);
    }
    _settings.stitchesPerRow = stitchesPerRow;

    // Extract the color from the hash and update the settings
    let color = '';
    if (separatorIndex && exclamationIndex) {
      color = hash.substring(separatorIndex + 1, exclamationIndex);
    } else if (separatorIndex && lengthEndIndex) {
      color = hash.substring(separatorIndex + 1, lengthEndIndex);
    }
    if (chroma.valid(color)) _settings.extrasColor = chroma(color).hex();

    // Extract the length target or stitches per row from the hash and update the settings
    if (exclamationIndex) {
      let content = hash.substring(exclamationIndex + 1, lengthEndIndex);
      if (isNaN(+content)) _settings.lengthTarget = content;
      else if (!isNaN(+content)) {
        _settings.stitchesPerDay = +content;
        _settings.lengthTarget = 'custom';
      }
    }

    // Update the settings and active preview
    settings.set(_settings);
    activePreview.setId(id);
  };
</script>

<script>
  import NumberInputButton from '$lib/components/buttons/NumberInputButton.svelte';
  import ToggleSwitchGroup from '$lib/components/buttons/ToggleSwitchGroup.svelte';
  import ChangeColor from '$lib/components/modals/ChangeColor.svelte';
  import { createdGauges, modal, weatherGrouping } from '$lib/stores';
  import { setTargets } from '$lib/utils';

  $: targets = $createdGauges.map((n) => n.targets).flat();

  $: if ($createdGauges)
    $settings.selectedTargets = setTargets($settings.selectedTargets);
</script>

{#if $details}
  <div class="w-full italic">
    <p>
      {$details.rows}
      {pluralize('row', $details.rows)}.
      {#if $details.countOfAdditionalStitches}
        {Number.isInteger($details.countOfAdditionalStitches)
          ? $details.countOfAdditionalStitches
          : `~ ${Math.round($details.countOfAdditionalStitches)}`}
        additional {pluralize(
          {
            singular: 'stitch',
            plural: 'stitches',
          },
          Math.round($details.countOfAdditionalStitches),
        )}.
      {/if}
    </p>
    {#if $details.countOfAdditionalStitches}
      <p>
        Stitches are counted using the parameter's absolute value rounded to the
        nearest non-zero integer. A temperature or hieght of zero is rounded up
        to one. Any missing values use the custom stitches per {$weatherGrouping}
        value.
      </p>
    {/if}
  </div>
{/if}

<div class="text-left">
  <ToggleSwitchGroup
    groupLabel={`Color Using the ${capitalizeFirstLetter($weatherGrouping)}'s`}
    {targets}
    bind:value={$settings.selectedTargets}
  />
</div>

<NumberInputButton
  bind:value={$settings.stitchesPerRow}
  title="Stitches Per Row"
  icon={true}
/>

<label class="label">
  <span>Stitches Per {capitalizeFirstLetter($weatherGrouping)} Using</span>
  <select
    class="select w-fit"
    id="rows-length-param"
    bind:value={$settings.lengthTarget}
  >
    <option value="none">Entire Row Length</option>
    {#each targets as { id, label, icon }}
      <option value={id}>{icon} {label}</option>
    {/each}
    <option value="custom">Custom Length</option>
  </select>
</label>

{#if $settings.lengthTarget === 'custom'}
  <NumberInputButton
    bind:value={$settings.stitchesPerDay}
    title="Stitches Per {capitalizeFirstLetter($weatherGrouping)}"
    icon={true}
  />
{/if}

{#if $details}
  {#if $details.countOfAdditionalStitches}
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
      Color of Additional Stitches
    </button>
  {/if}
{/if}

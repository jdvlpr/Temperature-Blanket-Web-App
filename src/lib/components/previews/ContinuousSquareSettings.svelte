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
  import { capitalizeFirstLetter, pluralize } from '$lib/utils';
  import chroma from 'chroma-js';
  import { derived, writable } from 'svelte/store';

  const id = 'cosq';

  const defaultSettings = {
    selectedTarget: 'tmax',
    stitchesPerDay: 28,
    extrasColor: '#f0f3f3',
  };

  export const settings = writable(JSON.parse(JSON.stringify(defaultSettings)));

  export const details = writable(null);

  export const hash = derived([settings, details], ([$settings, $details]) => {
    let hash = '&';
    hash += `${id}=`;
    hash += `${$settings.selectedTarget}`;
    hash += '(';
    hash += $settings.stitchesPerDay;
    if ($details && $details.countOfAdditionalStitches > 0)
      hash += `${CHARACTERS_FOR_URL_HASH.separator}${chroma($settings.extrasColor).hex().substring(1)}`;
    hash += ')';
    return hash;
  });

  export const load = (hash) => {
    let _settings = JSON.parse(JSON.stringify(defaultSettings));

    let startIndex, separatorIndex, lengthEndIndex;

    for (let i = 0; i < hash.length; i++) {
      if (hash[i] === '(') startIndex = i;
      if (
        hash[i] === CHARACTERS_FOR_URL_HASH.separator ||
        hash[i] == CHARACTERS_FOR_URL_HASH.separator_alt
      )
        separatorIndex = i;
      if (hash[i] === ')') lengthEndIndex = i;
    }

    if (!startIndex || !lengthEndIndex) return; // format of hash was wrong, so stop processing

    let target = hash.substring(0, startIndex);
    _settings.selectedTarget = target;

    // stitches per day
    let stitchesPerDay;
    if (separatorIndex) {
      stitchesPerDay = +hash.substring(startIndex + 1, separatorIndex);
    } else if (lengthEndIndex) {
      stitchesPerDay = +hash.substring(startIndex + 1, lengthEndIndex);
    }
    _settings.stitchesPerDay = stitchesPerDay;

    // color
    let color = '';
    if (separatorIndex && lengthEndIndex) {
      color = hash.substring(separatorIndex + 1, lengthEndIndex);
    }
    if (chroma.valid(color)) _settings.extrasColor = chroma(color).hex();

    settings.set(_settings);
    preview.setId(id);
  };
</script>

<script>
  import NumberInputButton from '$lib/components/buttons/NumberInputButton.svelte';
  import ChangeColor from '$lib/components/modals/ChangeColor.svelte';
  import { modal, weather } from '$lib/state';
  import { setTargets } from '$lib/utils';

  $: targets = gauges.allCreated.map((n) => n.targets).flat();

  $: if (gauges.allCreated)
    $settings.selectedTarget = setTargets($settings.selectedTarget);
</script>

{#if $details?.rounds}
  <div class="w-full">
    <div class="mx-auto max-w-screen-sm">
      <p class="mb-2">
        Starting from the center, stitches are added in a clockwise square
        pattern. Possible crochet patterns: Granny Square, Moss Stitch/Linen
        Stitch Square.
      </p>
      <p class="italic">
        {$details.rounds} rounds with {$details.countOfAdditionalStitches}
        additional
        {pluralize('stitch', $details.countOfAdditionalStitches, 'es')}.
      </p>
    </div>
  </div>
{/if}

<label class="label">
  <span>Color Using the {capitalizeFirstLetter(weather.grouping)}'s</span>
  <select
    class="select w-fit"
    id="cosq-param"
    bind:value={$settings.selectedTarget}
  >
    {#each targets as { id, label, icon }}
      <option value={id}>{icon} {label} </option>
    {/each}
  </select>
</label>

<NumberInputButton
  bind:value={$settings.stitchesPerDay}
  title="Stitches Per {capitalizeFirstLetter(weather.grouping)}"
  icon={true}
/>

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
      Color of Additional Stitches</button
    >
  {/if}
{/if}

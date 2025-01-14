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

<script context="module" lang="ts">
  import { CHARACTERS_FOR_URL_HASH } from '$lib/constants';
  import { gauges, preview } from '$lib/state';
  import { setSecondaryTargets } from '$lib/utils';
  import chroma from 'chroma-js';
  import { derived, writable } from 'svelte/store';

  const id: string = 'sqrs';

  const defaultSettings: {
    primaryTarget: string;
    squareSize: number;
    columns: number;
    secondaryTargets: string[];
    squaresAtBeginning: number;
    squaresBetweenMonthsCount: number;
    additionalSquaresColor: string;
    primaryTargetAsBackup: boolean;
  } = {
    primaryTarget: 'tmax',
    squareSize: 3,
    columns: 17,
    secondaryTargets: [],
    squaresAtBeginning: 0,
    squaresBetweenMonthsCount: 0,
    additionalSquaresColor: '#f0f3f3',
    primaryTargetAsBackup: true,
  };

  export const settings = writable(JSON.parse(JSON.stringify(defaultSettings)));

  export const details = writable(null);

  export const hash = derived(settings, ($settings) => {
    let hash = '&';
    hash += `${id}=`;
    hash += `${$settings.primaryTarget}(${$settings.squareSize}${CHARACTERS_FOR_URL_HASH.separator}${$settings.columns}${
      CHARACTERS_FOR_URL_HASH.separator
    }${$settings.squaresBetweenMonthsCount}${CHARACTERS_FOR_URL_HASH.separator}${chroma(
      $settings.additionalSquaresColor,
    )
      .hex()
      .substring(1)})`;

    if ($settings.primaryTargetAsBackup) hash += '1';
    else hash += '0';

    hash += `${$settings.squaresAtBeginning}!`;

    if ($settings.secondaryTargets.length) {
      $settings.secondaryTargets.forEach((item) => {
        hash += `${item.targetId}(${item.indexes.join(CHARACTERS_FOR_URL_HASH.separator)})`;
      });
    }
    return hash;
  });

  export const load = (hash: string) => {
    let _settings = JSON.parse(JSON.stringify(defaultSettings));

    let startIndex = [],
      endIndex = [];
    let exclamationIndex: number[] = [];
    const separatorIndex = [];
    for (let i = 0; i < hash.length; i++) {
      if (hash[i] === '(') startIndex.push(i);
      if (
        hash[i] === CHARACTERS_FOR_URL_HASH.separator ||
        hash[i] === CHARACTERS_FOR_URL_HASH.separator_alt
      )
        separatorIndex.push(i);
      if (hash[i] === ')') endIndex.push(i);
      if (hash[i] === '!') exclamationIndex.push(i);
    }
    if (!startIndex || !separatorIndex || !endIndex) return; // format of hash was wrong, so stop processing

    _settings.primaryTarget = hash.substring(0, startIndex[0]);
    // SquareSize
    _settings.squareSize = +hash.substring(
      startIndex[0] + 1,
      separatorIndex[0],
    );
    // Columns
    _settings.columns = +hash.substring(
      separatorIndex[0] + 1,
      separatorIndex[1],
    );

    // Layout
    if (
      hash.substring(separatorIndex[1] + 1, separatorIndex[2]).length > 1 &&
      +hash.substring(separatorIndex[1] + 1, separatorIndex[1] + 2) === 0
    )
      _settings.squaresBetweenMonthsCount = +hash.substring(
        separatorIndex[1] + 2,
        separatorIndex[2],
      );
    else if (
      hash.substring(separatorIndex[1] + 1, separatorIndex[2]).length >= 1
    )
      _settings.squaresBetweenMonthsCount = +hash.substring(
        separatorIndex[1] + 1,
        separatorIndex[2],
      );

    _settings.additionalSquaresColor = chroma(
      hash.substring(separatorIndex[2] + 1, endIndex[0]),
    ).hex();

    // primarytargetAsBackup
    const _primaryTargetAsBackup = hash.substring(
      endIndex[0] + 1,
      endIndex[0] + 2,
    );
    if (_primaryTargetAsBackup === '0') _settings.primaryTargetAsBackup = false;
    else _settings.primaryTargetAsBackup = true;

    // Squares at beginning
    if (exclamationIndex.length) {
      const squaresAtBeginning = +hash.substring(
        endIndex[0] + 2,
        exclamationIndex[0],
      );
      if (typeof squaresAtBeginning === 'number') {
        _settings.squaresAtBeginning = squaresAtBeginning;
      }
    }

    // Secondary Targets
    if (startIndex.length > 1) {
      for (let i = 1; i < startIndex.length; i++) {
        let targetId = hash.substring(startIndex[i] - 4, startIndex[i]);
        if (targetId === 'time') targetId = 'dayt'; // Bug fix in 1.67 (previous id was 'daytime' so it got cut off because it wasn't four characters long)
        const secondaryParamSeparatorIndex = separatorIndex.filter(
          (item) => item > startIndex[i] && item < endIndex[i],
        );
        let start = startIndex[i] + 1;
        for (
          let positionIndex = 0;
          positionIndex < secondaryParamSeparatorIndex.length + 1;
          positionIndex++
        ) {
          let end = secondaryParamSeparatorIndex[positionIndex] || endIndex[i];
          let value = hash.substring(start, end);
          start = end + 1;
          _settings.secondaryTargets = setSecondaryTargets(
            [targetId, +value],
            _settings.secondaryTargets,
          );
        }
      }
    }
    settings.set(_settings);
    preview.setId(id);
  };
</script>

<script lang="ts">
  import ChangeColor from '$lib/components/modals/ChangeColor.svelte';
  import SquareDesigner from '$lib/components/modals/SquareDesigner.svelte';
  import { modal } from '$lib/state';
  import { pluralize, setTargets } from '$lib/utils';

  $: targets = gauges.allCreated.map((n) => n.targets).flat();

  $: if (gauges.allCreated) {
    $settings.primaryTarget = setTargets($settings.primaryTarget);
    $settings.secondaryTargets = setTargets($settings.secondaryTargets);
  }

  function handelOkaySquareDesigner(e) {
    $settings.squareSize = e.squareSize;
    $settings.primaryTarget = e.primaryTarget;
    $settings.secondaryTargets = e.secondaryTargets;
    $settings.primaryTargetAsBackup = e.primaryTargetAsBackup;
  }
</script>

{#if $details}
  <div class="w-full">
    <p class="italic">
      {$details.rows} rows with {$details.additionalSquares} additional
      {pluralize('square', $details.additionalSquares)}.
    </p>
  </div>
{/if}

<button
  class="btn bg-secondary-hover-token gap-1"
  title="Edit Square Design"
  on:click={() =>
    modal.state.trigger({
      type: 'component',
      component: {
        ref: SquareDesigner,
        props: {
          targets,
          squareSize: $settings.squareSize,
          primaryTarget: $settings.primaryTarget,
          secondaryTargets: $settings.secondaryTargets,
          primaryTargetAsBackup: $settings.primaryTargetAsBackup,
          onOkay: handelOkaySquareDesigner,
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
      d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z"
    />
  </svg>
  Square Design
</button>

<label class="label">
  <span>Number of Columns</span>
  <select class="select w-fit" id="sqrs-columns" bind:value={$settings.columns}>
    {#each Array(300) as _, i}
      {#if i > 0}
        <option value={i}>
          {i}
        </option>
      {/if}
    {/each}
  </select>
</label>

<label class="label">
  <span>Squares at Beginning</span>
  <select
    class="select w-fit"
    id="sqrs-squares-at-beginning"
    bind:value={$settings.squaresAtBeginning}
  >
    {#each Array(51) as _, i}
      <option value={i}>
        {i}
      </option>
    {/each}
  </select>
</label>

<label class="label">
  <span>Squares Between Months</span>
  <select
    class="select w-fit"
    id="sqrs-squares-between-months"
    bind:value={$settings.squaresBetweenMonthsCount}
  >
    {#each Array(51) as _, i}
      <option value={i}>
        {i}
      </option>
    {/each}
  </select>
</label>

{#if $details?.additionalSquares || $settings?.squaresBetweenMonthsCount}
  <button
    class="btn bg-secondary-hover-token gap-1"
    title="Choose a Color"
    on:click={() =>
      modal.state.trigger({
        type: 'component',
        component: {
          ref: ChangeColor,
          props: {
            hex: $settings.additionalSquaresColor,
            onChangeColor: ({ hex }) =>
              ($settings.additionalSquaresColor = hex),
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
    Color of Additional Squares
  </button>
{/if}

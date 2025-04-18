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
  import ChangeColor from '$lib/components/modals/ChangeColor.svelte';
  import { gauges, modal, weather } from '$lib/state';
  import { pluralize } from '$lib/utils';
  import { capitalizeFirstLetter } from '$lib/utils/other-utils';
  import { ArrowRightIcon, InfoIcon, PipetteIcon } from '@lucide/svelte';
  import { squareRoundsPreview } from './state.svelte';
  import Tooltip from '$lib/components/Tooltip.svelte';

  let targets = $derived(gauges.allCreated.map((n) => n.targets).flat());

  let weatherRoundsPerSquare = $derived(
    squareRoundsPreview.weatherSquares[0].length,
  );

  let weatherRoundsinLastSquare = $derived(
    squareRoundsPreview.weatherSquares[
      squareRoundsPreview.weatherSquares.length - 1
    ].length,
  );

  let extraRounds = $derived.by(() => {
    if (weatherRoundsPerSquare === weatherRoundsinLastSquare) return 0;

    return weatherRoundsinLastSquare;
  });
</script>

<p class="w-full">Each round in a square represents one day.</p>

{#if squareRoundsPreview.rows}
  <div class="flex w-full flex-col italic">
    <p class="w-full">
      {squareRoundsPreview.settings.columns}
      {pluralize('column', squareRoundsPreview.settings.columns)} x {squareRoundsPreview.rows}
      {pluralize('row', squareRoundsPreview.rows)} = {squareRoundsPreview.totalSquares}
      total {pluralize('square', squareRoundsPreview.totalSquares)}

      {#if extraRounds}
        , 1 square has {extraRounds} of {weatherRoundsPerSquare}
        {pluralize('round', weatherRoundsPerSquare)} of weather data
      {/if}

      {#if squareRoundsPreview.extraSquares}
        , {squareRoundsPreview.extraSquares}
        {pluralize('square', squareRoundsPreview.extraSquares)}
        {pluralize(
          { singular: 'has', plural: 'have' },
          squareRoundsPreview.extraSquares,
        )} no weather data
      {/if}

      {#if extraRounds || squareRoundsPreview.extraSquares}
        <Tooltip tooltipClass="">
          <InfoIcon class="-top[1px] relative inline size-5" />
          {#snippet tooltip()}
            <p class="text-warning-800-200 not-italic">
              Adjust the <span class="inline font-bold">Layout Settings</span>
              or
              <span class="inline font-bold">Square Settings</span>
              <ArrowRightIcon class="relative -top-[2px] inline size-4" />
              <span class="inline font-bold">Days Per Square</span>
              below to avoid rounds of no weather data.
            </p>
          {/snippet}
        </Tooltip>
      {/if}
    </p>
  </div>
{/if}

<div
  class="preset-outlined-surface-300-700 card flex flex-col items-start gap-4 p-4"
>
  <p class="text-2xl font-bold">Layout Settings</p>

  <label class="label">
    Size (width)
    <select
      class="select w-fit min-w-[120px]"
      bind:value={squareRoundsPreview.settings.columns}
    >
      {#each Array(weather.data.length), i}
        {@const number = i + 1}
        <option value={number}>
          {number}
          {pluralize('square', number)}
        </option>
      {/each}
    </select>
  </label>

  <div class="flex flex-col items-start">
    <p class="font-bold">Border</p>
    <label class="label max-w-[250px]">
      Use the Last <select
        class="select inline w-fit min-w-[60px]"
        bind:value={squareRoundsPreview.settings.layoutBorder}
      >
        {#each Array(weather.data.length), i}
          <option value={i}>
            {i}
          </option>
        {/each}
      </select>
      {pluralize('Day', squareRoundsPreview.settings.layoutBorder)} of Weather Data
      as {pluralize(
        { singular: 'a', plural: '' },
        squareRoundsPreview.settings.layoutBorder,
      )} Border {pluralize('Round', squareRoundsPreview.settings.layoutBorder)}
    </label>
  </div>
</div>

<div
  class="preset-outlined-surface-300-700 card flex flex-col items-start gap-4 p-4"
>
  <p class="text-2xl font-bold">Square Settings</p>

  <label class="label">
    Days Per Square
    <select
      class="select w-fit min-w-[60px]"
      bind:value={squareRoundsPreview.settings.daysPerSquare}
    >
      {#each Array(weather.data.length), i}
        <option value={i + 1}>
          {i + 1}
        </option>
      {/each}
    </select>
  </label>

  <label class="label">
    Border Around Each Square
    <select
      class="select w-fit min-w-[120px]"
      bind:value={squareRoundsPreview.settings.squareBorder}
    >
      {#each Array(51), i}
        <option value={i}>
          {i}
          {pluralize('round', i)}
        </option>
      {/each}
    </select>
  </label>

  <button
    class="btn hover:preset-tonal text-left whitespace-pre-wrap"
    title="Choose a Color"
    onclick={() =>
      modal.trigger({
        type: 'component',
        component: {
          ref: ChangeColor,
          props: {
            hex: squareRoundsPreview.settings.additionalRoundsColor,
            onChangeColor: ({ hex }) => {
              squareRoundsPreview.settings.additionalRoundsColor = hex;
              modal.close();
            },
          },
        },
      })}
  >
    <PipetteIcon />
    Color of Square Border and Additional Rounds
  </button>
</div>

<div
  class="preset-outlined-surface-300-700 card flex flex-col items-start gap-4 p-4"
>
  <p class="text-2xl font-bold">Round Settings</p>

  <label class="label">
    <span
      >Color Each Round Using the {capitalizeFirstLetter(
        weather.grouping,
      )}'s</span
    >
    <select
      class="select w-fit"
      id="msqs-param"
      bind:value={squareRoundsPreview.settings.selectedTarget}
    >
      {#each targets as { id, label, icon }}
        <option value={id}>{icon} {label} </option>
      {/each}
    </select>
  </label>
</div>

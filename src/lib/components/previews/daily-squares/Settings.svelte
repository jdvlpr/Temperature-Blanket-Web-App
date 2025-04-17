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
  import NumberInputButton from '$lib/components/buttons/NumberInputButton.svelte';
  import ChangeColor from '$lib/components/modals/ChangeColor.svelte';
  import { gauges, modal, weather } from '$lib/state';
  import { pluralize } from '$lib/utils';
  import { capitalizeFirstLetter } from '$lib/utils/other-utils';
  import { PipetteIcon } from '@lucide/svelte';
  import { dailySquaresPreview } from './state.svelte';
  import ToggleSwitch from '$lib/components/buttons/ToggleSwitch.svelte';

  let targets = $derived(gauges.allCreated.map((n) => n.targets).flat());
</script>

<p class="w-full">
  Each square represents {dailySquaresPreview.settings.daysPerSquare}
  {pluralize('day', dailySquaresPreview.settings.daysPerSquare)}. Each round in
  a square represents one day.
</p>

{#if dailySquaresPreview.rows}
  <p class="w-full italic">
    {dailySquaresPreview.settings.columns}
    {pluralize('column', dailySquaresPreview.settings.columns)}, {dailySquaresPreview.rows}
    {pluralize('row', dailySquaresPreview.rows)}

    {#if dailySquaresPreview.extraSquares}
      , {dailySquaresPreview.extraSquares}
      empty {pluralize('square', dailySquaresPreview.extraSquares)}
    {/if}
  </p>
{/if}

<div
  class="preset-outlined-surface-300-700 card flex flex-col items-start gap-4 p-4"
>
  <p class="text-2xl font-bold">Layout Settings</p>

  <label class="label">
    Number of Columns
    <select
      class="select w-fit min-w-[60px]"
      id="sqrs-columns"
      bind:value={dailySquaresPreview.settings.columns}
    >
      {#each Array(weather.data.length), i}
        <option value={i + 1}>
          {i + 1}
        </option>
      {/each}
    </select>
  </label>

  <label class="label max-w-[230px]">
    Use the Last <select
      class="select inline w-fit min-w-[60px]"
      id="sqrs-columns"
      bind:value={dailySquaresPreview.settings.layoutBorder}
    >
      {#each Array(weather.data.length), i}
        <option value={i}>
          {i}
        </option>
      {/each}
    </select>
    {pluralize(weather.grouping, dailySquaresPreview.settings.layoutBorder)} of Weather
    Data as the Border
  </label>
</div>

<div
  class="preset-outlined-surface-300-700 card flex flex-col items-start gap-4 p-4"
>
  <p class="text-2xl font-bold">Square Settings</p>

  <label class="label">
    {capitalizeFirstLetter(weather.grouping)}s Per Square
    <select
      class="select w-fit min-w-[60px]"
      bind:value={dailySquaresPreview.settings.daysPerSquare}
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
      class="select w-fit min-w-[60px]"
      bind:value={dailySquaresPreview.settings.squareBorder}
    >
      {#each Array(51), i}
        <option value={i}>
          {i}
        </option>
      {/each}
    </select>
  </label>

  <button
    class="btn hover:preset-tonal"
    title="Choose a Color"
    onclick={() =>
      modal.trigger({
        type: 'component',
        component: {
          ref: ChangeColor,
          props: {
            hex: dailySquaresPreview.settings.additionalRoundsColor,
            onChangeColor: ({ hex }) => {
              dailySquaresPreview.settings.additionalRoundsColor = hex;
              modal.close();
            },
          },
        },
      })}
  >
    <PipetteIcon />
    Color of Additional Rounds
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
      bind:value={dailySquaresPreview.settings.selectedTarget}
    >
      {#each targets as { id, label, icon }}
        <option value={id}>{icon} {label} </option>
      {/each}
    </select>
  </label>
</div>

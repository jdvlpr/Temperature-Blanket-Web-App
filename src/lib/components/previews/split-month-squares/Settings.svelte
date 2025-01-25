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
  import { capitalizeFirstLetter } from '$lib/utils/other-utils';
  import { splitMonthSquaresPreview } from './state.svelte';

  let targets = $derived(gauges.allCreated.flatMap((n) => n.targets));
</script>

<p class="w-full">
  Each square represents one month. Each round in a square represents one day,
  starting with the first of the month in the center of the square. Each round
  is split in half to represent two different weather parameters. Months with
  fewer days have extra rounds added, so that each square has the same number of
  rounds.
</p>

{#if splitMonthSquaresPreview.details}
  <p class="italic w-full">
    Each square has {splitMonthSquaresPreview.details.roundsPerSquare} total rounds.
  </p>
{/if}

<label class="label">
  <span>Dimensions (W x H)</span>
  <select
    class="select w-fit"
    id="smsq-dimensions"
    bind:value={splitMonthSquaresPreview.settings.dimensions}
  >
    {#each splitMonthSquaresPreview.possibleDimensions as value}
      <option {value}>{value}</option>
    {/each}
  </select>
</label>

<label class="label">
  <span
    >Color Left Side Using the {capitalizeFirstLetter(weather.grouping)}'s</span
  >
  <select
    class="select w-fit"
    id="smsq-left-params"
    bind:value={splitMonthSquaresPreview.settings.leftTarget}
  >
    {#each targets as { id, label, icon }}
      <option value={id}>{icon} {label}</option>
    {/each}
  </select>
</label>

<label class="label">
  <span
    >Color Right Side Using the {capitalizeFirstLetter(
      weather.grouping,
    )}'s</span
  >
  <select
    class="select w-fit"
    id="smsq-right-params"
    bind:value={splitMonthSquaresPreview.settings.rightTarget}
  >
    {#each targets as { id, label, icon }}
      <option value={id}>{icon} {label}</option>
    {/each}
  </select>
</label>

<NumberInputButton
  bind:value={splitMonthSquaresPreview.settings.additionalRoundsPerSquare}
  title="Additional Rounds Per Square"
  min={0}
  icon={true}
/>

<button
  class="btn bg-secondary-hover-token gap-1"
  title="Choose a Color"
  onclick={() =>
    modal.state.trigger({
      type: 'component',
      component: {
        ref: ChangeColor,
        props: {
          hex: splitMonthSquaresPreview.settings.additionalRoundsColor,
          onChangeColor: ({ hex }) =>
            (splitMonthSquaresPreview.settings.additionalRoundsColor = hex),
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
  Color of Additional Rounds
</button>

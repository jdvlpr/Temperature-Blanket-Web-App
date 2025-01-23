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

<script>
  import ToggleSwitch from '$lib/components/buttons/ToggleSwitch.svelte';
  import ChangeColor from '$lib/components/modals/ChangeColor.svelte';
  import SquareDesigner from '$lib/components/modals/SquareDesigner.svelte';
  import { DAYS_OF_THE_WEEK } from '$lib/constants';
  import { gauges, modal, weather } from '$lib/state';
  import { calendarPreview } from '$lib/state/previews/calendar-preview-state.svelte';

  let targets = $derived(gauges.allCreated.map((n) => n.targets).flat());

  // let factors = $derived(getFactors({ length: calendarPreview.months.length }));

  // let possibleDimensions = $derived(getPossibleDimensions({ factors }));

  function handelOkaySquareDesigner(e) {
    calendarPreview.settings.squareSize = e.squareSize;
    calendarPreview.settings.primaryTarget = e.primaryTarget;
    calendarPreview.settings.secondaryTargets = e.secondaryTargets;
    calendarPreview.settings.primaryTargetAsBackup = e.primaryTargetAsBackup;
  }
</script>

<p class="w-full">
  Squares are arranged in a calendar-like grid, grouped by month.
</p>

<label class="label">
  <span>Dimensions (W x H)</span>
  <select
    class="select w-fit"
    id="clnr-dimensions"
    bind:value={calendarPreview.settings.dimensions}
  >
    {#each calendarPreview.possibleDimensions as value}
      <option {value}>{value}</option>
    {/each}
  </select>
</label>

<button
  class="btn bg-secondary-hover-token gap-1"
  title="Edit Square Design"
  onclick={async () => {
    modal.state.trigger({
      type: 'component',
      component: {
        ref: SquareDesigner,
        props: {
          targets,
          squareSize: calendarPreview.settings.squareSize,
          primaryTarget: calendarPreview.settings.primaryTarget,
          secondaryTargets: calendarPreview.settings.secondaryTargets,
          primaryTargetAsBackup: calendarPreview.settings.primaryTargetAsBackup,
          onOkay: handelOkaySquareDesigner,
        },
      },
    });
  }}
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

  Square Design</button
>

<label class="label">
  <span>Weeks Start On</span>
  <select
    class="select w-fit"
    bind:value={calendarPreview.settings.weekStartCode}
    onchange={() => {
      if (weather.grouping === 'week')
        weather.monthGroupingStartDay = calendarPreview.settings.weekStartCode;
    }}
  >
    {#each DAYS_OF_THE_WEEK as { value, label }}
      <option {value}>{label}</option>
    {/each}
  </select>
</label>

<div class="flex gap-2 items-center">
  <ToggleSwitch
    bind:checked={calendarPreview.settings.monthPadding}
    label="Space around months"
  />
</div>

<button
  class="btn bg-secondary-hover-token gap-1"
  title="Choose a Color"
  onclick={() =>
    modal.state.trigger({
      type: 'component',
      component: {
        ref: ChangeColor,
        props: {
          hex: calendarPreview.settings.additionalSquaresColor,
          onChangeColor: ({ hex }) =>
            (calendarPreview.settings.additionalSquaresColor = hex),
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

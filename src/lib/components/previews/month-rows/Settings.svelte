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
  import ToggleSwitchGroup from '$lib/components/buttons/ToggleSwitchGroup.svelte';
  import ChangeColor from '$lib/components/modals/ChangeColor.svelte';
  import { gauges, modal, weather } from '$lib/state';
  import { pluralize } from '$lib/utils';
  import { capitalizeFirstLetter } from '$lib/utils/other-utils';
  import { monthRowsPreview } from './state.svelte';

  let targets = $derived(gauges.allCreated.flatMap((n) => n.targets));
</script>

{#if monthRowsPreview.details}
  <div class="w-full">
    <p class="max-w-(--breakpoint-sm) mx-auto">
      Rows are grouped by month from <span class="italic"
        >{#if monthRowsPreview.settings?.direction === 'left-to-right'}left to
          right{:else if monthRowsPreview.settings.direction === 'top-to-bottom'}top
          to bottom{/if}</span
      >. Months with fewer days have extra rows added, so that each month
      section has the same number of rows.
    </p>
    <p class="italic mt-2">
      Each month section has {monthRowsPreview.details.rowsPerMonth} total {pluralize(
        'row',
        monthRowsPreview.details.rowsPerMonth,
      )}.
    </p>
  </div>
{/if}

<label class="label">
  <span>Dimensions (W x H)</span>
  <select
    class="select w-fit"
    id="mrws-dimensions"
    bind:value={monthRowsPreview.settings.dimensions}
  >
    {#each monthRowsPreview.possibleDimensions as value}
      <option {value}>{value}</option>
    {/each}
  </select>
</label>

<label class="label">
  <span>Direction</span>
  <select
    class="select w-fit"
    id="mrws-direction"
    bind:value={monthRowsPreview.settings.direction}
  >
    <option value="left-to-right">Left to Right</option>
    <option value="top-to-bottom">Top to Bottom</option>
  </select>
</label>

<div class="text-left">
  <ToggleSwitchGroup
    groupLabel={`Color Using the ${capitalizeFirstLetter(weather.grouping)}'s`}
    {targets}
    bind:value={monthRowsPreview.settings.selectedTargets}
  />
</div>

<NumberInputButton
  bind:value={monthRowsPreview.settings.stitchesPerRow}
  title="Stitches Per Row"
  icon={true}
/>

<button
  class="btn hover:preset-tonal gap-1"
  title="Choose a Color for Extra Rows"
  onclick={() =>
    modal.trigger({
      type: 'component',
      component: {
        ref: ChangeColor,
        props: {
          hex: monthRowsPreview.settings.extrasColor,
          onChangeColor: ({ hex }) => {
            monthRowsPreview.settings.extrasColor = hex;
            modal.close();
          },
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
  bind:value={monthRowsPreview.settings.borderStitches}
  min={0}
  title="Border Stitches"
  icon={true}
/>

{#if monthRowsPreview.settings.borderStitches > 0}
  <button
    class="btn hover:preset-tonal gap-1"
    title="Choose a Color for Border Stitches"
    onclick={() =>
      modal.trigger({
        type: 'component',
        component: {
          ref: ChangeColor,
          props: {
            hex: monthRowsPreview.settings.borderColor,
            onChangeColor: ({ hex }) => {
              monthRowsPreview.settings.borderColor = hex;
              modal.close();
            },
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

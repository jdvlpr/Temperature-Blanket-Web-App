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
  import NumberInputButton from '$lib/components/buttons/NumberInputButton.svelte';
  import ToggleSwitchGroup from '$lib/components/buttons/ToggleSwitchGroup.svelte';
  import ChangeColor from '$lib/components/modals/ChangeColor.svelte';
  import { gaugesState, modal, weatherGrouping } from '$lib/state';
  import { rowsPreview } from '$lib/state/previews/rows-preview-state.svelte';
  import { capitalizeFirstLetter, pluralize, setTargets } from '$lib/utils';

  let targets = $derived(gaugesState.gauges.map((n) => n.targets).flat());

  let debounceTimer;
  const debounce = (callback, time) => {
    window.clearTimeout(debounceTimer);
    debounceTimer = window.setTimeout(callback, time);
  };

  $effect(() => {
    debounce(() => {
      if (gaugesState.gauges)
        rowsPreview.settings.selectedTargets = setTargets(
          rowsPreview.settings.selectedTargets,
        );
    }, 1000);
  });
</script>

<div class="w-full italic">
  <p>
    {rowsPreview.totalRows}
    {pluralize('row', rowsPreview.totalRows)}.
    {#if rowsPreview.countOfAdditionalStitches}
      {Number.isInteger(rowsPreview.countOfAdditionalStitches)
        ? rowsPreview.countOfAdditionalStitches
        : `~ ${Math.round(rowsPreview.countOfAdditionalStitches)}`}
      additional {pluralize(
        {
          singular: 'stitch',
          plural: 'stitches',
        },
        Math.round(rowsPreview.countOfAdditionalStitches),
      )}.
    {/if}
  </p>
  {#if rowsPreview.countOfAdditionalStitches}
    <p>
      Stitches are counted using the parameter's absolute value rounded to the
      nearest non-zero integer. A temperature or hieght of zero is rounded up to
      one. Any missing values use the custom stitches per {weatherGrouping.value}
      value.
    </p>
  {/if}
</div>

<div class="text-left">
  <ToggleSwitchGroup
    groupLabel={`Color Using the ${capitalizeFirstLetter(weatherGrouping.value)}'s`}
    {targets}
    bind:value={rowsPreview.settings.selectedTargets}
  />
</div>

<NumberInputButton
  bind:value={rowsPreview.settings.stitchesPerRow}
  title="Stitches Per Row"
  icon={true}
/>

<label class="label">
  <span>Stitches Per {capitalizeFirstLetter(weatherGrouping.value)} Using</span>
  <select
    class="select w-fit"
    id="rows-length-param"
    bind:value={rowsPreview.settings.lengthTarget}
  >
    <option value="none">Entire Row Length</option>
    {#each targets as { id, label, icon }}
      <option value={id}>{icon} {label}</option>
    {/each}
    <option value="custom">Custom Length</option>
  </select>
</label>

{#if rowsPreview.settings.lengthTarget === 'custom'}
  <NumberInputButton
    bind:value={rowsPreview.settings.stitchesPerDay}
    title="Stitches Per {capitalizeFirstLetter(weatherGrouping.value)}"
    icon={true}
  />
{/if}

{#if rowsPreview.countOfAdditionalStitches}
  <button
    class="btn bg-secondary-hover-token gap-1"
    title="Choose a Color"
    onclick={() =>
      modal.state.trigger({
        type: 'component',
        component: {
          ref: ChangeColor,
          props: {
            hex: rowsPreview.settings.extrasColor,
            onChangeColor: ({ hex }) =>
              (rowsPreview.settings.extrasColor = hex),
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

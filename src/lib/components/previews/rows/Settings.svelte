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
  import { rowsPreview } from '$lib/components/previews/rows/state.svelte';
  import { gauges, modal, weather } from '$lib/state';
  import { capitalizeFirstLetter, pluralize } from '$lib/utils';
  import { PipetteIcon } from '@lucide/svelte';

  let targets = $derived(gauges.allCreated.map((n) => n.targets).flat());
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
      one. Any missing values use the custom stitches per {weather.grouping}
      value.
    </p>
  {/if}
</div>

<div class="text-left">
  <ToggleSwitchGroup
    groupLabel={`Color Using the ${capitalizeFirstLetter(weather.grouping)}'s`}
    {targets}
    bind:value={rowsPreview.settings.selectedTargets}
  />
</div>

<NumberInputButton
  bind:value={rowsPreview.settings.stitchesPerRow}
  title="Stitches Per Row"
  icon={`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-ruler size-6"><path d="M21.3 15.3a2.4 2.4 0 0 1 0 3.4l-2.6 2.6a2.4 2.4 0 0 1-3.4 0L2.7 8.7a2.41 2.41 0 0 1 0-3.4l2.6-2.6a2.41 2.41 0 0 1 3.4 0Z"/><path d="m14.5 12.5 2-2"/><path d="m11.5 9.5 2-2"/><path d="m8.5 6.5 2-2"/><path d="m17.5 15.5 2-2"/></svg>`}
/>

<label class="label">
  <span>Stitches Per {capitalizeFirstLetter(weather.grouping)} Using</span>
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
    title="Stitches Per {capitalizeFirstLetter(weather.grouping)}"
    icon={true}
  />
{/if}

{#if rowsPreview.countOfAdditionalStitches}
  <button
    class="btn hover:preset-tonal gap-1"
    title="Choose a color for any additional stitches"
    onclick={() =>
      modal.trigger({
        type: 'component',
        component: {
          ref: ChangeColor,
          props: {
            hex: rowsPreview.settings.extrasColor,
            onChangeColor: ({ hex }) => {
              rowsPreview.settings.extrasColor = hex;
              modal.close();
            },
          },
        },
      })}
  >
    <PipetteIcon />
    Color of Additional Stitches
  </button>
{/if}

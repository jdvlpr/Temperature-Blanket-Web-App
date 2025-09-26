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
  import PreviewInfo from '$lib/components/PreviewInfo.svelte';
  import { rowsPreview } from '$lib/components/previews/rows/state.svelte';
  import SpanYarnColorSelectIcon from '$lib/components/SpanYarnColorSelectIcon.svelte';
  import { gauges, modal, weather } from '$lib/state';
  import { capitalizeFirstLetter, pluralize } from '$lib/utils';

  let targets = $derived(gauges.allCreated.map((n) => n.targets).flat());
</script>

<PreviewInfo previewTitle={rowsPreview.name}>
  {#snippet description()}
    Each {weather.grouping} is represented by a row of stitches, added from {#if rowsPreview.countOfAdditionalStitches}
      left to right and ‎{/if}top to bottom.
  {/snippet}
  {#snippet details()}
    There are <span class="font-semibold"
      >{rowsPreview.totalRows}
      {pluralize('row', rowsPreview.totalRows)}</span
    >{#if rowsPreview.countOfAdditionalStitches}
      ‎ and <span class="font-semibold">
        {Number.isInteger(rowsPreview.countOfAdditionalStitches)
          ? rowsPreview.countOfAdditionalStitches
          : ` ${Math.round(rowsPreview.countOfAdditionalStitches)}`}
        additional {pluralize(
          {
            singular: 'stitch',
            plural: 'stitches',
          },
          Math.round(rowsPreview.countOfAdditionalStitches),
        )}
      </span>
    {/if}.

    {#if rowsPreview.countOfAdditionalStitches}
      <span class="mt-1 inline-block text-sm">
        Stitches are counted using the parameter's absolute value rounded to the
        nearest non-zero integer. A temperature or height of zero is rounded up
        to one. Any missing values use the custom stitches per {weather.grouping}
        value.
      </span>
    {/if}
  {/snippet}
</PreviewInfo>

<div
  class="preset-outlined-surface-300-700 card flex flex-col items-start gap-4 p-4"
>
  <p class="text-2xl font-bold">Settings</p>

  <ToggleSwitchGroup
    groupLabel={`Color Each Row Using the ${capitalizeFirstLetter(weather.grouping)}'s`}
    {targets}
    bind:value={rowsPreview.settings.selectedTargets}
  />

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
      class="btn hover:preset-tonal"
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
      <SpanYarnColorSelectIcon color={rowsPreview.settings.extrasColor} />
      Color of Additional Stitches
    </button>
  {/if}
</div>

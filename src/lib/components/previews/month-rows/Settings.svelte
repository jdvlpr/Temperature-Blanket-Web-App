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
  import PreviewInfo from '$lib/components/PreviewInfo.svelte';
  import SpanYarnColorSelectIcon from '$lib/components/SpanYarnColorSelectIcon.svelte';
  import { gauges, dialog, weather } from '$lib/state';
  import { pluralize } from '$lib/utils';
  import { capitalizeFirstLetter } from '$lib/utils/other-utils';
  import { SquareDashedIcon } from '@lucide/svelte';
  import { monthRowsPreview } from './state.svelte';

  let targets = $derived(gauges.allCreated.flatMap((n) => n.targets));
</script>

{#if monthRowsPreview.details}
  <PreviewInfo previewTitle={monthRowsPreview.name}>
    {#snippet description()}
      Rows are grouped by month from <span class="font-semibold"
        >{#if monthRowsPreview.settings?.direction === 'left-to-right'}left to
          right{:else if monthRowsPreview.settings.direction === 'top-to-bottom'}top
          to bottom{/if}</span
      >. Months with fewer days have extra rows added, so that each month
      section has the same number of rows.
    {/snippet}
    {#snippet details()}
      There are <span class="font-semibold"
        >{monthRowsPreview.monthsInData.length} month
        {pluralize('section', monthRowsPreview.monthsInData.length)}</span
      >. Each month section has
      <span class="font-semibold"
        >{monthRowsPreview.details.rowsPerMonth} total {pluralize(
          'row',
          monthRowsPreview.details.rowsPerMonth,
        )}</span
      >.
    {/snippet}
  </PreviewInfo>
{/if}

<div
  class="preset-outlined-surface-300-700 card flex flex-col items-start gap-4 p-4"
>
  <p class="text-2xl font-bold">Layout Settings</p>

  <label class="label">
    <span>Size (width x height)</span>
    <select
      class="select w-fit min-w-[210px]"
      id="mrws-dimensions"
      bind:value={monthRowsPreview.settings.dimensions}
    >
      {#each monthRowsPreview.possibleDimensions as value}
        {@const [width, height] = value.split('x')}
        <option {value}
          >{width}
          {pluralize('month', +width)} x {height}
          {pluralize('month', +height)}</option
        >
      {/each}
    </select>
  </label>

  <label class="label">
    <span>Direction</span>
    <select
      class="select w-fit min-w-[210px]"
      id="mrws-direction"
      bind:value={monthRowsPreview.settings.direction}
    >
      <option value="left-to-right">→ Left to Right</option>
      <option value="top-to-bottom">↓ Top to Bottom</option>
    </select>
  </label>
</div>

<div
  class="preset-outlined-surface-300-700 card flex flex-col items-start gap-4 p-4"
>
  <p class="text-2xl font-bold">Month Settings</p>
  <NumberInputButton
    bind:value={monthRowsPreview.settings.borderStitches}
    min={0}
    title="Border Size"
    icon={SquareDashedIcon}
  />

  {#if monthRowsPreview.settings.borderStitches > 0}
    <button
      class="btn hover:preset-tonal"
      title="Choose a Color for Border Stitches"
      onclick={() =>
        dialog.trigger({
          type: 'component',
          component: {
            ref: ChangeColor,
            props: {
              hex: monthRowsPreview.settings.borderColor,
              onChangeColor: ({ hex }) => {
                monthRowsPreview.settings.borderColor = hex;
                dialog.close();
              },
            },
          },
        })}
    >
      <SpanYarnColorSelectIcon color={monthRowsPreview.settings.borderColor} />
      Accent Color (for borders)</button
    >
  {/if}
</div>

<div
  class="preset-outlined-surface-300-700 card flex flex-col items-start gap-4 p-4"
>
  <p class="text-2xl font-bold">Row Settings</p>

  <ToggleSwitchGroup
    groupLabel={`Color Each Row Using the ${capitalizeFirstLetter(weather.grouping)}'s`}
    {targets}
    bind:value={monthRowsPreview.settings.selectedTargets}
  />

  <NumberInputButton
    bind:value={monthRowsPreview.settings.stitchesPerRow}
    title="Stitches Per Row"
  />

  <button
    class="btn hover:preset-tonal"
    title="Choose a Color for Extra Rows"
    onclick={() =>
      dialog.trigger({
        type: 'component',
        component: {
          ref: ChangeColor,
          props: {
            hex: monthRowsPreview.settings.extrasColor,
            onChangeColor: ({ hex }) => {
              monthRowsPreview.settings.extrasColor = hex;
              dialog.close();
            },
          },
        },
      })}
  >
    <SpanYarnColorSelectIcon color={monthRowsPreview.settings.extrasColor} />
    Color of Extra Rows</button
  >
</div>

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
  import SpanYarnColorSelectIcon from '$lib/components/SpanYarnColorSelectIcon.svelte';
  import { gauges, modal, weather } from '$lib/state';
  import { pluralize } from '$lib/utils';
  import { capitalizeFirstLetter } from '$lib/utils/other-utils';
  import { monthRowsPreview } from './state.svelte';

  let targets = $derived(gauges.allCreated.flatMap((n) => n.targets));
</script>

{#if monthRowsPreview.details}
  <div class="w-full">
    <p class="mx-auto max-w-(--breakpoint-sm)">
      Rows are grouped by month from <span class="italic"
        >{#if monthRowsPreview.settings?.direction === 'left-to-right'}left to
          right{:else if monthRowsPreview.settings.direction === 'top-to-bottom'}top
          to bottom{/if}</span
      >. Months with fewer days have extra rows added, so that each month
      section has the same number of rows.
    </p>
    <p class="mt-2 italic">
      Each month section has {monthRowsPreview.details.rowsPerMonth} total {pluralize(
        'row',
        monthRowsPreview.details.rowsPerMonth,
      )}.
    </p>
  </div>
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
    icon={`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-square-dashed size-6"><path d="M5 3a2 2 0 0 0-2 2"/><path d="M19 3a2 2 0 0 1 2 2"/><path d="M21 19a2 2 0 0 1-2 2"/><path d="M5 21a2 2 0 0 1-2-2"/><path d="M9 3h1"/><path d="M9 21h1"/><path d="M14 3h1"/><path d="M14 21h1"/><path d="M3 9v1"/><path d="M21 9v1"/><path d="M3 14v1"/><path d="M21 14v1"/></svg>`}
  />

  {#if monthRowsPreview.settings.borderStitches > 0}
    <button
      class="btn hover:preset-tonal"
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
    >
      <SpanYarnColorSelectIcon color={monthRowsPreview.settings.borderColor} />
      Color of Border Stitches</button
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
    icon={`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-ruler size-6"><path d="M21.3 15.3a2.4 2.4 0 0 1 0 3.4l-2.6 2.6a2.4 2.4 0 0 1-3.4 0L2.7 8.7a2.41 2.41 0 0 1 0-3.4l2.6-2.6a2.41 2.41 0 0 1 3.4 0Z"/><path d="m14.5 12.5 2-2"/><path d="m11.5 9.5 2-2"/><path d="m8.5 6.5 2-2"/><path d="m17.5 15.5 2-2"/></svg>`}
  />

  <button
    class="btn hover:preset-tonal"
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
  >
    <SpanYarnColorSelectIcon color={monthRowsPreview.settings.extrasColor} />
    Color of Extra Rows</button
  >
</div>

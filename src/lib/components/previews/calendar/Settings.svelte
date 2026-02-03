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
  import PreviewInfo from '$lib/components/PreviewInfo.svelte';
  import { calendarPreview } from '$lib/components/previews/calendar/state.svelte';
  import SpanYarnColorSelectIcon from '$lib/components/SpanYarnColorSelectIcon.svelte';
  import { DAYS_OF_THE_WEEK } from '$lib/constants';
  import { gauges, dialog, weather } from '$lib/state';
  import { pluralize } from '$lib/utils';
  import { SquareSquareIcon } from '@lucide/svelte';

  let targets = $derived(gauges.allCreated.map((n) => n.targets).flat());

  // let factors = $derived(getFactors({ length: calendarPreview.months.length }));

  // let possibleDimensions = $derived(getPossibleDimensions({ factors }));

  function handelOkaySquareDesigner(e) {
    calendarPreview.settings = {
      ...calendarPreview.settings,
      squareSize: e.squareSize,
      primaryTarget: e.primaryTarget,
      secondaryTargets: e.secondaryTargets,
      primaryTargetAsBackup: e.primaryTargetAsBackup,
    };
  }
</script>

<PreviewInfo previewTitle={calendarPreview.name}>
  {#snippet description()}
    Squares are arranged in a calendar-like grid, grouped by month.
  {/snippet}
</PreviewInfo>

<div
  class="preset-outlined-surface-300-700 card flex flex-col items-start gap-4 p-4"
>
  <p class="text-2xl font-bold">Layout Settings</p>

  <label class="label">
    <span class="label-text">Size (width x height)</span>
    <select
      class="select w-fit min-w-[210px]"
      bind:value={calendarPreview.settings.dimensions}
    >
      {#each calendarPreview.possibleDimensions as value}
        {@const [width, height] = value.split('x')}
        <option {value}
          >{width}
          {pluralize('month', +width)} x {height}
          {pluralize('month', +height)}</option
        >
      {/each}
    </select>
  </label>

  <ToggleSwitch
    bind:checked={calendarPreview.settings.monthPadding}
    label="Space around months"
  />

  <label class="label">
    <span class="label-text">Weeks Start On</span>
    <select
      class="select w-fit"
      bind:value={calendarPreview.settings.weekStartCode}
      onchange={() => {
        if (weather.grouping === 'week')
          weather.monthGroupingStartDay =
            calendarPreview.settings.weekStartCode;
      }}
    >
      {#each DAYS_OF_THE_WEEK as { value, label }}
        <option {value}>{label}</option>
      {/each}
    </select>
  </label>
</div>
<div
  class="preset-outlined-surface-300-700 card flex flex-col items-start gap-4 p-4"
>
  <p class="text-2xl font-bold">Square Settings</p>

  <button
    class="btn hover:preset-tonal-surface"
    title="Edit Square Design"
    onclick={async () => {
      dialog.trigger({
        type: 'component',
        component: {
          ref: SquareDesigner,
          props: {
            targets,
            squareSize: calendarPreview.settings.squareSize,
            primaryTarget: calendarPreview.settings.primaryTarget,
            secondaryTargets: $state.snapshot(
              calendarPreview.settings.secondaryTargets,
            ),
            primaryTargetAsBackup:
              calendarPreview.settings.primaryTargetAsBackup,
            onOkay: handelOkaySquareDesigner,
          },
        },
      });
    }}
  >
    <SquareSquareIcon />
    Customize Square Design</button
  >

  <button
    class="btn hover:preset-tonal-surface"
    title="Choose a Color"
    onclick={() =>
      dialog.trigger({
        type: 'component',
        component: {
          ref: ChangeColor,
          props: {
            hex: calendarPreview.settings.additionalSquaresColor,
            onChangeColor: ({ hex }) => {
              calendarPreview.settings.additionalSquaresColor = hex;
              dialog.close();
            },
          },
        },
        options: {
          size: 'large',
        },
      })}
  >
    <SpanYarnColorSelectIcon
      color={calendarPreview.settings.additionalSquaresColor}
    />
    Accent Color (for additional squares)
  </button>

  <label class="label">
    <span class="label-text">Border Size</span>
    <select
      class="select w-fit min-w-[110px]"
      bind:value={calendarPreview.settings.joinStitches}
    >
      {#each Array(11) as _, i}
        <option value={i}>
          {#if i === 0}
            None
          {:else}
            {i}
            {pluralize('round', i)}
          {/if}
        </option>
      {/each}
    </select>
  </label>

  {#if calendarPreview.settings.joinStitches > 0}
    <button
      class="btn hover:preset-tonal-surface"
      title="Choose a color for the border stitches around each square"
      onclick={() =>
        dialog.trigger({
          type: 'component',
          component: {
            ref: ChangeColor,
            props: {
              hex: calendarPreview.settings.joinColor,
              onChangeColor: ({ hex }) => {
                calendarPreview.settings.joinColor = hex;
                dialog.close();
              },
            },
          },
          options: {
            size: 'large',
          },
        })}
    >
      <SpanYarnColorSelectIcon color={calendarPreview.settings.joinColor} />
      Border Color
    </button>
  {/if}
</div>

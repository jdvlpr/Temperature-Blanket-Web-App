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
  import ChangeColor from '$lib/components/modals/ChangeColor.svelte';
  import SquareDesigner from '$lib/components/modals/SquareDesigner.svelte';
  import SpanYarnColorSelectIcon from '$lib/components/SpanYarnColorSelectIcon.svelte';
  import { gauges, dialog, weather } from '$lib/state';
  import { pluralize } from '$lib/utils';
  import { SquareDashedIcon, SquareSquareIcon } from '@lucide/svelte';
  import { squaresPreview } from './state.svelte';
  import PreviewInfo from '$lib/components/PreviewInfo.svelte';

  let targets = $derived(gauges.allCreated.map((n) => n.targets).flat());

  function handelOkaySquareDesigner(e) {
    squaresPreview.settings = {
      ...squaresPreview.settings,
      squareSize: e.squareSize,
      primaryTarget: e.primaryTarget,
      secondaryTargets: e.secondaryTargets,
      primaryTargetAsBackup: e.primaryTargetAsBackup,
    };
  }
</script>

<PreviewInfo previewTitle={squaresPreview.name}>
  {#snippet description()}
    Each square represents one {weather.grouping}. Squares are added from left
    to right, top to bottom.
  {/snippet}
  {#snippet details()}
    {#if squaresPreview.details}
      There are <span class="font-semibold"
        >{squaresPreview.squaresTotalCount} total {pluralize(
          'square',
          squaresPreview.squaresTotalCount,
        )}</span
      >
      in
      <span class="font-semibold"
        >{squaresPreview.details.rows}
        {pluralize('row', squaresPreview.details.rows)}</span
      >{#if squaresPreview.details.additionalSquares}.
        <span class="font-semibold"
          >{squaresPreview.details.additionalSquares}
          {pluralize('square', squaresPreview.details.additionalSquares)}</span
        > have no weather data
      {/if}.
    {/if}
  {/snippet}
</PreviewInfo>

<div
  class="preset-outlined-surface-300-700 card flex flex-col items-start gap-4 p-4"
>
  <p class="text-2xl font-bold">Layout Settings</p>

  <label class="label">
    Size (width)
    <select
      class="select w-fit min-w-[120px]"
      bind:value={squaresPreview.settings.columns}
    >
      {#each Array(300) as _, i}
        {@const number = i + 1}
        <option value={number}>
          {number}
          {pluralize('square', number)}
        </option>
      {/each}
    </select>
  </label>

  <label class="label">
    <span>Squares at Beginning</span>
    <select
      class="select w-fit min-w-[60px]"
      bind:value={squaresPreview.settings.squaresAtBeginning}
    >
      {#each Array(51) as _, i}
        <option value={i}>
          {i}
        </option>
      {/each}
    </select>
  </label>

  <label class="label">
    <span>Squares Between Months</span>
    <select
      class="select w-fit min-w-[60px]"
      bind:value={squaresPreview.settings.squaresBetweenMonthsCount}
    >
      {#each Array(51) as _, i}
        <option value={i}>
          {i}
        </option>
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
    onclick={() =>
      dialog.trigger({
        type: 'component',
        component: {
          ref: SquareDesigner,
          props: {
            targets,
            squareSize: squaresPreview.settings.squareSize,
            primaryTarget: squaresPreview.settings.primaryTarget,
            secondaryTargets: $state.snapshot(
              squaresPreview.settings.secondaryTargets,
            ),
            primaryTargetAsBackup:
              squaresPreview.settings.primaryTargetAsBackup,
            onOkay: handelOkaySquareDesigner,
          },
        },
      })}
  >
    <SquareSquareIcon />
    Customize Square Design
  </button>

  {#if squaresPreview.details?.additionalSquares || squaresPreview.settings?.squaresBetweenMonthsCount}
    <button
      class="btn hover:preset-tonal-surface"
      title="Choose a color for any additional squares"
      onclick={() =>
        dialog.trigger({
          type: 'component',
          component: {
            ref: ChangeColor,
            props: {
              hex: squaresPreview.settings.additionalSquaresColor,
              onChangeColor: ({ hex }) => {
                squaresPreview.settings.additionalSquaresColor = hex;
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
        color={squaresPreview.settings.additionalSquaresColor}
      />
      Accent Color (for additional squares)
    </button>
  {/if}

  <label class="label">
    Border Size
    <select
      class="select w-fit min-w-[110px]"
      bind:value={squaresPreview.settings.joinStitches}
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

  {#if squaresPreview.settings.joinStitches > 0}
    <button
      class="btn hover:preset-tonal-surface text-left whitespace-pre-wrap"
      title="Choose a color for the border stitches around each square"
      onclick={() =>
        dialog.trigger({
          type: 'component',
          component: {
            ref: ChangeColor,
            props: {
              hex: squaresPreview.settings.joinColor,
              onChangeColor: ({ hex }) => {
                squaresPreview.settings.joinColor = hex;
                dialog.close();
              },
            },
          },
          options: {
            size: 'large',
          },
        })}
    >
      <SquareDashedIcon />
      Border Color
    </button>
  {/if}
</div>

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
  import { gauges, modal } from '$lib/state';
  import { pluralize } from '$lib/utils';
  import {
    PipetteIcon,
    SquareDashedIcon,
    SquareSquareIcon,
  } from '@lucide/svelte';
  import { squaresPreview } from './state.svelte';

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

{#if squaresPreview.details}
  <div class="w-full">
    <p class="italic">
      {squaresPreview.details.rows} rows with {squaresPreview.details
        .additionalSquares} additional
      {pluralize('square', squaresPreview.details.additionalSquares)}.
    </p>
  </div>
{/if}

<div
  class="preset-outlined-surface-300-700 card flex flex-col items-start gap-4 p-4"
>
  <p class="text-2xl font-bold">Layout Settings</p>

  <label class="label">
    Number of Columns
    <select
      class="select w-fit min-w-[60px]"
      id="sqrs-columns"
      bind:value={squaresPreview.settings.columns}
    >
      {#each Array(300) as _, i}
        {#if i > 0}
          <option value={i}>
            {i}
          </option>
        {/if}
      {/each}
    </select>
  </label>

  <label class="label">
    <span>Squares at Beginning</span>
    <select
      class="select w-fit min-w-[60px]"
      id="sqrs-squares-at-beginning"
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
      id="sqrs-squares-between-months"
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
    class="btn hover:preset-tonal"
    title="Edit Square Design"
    onclick={() =>
      modal.trigger({
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
      class="btn hover:preset-tonal"
      title="Choose a color for any additional squares"
      onclick={() =>
        modal.trigger({
          type: 'component',
          component: {
            ref: ChangeColor,
            props: {
              hex: squaresPreview.settings.additionalSquaresColor,
              onChangeColor: ({ hex }) => {
                squaresPreview.settings.additionalSquaresColor = hex;
                modal.close();
              },
            },
          },
        })}
    >
      <PipetteIcon />
      Color of Additional Squares
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
      class="btn hover:preset-tonal text-left whitespace-pre-wrap"
      title="Choose a color for the border stitches around each square"
      onclick={() =>
        modal.trigger({
          type: 'component',
          component: {
            ref: ChangeColor,
            props: {
              hex: squaresPreview.settings.joinColor,
              onChangeColor: ({ hex }) => {
                squaresPreview.settings.joinColor = hex;
                modal.close();
              },
            },
          },
        })}
    >
      <SquareDashedIcon />
      Border Color
    </button>
  {/if}
</div>

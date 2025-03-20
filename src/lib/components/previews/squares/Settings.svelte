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
  import { PipetteIcon, SquareSquareIcon } from '@lucide/svelte';
  import { squaresPreview } from './state.svelte';

  let targets = $derived(gauges.allCreated.map((n) => n.targets).flat());

  function handelOkaySquareDesigner(e) {
    squaresPreview.settings.squareSize = e.squareSize;
    squaresPreview.settings.primaryTarget = e.primaryTarget;
    squaresPreview.settings.secondaryTargets = e.secondaryTargets;
    squaresPreview.settings.primaryTargetAsBackup = e.primaryTargetAsBackup;
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

<button
  class="btn hover:preset-tonal gap-1"
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
          primaryTargetAsBackup: squaresPreview.settings.primaryTargetAsBackup,
          onOkay: handelOkaySquareDesigner,
        },
      },
    })}
>
  <SquareSquareIcon />

  Square Design
</button>

<label class="label">
  <span>Number of Columns</span>
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

{#if squaresPreview.details?.additionalSquares || squaresPreview.settings?.squaresBetweenMonthsCount}
  <button
    class="btn hover:preset-tonal gap-1"
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

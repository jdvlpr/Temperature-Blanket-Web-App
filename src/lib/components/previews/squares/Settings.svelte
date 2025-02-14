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
      d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z"
    />
  </svg>
  Square Design
</button>

<label class="label">
  <span>Number of Columns</span>
  <select
    class="select w-fit"
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
    class="select w-fit"
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
    class="select w-fit"
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
    title="Choose a Color"
    onclick={() =>
      modal.trigger({
        type: 'component',
        component: {
          ref: ChangeColor,
          props: {
            hex: squaresPreview.settings.additionalSquaresColor,
            onChangeColor: ({ hex }) =>
              (squaresPreview.settings.additionalSquaresColor = hex),
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
    Color of Additional Squares
  </button>
{/if}

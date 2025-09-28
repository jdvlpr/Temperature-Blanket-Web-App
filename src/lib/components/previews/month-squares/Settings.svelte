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
  import ChangeColor from '$lib/components/modals/ChangeColor.svelte';
  import PreviewInfo from '$lib/components/PreviewInfo.svelte';
  import SpanYarnColorSelectIcon from '$lib/components/SpanYarnColorSelectIcon.svelte';
  import { gauges, modal, weather } from '$lib/state';
  import { capitalizeFirstLetter, pluralize } from '$lib/utils';
  import { monthSquaresPreview } from './state.svelte';

  let targets = $derived(gauges.allCreated.flatMap((n) => n.targets));
</script>

<PreviewInfo previewTitle={monthSquaresPreview.name}>
  {#snippet description()}
    Each square represents one month. Each round in a square represents one day,
    starting with the first of the month in the center of the square. Months
    with fewer days have extra rounds added, so that each square has the same
    number of rounds.
  {/snippet}
  {#snippet details()}
    {#if monthSquaresPreview.details}
      There are <span class="font-semibold"
        >{monthSquaresPreview.weatherMonths.length} month
        {pluralize('square', monthSquaresPreview.weatherMonths.length)}</span
      >. Each month square has
      <span class="font-semibold"
        >{monthSquaresPreview.details.roundsPerSquare} total {pluralize(
          'round',
          monthSquaresPreview.details.roundsPerSquare,
        )}</span
      >.
    {/if}
  {/snippet}
</PreviewInfo>

<div
  class="preset-outlined-surface-300-700 card flex flex-col items-start gap-4 p-4"
>
  <p class="text-2xl font-bold">Layout Settings</p>

  <label class="label">
    <span>Size (width x height)</span>
    <select
      class="select w-fit min-w-[210px]"
      id="msqs-dimensions"
      bind:value={monthSquaresPreview.settings.dimensions}
    >
      {#each monthSquaresPreview.possibleDimensions as value}
        {@const [width, height] = value.split('x')}
        <option {value}
          >{width}
          {pluralize('month', +width)} x {height}
          {pluralize('month', +height)}</option
        >
      {/each}
    </select>
  </label>
</div>

<div
  class="preset-outlined-surface-300-700 card flex flex-col items-start gap-4 p-4"
>
  <p class="text-2xl font-bold">Square Settings</p>

  <NumberInputButton
    bind:value={monthSquaresPreview.settings.additionalRoundsPerSquare}
    title="Additional Rounds Per Square"
    min={0}
    icon={`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-square-dashed size-6"><path d="M5 3a2 2 0 0 0-2 2"/><path d="M19 3a2 2 0 0 1 2 2"/><path d="M21 19a2 2 0 0 1-2 2"/><path d="M5 21a2 2 0 0 1-2-2"/><path d="M9 3h1"/><path d="M9 21h1"/><path d="M14 3h1"/><path d="M14 21h1"/><path d="M3 9v1"/><path d="M21 9v1"/><path d="M3 14v1"/><path d="M21 14v1"/></svg>`}
  />
  <button
    class="btn hover:preset-tonal"
    title="Choose a Color"
    onclick={() =>
      modal.trigger({
        type: 'component',
        component: {
          ref: ChangeColor,
          props: {
            hex: monthSquaresPreview.settings.additionalRoundsColor,
            onChangeColor: ({ hex }) => {
              monthSquaresPreview.settings.additionalRoundsColor = hex;
              modal.close();
            },
          },
        },
      })}
  >
    <SpanYarnColorSelectIcon
      color={monthSquaresPreview.settings.additionalRoundsColor}
    />
    Color of Additional Rounds
  </button>
</div>

<div
  class="preset-outlined-surface-300-700 card flex flex-col items-start gap-4 p-4"
>
  <p class="text-2xl font-bold">Round Settings</p>

  <label class="label">
    <span
      >Color Each Round Using the {capitalizeFirstLetter(
        weather.grouping,
      )}'s</span
    >
    <select
      class="select w-fit"
      id="msqs-param"
      bind:value={monthSquaresPreview.settings.selectedTarget}
    >
      {#each targets as { id, label, icon }}
        <option value={id}>{icon} {label} </option>
      {/each}
    </select>
  </label>
</div>

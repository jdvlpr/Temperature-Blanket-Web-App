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
  import { gauges, dialog, weather } from '$lib/state';
  import { capitalizeFirstLetter } from '$lib/utils/other-utils';
  import { pluralize } from '$lib/utils/string-utils';
  import { continuousSquarePreview } from './state.svelte';

  let targets = $derived(gauges.allCreated.map((n) => n.targets).flat());
</script>

{#if continuousSquarePreview.details?.rounds}
  <PreviewInfo previewTitle={continuousSquarePreview.name}>
    {#snippet description()}
      Starting from the center, stitches are added in a clockwise square
      pattern. Possible crochet patterns: Granny Square, Moss Stitch/Linen
      Stitch Square.
    {/snippet}
    {#snippet details()}
      There are <span class="font-semibold"
        >{continuousSquarePreview.details.rounds}
        rounds</span
      >
      with
      <span class="font-semibold"
        >{continuousSquarePreview.details.countOfAdditionalStitches} additional {pluralize(
          'stitch',
          continuousSquarePreview.details.countOfAdditionalStitches,
          'es',
        )}</span
      >.
    {/snippet}
  </PreviewInfo>
{/if}

<div
  class="preset-outlined-surface-300-700 card flex flex-col items-start gap-4 p-4"
>
  <p class="text-2xl font-bold">Settings</p>

  <label class="label">
    <span
      >Color Stitches Using the {capitalizeFirstLetter(
        weather.grouping,
      )}'s</span
    >
    <select
      class="select w-fit"
      id="cosq-param"
      bind:value={continuousSquarePreview.settings.selectedTarget}
    >
      {#each targets as { id, label, icon }}
        <option value={id}>{icon} {label} </option>
      {/each}
    </select>
  </label>

  <NumberInputButton
    bind:value={continuousSquarePreview.settings.stitchesPerDay}
    title="Stitches Per {capitalizeFirstLetter(weather.grouping)}"
  />

  {#if continuousSquarePreview.details}
    {#if continuousSquarePreview.details.countOfAdditionalStitches}
      <button
        class="btn hover:preset-tonal"
        title="Choose a Color"
        onclick={() =>
          dialog.trigger({
            type: 'component',
            component: {
              ref: ChangeColor,
              props: {
                hex: continuousSquarePreview.settings.extrasColor,
                onChangeColor: ({ hex }) => {
                  continuousSquarePreview.settings.extrasColor = hex;
                  dialog.close();
                },
              },
            },
          })}
      >
        <SpanYarnColorSelectIcon
          color={continuousSquarePreview.settings.extrasColor}
        />
        Color of Additional Stitches
      </button>
    {/if}
  {/if}
</div>

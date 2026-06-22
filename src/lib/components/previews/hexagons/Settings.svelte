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
  import { gauges } from '$lib/state/gauges-state.svelte';
  import { dialog } from '$lib/state/page-state.svelte';
  import { weather } from '$lib/state/weather-state.svelte';
  import { capitalizeFirstLetter } from '$lib/utils/other-utils';
  import { pluralize } from '$lib/utils/string-utils';
  import { SquareDashedIcon } from '@lucide/svelte';
  import { hexagonsPreview } from './state.svelte';

  let targets = $derived(gauges.allCreated.map((n) => n.targets).flat());
</script>

<div class="w-full">
  <p class="">
    Days are represented by lines added in a back-and-forth pattern starting
    from the bottom right.
  </p>
</div>

<div
  class="preset-outlined-surface-300-700 card flex flex-col items-start gap-4 p-4"
>
  <p class="text-2xl font-bold">Settings</p>

  <label class="label">
    <span
      >Color Lines Using the {capitalizeFirstLetter(weather.grouping)}'s</span
    >
    <select
      class="select w-fit"
      id="crnr-param"
      bind:value={hexagonsPreview.settings.primaryTarget}
    >
      {#each targets as { id, label, icon }}
        <option value={id}>{icon} {label} </option>
      {/each}
    </select>
  </label>

  <NumberInputButton
    bind:value={hexagonsPreview.settings.hexagonSize}
    title="Hexagon Size"
  />

  {#if hexagonsPreview.dimensionsOptions}
    <label class="label">
      <span>Size (width x height)</span>
      <select
        class="select w-fit min-w-[100px]"
        id="crnr-dimensions"
        bind:value={hexagonsPreview.settings.dimensions}
      >
        {#each hexagonsPreview.dimensionsOptions as value}
          <option {value}>{value}</option>
        {/each}
      </select>
    </label>
  {/if}

  <label class="label">
    Border Size
    <select
      class="select w-fit min-w-[110px]"
      bind:value={hexagonsPreview.settings.joinStitches}
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

  {#if hexagonsPreview.settings.joinStitches > 0}
    <button
      class="btn hover:preset-tonal text-left whitespace-pre-wrap"
      title="Choose a color for the border stitches around each square"
      onclick={() =>
        dialog.trigger({
          type: 'component',
          component: {
            ref: ChangeColor,
            props: {
              hex: hexagonsPreview.settings.joinColor,
              onChangeColor: ({ hex }) => {
                hexagonsPreview.settings.joinColor = hex;
                dialog.close();
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

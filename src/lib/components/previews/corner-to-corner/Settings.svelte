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
  import PreviewInfo from '$lib/components/PreviewInfo.svelte';
  import { gauges, weather } from '$lib/state';
  import { capitalizeFirstLetter } from '$lib/utils';
  import { cornerToCornerPreview } from './state.svelte';

  let targets = $derived(gauges.allCreated.map((n) => n.targets).flat());
</script>

<PreviewInfo previewTitle={cornerToCornerPreview.name}>
  {#snippet description()}
    Days are represented by lines added in a back-and-forth pattern starting
    from the bottom right.
  {/snippet}
</PreviewInfo>

<div
  class="preset-outlined-surface-300-700 card flex flex-col items-start gap-4 p-4"
>
  <p class="text-2xl font-bold">Settings</p>

  <label class="label">
    <span class="label-text"
      >Color Lines Using the {capitalizeFirstLetter(weather.grouping)}'s</span
    >
    <select
      class="select w-fit"
      bind:value={cornerToCornerPreview.settings.selectedTarget}
    >
      {#each targets as { id, label, icon }}
        <option value={id}>{icon} {label} </option>
      {/each}
    </select>
  </label>

  <NumberInputButton
    bind:value={cornerToCornerPreview.settings.lineLength}
    title="Line Length"
  />

  {#if cornerToCornerPreview.dimensionsOptions}
    <label class="label">
      <span class="label-text">Size (width x height)</span>
      <select
        class="select w-fit min-w-[100px]"
        bind:value={cornerToCornerPreview.settings.dimensions}
      >
        {#each cornerToCornerPreview.dimensionsOptions as value}
          <option {value}>{value}</option>
        {/each}
      </select>
    </label>
  {/if}
</div>

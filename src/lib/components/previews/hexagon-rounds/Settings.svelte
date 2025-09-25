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
  import ChangeColor from '$lib/components/modals/ChangeColor.svelte';
  import SpanYarnColorSelectIcon from '$lib/components/SpanYarnColorSelectIcon.svelte';
  import Tooltip from '$lib/components/Tooltip.svelte';
  import { gauges, modal, weather } from '$lib/state';
  import { pluralize } from '$lib/utils';
  import { capitalizeFirstLetter } from '$lib/utils/other-utils';
  import { ArrowRightIcon, InfoIcon } from '@lucide/svelte';
  import { hexagonRoundsPreview } from './state.svelte';

  let targets = $derived(gauges.allCreated.map((n) => n.targets).flat());

  let weatherRoundsPerHexagon = $derived(
    hexagonRoundsPreview.weatherHexagons[0].length,
  );

  let weatherRoundsinLastHexagon = $derived(
    hexagonRoundsPreview.weatherHexagons[
      hexagonRoundsPreview.weatherHexagons.length - 1
    ].length,
  );

  let extraRounds = $derived.by(() => {
    if (weatherRoundsPerHexagon === weatherRoundsinLastHexagon) return 0;

    return weatherRoundsinLastHexagon;
  });
</script>

<p class="w-full">Each round in a hexagon represents one {weather.grouping}.</p>

{#if hexagonRoundsPreview.rows}
  <div class="flex w-full flex-col italic">
    <p class="w-full">
      {hexagonRoundsPreview.settings.columns}
      {pluralize('column', hexagonRoundsPreview.settings.columns)}, {hexagonRoundsPreview.rows}
      {pluralize('row', hexagonRoundsPreview.rows)}, {hexagonRoundsPreview.totalHexagons}
      total {pluralize('hexagon', hexagonRoundsPreview.totalHexagons)}

      {#if extraRounds}
        , 1 hexagon has {extraRounds} of {weatherRoundsPerHexagon}
        {pluralize('round', weatherRoundsPerHexagon)} of weather data
      {/if}

      {#if hexagonRoundsPreview.hexagonsWithNoWeatherData}
        , {hexagonRoundsPreview.hexagonsWithNoWeatherData}
        {pluralize('hexagon', hexagonRoundsPreview.hexagonsWithNoWeatherData)}
        {pluralize(
          { singular: 'has', plural: 'have' },
          hexagonRoundsPreview.hexagonsWithNoWeatherData,
        )} no weather data
      {/if}

      {#if extraRounds || hexagonRoundsPreview.hexagonsWithNoWeatherData}
        <Tooltip tooltipClass="">
          <InfoIcon class="-top[1px] relative inline size-5" />
          {#snippet tooltip()}
            <p class="text-warning-800-200 not-italic">
              Adjust the <span class="inline font-bold">Layout Settings</span>
              or
              <span class="inline font-bold">Hexagon Settings</span>
              <ArrowRightIcon class="relative -top-[2px] inline size-4" />
              <span class="inline font-bold"
                >{capitalizeFirstLetter(weather.grouping)}s Per Hexagon</span
              >
              below to avoid rounds of no weather data.
            </p>
          {/snippet}
        </Tooltip>
      {/if}
    </p>
  </div>
{/if}

<div
  class="preset-outlined-surface-300-700 card flex flex-col items-start gap-4 p-4"
>
  <p class="text-2xl font-bold">Layout Settings</p>

  <label class="label">
    Size (width)
    <select
      class="select w-fit min-w-[120px]"
      bind:value={hexagonRoundsPreview.settings.columns}
    >
      {#each Array(weather.data.length), i}
        {@const number = i + 1}
        <option value={number}>
          {number}
          {pluralize('hexagon', number)}
        </option>
      {/each}
    </select>
  </label>

  <div class="flex flex-col items-start">
    <p class="font-bold">Border</p>
    <label class="label max-w-[250px]">
      Use the Last <select
        class="select inline w-fit min-w-[60px]"
        bind:value={hexagonRoundsPreview.settings.layoutBorder}
      >
        {#each Array(weather.data.length), i}
          <option value={i}>
            {i}
          </option>
        {/each}
      </select>
      {pluralize(
        capitalizeFirstLetter(weather.grouping),
        hexagonRoundsPreview.settings.layoutBorder,
      )} of Weather Data as {pluralize(
        { singular: 'a', plural: '' },
        hexagonRoundsPreview.settings.layoutBorder,
      )} Border {pluralize('Round', hexagonRoundsPreview.settings.layoutBorder)}
    </label>
  </div>
</div>

<div
  class="preset-outlined-surface-300-700 card flex flex-col items-start gap-4 p-4"
>
  <p class="text-2xl font-bold">Hexagon Settings</p>

  <label class="label">
    {capitalizeFirstLetter(weather.grouping)}s Per Hexagon
    <select
      class="select w-fit min-w-[60px]"
      bind:value={hexagonRoundsPreview.settings.roundsPerHexagon}
    >
      {#each Array(weather.data.length), i}
        <option value={i + 1}>
          {i + 1}
        </option>
      {/each}
    </select>
  </label>

  <label class="label">
    Border Around Each Hexagon
    <select
      class="select w-fit min-w-[120px]"
      bind:value={hexagonRoundsPreview.settings.hexagonBorder}
    >
      {#each Array(51), i}
        <option value={i}>
          {i}
          {pluralize('round', i)}
        </option>
      {/each}
    </select>
  </label>

  <button
    class="btn hover:preset-tonal text-left whitespace-pre-wrap"
    title="Choose a Color"
    onclick={() =>
      modal.trigger({
        type: 'component',
        component: {
          ref: ChangeColor,
          props: {
            hex: hexagonRoundsPreview.settings.additionalRoundsColor,
            onChangeColor: ({ hex }) => {
              hexagonRoundsPreview.settings.additionalRoundsColor = hex;
              modal.close();
            },
          },
        },
      })}
  >
    <SpanYarnColorSelectIcon
      color={hexagonRoundsPreview.settings.additionalRoundsColor}
    />
    Color of Hexagon Border and Additional Rounds
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
      id="hxrd-param"
      bind:value={hexagonRoundsPreview.settings.selectedTarget}
    >
      {#each targets as { id, label, icon }}
        <option value={id}>{icon} {label} </option>
      {/each}
    </select>
  </label>
</div>

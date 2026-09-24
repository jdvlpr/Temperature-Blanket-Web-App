<!-- Copyright (c) 2024 - 2026, Thomas (https://github.com/jdvlpr)

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
  import { withExtraColorDetails } from '$lib/utils/extra-colors-utils';
  import ChangeColor from '$lib/components/modals/ChangeColor.svelte';
  import HexagonDesigner from '$lib/components/modals/HexagonDesigner.svelte';
  import PreviewInfo from '$lib/components/PreviewInfo.svelte';
  import SpanYarnColorSelectIcon from '$lib/components/SpanYarnColorSelectIcon.svelte';
  import { gauges } from '$lib/state/gauges-state.svelte';
  import { dialog } from '$lib/state/page-state.svelte';
  import { weather } from '$lib/state/weather-state.svelte';
  import type { WeatherParam } from '$lib/types/gauge-types';
  import type { SecondaryTarget } from '$lib/types/preview-types';
  import type { Color } from '$lib/types/yarn-types';
  import { pluralize } from '$lib/utils/string-utils';
  import { HexagonIcon, SquareDashedIcon } from '@lucide/svelte';
  import Preview from './Preview.svelte';
  import { HEXAGONS_ROW_LAYOUTS, hexagonsPreview } from './state.svelte';

  let targets = $derived(gauges.allCreated.map((n) => n.targets).flat());

  function handleOkayHexagonDesigner(e: {
    hexagonSize: number;
    primaryTarget: WeatherParam['id'];
    secondaryTargets: SecondaryTarget[];
    primaryTargetAsBackup: boolean;
  }) {
    hexagonsPreview.settings = { ...hexagonsPreview.settings, ...e };
  }
</script>

<PreviewInfo previewTitle={hexagonsPreview.name}>
  {#snippet description()}
    <p>
      Each hexagon represents one {weather.grouping}. Hexagons are added from
      left to right, top to bottom.
    </p>
  {/snippet}
  {#snippet details()}
    <p>
      There are <span class="font-semibold"
        >{hexagonsPreview.hexagonsTotalCount} total {pluralize(
          'hexagon',
          hexagonsPreview.hexagonsTotalCount,
        )}</span
      >
      in
      <span class="font-semibold"
        >{hexagonsPreview.details.rows}
        {pluralize('row', hexagonsPreview.details.rows)}</span
      >{#if hexagonsPreview.details.additionalHexagons}.
        <span class="font-semibold"
          >{hexagonsPreview.details.additionalHexagons}
          {pluralize(
            'hexagon',
            hexagonsPreview.details.additionalHexagons,
          )}</span
        > have no weather data
      {/if}.
    </p>
  {/snippet}
</PreviewInfo>

<div class="w-full"><Preview /></div>

<div
  class="preset-outlined-surface-300-700 card flex flex-col items-start gap-4 p-4"
>
  <p class="text-2xl font-bold">Layout Settings</p>

  <label class="label">
    <span class="label-text">Size (hexagons in the first row)</span>
    <select
      class="select w-fit min-w-[120px]"
      id="hxgs-columns"
      bind:value={hexagonsPreview.settings.columns}
    >
      {#each Array(300), i}
        {@const number = i + 1}
        <option value={number}>
          {number}
          {pluralize('hexagon', number)}
        </option>
      {/each}
    </select>
  </label>

  <label class="label">
    <span class="label-text">Row Layout</span>
    <select
      class="select w-fit max-w-full truncate"
      id="hxgs-row-layout"
      bind:value={hexagonsPreview.settings.rowLayout}
    >
      {#each HEXAGONS_ROW_LAYOUTS as { value, label } (value)}
        <option {value}>{label}</option>
      {/each}
    </select>
  </label>

  <label class="label">
    <span class="label-text">Hexagons at Beginning</span>
    <select
      class="select w-fit min-w-[60px]"
      bind:value={hexagonsPreview.settings.hexagonsAtBeginning}
    >
      {#each Array(51), i}
        <option value={i}>{i}</option>
      {/each}
    </select>
  </label>

  <label class="label">
    <span class="label-text">Hexagons Between Months</span>
    <select
      class="select w-fit min-w-[60px]"
      bind:value={hexagonsPreview.settings.hexagonsBetweenMonthsCount}
    >
      {#each Array(51), i}
        <option value={i}>{i}</option>
      {/each}
    </select>
  </label>
</div>

<div
  class="preset-outlined-surface-300-700 card flex flex-col items-start gap-4 p-4"
>
  <p class="text-2xl font-bold">Hexagon Settings</p>

  <button
    class="btn hover:preset-tonal-surface"
    title="Edit Hexagon Design"
    onclick={() =>
      dialog.trigger({
        type: 'component',
        component: {
          ref: HexagonDesigner,
          props: {
            targets,
            hexagonSize: hexagonsPreview.settings.hexagonSize,
            primaryTarget: hexagonsPreview.settings.primaryTarget,
            secondaryTargets: $state.snapshot(
              hexagonsPreview.settings.secondaryTargets,
            ),
            primaryTargetAsBackup:
              hexagonsPreview.settings.primaryTargetAsBackup,
            onOkay: handleOkayHexagonDesigner,
          },
        },
      })}
  >
    <HexagonIcon />
    Customize Hexagon Design
  </button>

  {#if hexagonsPreview.details.additionalHexagons}
    <button
      class="btn hover:preset-tonal-surface"
      title="Choose a color for any additional hexagons"
      onclick={() =>
        dialog.trigger({
          type: 'component',
          component: {
            ref: ChangeColor,
            props: {
              ...withExtraColorDetails(
                hexagonsPreview.settings.additionalHexagonsColor,
                hexagonsPreview.extraColorDetails.accent,
              ),
              onChangeColor: (color: Color) => {
                hexagonsPreview.settings.additionalHexagonsColor =
                  color.hex as NonNullable<Color['hex']>;
                hexagonsPreview.extraColorDetails.accent = color;
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
        color={hexagonsPreview.settings.additionalHexagonsColor}
      />
      Accent Color (for additional hexagons)
    </button>
  {/if}

  <label class="label">
    <span class="label-text">Border Size</span>
    <select
      class="select w-fit min-w-[110px]"
      bind:value={hexagonsPreview.settings.joinStitches}
    >
      {#each Array(11), i}
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
      class="btn hover:preset-tonal-surface text-left whitespace-pre-wrap"
      title="Choose a color for the border stitches around each hexagon"
      onclick={() =>
        dialog.trigger({
          type: 'component',
          component: {
            ref: ChangeColor,
            props: {
              ...withExtraColorDetails(
                hexagonsPreview.settings.joinColor,
                hexagonsPreview.extraColorDetails.border,
              ),
              onChangeColor: (color: Color) => {
                hexagonsPreview.settings.joinColor = color.hex as NonNullable<
                  Color['hex']
                >;
                hexagonsPreview.extraColorDetails.border = color;
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

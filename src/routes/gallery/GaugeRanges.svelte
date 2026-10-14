<!-- Copyright (c) 2026, Thomas (https://github.com/jdvlpr)

This file is part of Temperature-Blanket-Web-App.

Temperature-Blanket-Web-App is free software: you can redistribute it and/or modify it
under the terms of the GNU General Public License as published by the Free Software Foundation,
either version 3 of the License, or (at your option) any later version.

Temperature-Blanket-Web-App is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY;
without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.
See the GNU General Public License for more details.

You should have received a copy of the GNU General Public License along with Temperature-Blanket-Web-App.
If not, see <https://www.gnu.org/licenses/>. -->

<!-- @component
  A gallery project's gauge as a legend: its name, its yarn, the rule for its
  ranges' ends, and one link to its yarn palette (its own gallery page, or a
  copy in the Yarn Palette Creator), then a row for each
  range: its numbered swatch, the range, its colorway (and yarn, when they
  differ), and the "more"
  menu (⋮) to buy or view the yarn and copy its name or hex code. Colors
  without a range (a preview's border or accent) show their role instead.
-->
<script lang="ts">
  import ColorSwatch from '#lib/components/ColorSwatch.svelte';
  import RangeValue from '#lib/components/RangeValue.svelte';
  import ColorwayMoreMenu from '#lib/components/yarn-colorways/ColorwayMoreMenu.svelte';
  import { PANEL_LIST } from '#lib/constants/class-constants.js';
  import type {
    GaugeRange,
    GaugeRangeCategory,
    GaugeRangeOptions,
  } from '#lib/types/gauge-types.js';
  import type { Color } from '#lib/types/yarn-types.js';
  import { rangeRuleSentence } from '#lib/utils/range-format.js';
  import type { Snippet } from 'svelte';
  import GalleryYarnLines from './GalleryYarnLines.svelte';

  interface Item {
    color: Color;
    /** Its number in the palette, or its role ("Border") */
    label: number | string;
    range?: GaugeRange | GaugeRangeCategory;
  }

  interface Props {
    /** e.g. "Temperature" */
    heading: string;
    items: Item[];
    /** e.g. °F; a temperature's sits up by the top of its number */
    unitLabel?: string;
    unitType?: string;
    /** Whether ranges include their From and To, said once above them */
    rangeOptions?: GaugeRangeOptions;
    /** Which gauge, for what its ranges can include */
    gaugeId?: string;
    /** Its palette link, beside the heading */
    action?: Snippet;
  }

  let {
    heading,
    items,
    unitLabel = '',
    unitType,
    rangeOptions,
    gaugeId,
    action,
  }: Props = $props();

  let hasRanges = $derived(
    items.some((item) => item.range && 'from' in item.range),
  );
  // One yarn is named above the rows; different ones, on each row
  let mixedYarns = $derived(
    new Set(
      items.map(
        ({ color }) => `${color.brandName ?? ''}/${color.yarnName ?? ''}`,
      ),
    ).size > 1,
  );
</script>

<section class="{PANEL_LIST} mx-auto w-full max-w-2xl text-left">
  <div class="flex flex-wrap items-center gap-x-3 gap-y-1 px-4 py-2">
    <div class="min-w-0 flex-1">
      <h2 class="text-lg font-semibold">{heading}</h2>
      {#if !mixedYarns && items[0]?.color.brandName}
        <p class="text-sm">
          <GalleryYarnLines colors={[items[0].color]} />
        </p>
      {/if}
      {#if hasRanges && rangeOptions}
        <p class="text-surface-700-300 text-xs">
          {rangeRuleSentence(rangeOptions, gaugeId)}
        </p>
      {/if}
    </div>
    <!-- Beside the heading, or on a phone a full-width button under it, its
         label wrapping on the narrowest -->
    {#if action}
      <div
        class="max-sm:[&>*]:bg-surface-200-800 flex max-sm:w-full max-sm:pb-1 max-sm:[&>*]:w-full max-sm:[&>*]:text-center max-sm:[&>*]:whitespace-normal"
      >
        {@render action()}
      </div>
    {/if}
  </div>
  <ol class="divide-surface-200-800 flex flex-col divide-y">
    {#each items as { color, label, range }, index (index)}
      <li class="flex min-h-12 items-center gap-3 px-4 py-2">
        <ColorSwatch
          hex={color.hex}
          number={typeof label === 'number' ? label : undefined}
        />
        <div
          class="flex min-w-0 flex-1 flex-col gap-x-4 sm:flex-row sm:items-center"
        >
          {#if range}
            <span class="shrink-0 sm:min-w-40">
              {#if 'from' in range}
                <RangeValue
                  from={range.from}
                  to={range.to}
                  {unitLabel}
                  {unitType}
                />
              {:else}
                <span class="font-semibold text-pretty">{range.label}</span>
              {/if}
            </span>
          {:else if typeof label === 'string'}
            <span class="shrink-0 font-semibold sm:min-w-40">{label}</span>
          {/if}
          <span class="flex min-w-0 flex-col">
            <span class="leading-tight text-pretty">
              {color.name || color.hex}
            </span>
            {#if mixedYarns && color.brandName && color.yarnName}
              <span class="text-surface-700-300 text-xs text-pretty">
                {color.brandName} · {color.yarnName}
              </span>
            {/if}
          </span>
        </div>
        <ColorwayMoreMenu colorway={color} on="surface" />
      </li>
    {/each}
  </ol>
</section>

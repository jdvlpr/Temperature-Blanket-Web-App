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

<!-- @component
  A palette's colors to look at, not edit (a gallery project's gauges), drawn
  like the palette editor's: as cards or rows (View › Grid or List), each a
  numbered round swatch with its yarn, its range, and the "more" menu (⋮) to
  buy or view the yarn and copy its name or hex code. Colors without a number
  (a preview's border or accent) show their role instead. With View › Fill
  with color, each card or row takes its color, grown out of its swatch.
-->
<script lang="ts">
  import ColorwayMoreMenu from '$lib/components/yarn-colorways/ColorwayMoreMenu.svelte';
  import { iconColorOn } from '$lib/components/yarn-colorways/colorway-utils';
  import {
    fillFromSwatch,
    fillWithColor,
    mutedText,
  } from '$lib/components/yarn-colorways/fill-with-color';
  import { preferences } from '$lib/storage/preferences.svelte';
  import type {
    GaugeRange,
    GaugeRangeCategory,
    GaugeRangeOptions,
  } from '$lib/types/gauge-types';
  import type { Color } from '$lib/types/yarn-types';
  import { ArrowRightIcon } from '@lucide/svelte';

  interface Item {
    color: Color;
    /** Its number in the palette, or its role ("Border") */
    label: number | string;
    range?: GaugeRange | GaugeRangeCategory;
  }

  interface Props {
    items: Item[];
    /** e.g. °F; a temperature's sits up by the top of its number */
    unitLabel?: string;
    unitType?: string;
    /** Whether ranges include their From and To, said once below them */
    rangeOptions?: GaugeRangeOptions;
  }

  let { items, unitLabel = '', unitType, rangeOptions }: Props = $props();

  let grid = $derived(preferences.value.layout === 'grid');
  let filled = $derived(fillWithColor.on);
  let hasRanges = $derived(
    items.some((item) => item.range && 'from' in item.range),
  );
</script>

{#snippet swatch({ color, label }: Item)}
  <span
    class="grid size-12 shrink-0 place-items-center rounded-full text-sm font-semibold shadow-[inset_0_0_0_1px_rgb(0_0_0/0.12)] {filled
      ? 'ring-2 ring-current/40'
      : ''}"
    style="background:{color.hex};color:{iconColorOn(color.hex ?? '#fff')}"
    data-fill-origin
  >
    {#if typeof label === 'number'}
      <span class="sr-only">Color</span> {label}
    {/if}
  </span>
{/snippet}

<!-- The yarn: its role if it has one, its name and "Brand · Yarn", or its hex code -->
{#snippet yarn({ color, label }: Item)}
  <span class="flex min-w-0 flex-col">
    {#if typeof label === 'string'}
      <span class="{mutedText(filled)} text-xs font-semibold">{label}</span>
    {/if}
    <span class="leading-tight font-semibold text-pretty">
      {color.name || color.hex}
    </span>
    {#if color.brandName && color.yarnName}
      <span class="{mutedText(filled)} text-xs text-pretty">
        {color.brandName} · {color.yarnName}
      </span>
    {/if}
  </span>
{/snippet}

{#snippet unit()}
  {#if unitLabel}<span
      class={[
        'text-xs font-normal',
        !filled && 'opacity-70',
        unitType === 'temperature' && 'align-[0.25em] leading-none',
      ]}>{unitLabel}</span
    >{/if}
{/snippet}

<!-- e.g. "72°F → 80°F", or a category's name -->
{#snippet range(r: GaugeRange | GaugeRangeCategory)}
  {#if 'from' in r}
    <span
      class="flex flex-wrap items-center gap-x-1.5 font-semibold whitespace-nowrap tabular-nums"
    >
      <span>{r.from}{@render unit()}</span>
      <ArrowRightIcon
        size={14}
        class="shrink-0 opacity-60"
        aria-hidden="true"
      />
      <span class="sr-only">to</span>
      <span>{r.to}{@render unit()}</span>
    </span>
  {:else}
    <span class="text-sm text-pretty">{r.label}</span>
  {/if}
{/snippet}

<div
  class="text-left {grid
    ? 'grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4'
    : 'rounded-container border-surface-200-800 bg-surface-50-950 flex flex-col border'}"
>
  {#each items as item, index (index)}
    <div
      class="relative isolate overflow-hidden {grid
        ? 'card border-surface-200-800 bg-surface-50-950 flex min-w-0 flex-col border'
        : 'bg-surface-50-950 border-surface-200-800 first:rounded-t-container last:rounded-b-container @container border-b last:border-b-0'}"
      style:color={filled ? iconColorOn(item.color.hex ?? '#fff') : undefined}
      data-fillable
      data-filled={filled || undefined}
      use:fillFromSwatch={filled}
    >
      <span
        class="fill-layer"
        style:background={item.color.hex}
        aria-hidden="true"
      ></span>
      {#if grid}
        <div class="flex items-center gap-1 px-2 pt-2">
          {@render swatch(item)}
          <span class="ml-auto"
            ><ColorwayMoreMenu
              colorway={item.color}
              on={filled ? 'color' : 'surface'}
            /></span
          >
        </div>
        <div class="flex flex-1 flex-col gap-2 p-2">
          {@render yarn(item)}
          {#if item.range}
            <!-- At the bottom, so they line up with the cards beside it -->
            <div class="mt-auto flex">{@render range(item.range)}</div>
          {/if}
        </div>
      {:else}
        <!-- One line where there's room; on a phone, the range goes under
        the yarn's name -->
        <div
          class="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-x-3 gap-y-1 p-2 @lg:grid-cols-[auto_minmax(0,1fr)_auto_auto]"
        >
          <span class="col-start-1 row-span-2 row-start-1 @lg:row-span-1">
            {@render swatch(item)}
          </span>
          <span class="col-start-2 row-start-1 flex min-w-0">
            {@render yarn(item)}
          </span>
          {#if item.range}
            <span
              class="col-start-2 row-start-2 flex @lg:col-start-3 @lg:row-start-1"
            >
              {@render range(item.range)}
            </span>
          {/if}
          <span
            class="col-start-3 row-span-2 row-start-1 @lg:col-start-4 @lg:row-span-1"
          >
            <ColorwayMoreMenu
              colorway={item.color}
              on={filled ? 'color' : 'surface'}
            />
          </span>
        </div>
      {/if}
    </div>
  {/each}
</div>
{#if hasRanges && rangeOptions}
  <p class="text-surface-700-300 mt-2 px-2 text-center text-xs">
    From is {rangeOptions.includeFromValue ? 'included' : 'excluded'}, To is
    {rangeOptions.includeToValue ? 'included' : 'excluded'}.
  </p>
{/if}

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
  What a weather grid shows for a value, the same in every table:
  - the value (bold when `changed`; "–" when missing)
  - with `was`, the value before struck through and the signed change beside it
  - with Show Colors (`color` given), its swatch at the left edge and a line
    "Color 3", or "Color 2 → 3" when `wasColor` differs
  The cell around it (its role, place and events) is the table's own.
-->
<script lang="ts">
  import { colorChanges, colorLine } from '#lib/utils/weather-grid.js';
  import ColorSwatch from './ColorSwatch.svelte';
  import type { SwatchColor } from './grid-color.svelte.js';
  import type { Snippet } from 'svelte';

  let {
    text,
    changed = false,
    was,
    difference = '',
    color,
    wasColor,
    faint = false,
    swatchTitle,
    typing = false,
    children,
  }: {
    /** The value as shown; '' when missing */
    text: string;
    changed?: boolean;
    /** The value before ('' when it was missing), to show it struck through */
    was?: string;
    /** How much it changed ("+0.5") */
    difference?: string;
    /** Its color, with Show Colors on and a gauge coloring it; undefined for no swatch */
    color?: SwatchColor;
    wasColor?: SwatchColor;
    /** Unchanged, among changes: shown faintly */
    faint?: boolean;
    /** What the value is ("Jan 4, High"), for its swatch's details */
    swatchTitle?: string;
    /** Typing a new value: `children` (an input) in its place */
    typing?: boolean;
    children?: Snippet;
  } = $props();

  // A swatch where a gauge colors it, unless there's no value (now or before)
  const colored = $derived(
    color !== undefined && (color !== null || (wasColor ?? null) !== null),
  );
  const colorChanged = $derived(
    colored && wasColor !== undefined && colorChanges(color ?? null, wasColor),
  );
</script>

<div
  class={[
    'relative flex h-full min-w-0 flex-col justify-center px-2 leading-tight tabular-nums',
    colored && 'pl-7',
  ]}
>
  {#if colored}
    <ColorSwatch
      color={color ?? null}
      was={wasColor}
      {faint}
      title={swatchTitle}
    />
  {/if}
  {#if typing && children}
    {@render children()}
  {:else}
    <span class={['truncate', changed && 'font-semibold', faint && 'opacity-50']}>
      {#if text === ''}
        <span aria-label="missing">–</span>
      {:else}
        {text}
      {/if}
    </span>
  {/if}
  {#if was !== undefined}
    <span class="flex items-center gap-1.5 truncate text-xs">
      <span class="sr-only">was</span>
      <s class="opacity-70">{was === '' ? '–' : was}</s>
      {#if difference}
        <span class="sr-only">, changed by</span>
        <span class="opacity-70">{difference}</span>
      {/if}
    </span>
  {/if}
  {#if colored}
    <span
      class={[
        'truncate text-xs',
        colorChanged ? 'font-semibold' : 'opacity-60',
      ]}
    >
      {colorLine(color ?? null, wasColor)}
    </span>
  {/if}
</div>

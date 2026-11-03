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
  A value's color in a weather grid: a circle at its cell's left edge. When
  `was` differs, two: the new color over the old, crossed out. Dashed for a
  value in none of its gauge's ranges. Pressed or hovered (`title` given, in a grid
  with SwatchDetails), it shows the color's details.
-->
<script lang="ts">
  import { colorChanges } from '#lib/utils/weather-grid.js';
  import { getSwatchDetails, type SwatchColor } from './grid-color.svelte.js';

  let {
    color,
    was,
    faint = false,
    title,
  }: {
    color: SwatchColor;
    /** The color before, to show a change */
    was?: SwatchColor;
    faint?: boolean;
    /** What the value is ("Jan 4, High"): makes it a button showing details */
    title?: string;
  } = $props();

  // A value in none of its gauge's ranges
  const OUTSIDE_STRIPES =
    'repeating-linear-gradient(45deg, transparent 0 2px, rgb(128 128 128 / 0.6) 2px 4px)';

  const details = getSwatchDetails();
  const changed = $derived(was !== undefined && colorChanges(color, was));
  const shown = $derived(color && color !== 'outside' ? color : null);
  const interactive = $derived(!!details && !!title && !!shown);
</script>

{#snippet circle(c: SwatchColor, crossed = false)}
  <span
    class={[
      'relative block shrink-0 overflow-hidden rounded-full',
      changed ? 'size-3.5' : 'size-4',
      c === 'outside' || !c
        ? 'border-surface-500 border border-dashed'
        : 'ring-1 ring-black/25',
    ]}
    style:background-color={c && c !== 'outside' ? c.hex : undefined}
    style:background-image={c === 'outside' || !c ? OUTSIDE_STRIPES : undefined}
  >
    {#if crossed}
      <svg class="absolute inset-0 size-full" viewBox="0 0 10 10">
        <path
          d="M2.5 2.5 7.5 7.5M7.5 2.5 2.5 7.5"
          stroke="rgb(0 0 0 / 0.6)"
          stroke-width="3.5"
          vector-effect="non-scaling-stroke"
        />
        <path
          d="M2.5 2.5 7.5 7.5M7.5 2.5 2.5 7.5"
          stroke="white"
          stroke-width="1.75"
          vector-effect="non-scaling-stroke"
        />
      </svg>
    {/if}
  </span>
{/snippet}

{#snippet bar()}
  <span
    class={['flex flex-col items-center gap-1', faint && 'opacity-50']}
    aria-hidden="true"
  >
    {@render circle(color)}
    {#if changed}
      {@render circle(was ?? null, true)}
    {/if}
  </span>
{/snippet}

{#if interactive && shown && details}
  <button
    type="button"
    class="absolute top-1 bottom-1 left-0.5 flex w-5 cursor-pointer items-center justify-center py-0.5"
    aria-label="{title}: color details"
    aria-haspopup="dialog"
    onclick={(e) => {
      const anchor = e.currentTarget;
      if (details.anchor === anchor && !details.byHover) details.close();
      else details.open(anchor, shown, title ?? '');
    }}
    onpointerenter={(e) => {
      if (e.pointerType === 'mouse' && !details.anchor)
        details.open(e.currentTarget, shown, title ?? '', true);
    }}
    onpointerleave={(e) => {
      if (details.anchor === e.currentTarget && details.byHover)
        details.close();
    }}
  >
    {@render bar()}
  </button>
{:else}
  <span
    class="pointer-events-none absolute top-1 bottom-1 left-0.5 flex w-5 items-center justify-center py-0.5"
  >
    {@render bar()}
  </span>
{/if}

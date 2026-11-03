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
  A value's color in a weather grid: a bar at its cell's left edge. One color;
  the new one over the old, crossed out, when `was` differs; dashed for a value
  in none of its gauge's ranges. Pressed or hovered (`title` given, in a grid
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

{#snippet fill(c: SwatchColor)}
  {#if c === 'outside' || !c}
    <span class="block flex-1" style:background-image={OUTSIDE_STRIPES}></span>
  {:else}
    <span class="block flex-1" style:background-color={c.hex}></span>
  {/if}
{/snippet}

{#snippet bar()}
  <span
    class={[
      'flex h-full w-3 flex-col overflow-hidden rounded-full',
      color === 'outside' && !changed
        ? 'border-surface-500 border border-dashed'
        : 'ring-1 ring-black/25',
      faint && 'opacity-50',
    ]}
    aria-hidden="true"
  >
    {@render fill(color)}
    {#if changed}
      <span class="relative flex flex-1 flex-col border-t border-black/40">
        {@render fill(was ?? null)}
        <svg
          class="absolute inset-0 size-full"
          viewBox="0 0 10 10"
          preserveAspectRatio="none"
        >
          <path
            d="M2 2 8 8M8 2 2 8"
            stroke="rgb(0 0 0 / 0.6)"
            stroke-width="3.5"
            vector-effect="non-scaling-stroke"
          />
          <path
            d="M2 2 8 8M8 2 2 8"
            stroke="white"
            stroke-width="1.75"
            vector-effect="non-scaling-stroke"
          />
        </svg>
      </span>
    {/if}
  </span>
{/snippet}

{#if interactive && shown && details}
  <button
    type="button"
    class="absolute top-1 bottom-1 left-0.5 flex w-5 cursor-pointer justify-center py-0.5"
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
    class="pointer-events-none absolute top-1 bottom-1 left-0.5 flex w-5 justify-center py-0.5"
  >
    {@render bar()}
  </span>
{/if}

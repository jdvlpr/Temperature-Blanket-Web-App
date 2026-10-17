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
  Yarn colorways as cards, like the palette's color cards: a round swatch on
  the card's top line with a "more" menu (⋮) at its end, then the name, yarn
  and match below it on the card. The ⋮ menu holds the link to buy or view
  it and the copy options. The cards share their grid row's tracks (subgrid),
  so across a row the names, yarns and matches line up.

  With View › Fill with color, the whole card takes the colorway's color,
  grown out of the swatch (which fades into it), with black or white text,
  whichever stands out on it. The match keeps its own surface.

  With `selection`, each card (but its ⋮ menu) is one toggle button, led by a
  circle that's checked when it's selected, beside the swatch.
-->
<script lang="ts">
  import type { Color } from '#lib/types/yarn-types.js';
  import { CircleCheckIcon, CircleIcon } from '@lucide/svelte';
  import ColorwayMoreMenu from './ColorwayMoreMenu.svelte';
  import {
    colorwayKey,
    iconColorOn,
    matchPercent,
    swatchClass,
    type ColorwaySelection,
  } from './colorway-utils';
  import { fillFromSwatch, fillWithColor, mutedText } from './fill-with-color';

  interface Props {
    colorways: (Color & { delta?: number })[];
    selection?: ColorwaySelection;
  }

  let { colorways, selection }: Props = $props();

  let filled = $derived(fillWithColor.on);

  // A track for the match and "No longer available" only when some card
  // has one, so there's no empty track (and its gap) on every card
  let hasExtras = $derived(
    colorways.some(
      (colorway) =>
        matchPercent(colorway) !== undefined || colorway.unavailable,
    ),
  );
  // Literal, so Tailwind finds them. The card's own gap, not the grid's.
  let rows = $derived(
    `grid grid-rows-subgrid gap-y-1 ${hasExtras ? 'row-span-4' : 'row-span-3'}`,
  );
</script>

<!-- Spans, since in a selectable card they're inside its button -->
{#snippet swatch(colorway: Color)}
  <span
    class="{swatchClass} {filled ? 'opacity-0' : ''}"
    style="background:{colorway.hex}"
    data-fill-origin
  ></span>
{/snippet}

{#snippet fillLayer(colorway: Color)}
  <span class="fill-layer" style="background:{colorway.hex}" aria-hidden="true"
  ></span>
{/snippet}

<!-- One per track: name, yarn, then match and "No longer available" -->
{#snippet details(colorway: Color & { delta?: number })}
  {@const match = matchPercent(colorway)}
  <span class="leading-tight font-semibold text-pretty">
    {colorway.name}
  </span>
  <span class="{mutedText(filled)} text-xs text-pretty">
    {colorway.brandName} · {colorway.yarnName}
  </span>
  <!-- Its track stays when this card has neither, if another has one -->
  {#if match !== undefined || colorway.unavailable}
    <span class="flex flex-col items-start gap-1 pt-1">
      {#if match !== undefined}
        <span
          class="bg-surface-200-800 text-surface-950-50 w-fit rounded-full px-2 py-0.5 text-xs font-semibold whitespace-nowrap tabular-nums"
        >
          {match}% match
        </span>
      {/if}
      {#if colorway.unavailable}
        <span class="{mutedText(filled)} text-xs leading-tight">
          No longer available
        </span>
      {/if}
    </span>
  {/if}
{/snippet}

<ul
  class="grid w-full grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5"
>
  {#each colorways as colorway (colorwayKey(colorway))}
    {#if selection}
      {@const selected = selection.isSelected(colorway)}
      <!-- Selected on a color: the ring stands off the card, so it shows
      even on a yarn close to the ring's own color -->
      <li
        class="card bg-surface-50-950 relative isolate min-w-0 overflow-hidden border {rows} {selected
          ? 'border-primary-500 ring-primary-500 ring-2'
          : 'border-surface-200-800'} {selected && filled
          ? 'ring-offset-surface-50-950 ring-offset-2'
          : ''}"
        style:color={filled ? iconColorOn(colorway.hex) : undefined}
        data-fillable
        data-filled={filled || undefined}
        use:fillFromSwatch={filled}
      >
        {@render fillLayer(colorway)}
        <button
          type="button"
          class="cursor-pointer p-2 text-left {rows} {filled
            ? 'hover-on-color'
            : 'hover:bg-surface-200-800/50'}"
          aria-pressed={selected}
          onclick={() => selection.ontoggle(colorway)}
        >
          <!-- Room at the end for the ⋮ menu, which isn't part of the toggle -->
          <span class="mb-1 flex h-12 items-center gap-1 pr-12">
            <span class="flex size-8 shrink-0 items-center justify-center">
              {#if selected}
                <CircleCheckIcon
                  class={filled ? '' : 'text-primary-700-300'}
                  aria-hidden="true"
                />
              {:else}
                <CircleIcon aria-hidden="true" />
              {/if}
            </span>
            {@render swatch(colorway)}
          </span>
          {@render details(colorway)}
        </button>
        <!-- Over the swatch's line, a box the same height and as far down,
        so the button centers on that line whatever its own size -->
        <div class="absolute top-2 right-2 flex h-12 items-center">
          <ColorwayMoreMenu {colorway} on={filled ? 'color' : 'surface'} />
        </div>
      </li>
    {:else}
      <li
        class="card bg-surface-50-950 border-surface-200-800 relative isolate min-w-0 overflow-hidden border p-2 {rows}"
        style:color={filled ? iconColorOn(colorway.hex) : undefined}
        data-fillable
        data-filled={filled || undefined}
        use:fillFromSwatch={filled}
      >
        {@render fillLayer(colorway)}
        <div class="mb-1 flex h-12 items-center gap-1">
          {@render swatch(colorway)}
          <span class="ml-auto flex items-center"
            ><ColorwayMoreMenu
              {colorway}
              on={filled ? 'color' : 'surface'}
            /></span
          >
        </div>
        {@render details(colorway)}
      </li>
    {/if}
  {/each}
</ul>

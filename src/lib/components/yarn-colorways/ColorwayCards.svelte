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
  and match below it on the card, so text reads the same on every color. The
  ⋮ menu holds the link to buy or view it and the copy options.

  With `selection`, each card (but its ⋮ menu) is one toggle button, led by a
  circle that's checked when it's selected, beside the swatch.
-->
<script lang="ts">
  import type { Color } from '$lib/types/yarn-types';
  import { CircleCheckIcon, CircleIcon } from '@lucide/svelte';
  import ColorwayMoreMenu from './ColorwayMoreMenu.svelte';
  import {
    colorwayKey,
    matchPercent,
    swatchClass,
    type ColorwaySelection,
  } from './colorway-utils';

  interface Props {
    colorways: (Color & { delta?: number })[];
    selection?: ColorwaySelection;
  }

  let { colorways, selection }: Props = $props();
</script>

<!-- Spans, since in a selectable card they're inside its button -->
{#snippet swatch(colorway: Color)}
  <span class={swatchClass} style="background:{colorway.hex}"></span>
{/snippet}

{#snippet details(colorway: Color & { delta?: number })}
  {@const match = matchPercent(colorway)}
  <span class="flex min-w-0 flex-col gap-0.5">
    <span class="leading-tight font-semibold text-pretty">
      {colorway.name}
    </span>
    <span class="text-surface-700-300 text-xs text-pretty">
      {colorway.brandName} · {colorway.yarnName}
    </span>
  </span>
  {#if match !== undefined}
    <span
      class="bg-surface-200-800 text-surface-950-50 w-fit rounded-full px-2 py-0.5 text-xs font-semibold whitespace-nowrap tabular-nums"
    >
      {match}% match
    </span>
  {/if}
  {#if colorway.unavailable}
    <span class="text-surface-700-300 mt-auto text-xs leading-tight">
      No longer available
    </span>
  {/if}
{/snippet}

<ul
  class="grid w-full grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5"
>
  {#each colorways as colorway (colorwayKey(colorway))}
    {#if selection}
      {@const selected = selection.isSelected(colorway)}
      <li
        class="card bg-surface-50-950 relative flex min-w-0 flex-col overflow-hidden border {selected
          ? 'border-primary-500 ring-primary-500 ring-2'
          : 'border-surface-200-800'}"
      >
        <button
          type="button"
          class="hover:bg-surface-200-800/50 flex flex-1 cursor-pointer flex-col text-left"
          aria-pressed={selected}
          onclick={() => selection.ontoggle(colorway)}
        >
          <!-- Room at the end for the ⋮ menu, which isn't part of the toggle -->
          <span class="flex h-14 items-center gap-1 px-2 pt-2 pr-14">
            <span class="flex size-8 shrink-0 items-center justify-center">
              {#if selected}
                <CircleCheckIcon
                  class="text-primary-700-300"
                  aria-hidden="true"
                />
              {:else}
                <CircleIcon aria-hidden="true" />
              {/if}
            </span>
            {@render swatch(colorway)}
          </span>
          <span class="flex flex-1 flex-col gap-2 p-2">
            {@render details(colorway)}
          </span>
        </button>
        <!-- Over the swatch's line, a box the same height and as far down,
        so the button centers on that line whatever its own size -->
        <div class="absolute top-2 right-2 flex h-12 items-center">
          <ColorwayMoreMenu {colorway} on="surface" />
        </div>
      </li>
    {:else}
      <li
        class="card bg-surface-50-950 border-surface-200-800 flex min-w-0 flex-col overflow-hidden border"
      >
        <div class="flex h-14 items-center gap-1 px-2 pt-2">
          {@render swatch(colorway)}
          <span class="ml-auto flex items-center"
            ><ColorwayMoreMenu {colorway} on="surface" /></span
          >
        </div>
        <div class="flex flex-1 flex-col gap-2 p-2">
          {@render details(colorway)}
        </div>
      </li>
    {/if}
  {/each}
</ul>

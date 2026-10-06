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
  Yarn colorways as swatch cards: the color on its own, uncovered, with the
  name and yarn below it on the card, so text reads the same on every color.
  A "more" menu (⋮) in the swatch's top right holds the link to buy or view
  it and the copy options. The match sits beside it, or below it on a card
  too narrow for both.

  With `selection`, each card's swatch and name are one toggle button (a
  circle, checked when selected); the ⋮ menu stays its own button beside it.
-->
<script lang="ts">
  import type { Color } from '$lib/types/yarn-types';
  import { CircleCheckIcon, CircleIcon } from '@lucide/svelte';
  import ColorwayMoreMenu from './ColorwayMoreMenu.svelte';
  import {
    colorwayKey,
    iconColorOn,
    matchPercent,
    type ColorwaySelection,
  } from './colorway-utils';

  interface Props {
    colorways: (Color & { delta?: number })[];
    selection?: ColorwaySelection;
  }

  let { colorways, selection }: Props = $props();
</script>

{#snippet matchPill(match: number)}
  <span
    class="bg-surface-50-950 text-surface-950-50 rounded-full px-2 py-0.5 text-xs font-semibold whitespace-nowrap"
  >
    {match}% match
  </span>
{/snippet}

<!-- Spans, since in a selectable card they're inside its button -->
{#snippet details(colorway: Color)}
  <span class="flex min-w-0 flex-col gap-0.5">
    <span class="leading-tight font-semibold text-pretty">
      {colorway.name}
    </span>
    <span class="text-surface-700-300 text-xs text-pretty">
      {colorway.brandName} · {colorway.yarnName}
    </span>
  </span>
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
    {@const match = matchPercent(colorway)}
    {#if selection}
      {@const selected = selection.isSelected(colorway)}
      <li
        class="card bg-surface-50-950 relative flex min-w-0 flex-col overflow-hidden border {selected
          ? 'border-primary-500 ring-primary-500 ring-2'
          : 'border-surface-200-800'}"
      >
        <button
          type="button"
          class="flex flex-1 cursor-pointer flex-col text-left"
          aria-pressed={selected}
          onclick={() => selection.ontoggle(colorway)}
        >
          <span
            class="flex h-20 w-full items-start gap-1 p-2 pr-10 sm:h-24"
            style="background:{colorway.hex};color:{iconColorOn(colorway.hex)}"
          >
            {#if selected}
              <CircleCheckIcon class="shrink-0" aria-hidden="true" />
            {:else}
              <CircleIcon class="shrink-0" aria-hidden="true" />
            {/if}
            {#if match !== undefined}{@render matchPill(match)}{/if}
          </span>
          <span class="flex flex-1 flex-col gap-2 p-2 sm:p-3">
            {@render details(colorway)}
          </span>
        </button>
        <div class="absolute top-1 right-1">
          <ColorwayMoreMenu {colorway} />
        </div>
      </li>
    {:else}
      <li
        class="card bg-surface-50-950 border-surface-200-800 flex min-w-0 flex-col overflow-hidden border"
      >
        <div class="h-20 p-2 sm:h-24" style="background:{colorway.hex}">
          <div
            class="flex flex-row-reverse flex-wrap items-center justify-between gap-1"
          >
            <div class="-m-1"><ColorwayMoreMenu {colorway} /></div>
            {#if match !== undefined}
              <div class="mr-auto">{@render matchPill(match)}</div>
            {/if}
          </div>
        </div>
        <div class="flex flex-1 flex-col gap-2 p-2 sm:p-3">
          {@render details(colorway)}
        </div>
      </li>
    {/if}
  {/each}
</ul>

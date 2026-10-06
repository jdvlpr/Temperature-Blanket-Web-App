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
  Yarn colorways as rows, the cards laid out sideways: swatch, name and yarn,
  match, and the same "more" menu (⋮) with the link to buy or view it and the
  copy options. Each row stays on one line at every width.

  With `selection`, each row (but its ⋮ menu) is one toggle button, led by a
  circle that's checked when it's selected.
-->
<script lang="ts">
  import type { Color } from '$lib/types/yarn-types';
  import { CircleCheckIcon, CircleIcon } from '@lucide/svelte';
  import ColorwayMoreMenu from './ColorwayMoreMenu.svelte';
  import {
    colorwayKey,
    matchPercent,
    type ColorwaySelection,
  } from './colorway-utils';

  interface Props {
    colorways: (Color & { delta?: number })[];
    selection?: ColorwaySelection;
  }

  let { colorways, selection }: Props = $props();
</script>

<!-- Spans, since in a selectable row they're inside its button -->
{#snippet row(colorway: Color & { delta?: number })}
  {@const match = matchPercent(colorway)}
  <span
    class="rounded-container size-12 shrink-0 ring-1 ring-black/10 ring-inset"
    style="background:{colorway.hex}"
  ></span>
  <span class="flex min-w-0 flex-1 flex-col gap-0.5">
    <span class="leading-tight font-semibold text-pretty">{colorway.name}</span>
    <span class="text-surface-700-300 text-xs text-pretty">
      {colorway.brandName} · {colorway.yarnName}
    </span>
    {#if colorway.unavailable}
      <span class="text-surface-700-300 text-xs leading-tight">
        No longer available
      </span>
    {/if}
  </span>
  {#if match !== undefined}
    <span
      class="bg-surface-200-800 text-surface-950-50 shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold whitespace-nowrap tabular-nums"
    >
      {match}% match
    </span>
  {/if}
{/snippet}

<ul
  class="rounded-container border-surface-200-800 bg-surface-50-950 divide-surface-200-800 w-full divide-y overflow-hidden border"
>
  {#each colorways as colorway (colorwayKey(colorway))}
    {#if selection}
      {@const selected = selection.isSelected(colorway)}
      <li
        class="flex items-center gap-1 pr-2 {selected
          ? 'bg-primary-500/15'
          : ''}"
      >
        <button
          type="button"
          class="hover:bg-surface-200-800/50 flex min-w-0 flex-1 cursor-pointer items-center gap-3 p-2 text-left"
          aria-pressed={selected}
          onclick={() => selection.ontoggle(colorway)}
        >
          {#if selected}
            <CircleCheckIcon
              class="text-primary-700-300 shrink-0"
              aria-hidden="true"
            />
          {:else}
            <CircleIcon class="shrink-0" aria-hidden="true" />
          {/if}
          {@render row(colorway)}
        </button>
        <ColorwayMoreMenu {colorway} on="surface" />
      </li>
    {:else}
      <li class="flex items-center gap-3 p-2">
        {@render row(colorway)}
        <ColorwayMoreMenu {colorway} on="surface" />
      </li>
    {/if}
  {/each}
</ul>

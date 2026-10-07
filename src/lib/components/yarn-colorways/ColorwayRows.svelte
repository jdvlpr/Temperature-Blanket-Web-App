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
  Yarn colorways as rows, the cards laid out sideways: round swatch, name and yarn,
  match, and the same "more" menu (⋮) with the link to buy or view it and the
  copy options. The match sits at the row's end, or under the name where the
  list is narrow.

  With View › Fill with color, the whole row takes the colorway's color, as
  the cards do (see ColorwayCards).

  With `selection`, each row (but its ⋮ menu) is one toggle button, led by a
  circle that's checked when it's selected.
-->
<script lang="ts">
  import type { Color } from '$lib/types/yarn-types';
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
</script>

{#snippet fillLayer(colorway: Color)}
  <span class="fill-layer" style="background:{colorway.hex}" aria-hidden="true"
  ></span>
{/snippet}

<!-- Spans, since in a selectable row they're inside its button -->
{#snippet matchPill(match: number, extra: string)}
  <span
    class="bg-surface-200-800 text-surface-950-50 w-fit shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold whitespace-nowrap tabular-nums {extra}"
  >
    {match}% match
  </span>
{/snippet}

{#snippet row(colorway: Color & { delta?: number })}
  {@const match = matchPercent(colorway)}
  <span
    class="{swatchClass} {filled ? 'opacity-0' : ''}"
    style="background:{colorway.hex}"
    data-fill-origin
  ></span>
  <span class="flex min-w-0 flex-1 flex-col gap-0.5">
    <span class="leading-tight font-semibold text-pretty">{colorway.name}</span>
    <span class="{mutedText(filled)} text-xs text-pretty">
      {colorway.brandName} · {colorway.yarnName}
    </span>
    {#if colorway.unavailable}
      <span class="{mutedText(filled)} text-xs leading-tight">
        No longer available
      </span>
    {/if}
    <!-- Under the name where the list is narrow, so the name keeps its room -->
    {#if match !== undefined}{@render matchPill(
        match,
        'mt-0.5 @md:hidden',
      )}{/if}
  </span>
  {#if match !== undefined}{@render matchPill(match, 'hidden @md:inline')}{/if}
{/snippet}

<ul
  class="rounded-container border-surface-200-800 bg-surface-50-950 divide-surface-200-800 @container w-full divide-y overflow-hidden border"
>
  {#each colorways as colorway (colorwayKey(colorway))}
    {#if selection}
      {@const selected = selection.isSelected(colorway)}
      <!-- Selected on a color: an outline in the text's color, which
      stands out on any yarn -->
      <li
        class="relative isolate flex items-center gap-1 overflow-hidden pr-2 {selected
          ? filled
            ? 'outline-2 -outline-offset-4 outline-current'
            : 'bg-primary-500/15'
          : ''}"
        style:color={filled ? iconColorOn(colorway.hex) : undefined}
        data-fillable
        data-filled={filled || undefined}
        use:fillFromSwatch={filled}
      >
        {@render fillLayer(colorway)}
        <button
          type="button"
          class="{filled
            ? 'hover-on-color'
            : 'hover:bg-surface-200-800/50'} flex min-w-0 flex-1 cursor-pointer items-center gap-3 p-2 text-left"
          aria-pressed={selected}
          onclick={() => selection.ontoggle(colorway)}
        >
          {#if selected}
            <CircleCheckIcon
              class="shrink-0 {filled ? '' : 'text-primary-700-300'}"
              aria-hidden="true"
            />
          {:else}
            <CircleIcon class="shrink-0" aria-hidden="true" />
          {/if}
          {@render row(colorway)}
        </button>
        <ColorwayMoreMenu {colorway} on={filled ? 'color' : 'surface'} />
      </li>
    {:else}
      <li
        class="relative isolate flex items-center gap-3 overflow-hidden p-2"
        style:color={filled ? iconColorOn(colorway.hex) : undefined}
        data-fillable
        data-filled={filled || undefined}
        use:fillFromSwatch={filled}
      >
        {@render fillLayer(colorway)}
        {@render row(colorway)}
        <ColorwayMoreMenu {colorway} on={filled ? 'color' : 'surface'} />
      </li>
    {/if}
  {/each}
</ul>

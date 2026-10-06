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
-->
<script lang="ts">
  import type { Color } from '$lib/types/yarn-types';
  import ColorwayMoreMenu from './ColorwayMoreMenu.svelte';
  import { colorwayKey, matchPercent } from './colorway-utils';

  interface Props {
    colorways: (Color & { delta?: number })[];
  }

  let { colorways }: Props = $props();
</script>

<ul
  class="grid w-full grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5"
>
  {#each colorways as colorway (colorwayKey(colorway))}
    {@const match = matchPercent(colorway)}
    <li
      class="card bg-surface-50-950 border-surface-200-800 flex min-w-0 flex-col overflow-hidden border"
    >
      <div class="h-20 p-2 sm:h-24" style="background:{colorway.hex}">
        <div
          class="flex flex-row-reverse flex-wrap items-center justify-between gap-1"
        >
          <div class="-m-1"><ColorwayMoreMenu {colorway} /></div>
          {#if match !== undefined}
            <p
              class="bg-surface-50-950 text-surface-950-50 mr-auto rounded-full px-2 py-0.5 text-xs font-semibold whitespace-nowrap"
            >
              {match}% match
            </p>
          {/if}
        </div>
      </div>
      <div class="flex flex-1 flex-col gap-2 p-2 sm:p-3">
        <div class="flex min-w-0 flex-col gap-0.5">
          <p class="leading-tight font-semibold text-pretty">
            {colorway.name}
          </p>
          <p class="text-surface-700-300 text-xs text-pretty">
            {colorway.brandName} · {colorway.yarnName}
          </p>
        </div>
        {#if colorway.unavailable}
          <p class="text-surface-700-300 mt-auto text-xs leading-tight">
            No longer available
          </p>
        {/if}
      </div>
    </li>
  {/each}
</ul>

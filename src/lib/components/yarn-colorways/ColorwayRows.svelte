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
  class="rounded-container border-surface-200-800 bg-surface-50-950 divide-surface-200-800 w-full divide-y overflow-hidden border"
>
  {#each colorways as colorway (colorwayKey(colorway))}
    {@const match = matchPercent(colorway)}
    <li class="flex items-center gap-3 p-2">
      <span
        class="rounded-container size-12 shrink-0 ring-1 ring-black/10 ring-inset"
        style="background:{colorway.hex}"
      ></span>
      <div class="flex min-w-0 flex-1 flex-col gap-0.5">
        <p class="leading-tight font-semibold text-pretty">{colorway.name}</p>
        <p class="text-surface-700-300 text-xs text-pretty">
          {colorway.brandName} · {colorway.yarnName}
        </p>
        {#if colorway.unavailable}
          <p class="text-surface-700-300 text-xs leading-tight">
            No longer available
          </p>
        {/if}
      </div>
      {#if match !== undefined}
        <p
          class="bg-surface-200-800 text-surface-950-50 shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold whitespace-nowrap tabular-nums"
        >
          {match}% match
        </p>
      {/if}
      <ColorwayMoreMenu {colorway} on="surface" />
    </li>
  {/each}
</ul>

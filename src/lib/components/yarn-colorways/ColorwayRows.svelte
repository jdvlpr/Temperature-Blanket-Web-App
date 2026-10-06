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
  Yarn colorways as detailed rows: swatch, name, yarn, match, and every
  action in reach without opening anything. On a phone the actions wrap onto
  their own line under the colorway.
-->
<script lang="ts">
  import type { Color } from '$lib/types/yarn-types';
  import ColorwayActions from './ColorwayActions.svelte';
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
    <li class="flex flex-wrap items-center gap-x-3 gap-y-2 p-2 md:flex-nowrap">
      <span
        class="rounded-container size-12 shrink-0 ring-1 ring-black/10 ring-inset"
        style="background:{colorway.hex}"
      ></span>
      <div class="flex min-w-0 flex-1 flex-col">
        <p class="leading-tight font-semibold">{colorway.name}</p>
        <p class="text-surface-700-300 text-xs">
          {colorway.brandName} · {colorway.yarnName}{#if colorway.hex}
            · <span class="font-mono">{colorway.hex}</span>{/if}
        </p>
      </div>
      {#if match !== undefined}
        <p class="shrink-0 text-sm font-semibold tabular-nums">
          {match}%<span class="sr-only"> match</span>
        </p>
      {/if}
      <div class="w-full md:w-auto">
        <ColorwayActions {colorway} layout="row" />
      </div>
    </li>
  {/each}
</ul>

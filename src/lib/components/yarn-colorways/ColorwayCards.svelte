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
  The name copies itself; the hex code and shop link sit under it.
-->
<script lang="ts">
  import type { Color } from '$lib/types/yarn-types';
  import ColorwayActions from './ColorwayActions.svelte';
  import {
    colorwayKey,
    copyColorwayText,
    matchPercent,
  } from './colorway-utils';

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
      <div
        class="flex h-24 items-start p-2 sm:h-28"
        style="background:{colorway.hex}"
      >
        {#if match !== undefined}
          <p
            class="bg-surface-50-950 text-surface-950-50 rounded-full px-2 py-0.5 text-xs font-semibold"
          >
            {match}% match
          </p>
        {/if}
      </div>
      <div class="flex flex-1 flex-col gap-2 p-2 sm:p-3">
        <div class="flex min-w-0 flex-col gap-0.5">
          <button
            type="button"
            class="cursor-pointer rounded-sm text-left leading-tight font-semibold text-pretty hover:underline"
            aria-label="Copy name {colorway.name}"
            title="Copy name"
            onclick={() => copyColorwayText(colorway.name ?? '')}
          >
            {colorway.name}
          </button>
          <p class="text-surface-700-300 text-xs text-pretty">
            {colorway.brandName} · {colorway.yarnName}
          </p>
        </div>
        <div class="mt-auto">
          <ColorwayActions {colorway} layout="card" />
        </div>
      </div>
    </li>
  {/each}
</ul>

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

<script lang="ts">
  import { getTextColor } from '$lib/utils/color-utils';
  import { LockIcon } from '@lucide/svelte';
  import type { ImagePaletteState } from './image-palette-state.svelte';

  let { palette }: { palette: ImagePaletteState } = $props();
</script>

<div
  class="rounded-container flex h-12 w-full overflow-hidden shadow-sm"
  role="group"
  aria-label="Palette"
>
  {#each palette.points as point, i (point.id)}
    {@const color = palette.colorOf(point)}
    {@const text = getTextColor(color)}
    {@const active = palette.selectedId === point.id}
    {@const yarn = palette.mode === 'yarn' ? point.yarn : null}
    <button
      type="button"
      class={[
        'relative flex min-w-0 flex-1 items-center justify-center text-xs font-bold transition-[flex-grow]',
        active && 'grow-[2]',
      ]}
      style="background:{color};color:{text}"
      title={yarn
        ? `${yarn.brandName} - ${yarn.yarnName}: ${yarn.name}`
        : color}
      aria-label="Color {i + 1}: {yarn
        ? `${yarn.brandName} ${yarn.yarnName} ${yarn.name}`
        : color}{point.locked ? ' (locked)' : ''}"
      aria-pressed={active}
      onclick={() => (palette.selectedId = active ? null : point.id)}
      onpointerenter={() => (palette.hoveredId = point.id)}
      onpointerleave={() => (palette.hoveredId = null)}
    >
      {#if active || palette.hoveredId === point.id}
        <span
          class="absolute inset-0 border-4"
          style="border-color:{text}"
          aria-hidden="true"
        ></span>
      {/if}
      {#if point.locked}
        <LockIcon class="size-3" />
      {:else if palette.points.length <= 20}
        {i + 1}
      {/if}
    </button>
  {/each}
</div>

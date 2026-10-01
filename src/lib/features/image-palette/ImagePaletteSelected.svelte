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
  import {
    ChevronLeftIcon,
    ChevronRightIcon,
    LockIcon,
    LockOpenIcon,
    Trash2Icon,
    XIcon,
  } from '@lucide/svelte';
  import type { ImagePaletteState } from './image-palette-state.svelte';
  import { colorwayKey } from './match';

  let { palette }: { palette: ImagePaletteState } = $props();

  let point = $derived(palette.selected);
  let index = $derived(
    point ? palette.points.findIndex((n) => n.id === point.id) : -1,
  );
  let yarn = $derived(palette.mode === 'yarn' ? point?.yarn : null);
  let alternatives = $derived(
    point && palette.mode === 'yarn' ? palette.alternatives(point) : [],
  );
</script>

{#if point}
  {@const color = palette.colorOf(point)}
  <div
    class="card preset-outlined-surface-200-800 my-2 flex flex-col gap-3 p-3"
  >
    <div class="flex flex-wrap items-center gap-3">
      <div
        class="rounded-container flex size-12 shrink-0 items-center justify-center font-bold"
        style="background:{color};color:{getTextColor(color)}"
      >
        {index + 1}
      </div>
      <div class="min-w-0 flex-1 text-left">
        {#if yarn}
          <p class="text-xs">{yarn.brandName} - {yarn.yarnName}</p>
          <p class="font-bold">{yarn.name}</p>
          <p class="text-xs">{Math.floor(100 - (yarn.delta ?? 0))}% Match</p>
        {:else}
          <p class="font-bold">{color}</p>
        {/if}
        <p class="text-surface-700-300 flex items-center gap-1 text-xs">
          From the photo:
          <span
            class="inline-block size-3 rounded-sm border border-black/20"
            style="background:{point.sourceHex}"
          ></span>
          {point.sourceHex}
        </p>
      </div>
      <div class="flex flex-wrap items-center gap-1">
        <button
          class="btn-icon hover:preset-tonal-surface"
          title="Move left"
          aria-label="Move color left"
          disabled={index <= 0}
          onclick={() => palette.shift(point.id, -1)}
        >
          <ChevronLeftIcon />
        </button>
        <button
          class="btn-icon hover:preset-tonal-surface"
          title="Move right"
          aria-label="Move color right"
          disabled={index >= palette.points.length - 1}
          onclick={() => palette.shift(point.id, 1)}
        >
          <ChevronRightIcon />
        </button>
        <button
          class="btn-icon hover:preset-tonal-surface"
          title={point.locked ? 'Unlock' : 'Lock'}
          aria-label="{point.locked ? 'Unlock' : 'Lock'} color"
          aria-pressed={point.locked}
          onclick={() => palette.toggleLock(point.id)}
        >
          {#if point.locked}<LockIcon />{:else}<LockOpenIcon />{/if}
        </button>
        <button
          class="btn-icon hover:preset-tonal-surface"
          title="Remove"
          aria-label="Remove color"
          onclick={() => palette.removePoint(point.id)}
        >
          <Trash2Icon />
        </button>
        <button
          class="btn-icon hover:preset-tonal-surface"
          title="Close"
          aria-label="Close color details"
          onclick={() => (palette.selectedId = null)}
        >
          <XIcon />
        </button>
      </div>
    </div>

    {#if alternatives.length}
      <div class="text-left">
        <p class="mb-1 text-sm">Other close yarns</p>
        <div class="flex flex-wrap gap-2">
          {#each alternatives as alternative (colorwayKey(alternative))}
            {@const current =
              !!yarn && colorwayKey(alternative) === colorwayKey(yarn)}
            <button
              class={[
                'rounded-container flex items-center gap-2 border px-2 py-1 text-left text-xs',
                current
                  ? 'border-primary-500 ring-primary-500 ring-2'
                  : 'border-surface-300-700 hover:preset-tonal-surface',
              ]}
              aria-pressed={current}
              disabled={point.locked}
              onclick={() => palette.setYarn(point.id, alternative)}
            >
              <span
                class="inline-block size-6 shrink-0 rounded-sm border border-black/20"
                style="background:{alternative.hex}"
              ></span>
              <span class="flex flex-col">
                <span class="font-bold">{alternative.name}</span>
                <span class="text-surface-700-300"
                  >{alternative.brandName} - {alternative.yarnName} · {Math.floor(
                    100 - (alternative.delta ?? 0),
                  )}%</span
                >
              </span>
            </button>
          {/each}
        </div>
      </div>
    {/if}
  </div>
{/if}

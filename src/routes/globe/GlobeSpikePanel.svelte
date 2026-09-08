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

<!--
  Dev-only controls for the zoom-detail spike. Reachable at /globe?spike=1
  under `pnpm dev` and gated so it cannot exist in a production build.

  The readout is the point: the spike is meant to settle whether tiles are
  worth their cost, and that is a question about frame rate and request counts,
  not about how the globe looks in a screenshot.
-->

<script lang="ts">
  import {
    BASE_MODES,
    TILE_SOURCES,
    findTileSource,
    type SurfaceMode,
  } from './globe-textures';

  interface Props {
    surface: SurfaceMode;
    anisotropy: boolean;
    overlay: boolean;
    /** Anisotropy level actually applied, as reported by the GPU. */
    anisotropyLevel: number;
    altitude: number;
    tileLevel: number | null;
    tileRequests: number;
    fps: number;
    onSurface: (mode: SurfaceMode) => void;
    onAnisotropy: (enabled: boolean) => void;
    onOverlay: (enabled: boolean) => void;
    onClearCache: () => void;
  }

  let {
    surface,
    anisotropy,
    overlay,
    anisotropyLevel,
    altitude,
    tileLevel,
    tileRequests,
    fps,
    onSurface,
    onAnisotropy,
    onOverlay,
    onClearCache,
  }: Props = $props();

  const activeSource = $derived(findTileSource(surface));

  const buttonClass = (active: boolean) =>
    `rounded px-2 py-1 text-left text-xs transition-colors ${
      active
        ? 'bg-primary-500 text-white'
        : 'bg-surface-700/60 text-surface-200 hover:bg-surface-600/60'
    }`;
</script>

<aside
  class="rounded-container bg-surface-900/90 text-surface-100 border-surface-700 w-full border p-3 text-xs lg:w-72"
>
  <p class="mb-2 font-semibold tracking-wide uppercase">Zoom detail spike</p>

  <p class="mb-1 font-medium">Surface</p>
  <div class="mb-3 flex flex-col gap-1">
    {#each BASE_MODES as mode (mode.id)}
      <button
        type="button"
        class={buttonClass(surface === mode.id)}
        onclick={() => onSurface(mode.id)}
      >
        {mode.label}
      </button>
    {/each}
    {#each TILE_SOURCES as source (source.id)}
      <button
        type="button"
        class={buttonClass(surface === source.id)}
        onclick={() => onSurface(source.id)}
      >
        {source.label}
        <span class="opacity-70">
          — tiles, max L{source.maxLevel}{source.labelled ? ', labelled' : ''}
        </span>
      </button>
    {/each}
  </div>

  <div class="mb-3 flex flex-col gap-1">
    <label class="flex items-center gap-2">
      <input
        type="checkbox"
        class="checkbox"
        checked={anisotropy}
        onchange={(e) => onAnisotropy(e.currentTarget.checked)}
      />
      Anisotropic filtering
      <span class="opacity-70">({anisotropyLevel}x)</span>
    </label>
    <label class="flex items-center gap-2">
      <input
        type="checkbox"
        class="checkbox"
        checked={overlay}
        onchange={(e) => onOverlay(e.currentTarget.checked)}
      />
      Coastlines + borders
    </label>
  </div>

  <dl
    class="border-surface-700 mb-3 grid grid-cols-2 gap-x-2 gap-y-1 border-t pt-2"
  >
    <dt class="opacity-70">Altitude</dt>
    <dd class="text-right tabular-nums">{altitude.toFixed(3)}</dd>
    <dt class="opacity-70">Tile level</dt>
    <dd class="text-right tabular-nums">{tileLevel ?? '—'}</dd>
    <dt class="opacity-70">Tiles fetched</dt>
    <dd class="text-right tabular-nums">{tileRequests}</dd>
    <dt class="opacity-70">FPS</dt>
    <dd class="text-right tabular-nums">{fps}</dd>
  </dl>

  <button
    type="button"
    class="bg-surface-700/60 hover:bg-surface-600/60 mb-3 w-full rounded px-2 py-1 text-xs"
    onclick={onClearCache}
  >
    Clear tile cache (re-test cold load)
  </button>

  {#if activeSource}
    <p class="mb-1 opacity-70">
      Imagery: {activeSource.attribution}
    </p>
    <p class="text-warning-400">{activeSource.caveat}</p>
  {/if}

  <p class="border-surface-700 mt-3 border-t pt-2 opacity-60">
    Exact bytes have to come from the DevTools network panel — these tile hosts
    do not send Timing-Allow-Origin, so the browser reports a count but zeroes
    the sizes.
  </p>
</aside>

<!-- Copyright (c) 2026, Thomas (https://github.com/jdvlpr)

This file is part of Temperature-Blanket-Web-App.

Temperature-Blanket-Web-App is free software: you can redistribute it and/or modify it
under the terms of the GNU General Public License as published by the Free Software Foundation,
either version 3 of the License, or (at your option) any later version.

Temperature-Blanket-Web-App is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY;
without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.
See the GNU General Public License for more details.

You should have received a copy of the GNU General Public License along with Temperature-Blanket-Web-App.
If not, see <https://www.gnu.org/licenses/>. -->

<!-- The Palette menu's Open (and Cmd/Ctrl+O): the saved palettes, most
recently changed first, or (signed in) starred gallery palettes, opened as a
named copy. Choosing one opens it here in place of this one, which saves
first. The open one is marked, not a button. -->

<script lang="ts">
  import { browser } from '$app/env';
  import { resolve } from '$app/paths';
  import { account } from '#lib/accounts/summary.svelte.js';
  import PaletteStrip from '#lib/components/PaletteStrip.svelte';
  import OpenShell from '#lib/components/modals/OpenShell.svelte';
  import {
    OPEN_NOW_ROW,
    PANEL_LIST,
    PANEL_ROW,
  } from '#lib/constants/class-constants.js';
  import { ensureYarnData } from '#lib/data/yarns/colorways.svelte.js';
  import { dialog } from '#lib/state/page-state.svelte.js';
  import { savedPalettes } from '#lib/storage/palettes.svelte.js';
  import { sync } from '#lib/sync/status.svelte.js';
  import type { Color } from '#lib/types/yarn-types.js';
  import { matchesSearch } from '#lib/utils/collection-filter.js';
  import {
    getColorsFromInput,
    getPaletteFallbackName,
    type GalleryPalette,
  } from '#lib/utils/color-utils.js';
  import { recordPageView } from '#lib/utils/gallery-utils.js';
  import { savedOn } from '#lib/utils/saved-line.js';
  import { onMount } from 'svelte';
  import { paletteAutosave, savePaletteNow } from './autosave.svelte';
  import { yarnPageState } from './state.svelte';

  // Colorway names come from the yarn data
  let yarnDataReady = $state(false);
  onMount(async () => {
    await ensureYarnData();
    yarnDataReady = true;
  });
  $effect(() => {
    void sync.version;
    void account.summary?.id;
    if (browser) void savedPalettes.refresh();
  });

  // Every saved palette, most recently changed first
  const all = $derived(
    yarnDataReady
      ? savedPalettes.items
          .toSorted((a, b) => b.updatedAt - a.updatedAt)
          .map((palette) => {
            const colors = getColorsFromInput({ string: palette.code });
            if (!colors || !colors.length) return null;
            return {
              id: palette.id,
              colors,
              label: palette.name || getPaletteFallbackName(colors),
              saved: savedOn(palette.updatedAt),
            };
          })
          .filter((item) => item !== null)
      : null,
  );

  async function openSaved(id: string, colors: Color[]) {
    await savePaletteNow();
    await yarnPageState.openSaved(id, colors);
    dialog.close();
  }

  // A starred one, as a copy named after its page
  async function openStarred(palette: GalleryPalette) {
    await savePaletteNow();
    recordPageView(palette.postId);
    yarnPageState.openCopy(palette.colors, palette.page.title);
    dialog.close();
  }
</script>

{#snippet strip(colors: Color[])}
  <span class="w-12 shrink-0" aria-hidden="true">
    <PaletteStrip {colors} height="40px" corners="small" insideControl />
  </span>
{/snippet}

{#snippet mine(search: string)}
  {@const shown = (all ?? []).filter((item) =>
    matchesSearch(search, [
      item.label,
      ...item.colors.flatMap((color) => [
        color.name,
        color.brandName,
        color.yarnName,
      ]),
    ]),
  )}
  {#if !all}
    <p class="text-surface-700-300 text-sm" role="status">Loading…</p>
  {:else if !all.length}
    <p class="text-surface-700-300 text-sm">No saved palettes yet.</p>
  {:else if !shown.length}
    <p class="text-surface-700-300 text-sm">No palettes match “{search}”.</p>
  {:else}
    <ul class={PANEL_LIST} aria-label="Saved palettes">
      {#each shown as item (item.id)}
        <li>
          {#if item.id === paletteAutosave.id}
            <!-- The open one: nothing to open -->
            <div class={OPEN_NOW_ROW} aria-current="true">
              {@render strip(item.colors)}
              <span class="flex min-w-0 flex-1 flex-col">
                <span class="line-clamp-2 text-sm font-semibold break-words"
                  >{item.label}</span
                >
                <span class="text-surface-700-300 text-xs">Open now</span>
              </span>
            </div>
          {:else}
            <button
              type="button"
              class={PANEL_ROW}
              onclick={() => openSaved(item.id, item.colors)}
            >
              {@render strip(item.colors)}
              <span class="flex min-w-0 flex-1 flex-col">
                <span class="line-clamp-2 text-sm font-semibold break-words"
                  >{item.label}</span
                >
                <span class="text-surface-700-300 line-clamp-1 text-xs"
                  >{item.saved}</span
                >
              </span>
            </button>
          {/if}
        </li>
      {/each}
    </ul>
  {/if}
{/snippet}

<OpenShell
  kind="palette"
  mineCount={all?.length ?? null}
  libraryHref={resolve('/my-palettes')}
  {mine}
  onuse={openStarred}
/>

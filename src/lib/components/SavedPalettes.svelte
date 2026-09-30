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

<script lang="ts">
  import ColorPalette from '$lib/components/ColorPalette.svelte';
  import PlaceholderPalettes from '$lib/components/PlaceholderPalettes.svelte';
  import { ensureYarnData } from '$lib/data/yarns/colorways.svelte';
  import { toast } from '$lib/state/page-state.svelte';
  import {
    MAX_SAVED_PALETTE_NAME_LENGTH,
    PaletteStorage,
    savedPalettes,
    type SavedPalette,
  } from '$lib/storage/palettes.svelte';
  import type { Color } from '$lib/types/yarn-types';
  import {
    getColorsFromInput,
    getPaletteFallbackName,
  } from '$lib/utils/color-utils';
  import { escapeHtml } from '$lib/utils/string-utils';
  import {
    CheckIcon,
    PencilIcon,
    Trash2Icon,
    Undo2Icon,
    XIcon,
  } from '@lucide/svelte';
  import { onMount } from 'svelte';

  let {
    updateGauge,
  }: {
    updateGauge: (update: { _colors: Color[]; _schemeId?: string }) => void;
  } = $props();

  // Codes only carry hex and brand/yarn ids, so names need the yarn data first
  let yarnDataReady = $state(false);
  let editingId = $state<string | null>(null);
  let editingName = $state('');
  // Undo lives in the list, since the dialog is modal and a toast button behind it can't be clicked
  let lastDeleted = $state<{ id: string; label: string } | null>(null);

  let palettes = $derived(
    yarnDataReady
      ? savedPalettes.items
          .map((palette) => {
            const colors = getColorsFromInput({ string: palette.code });
            if (!colors || !colors.length) return null;
            return {
              palette,
              colors,
              label: palette.name || getPaletteFallbackName(colors),
            };
          })
          .filter((n) => n !== null)
      : [],
  );

  onMount(async () => {
    await Promise.all([ensureYarnData(), savedPalettes.refresh()]);
    yarnDataReady = true;
  });

  async function run(action: () => Promise<void>, errorMessage: string) {
    try {
      await action();
    } catch {
      toast.trigger({ message: errorMessage, category: 'error' });
    }
    await savedPalettes.refresh();
  }

  function startRename(palette: SavedPalette) {
    editingId = palette.id;
    editingName = palette.name;
  }

  async function saveRename() {
    if (!editingId) return;
    const id = editingId;
    editingId = null;
    await run(
      () => PaletteStorage.rename(id, editingName),
      'Unable to rename the palette',
    );
  }

  async function remove(palette: SavedPalette, label: string) {
    lastDeleted = { id: palette.id, label };
    await run(
      () => PaletteStorage.remove(palette.id),
      'Unable to delete the palette',
    );
  }

  async function undoRemove() {
    if (!lastDeleted) return;
    const { id } = lastDeleted;
    lastDeleted = null;
    await run(
      () => PaletteStorage.restore(id),
      'Unable to restore the palette',
    );
  }

  function use(colors: Color[]) {
    updateGauge({ _colors: colors, _schemeId: 'Custom' });
  }
</script>

<!-- The dialog sizes to its content, so keep this as wide as the other Browse Palettes tabs -->
<div
  class="flex w-full flex-col items-center px-2 md:min-w-[44rem] lg:min-w-[62rem]"
>
  {#if lastDeleted}
    <div
      class="card preset-tonal-surface flex w-full items-center justify-between gap-2 p-2 pl-4 text-left text-sm"
      role="status"
    >
      <span class="line-clamp-1">Deleted {lastDeleted.label}</span>
      <button
        type="button"
        class="btn btn-sm hover:preset-tonal-surface"
        onclick={undoRemove}
      >
        <Undo2Icon />
        Undo
      </button>
    </div>
  {/if}
  {#if !yarnDataReady}
    <div class="my-1"></div>
    <PlaceholderPalettes items={3} maxWFull={true} />
  {:else if !palettes.length}
    <div class="my-8 flex max-w-prose flex-col gap-2 text-center">
      <p class="font-bold">No saved palettes yet</p>
      <p class="text-sm">
        Use the Save Palette button under any palette to keep it here. Saved
        palettes are stored in this browser.
      </p>
    </div>
  {:else}
    <ul
      class="my-2 flex w-full flex-col items-start justify-start gap-4"
      aria-label="Saved palettes"
    >
      {#each palettes as { palette, colors, label } (palette.id)}
        <li class="flex w-full items-start gap-2">
          {#if editingId === palette.id}
            <div class="flex w-full flex-col gap-2">
              <ColorPalette {colors} schemeName=" " />
              <div class="input-group grid-cols-[1fr_auto_auto]">
                <input
                  type="text"
                  class="ig-input"
                  aria-label="Palette name"
                  autocomplete="off"
                  maxlength={MAX_SAVED_PALETTE_NAME_LENGTH}
                  placeholder={getPaletteFallbackName(colors)}
                  bind:value={editingName}
                  onkeydown={(e) => {
                    if (e.key === 'Enter') saveRename();
                    if (e.key === 'Escape') {
                      e.stopPropagation();
                      editingId = null;
                    }
                  }}
                />
                <button
                  type="button"
                  class="ig-btn hover:preset-tonal-surface"
                  title="Save Name"
                  onclick={saveRename}
                >
                  <CheckIcon />
                </button>
                <button
                  type="button"
                  class="ig-btn hover:preset-tonal-surface"
                  title="Cancel"
                  onclick={() => (editingId = null)}
                >
                  <XIcon />
                </button>
              </div>
            </div>
          {:else}
            <button
              type="button"
              class="w-full min-w-0 cursor-pointer"
              title="Use This Palette"
              onclick={() => use(colors)}
            >
              <ColorPalette {colors} schemeName={escapeHtml(label)} />
            </button>
            <!-- Centered on the 70px color bar, not the label under it -->
            <div class="flex h-[70px] shrink-0 items-center gap-1">
              <button
                type="button"
                class="btn-icon hover:preset-tonal-surface"
                title="Rename Palette"
                aria-label="Rename {label}"
                onclick={() => startRename(palette)}
              >
                <PencilIcon />
              </button>
              <button
                type="button"
                class="btn-icon hover:preset-tonal-surface"
                title="Delete Palette"
                aria-label="Delete {label}"
                onclick={() => remove(palette, label)}
              >
                <Trash2Icon />
              </button>
            </div>
          {/if}
        </li>
      {/each}
    </ul>
  {/if}
</div>

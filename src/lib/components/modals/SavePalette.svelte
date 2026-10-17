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
  import SaveAndCloseButtons from '#lib/components/modals/SaveAndCloseButtons.svelte';
  import { untrack } from 'svelte';
  import { account } from '#lib/accounts/summary.svelte.js';
  import { sync } from '#lib/sync/status.svelte.js';
  import { dialog, toast } from '#lib/state/page-state.svelte.js';
  import {
    MAX_SAVED_PALETTE_NAME_LENGTH,
    PaletteStorage,
    type SavedPalette,
  } from '#lib/storage/palettes.svelte.js';
  import type { Color } from '#lib/types/yarn-types.js';
  import {
    colorsToPaletteCode,
    getPaletteFallbackName,
  } from '#lib/utils/color-utils.js';
  import { BookmarkIcon } from '@lucide/svelte';

  let {
    colors,
    suggestedName = '',
    onsaved,
  }: {
    colors: Color[];
    /** The name to start with (a gallery palette's), still editable */
    suggestedName?: string;
    /** The Yarn page: the saved palette (or the one already saved) is now
    open there, and saves by itself */
    onsaved?: (palette: SavedPalette) => void;
  } = $props();

  // The dialog is opened for one palette, so its suggestion never changes
  let name = $state(untrack(() => suggestedName));
  let saving = $state(false);
  let fallbackName = $derived(getPaletteFallbackName(colors));

  async function save() {
    saving = true;
    try {
      const { palette, added } = await PaletteStorage.add({
        code: colorsToPaletteCode(colors),
        name,
      });
      onsaved?.(palette);
      const after = onsaved ? ' Changes now save automatically.' : '';
      toast.trigger({
        message: added
          ? `Palette saved. Find it in My Library, or in a project press Get Colors, then My Palettes.${after}`
          : `This palette is already saved.${after}`,
        category: added ? 'success' : 'info',
      });
      dialog.close();
    } catch {
      toast.trigger({
        message: 'Unable to save the palette in this browser',
        category: 'error',
      });
    } finally {
      saving = false;
    }
  }
</script>

<div class="flex flex-col gap-4 px-4 pt-2 sm:min-w-[600px]">
  <label class="label text-left">
    <span class="label-text">Name (optional)</span>
    <input
      type="text"
      class="input"
      id="saved-palette-name"
      autocomplete="off"
      maxlength={MAX_SAVED_PALETTE_NAME_LENGTH}
      placeholder={fallbackName}
      bind:value={name}
      onkeydown={(e) => {
        if (e.key === 'Enter' && !saving) save();
      }}
    />
  </label>

  <p class="text-sm opacity-68">
    {#if __ACCOUNTS_ENABLED__ && account.summary && sync.active}
      Saved palettes are kept in your account, so they show up on every device
      where you’re signed in.
    {:else}
      Saved palettes are stored in this browser.
    {/if}
  </p>

  <SaveAndCloseButtons
    onSave={save}
    onClose={() => dialog.close()}
    saveText="Save Palette"
    icon={BookmarkIcon}
    disabled={saving || !colors.length}
  />
</div>

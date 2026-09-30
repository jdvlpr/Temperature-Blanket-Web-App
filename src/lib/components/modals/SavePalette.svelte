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
  import SaveAndCloseButtons from '$lib/components/modals/SaveAndCloseButtons.svelte';
  import { dialog, toast } from '$lib/state/page-state.svelte';
  import {
    MAX_SAVED_PALETTE_NAME_LENGTH,
    PaletteStorage,
  } from '$lib/storage/palettes.svelte';
  import type { Color } from '$lib/types/yarn-types';
  import {
    colorsToPaletteCode,
    getPaletteFallbackName,
  } from '$lib/utils/color-utils';
  import { escapeHtml } from '$lib/utils/string-utils';

  let { colors }: { colors: Color[] } = $props();

  let name = $state('');
  let saving = $state(false);
  let fallbackName = $derived(getPaletteFallbackName(colors));

  async function save() {
    saving = true;
    try {
      const { added } = await PaletteStorage.add({
        code: colorsToPaletteCode(colors),
        name,
      });
      toast.trigger({
        message: added
          ? 'Palette saved. To find it, press Get Colors, then Browse Palettes.'
          : 'This palette is already saved',
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

<div class="flex flex-col gap-4 p-4 pt-12 sm:min-w-[600px]">
  <!-- ColorPalette renders its label as HTML -->
  <ColorPalette {colors} schemeName={escapeHtml(name.trim() || fallbackName)} />

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
    Saved palettes are stored in this browser. To use one in any project, press
    Get Colors, then Browse Palettes, then Saved.
  </p>

  <SaveAndCloseButtons
    onSave={save}
    onClose={() => dialog.close()}
    saveText="Save Palette"
    disabled={saving || !colors.length}
  />
</div>

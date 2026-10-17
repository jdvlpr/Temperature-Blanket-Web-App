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

<!-- Palette, in the Yarn page's top bar, as Project is in the planner's: its
icon shows the save state only when there's something to see (SaveStateIcon),
and until the palette is saved, a dot says so. It opens the Palette menu. -->

<script lang="ts">
  import SaveStateIcon from '#lib/components/SaveStateIcon.svelte';
  import { paletteAutosave } from './autosave.svelte';
  import { openPaletteMenu } from './open-palette-menu';

  let { onsave }: { /** Opens Save Palette */ onsave: () => void } = $props();

  const status = $derived(
    !paletteAutosave.id
      ? 'Not saved'
      : paletteAutosave.state === 'error'
        ? 'Not saved'
        : paletteAutosave.state === 'saved'
          ? paletteAutosave.account
            ? 'Saved to your account'
            : 'Saved in this browser'
          : 'Saving…',
  );
  const label = $derived(`Palette Menu (${status})`);
</script>

<button
  type="button"
  class="btn hover:preset-tonal-surface relative shrink-0 gap-1"
  aria-label={label}
  title={label}
  aria-haspopup="dialog"
  data-testid="palette-button"
  data-save-status={status}
  onclick={() => openPaletteMenu(onsave)}
>
  <SaveStateIcon
    on={Boolean(paletteAutosave.id)}
    saveState={paletteAutosave.state}
    account={paletteAutosave.account}
  />
  <span>Palette</span>
  {#if !paletteAutosave.id}
    <span
      class="bg-primary-500 absolute top-1 right-1 size-2 rounded-full"
      aria-hidden="true"
      data-testid="unsaved-dot"
    ></span>
  {/if}
</button>

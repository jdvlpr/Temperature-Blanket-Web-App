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

<!-- Start a Project with It, for a palette that isn't saved: save it first
(to come back to it from My Palettes), go without saving, or stay -->

<script lang="ts">
  import DialogFooter from '#lib/components/modals/DialogFooter.svelte';
  import {
    BTN_PRIMARY,
    BTN_SECONDARY,
  } from '#lib/constants/class-constants.js';
  import { dialog } from '#lib/state/page-state.svelte.js';
  import { BookmarkIcon, LoaderCircleIcon } from '@lucide/svelte';

  let {
    onsave,
    ongo,
  }: {
    /** Saves the palette */
    onsave: () => Promise<void>;
    /** Goes to the new project */
    ongo: () => void;
  } = $props();

  let saving = $state(false);

  async function saveAndGo() {
    saving = true;
    try {
      await onsave();
      ongo();
    } finally {
      saving = false;
    }
  }
</script>

<div class="flex flex-col gap-4 px-4 pt-2 text-left">
  <p>
    Save this palette first? It goes on the new project’s Temperature gauge
    either way. Saved, you can come back to it from My Palettes.
  </p>
  <DialogFooter>
    <button
      type="button"
      class={BTN_SECONDARY}
      disabled={saving}
      onclick={() => dialog.close()}>Cancel</button
    >
    <button type="button" class={BTN_SECONDARY} disabled={saving} onclick={ongo}
      >Don’t Save</button
    >
    <button
      type="button"
      class={BTN_PRIMARY}
      disabled={saving}
      onclick={saveAndGo}
    >
      {#if saving}
        <LoaderCircleIcon class="animate-spin" />
      {:else}
        <BookmarkIcon />
      {/if}
      Save and Start
    </button>
  </DialogFooter>
</div>

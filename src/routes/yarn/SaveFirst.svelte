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

<div class="flex flex-col gap-4 p-4 pt-2 text-left">
  <p>
    Save this palette first? It goes on the new project’s Temperature gauge
    either way. Saved, you can come back to it from My Palettes.
  </p>
  <div class="flex flex-wrap gap-2">
    <button
      type="button"
      class="btn preset-filled-primary-500"
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
    <button
      type="button"
      class="btn preset-tonal"
      disabled={saving}
      onclick={ongo}>Don’t Save</button
    >
    <button
      type="button"
      class="btn hover:preset-tonal"
      disabled={saving}
      onclick={() => dialog.close()}>Cancel</button
    >
  </div>
</div>

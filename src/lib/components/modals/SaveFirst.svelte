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

<!-- Leaving something that isn't saved (a palette for Start a Project with It,
a project for New Project or a recent one): save it first, go without saving,
or stay. Changes that can't be saved (a project whose saving failed) have no
save button: leave without them, or stay. -->

<script lang="ts">
  import DialogFooter from '#lib/components/modals/DialogFooter.svelte';
  import {
    BTN_DANGER,
    BTN_PRIMARY,
    BTN_SECONDARY,
  } from '#lib/constants/class-constants.js';
  import { dialog } from '#lib/state/page-state.svelte.js';
  import { BookmarkIcon, LoaderCircleIcon } from '@lucide/svelte';

  let {
    message,
    saveLabel,
    onsave,
    ongo,
  }: {
    /** What's asked, and what saving it is for */
    message: string;
    /** Its save-and-go button, e.g. "Save and Start" */
    saveLabel?: string;
    /** Saves it; throws to stay, when it couldn't (and has said so) */
    onsave?: () => Promise<void>;
    /** Goes on */
    ongo: () => void;
  } = $props();

  let saving = $state(false);

  async function saveAndGo() {
    if (!onsave) return;
    saving = true;
    try {
      await onsave();
    } catch {
      return;
    } finally {
      saving = false;
    }
    ongo();
  }
</script>

<div class="flex flex-col gap-4 px-4 pt-2 text-left">
  <p>{message}</p>
  <DialogFooter>
    <button
      type="button"
      class={BTN_SECONDARY}
      disabled={saving}
      onclick={() => dialog.close()}>Cancel</button
    >
    <button
      type="button"
      class={onsave ? BTN_SECONDARY : BTN_DANGER}
      disabled={saving}
      onclick={ongo}>Don’t Save</button
    >
    {#if onsave}
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
        {saveLabel}
      </button>
    {/if}
  </DialogFooter>
</div>

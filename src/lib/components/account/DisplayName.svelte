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
  import { accountErrorMessage, updateName } from '$lib/accounts/client';
  import { CheckIcon, LoaderCircleIcon } from '@lucide/svelte';
  import { untrack } from 'svelte';

  let {
    name: savedName,
    onsaved,
  }: { name: string; onsaved?: (name: string) => void } = $props();

  // An editable copy of the saved name
  let name = $state(untrack(() => savedName));
  let lastSaved = $state(untrack(() => savedName));
  let busy = $state(false);
  let saved = $state(false);
  let errorMessage = $state('');

  let changed = $derived(name.trim() !== lastSaved);

  async function save(event: Event) {
    event.preventDefault();
    busy = true;
    saved = false;
    errorMessage = '';
    try {
      const trimmed = name.trim();
      await updateName(trimmed);
      name = lastSaved = trimmed;
      saved = true;
      onsaved?.(trimmed);
    } catch (e) {
      errorMessage = accountErrorMessage(e);
    } finally {
      busy = false;
    }
  }
</script>

<form class="flex flex-col gap-2 px-4 py-3" onsubmit={save}>
  <label class="label" for="display-name">
    <span class="label-text">Display name</span>
  </label>
  <div class="flex items-center gap-2">
    <input
      id="display-name"
      type="text"
      class="input h-11"
      maxlength="80"
      autocomplete="nickname"
      enterkeyhint="done"
      placeholder="Add a name"
      bind:value={name}
      oninput={() => (saved = false)}
      disabled={busy}
    />
    {#if changed}
      <button
        type="submit"
        class="btn preset-filled-primary-500 h-11 shrink-0"
        disabled={busy}
      >
        {#if busy}<LoaderCircleIcon class="animate-spin" />{/if}
        Save name
      </button>
    {:else if saved}
      <span
        class="text-success-700-300 flex shrink-0 items-center gap-1 text-sm"
        role="status"><CheckIcon size="16" /> Saved</span
      >
    {/if}
  </div>
  <p class="text-sm opacity-70">
    Optional. Only shown if you choose to show it on a gallery page.
  </p>
  {#if errorMessage}
    <p class="text-error-700-300" role="alert">{errorMessage}</p>
  {/if}
</form>

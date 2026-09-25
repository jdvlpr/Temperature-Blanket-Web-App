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

  let { name: savedName }: { name: string } = $props();

  // An editable copy of the saved name
  let name = $state(untrack(() => savedName));
  let busy = $state(false);
  let saved = $state(false);
  let errorMessage = $state('');

  async function save(event: Event) {
    event.preventDefault();
    busy = true;
    saved = false;
    errorMessage = '';
    try {
      await updateName(name.trim());
      name = name.trim();
      saved = true;
    } catch (e) {
      errorMessage = accountErrorMessage(e);
    } finally {
      busy = false;
    }
  }
</script>

<form class="flex flex-col gap-2" onsubmit={save}>
  <label class="label">
    <span class="label-text">Display name</span>
    <input
      type="text"
      class="input"
      maxlength="80"
      autocomplete="nickname"
      bind:value={name}
      oninput={() => (saved = false)}
      disabled={busy}
    />
  </label>
  <p class="text-sm opacity-80">
    Optional. Only shown if you choose to show it on a gallery page.
  </p>
  <div class="flex items-center gap-2">
    <button
      type="submit"
      class="btn preset-tonal-surface w-fit"
      disabled={busy}
    >
      {#if busy}<LoaderCircleIcon class="animate-spin" />{/if}
      Save name
    </button>
    {#if saved}
      <span class="flex items-center gap-1 text-sm" role="status"
        ><CheckIcon size="16" /> Saved</span
      >
    {/if}
  </div>
  {#if errorMessage}
    <p class="text-error-700-300" role="alert">{errorMessage}</p>
  {/if}
</form>

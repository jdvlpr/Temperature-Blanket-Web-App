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

<!-- Shown before signing out only when some of the account's projects here
haven't finished syncing. Signing out removes the synced ones from this
browser; these stay, since the account doesn't have them yet. -->

<script lang="ts">
  import { dialog } from '$lib/state/page-state.svelte';
  import { sync, syncNow, unsyncedCount } from '$lib/sync/sync.svelte';
  import { LoaderCircleIcon, TriangleAlertIcon } from '@lucide/svelte';
  import { onMount } from 'svelte';

  let {
    userId,
    everywhere,
    onconfirm,
  }: {
    userId: string;
    everywhere: boolean;
    onconfirm: () => Promise<void>;
  } = $props();

  let unsynced = $state(0);
  let busy = $state(false);

  const refresh = async () => (unsynced = await unsyncedCount(userId));
  onMount(refresh);

  async function syncFirst() {
    await syncNow();
    await refresh();
  }

  async function confirm() {
    busy = true;
    try {
      await onconfirm();
      dialog.close();
    } finally {
      busy = false;
    }
  }

  const projects = (n: number) => (n === 1 ? '1 project' : `${n} projects`);
</script>

<form
  class="flex flex-col gap-4 p-4"
  aria-labelledby="sign-out-title"
  onsubmit={(e) => {
    e.preventDefault();
    confirm();
  }}
>
  <h2 id="sign-out-title" class="h4">
    {everywhere ? 'Sign out everywhere' : 'Sign out'}
  </h2>

  {#if unsynced}
    <div
      class="rounded-container bg-warning-500/10 border-warning-500/40 flex flex-col gap-2 border p-3"
      role="status"
    >
      <p class="flex items-start gap-2 text-sm">
        <TriangleAlertIcon class="text-warning-700-300 size-5 shrink-0" />
        <span>
          {projects(unsynced)}
          {unsynced === 1 ? 'hasn’t' : 'haven’t'} finished syncing to your account,
          so {unsynced === 1 ? 'it stays' : 'they stay'} in this browser after you
          sign out. Anyone using this browser can open {unsynced === 1
            ? 'it'
            : 'them'}.
        </span>
      </p>
      <button
        type="button"
        class="btn btn-sm preset-outlined-surface-300-700 w-fit"
        disabled={sync.state === 'syncing'}
        onclick={syncFirst}
      >
        {#if sync.state === 'syncing'}
          <LoaderCircleIcon class="size-4 animate-spin" /> Syncing…
        {:else}
          Sync now
        {/if}
      </button>
    </div>
  {:else}
    <p class="text-sm opacity-80" role="status">
      Everything is synced. Your projects are in your account.
    </p>
  {/if}

  <p class="text-sm opacity-80">
    Your synced projects are removed from this browser. Sign in again to get
    them back.
  </p>

  <div class="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
    <button
      type="button"
      class="btn hover:preset-tonal-surface max-sm:w-full"
      onclick={() => dialog.close()}>Cancel</button
    >
    <button
      type="submit"
      class="btn preset-filled-primary-500 max-sm:w-full"
      disabled={busy}
    >
      {everywhere ? 'Sign out everywhere' : 'Sign out'}
    </button>
  </div>
</form>

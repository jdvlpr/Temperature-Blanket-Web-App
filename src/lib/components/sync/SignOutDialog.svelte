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

<!-- Signing out with the account's projects on this device: keep them here, or
remove them. Projects that haven't finished syncing are never removed. -->

<script lang="ts">
  import { dialog } from '$lib/state/page-state.svelte';
  import { sync, syncNow, unsyncedCount } from '$lib/sync/sync.svelte';
  import { LoaderCircleIcon, TriangleAlertIcon } from '@lucide/svelte';
  import { onMount } from 'svelte';

  let {
    userId,
    everywhere,
    projectCount,
    onconfirm,
  }: {
    userId: string;
    everywhere: boolean;
    projectCount: number;
    onconfirm: (keepProjects: boolean) => Promise<void>;
  } = $props();

  let keep = $state('keep');
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
      await onconfirm(keep === 'keep');
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
  <div class="flex flex-col gap-1">
    <h2 id="sign-out-title" class="h4">
      {everywhere ? 'Sign out everywhere' : 'Sign out'}
    </h2>
    <p class="text-sm opacity-80">
      {projects(projectCount)} from your account {projectCount === 1
        ? 'is'
        : 'are'} saved in this browser.
    </p>
  </div>

  <fieldset
    class="rounded-container border-surface-200-800 divide-surface-200-800 flex flex-col divide-y border"
  >
    <legend class="sr-only">Projects in this browser</legend>
    <label class="hover:preset-tonal-surface flex items-start gap-3 p-3">
      <input type="radio" class="radio mt-1" value="keep" bind:group={keep} />
      <span>
        <span class="block font-bold">Keep them in this browser</span>
        <span class="block text-sm opacity-70"
          >Anyone using it can open them. Your account keeps its copies.</span
        >
      </span>
    </label>
    <label class="hover:preset-tonal-surface flex items-start gap-3 p-3">
      <input type="radio" class="radio mt-1" value="remove" bind:group={keep} />
      <span>
        <span class="block font-bold">Remove them from this browser</span>
        <span class="block text-sm opacity-70"
          >Sign in again to get them back.</span
        >
      </span>
    </label>
  </fieldset>

  {#if unsynced}
    <div
      class="rounded-container bg-warning-500/10 border-warning-500/40 flex flex-col gap-2 border p-3"
      role="status"
    >
      <p class="flex items-start gap-2 text-sm">
        <TriangleAlertIcon class="text-warning-700-300 size-5 shrink-0" />
        <span>
          {projects(unsynced)}
          {unsynced === 1 ? 'hasn’t' : 'haven’t'} finished syncing, so {unsynced ===
          1
            ? 'it stays'
            : 'they stay'} in this browser either way.
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
  {/if}

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

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

<!-- Where the open project saves by itself: the account (a cloud), or only
this browser (a screen), with a way to sync that one. At the top of the
Project menu. -->

<script lang="ts">
  import { resolve } from '$app/paths';
  import { account } from '$lib/accounts/summary.svelte';
  import { toast } from '$lib/state/page-state.svelte';
  import {
    addOpenProjectToAccount,
    autosave,
  } from '$lib/storage/autosave.svelte';
  import {
    CloudCheckIcon,
    CloudUploadIcon,
    LoaderCircleIcon,
    LogInIcon,
    MonitorCheckIcon,
  } from '@lucide/svelte';

  const signedIn = $derived(
    __ACCOUNTS_ENABLED__ && Boolean(account.summary?.id),
  );
  const saving = $derived(autosave.state !== 'saved');

  let adding = $state(false);

  async function add() {
    adding = true;
    try {
      await addOpenProjectToAccount();
      toast.trigger({
        message: 'Added to your account. It’ll show up on your other devices.',
        category: 'success',
      });
    } catch (e) {
      console.warn("Can't add the project to the account", { e });
      toast.trigger({
        message: 'Unable to add it to your account. Try again.',
        category: 'error',
      });
    } finally {
      adding = false;
    }
  }
</script>

<div class="flex flex-col gap-2 text-sm">
  <p class="flex items-center gap-2 font-bold" data-testid="autosave-status">
    {#if saving}
      <LoaderCircleIcon class="size-4 shrink-0 animate-spin opacity-70" />
      Saving…
    {:else if autosave.account}
      <CloudCheckIcon class="size-4 shrink-0" />
      Saved to your account
    {:else}
      <MonitorCheckIcon class="size-4 shrink-0" />
      Saved in this browser
    {/if}
  </p>
  <p class="opacity-70">
    {#if autosave.account}
      Changes save automatically and sync to your devices.
    {:else if __ACCOUNTS_ENABLED__ && !signedIn}
      Changes save automatically, on this device only. Sign in to sync them.
    {:else}
      Changes save automatically, on this device only.
    {/if}
  </p>
  {#if !autosave.account && __ACCOUNTS_ENABLED__}
    {#if signedIn}
      <button
        type="button"
        class="btn preset-tonal-primary self-start"
        disabled={adding}
        onclick={add}
      >
        {#if adding}
          <LoaderCircleIcon class="animate-spin" />
        {:else}
          <CloudUploadIcon />
        {/if}
        Add to Account
      </button>
    {:else}
      <a href={resolve('/account')} class="btn preset-tonal-primary self-start">
        <LogInIcon />
        Sign In
      </a>
    {/if}
  {/if}
</div>

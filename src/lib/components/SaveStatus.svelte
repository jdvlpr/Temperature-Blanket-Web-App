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

<!-- Where the open project or palette saves by itself: the account (a cloud),
or only this browser (a screen), with a way to sync that one. At the top of the
Project menu, and in the Yarn page's Palette popover. -->

<script lang="ts">
  import { page } from '$app/state';
  import { backHereOnClick, signInHref } from '#lib/accounts/redirect.js';
  import { account } from '#lib/accounts/summary.svelte.js';
  import { toast } from '#lib/state/page-state.svelte.js';
  import type { autosave } from '#lib/storage/autosave.svelte.js';

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
  let {
    saveState,
    account: toAccount,
    addToAccount,
  }: {
    saveState: (typeof autosave)['state'];
    /** Whether it saves to the account; otherwise to this browser */
    account: boolean;
    /** Adds it, saved only in this browser, to the signed-in account */
    addToAccount: () => Promise<void>;
  } = $props();

  const saving = $derived(saveState !== 'saved');

  let adding = $state(false);

  async function add() {
    adding = true;
    try {
      await addToAccount();
      toast.trigger({
        message: 'Added to your account. It’ll show up on your other devices.',
        category: 'success',
      });
    } catch (e) {
      console.warn("Can't add it to the account", { e });
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
      <LoaderCircleIcon class="icon-sm shrink-0 animate-spin opacity-70" />
      Saving…
    {:else if toAccount}
      <CloudCheckIcon class="icon-sm shrink-0" />
      Saved to your account
    {:else}
      <MonitorCheckIcon class="icon-sm shrink-0" />
      Saved in this browser
    {/if}
  </p>
  <p class="opacity-70">
    {#if toAccount}
      Changes save automatically and sync to your devices.
    {:else if __ACCOUNTS_ENABLED__ && !signedIn}
      Changes save automatically, on this device only. Sign in to sync them.
    {:else}
      Changes save automatically, on this device only.
    {/if}
  </p>
  {#if !toAccount && __ACCOUNTS_ENABLED__}
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
      <a
        href={signInHref(page.url)}
        onclick={backHereOnClick}
        class="btn preset-tonal-primary self-start"><LogInIcon />Sign In</a
      >
    {/if}
  {/if}
</div>

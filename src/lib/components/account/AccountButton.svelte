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

<!-- The account button in the top bar. Signed in, it opens a menu with the
account's details, sync and sign out; otherwise it's a way to sign in. Nothing
when accounts are off. -->

<script lang="ts">
  import { ROW_FOCUS } from '$lib/constants/class-constants';
  import { resolve } from '$app/paths';
  import { page } from '$app/state';
  import { account, loadAccountSummary } from '$lib/accounts/summary.svelte';
  import AccountAvatar from '$lib/components/account/AccountAvatar.svelte';
  import AddToAccountButton from '$lib/components/sync/AddToAccountButton.svelte';
  import SyncStatus from '$lib/components/sync/SyncStatus.svelte';
  import { safeSlide } from '$lib/features/transitions/safeSlide';
  import { toast } from '$lib/state/page-state.svelte';
  import { accountsIntro } from '$lib/storage/accounts-intro.svelte';
  import { sync } from '$lib/sync/status.svelte';
  import {
    CircleUserRoundIcon,
    LogOutIcon,
    UserRoundCogIcon,
  } from '@lucide/svelte';
  import { Popover } from '@skeletonlabs/skeleton-svelte';
  import { onMount } from 'svelte';

  const BUTTON =
    'hover:preset-tonal-surface inline-flex size-10 shrink-0 items-center justify-center rounded-full';
  const ROW = `hover:preset-tonal-surface flex w-full items-center gap-3 px-4 py-3 text-left transition-colors disabled:opacity-50 ${ROW_FOCUS}`;

  let open = $state(false);
  let busy = $state(false);
  let errorMessage = $state('');

  let onAccountPage = $derived(page.url.pathname === '/account');

  // After loading, so the server's page (which can't know) doesn't differ
  let mounted = $state(false);

  onMount(() => {
    if (__ACCOUNTS_ENABLED__) loadAccountSummary();
    mounted = true;
  });

  // Opened the account page some other way: it's been seen
  $effect(() => {
    if (onAccountPage) accountsIntro.markButtonSeen();
  });

  async function signOut() {
    const userId = account.summary?.id;
    if (!userId) return;
    busy = true;
    errorMessage = '';
    // Loaded on demand, so guests never download it
    const { startSignOut } = await import('$lib/accounts/sign-out');
    await startSignOut({
      userId,
      onSignedOut: () => {
        open = false;
        toast.trigger({ message: 'Signed out', category: 'success' });
      },
      onError: (message) => (errorMessage = message),
    });
    busy = false;
  }
</script>

{#if __ACCOUNTS_ENABLED__}
  {#if account.summary}
    {@const summary = account.summary}
    <Popover
      {open}
      onOpenChange={(e) => {
        open = e.open;
        if (!open) errorMessage = '';
        // Catch up with changes from other devices while this tab stayed open
        else if (sync.active)
          import('$lib/sync/sync.svelte').then((m) => m.refreshSync());
      }}
    >
      <Popover.Trigger
        class={[BUTTON, (open || onAccountPage) && 'preset-tonal-secondary']}
        aria-label="Account"
        title="Account: {summary.name || summary.email}"
        data-testid="account-button"
      >
        <AccountAvatar
          {summary}
          class="aspect-square size-8 max-w-none text-xs"
        />
      </Popover.Trigger>
      <Popover.Positioner>
        <Popover.Content
          class="card bg-surface-200-800 w-96 max-w-[calc(100vw-2rem)] shadow-xl"
        >
          {#snippet element(attributes)}
            {#if !attributes.hidden}
              <div {...attributes} transition:safeSlide>
                <div
                  class="divide-surface-300-700 flex flex-col divide-y overflow-hidden"
                >
                  <div class="flex items-center gap-3 px-4 py-3">
                    <AccountAvatar {summary} class="size-10 text-sm" />
                    <div class="min-w-0">
                      {#if summary.name}
                        <p class="truncate font-bold">{summary.name}</p>
                      {/if}
                      <p class="truncate text-sm opacity-75">
                        {summary.email}
                      </p>
                    </div>
                  </div>

                  {#if sync.active}
                    <!-- Hidden when there's no notice and nothing to add -->
                    <div class="hidden flex-col gap-2 px-4 py-3 has-[*]:flex">
                      <SyncStatus />
                      <AddToAccountButton />
                    </div>
                  {/if}

                  <!-- The last row rounds its bottom corners like the card -->
                  <div
                    class="[&>:last-child]:rounded-b-container flex flex-col"
                  >
                    {#if !onAccountPage}
                      <a
                        href={resolve('/account')}
                        class={ROW}
                        onclick={() => (open = false)}
                      >
                        <UserRoundCogIcon class="shrink-0 opacity-70" />
                        <span class="font-bold">Account settings</span>
                      </a>
                    {/if}
                    <button
                      type="button"
                      class={ROW}
                      disabled={busy}
                      onclick={signOut}
                    >
                      <LogOutIcon class="shrink-0 opacity-70" />
                      <span class="font-bold">Sign out</span>
                    </button>
                    {#if errorMessage}
                      <p
                        class="text-error-700-300 px-4 pb-3 text-sm"
                        role="alert"
                      >
                        {errorMessage}
                      </p>
                    {/if}
                  </div>
                </div>
                <Popover.Arrow
                  style="--arrow-size: calc(var(--spacing) * 2); --arrow-background: var(--color-surface-200-800);"
                >
                  <Popover.ArrowTip />
                </Popover.Arrow>
              </div>
            {/if}
          {/snippet}
        </Popover.Content>
      </Popover.Positioner>
    </Popover>
  {:else}
    <!-- A "New" dot, until it's used, to introduce accounts -->
    {@const isNew = mounted && accountsIntro.showDot}
    <a
      href={resolve('/account')}
      class={[BUTTON, 'relative', onAccountPage && 'preset-tonal-secondary']}
      aria-label={isNew ? 'Sign in. Accounts (Beta)' : 'Sign in'}
      title={isNew ? 'Sign in. Accounts (Beta)' : 'Sign in'}
      data-testid="account-button"
      onclick={() => accountsIntro.markButtonSeen()}
    >
      <CircleUserRoundIcon />
      {#if isNew}
        <span
          class="bg-primary-500 absolute top-1.5 right-1.5 size-2.5 rounded-full"
          aria-hidden="true"
        ></span>
      {/if}
    </a>
  {/if}
{/if}

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

<!-- The account button in the top bar. Signed in, it opens a panel with the
account's details, sync, Account settings, Preferences and sign out; signed
out, a link to sign in. With accounts off, a plain link to Preferences.
Preferences and My Library are also in the sidebar. With showLabel (AppShell
sets it when the top bar has room) it names itself beside its icon: Account,
Sign In or Preferences. Hidden, the name is still laid out, out of sight, so
AppShell can measure it (data-account-label) -->

<script lang="ts">
  import { menuPositioning } from '#lib/components/menu-styles.js';
  import { ROW_FOCUS } from '#lib/constants/class-constants.js';
  import { resolve } from '$app/paths';
  import { page } from '$app/state';
  import { backHereOnClick, signInHref } from '#lib/accounts/redirect.js';
  import { account, loadAccountSummary } from '#lib/accounts/summary.svelte.js';
  import AccountAvatar from '#lib/components/account/AccountAvatar.svelte';
  import AddToAccountButton from '#lib/components/sync/AddToAccountButton.svelte';
  import SyncStatus from '#lib/components/sync/SyncStatus.svelte';
  import { safeSlide } from '#lib/features/transitions/safeSlide.js';
  import { toast } from '#lib/state/page-state.svelte.js';
  import { sync } from '#lib/sync/status.svelte.js';
  import {
    CircleUserRoundIcon,
    LogOutIcon,
    SlidersHorizontalIcon,
    UserRoundCogIcon,
  } from '@lucide/svelte';
  import { Popover } from '@skeletonlabs/skeleton-svelte';
  import { onMount } from 'svelte';

  let { showLabel = false }: { showLabel?: boolean } = $props();

  let BUTTON = $derived(
    showLabel
      ? 'btn hover:preset-tonal-surface relative shrink-0 px-3'
      : 'btn-icon hover:preset-tonal-surface relative shrink-0',
  );
  const ROW = `hover:preset-tonal-surface flex w-full items-center gap-3 px-4 py-3 text-left transition-colors disabled:opacity-50 ${ROW_FOCUS}`;

  let open = $state(false);
  let busy = $state(false);
  let errorMessage = $state('');

  let onAccountPage = $derived(page.url.pathname === '/account');
  let onPreferencesPage = $derived(page.url.pathname === '/preferences');
  // The button shows as current on any page it leads to
  let current = $derived(onAccountPage || onPreferencesPage);

  // Signing in comes back to this page, as it is when clicked
  // (backHereOnClick); in the browser only, since prerendering can't read a
  // page's query
  let signInTarget = $state('/auth/sign-in');
  $effect(() => {
    void page.url;
    signInTarget = signInHref(window.location);
  });

  onMount(() => {
    if (__ACCOUNTS_ENABLED__) loadAccountSummary();
  });

  async function signOut() {
    const userId = account.summary?.id;
    if (!userId) return;
    busy = true;
    errorMessage = '';
    // Loaded on demand, so guests never download it
    const { startSignOut } = await import('#lib/accounts/sign-out.js');
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

{#snippet label(text: string)}
  <span
    class={[
      'whitespace-nowrap',
      !showLabel && 'pointer-events-none invisible absolute top-0 right-0',
    ]}
    data-account-label>{text}</span
  >
{/snippet}

{#if !__ACCOUNTS_ENABLED__}
  <a
    href={resolve('preferences')}
    class={[BUTTON, onPreferencesPage && 'preset-tonal-secondary']}
    aria-label="Preferences"
    aria-current={onPreferencesPage ? 'page' : undefined}
    title="Preferences"
  >
    <SlidersHorizontalIcon aria-hidden="true" />
    {@render label('Preferences')}
  </a>
{:else if account.summary}
  {@const summary = account.summary}
  <Popover
    {open}
    positioning={menuPositioning('bottom-end')}
    onOpenChange={(e) => {
      open = e.open;

      if (!open) errorMessage = '';
      else // Catch up with changes from other devices while this tab stayed open
      if (sync.active)
        import('#lib/sync/sync.svelte.js').then((m) => m.refreshSync());
    }}
  >
    <Popover.Trigger
      class={[BUTTON, (open || current) && 'preset-tonal-secondary']}
      aria-label="Account"
      title="Account: {summary.name || summary.email}"
      data-testid="account-button"
    >
      <AccountAvatar
        {summary}
        class="aspect-square size-8 max-w-none text-xs {showLabel
          ? '-ml-2'
          : ''}"
      />
      {@render label('Account')}
    </Popover.Trigger>
    <Popover.Positioner>
      <Popover.Content
        class="card bg-surface-100-900 w-96 max-w-[calc(100vw-2rem)] shadow-xl"
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
                <div class="[&>:last-child]:rounded-b-container flex flex-col">
                  {#if !onAccountPage}
                    <a
                      href={resolve('account')}
                      class={ROW}
                      onclick={() => (open = false)}
                    >
                      <UserRoundCogIcon class="shrink-0 opacity-70" />
                      <span class="font-bold">Account settings</span>
                    </a>
                  {/if}
                  {#if !onPreferencesPage}
                    <a
                      href={resolve('preferences')}
                      class={ROW}
                      onclick={() => (open = false)}
                    >
                      <SlidersHorizontalIcon class="shrink-0 opacity-70" />
                      <span class="font-bold">Preferences</span>
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
                style="--arrow-size: calc(var(--spacing) * 2); --arrow-background: var(--color-surface-100-900);"
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
  <a
    href={signInTarget}
    onclick={backHereOnClick}
    class={BUTTON}
    aria-label="Sign In"
    title="Sign In"
    data-testid="account-button"
  >
    <CircleUserRoundIcon aria-hidden="true" />
    {@render label('Sign In')}
  </a>
{/if}

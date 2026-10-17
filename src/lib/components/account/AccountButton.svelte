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

<!-- The account button in the top bar, and the way to My Library and
Preferences. Signed in, it opens a panel with the account's details, sync, My
Library, Preferences and sign out; signed out, a menu to sign in or open
either. With accounts off, a menu of those two. -->

<script lang="ts">
  import {
    menuContentClass,
    menuItemClass,
    menuPositioning,
  } from '#lib/components/menu-styles.js';
  import { ROW_FOCUS } from '#lib/constants/class-constants.js';
  import { resolve } from '$app/paths';
  import { page } from '$app/state';
  import { signInHref } from '#lib/accounts/redirect.js';
  import { account, loadAccountSummary } from '#lib/accounts/summary.svelte.js';
  import AccountAvatar from '#lib/components/account/AccountAvatar.svelte';
  import AddToAccountButton from '#lib/components/sync/AddToAccountButton.svelte';
  import SyncStatus from '#lib/components/sync/SyncStatus.svelte';
  import { safeSlide } from '#lib/features/transitions/safeSlide.js';
  import { toast } from '#lib/state/page-state.svelte.js';
  import { accountsIntro } from '#lib/storage/accounts-intro.svelte.js';
  import { librarySection } from '#lib/storage/library-section.svelte.js';
  import { sync } from '#lib/sync/status.svelte.js';
  import {
    CircleUserRoundIcon,
    LibraryBigIcon,
    LogInIcon,
    LogOutIcon,
    SlidersHorizontalIcon,
    UserRoundCogIcon,
  } from '@lucide/svelte';
  import { Menu, Popover, Portal } from '@skeletonlabs/skeleton-svelte';
  import type { HTMLAnchorAttributes } from 'svelte/elements';
  import { onMount } from 'svelte';

  const BUTTON = 'btn-icon hover:preset-tonal-surface shrink-0';
  const ROW = `hover:preset-tonal-surface flex w-full items-center gap-3 px-4 py-3 text-left transition-colors disabled:opacity-50 ${ROW_FOCUS}`;

  let open = $state(false);
  let busy = $state(false);
  let errorMessage = $state('');

  let onAccountPage = $derived(page.url.pathname === '/account');
  let onPreferencesPage = $derived(page.url.pathname === '/preferences');
  // The button shows as current on any page it leads to
  let onLibraryPage = $derived(
    ['/my-projects', '/my-palettes'].includes(page.url.pathname),
  );
  let current = $derived(onAccountPage || onPreferencesPage || onLibraryPage);

  let mounted = $state(false);

  // Signing in comes back to this page, as it is when the menu opens
  let signInTarget = $state('/auth/sign-in');

  // Back to the side of My Library that was open last. After loading, so the
  // server's page (which can't know) doesn't differ
  let libraryHref = $derived(
    mounted && librarySection.value === 'palettes'
      ? resolve('my-palettes')
      : resolve('my-projects'),
  );

  // Where My Library leads, for a signed-in account's panel
  const libraryItem = $derived({
    value: 'my-library',
    label: 'My Library',
    href: libraryHref,
    icon: LibraryBigIcon,
    here: onLibraryPage,
  });

  // The menu's links, without an account
  let menuItems = $derived([
    libraryItem,
    ...(__ACCOUNTS_ENABLED__
      ? [
          {
            value: 'sign-in',
            label: 'Sign In',
            href: signInTarget,
            icon: LogInIcon,
            here: onAccountPage,
          },
        ]
      : []),
    {
      value: 'preferences',
      label: 'Preferences',
      href: resolve('preferences'),
      icon: SlidersHorizontalIcon,
      here: onPreferencesPage,
    },
  ]);

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

{#if __ACCOUNTS_ENABLED__ && account.summary}
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
        class="aspect-square size-8 max-w-none text-xs"
      />
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
                  {#if !onLibraryPage}
                    <a
                      href={libraryHref}
                      class={ROW}
                      onclick={() => (open = false)}
                    >
                      <LibraryBigIcon class="shrink-0 opacity-70" />
                      <span class="font-bold">My Library</span>
                    </a>
                  {/if}
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
  <!-- A "New" dot, until it's opened, to introduce accounts -->
  {@const isNew = __ACCOUNTS_ENABLED__ && mounted && accountsIntro.showDot}
  {@const label = !__ACCOUNTS_ENABLED__
    ? 'My Library and Preferences'
    : isNew
      ? 'Sign in, My Library and Preferences. Accounts (Beta)'
      : 'Sign in, My Library and Preferences'}
  <Menu
    positioning={menuPositioning('bottom-end')}
    onOpenChange={(e) => {
      if (!e.open) return;
      accountsIntro.markButtonSeen();
      signInTarget = signInHref(window.location);
    }}
  >
    <Menu.Trigger
      class={[
        BUTTON,
        'data-[state=open]:preset-tonal-secondary relative',
        current && 'preset-tonal-secondary',
      ]}
      aria-label={label}
      title={label}
      data-testid="account-button"
    >
      <CircleUserRoundIcon aria-hidden="true" />
      {#if isNew}
        <span
          class="bg-primary-500 absolute top-1.5 right-1.5 size-2.5 rounded-full"
          aria-hidden="true"
        ></span>
      {/if}
    </Menu.Trigger>
    <Portal>
      <Menu.Positioner>
        <Menu.Content class={menuContentClass}>
          {#each menuItems as item (item.value)}
            <Menu.Item value={item.value} class={menuItemClass}>
              {#snippet element(attributes)}
                <!-- The item's menu behavior, typed for its default div -->
                <a
                  {...attributes as HTMLAnchorAttributes}
                  href={item.href}
                  aria-current={item.here ? 'page' : undefined}
                >
                  <item.icon aria-hidden="true" />
                  <span>{item.label}</span>
                </a>
              {/snippet}
            </Menu.Item>
          {/each}
        </Menu.Content>
      </Menu.Positioner>
    </Portal>
  </Menu>
{/if}

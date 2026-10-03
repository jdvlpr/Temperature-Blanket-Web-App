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
  import { LIST_ENDS, ROW_FOCUS } from '$lib/constants/class-constants';
  import { resolve } from '$app/paths';
  import {
    accountErrorMessage,
    clearSignedInHint,
    getSession,
    hasSignedInHint,
    type AccountUser,
  } from '$lib/accounts/client';
  import {
    account,
    forgetAccountSummary,
    rememberAccountSummary,
  } from '$lib/accounts/summary.svelte';
  import AppLogo from '$lib/components/AppLogo.svelte';
  import AppShell from '$lib/components/AppShell.svelte';
  import AccountAvatar from '$lib/components/account/AccountAvatar.svelte';
  import ChangeEmail from '$lib/components/account/ChangeEmail.svelte';
  import DeleteAccount from '$lib/components/account/DeleteAccount.svelte';
  import DisplayName from '$lib/components/account/DisplayName.svelte';
  import GalleryNameSetting from '$lib/components/account/GalleryNameSetting.svelte';
  import SignInCard from '$lib/components/account/SignInCard.svelte';
  import SignInMethods from '$lib/components/account/SignInMethods.svelte';
  import { getGalleryPages } from '$lib/accounts/gallery';
  import {
    ChevronRightIcon,
    DownloadIcon,
    LoaderCircleIcon,
    LogOutIcon,
    MonitorSmartphoneIcon,
  } from '@lucide/svelte';
  import { onMount } from 'svelte';

  const CARD = `bg-surface-50-950 rounded-container divide-surface-200-800 flex flex-col divide-y overflow-hidden shadow-lg card-border ${LIST_ENDS}`;
  const ROW = `hover:bg-surface-100-900 flex min-h-14 w-full items-center gap-3 px-4 py-3 text-left transition-colors disabled:opacity-50 ${ROW_FOCUS}`;

  let status: 'loading' | 'signed-in' | 'signed-out' | 'deleted' | 'error' =
    $state('loading');
  let user = $state<AccountUser | null>(null);
  let busy = $state(false);
  let errorMessage = $state('');
  // For the delete-account question
  let galleryPageCount = $state(0);

  $effect(() => {
    if (status !== 'signed-in') return;
    getGalleryPages().then(
      (gallery) => (galleryPageCount = gallery?.posts.length ?? 0),
    );
  });

  let memberSince = $derived(
    user?.createdAt
      ? new Date(user.createdAt).toLocaleDateString(undefined, {
          month: 'long',
          year: 'numeric',
        })
      : '',
  );

  function showSignedIn(signedInUser: AccountUser) {
    user = signedInUser;
    rememberAccountSummary(signedInUser);
    status = 'signed-in';
  }

  onMount(async () => {
    if (!__ACCOUNTS_ENABLED__) return;
    if (!hasSignedInHint()) {
      forgetAccountSummary();
      status = 'signed-out';
      return;
    }
    try {
      const session = await getSession();
      if (session?.user) showSignedIn(session.user);
      else {
        clearSignedInHint();
        forgetAccountSummary();
        status = 'signed-out';
      }
    } catch (e) {
      errorMessage = accountErrorMessage(e);
      status = 'error';
    }
  });

  async function handleSignOut(everywhere = false) {
    if (!user) return;
    busy = true;
    errorMessage = '';
    const { startSignOut } = await import('$lib/accounts/sign-out');
    await startSignOut({
      userId: user.id,
      everywhere,
      onError: (message) => (errorMessage = message),
    });
    busy = false;
  }

  // Signed out here or from the account menu in the top bar
  $effect(() => {
    if (status === 'signed-in' && !account.summary) {
      user = null;
      status = 'signed-out';
    }
  });

  /** Account details from the server, plus every synced project. */
  async function downloadMyData() {
    busy = true;
    errorMessage = '';
    try {
      const response = await fetch('/api/account/export');
      if (!response.ok) throw new Error(`Export failed: ${response.status}`);
      const data = await response.json();
      try {
        const { downloadAccountProjects } =
          await import('$lib/sync/sync.svelte');
        data.projects = await downloadAccountProjects();
      } catch {
        data.projects =
          'Synced projects could not be downloaded. Try again later.';
      }

      const url = URL.createObjectURL(
        new Blob([JSON.stringify(data, null, 2)], {
          type: 'application/json',
        }),
      );
      const link = document.createElement('a');
      link.href = url;
      link.download = 'temperature-blanket-account.json';
      link.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (e) {
      errorMessage = accountErrorMessage(e);
    } finally {
      busy = false;
    }
  }
</script>

<svelte:head>
  <title>Account</title>
  <meta name="robots" content="noindex" />
</svelte:head>

<AppShell pageName="Account">
  {#snippet stickyHeader()}
    <div class="hidden lg:inline-flex"><AppLogo /></div>
  {/snippet}
  {#snippet main()}
    <main class="mx-auto flex w-full max-w-(--breakpoint-md) flex-col pb-8">
      {#if !__ACCOUNTS_ENABLED__}
        <div class="flex flex-col gap-2 px-2 py-4 text-center">
          <h2 class="h1 text-gradient mb-0">Account</h2>
          <p>Accounts aren’t available yet.</p>
        </div>
      {:else if status === 'loading'}
        <div class="flex justify-center py-16" aria-label="Loading">
          <LoaderCircleIcon class="size-8 animate-spin opacity-70" />
        </div>
      {:else if status === 'signed-in' && user}
        <div class="mx-auto flex w-full max-w-lg flex-col gap-6 px-2 py-4">
          <header class="flex flex-col items-center gap-2 text-center">
            <AccountAvatar summary={user} class="size-20 text-2xl shadow-lg" />
            <div>
              <h2 class="h3">{user.name || 'Welcome!'}</h2>
              {#if memberSince}
                <p class="text-sm opacity-70">Member since {memberSince}</p>
              {/if}
            </div>
          </header>

          <section class="flex flex-col gap-2" aria-labelledby="profile">
            <h3 id="profile" class="px-2 text-sm font-bold opacity-70">
              Profile
            </h3>
            <div class={CARD}>
              <DisplayName
                name={user.name}
                onsaved={(name) => {
                  if (!user) return;
                  user.name = name;
                  rememberAccountSummary(user);
                }}
              />
              <GalleryNameSetting name={user.name} />
              <ChangeEmail
                email={user.email}
                onchanged={(newEmail) => {
                  if (!user) return;
                  user.email = newEmail;
                  rememberAccountSummary(user);
                }}
              />
            </div>
          </section>

          <section
            class="flex flex-col gap-2"
            aria-labelledby="sign-in-methods"
          >
            <h3 id="sign-in-methods" class="px-2 text-sm font-bold opacity-70">
              Sign-in methods
            </h3>
            <div class={CARD}>
              <SignInMethods email={user.email} />
            </div>
          </section>

          <section class="flex flex-col gap-2" aria-labelledby="devices-data">
            <h3 id="devices-data" class="px-2 text-sm font-bold opacity-70">
              Devices and data
            </h3>
            <div class={CARD}>
              <button
                type="button"
                class={ROW}
                aria-label="Sign out"
                onclick={() => handleSignOut()}
                disabled={busy}
              >
                <LogOutIcon class="shrink-0 opacity-70" />
                <span class="flex-1">
                  <span class="block font-bold">Sign out</span>
                  <span class="block text-sm opacity-70">On this device</span>
                </span>
                <ChevronRightIcon class="shrink-0 opacity-50" />
              </button>
              <button
                type="button"
                class={ROW}
                aria-label="Sign out everywhere"
                onclick={() => handleSignOut(true)}
                disabled={busy}
              >
                <MonitorSmartphoneIcon class="shrink-0 opacity-70" />
                <span class="flex-1">
                  <span class="block font-bold">Sign out everywhere</span>
                  <span class="block text-sm opacity-70"
                    >Ends your sessions on every device and browser</span
                  >
                </span>
                <ChevronRightIcon class="shrink-0 opacity-50" />
              </button>
              <button
                type="button"
                class={ROW}
                aria-label="Download my data"
                onclick={downloadMyData}
                disabled={busy}
              >
                <DownloadIcon class="shrink-0 opacity-70" />
                <span class="flex-1">
                  <span class="block font-bold">Download my data</span>
                  <span class="block text-sm opacity-70"
                    >Your account, synced projects and gallery pages as a JSON
                    file</span
                  >
                </span>
                <ChevronRightIcon class="shrink-0 opacity-50" />
              </button>
              {#if errorMessage}
                <p class="text-error-700-300 px-4 py-3" role="alert">
                  {errorMessage}
                </p>
              {/if}
            </div>
          </section>

          <section
            class="rounded-container border-error-500/40 bg-error-500/5 flex flex-col gap-2 border p-4"
            aria-labelledby="delete-account"
          >
            <h3 id="delete-account" class="text-error-700-300 font-bold">
              Delete account
            </h3>
            <DeleteAccount
              email={user.email}
              {galleryPageCount}
              ondeleted={async () => {
                // The account's copies are gone; keep this browser's
                const { leaveAccount } = await import('$lib/sync/sync.svelte');
                if (user) await leaveAccount(user.id, true);
                forgetAccountSummary();
                user = null;
                status = 'deleted';
              }}
            />
          </section>
        </div>
      {:else if status === 'deleted'}
        <div class="flex flex-col items-center gap-4 px-2 py-8 text-center">
          <h2 class="h1 text-gradient mb-0">Account</h2>
          <p role="status">Your account was deleted.</p>
          <a href={resolve('/')} class="btn preset-filled-primary-500"
            >Back to the Project Planner</a
          >
        </div>
      {:else if status === 'signed-out'}
        <div class="flex flex-col gap-2 px-2 py-4 text-center">
          <h2 class="h1 text-gradient mb-0">Account</h2>
          <p class="text-sm opacity-80">
            Sign in to save your projects and pick them up on any device.
          </p>
        </div>
        <SignInCard onsignedin={showSignedIn} />
        <p class="mx-auto max-w-md px-2 pt-4 text-center text-sm opacity-80">
          <span class="badge preset-tonal-secondary mr-1">Beta</span>
          Accounts are new, so you might run into a few rough edges.
          <a href={resolve('/blog/2026-09-28-accounts-beta')} class="link"
            >Read about accounts</a
          >, and if something doesn't work as expected, please
          <a href={resolve('/contact')} class="link">get in touch</a>.
        </p>
      {:else}
        <div class="flex flex-col gap-2 px-2 py-4 text-center">
          <h2 class="h1 text-gradient mb-0">Account</h2>
          <p class="text-error-700-300" role="alert">{errorMessage}</p>
        </div>
      {/if}
    </main>
  {/snippet}
</AppShell>

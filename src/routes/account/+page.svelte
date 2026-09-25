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
  import AppLogo from '$lib/components/AppLogo.svelte';
  import AppShell from '$lib/components/AppShell.svelte';
  import ChangeEmail from '$lib/components/account/ChangeEmail.svelte';
  import DeleteAccount from '$lib/components/account/DeleteAccount.svelte';
  import DisplayName from '$lib/components/account/DisplayName.svelte';
  import SignInMethods from '$lib/components/account/SignInMethods.svelte';
  import {
    accountErrorMessage,
    clearSignedInHint,
    getSession,
    hasSignedInHint,
    signOut,
    signOutEverywhere,
    type AccountUser,
  } from '$lib/accounts/client';
  import {
    DownloadIcon,
    LoaderCircleIcon,
    LogOutIcon,
    MonitorSmartphoneIcon,
  } from '@lucide/svelte';
  import { resolve } from '$app/paths';
  import { onMount } from 'svelte';

  let status: 'loading' | 'signed-in' | 'signed-out' | 'deleted' | 'error' =
    $state('loading');
  let user: AccountUser | null = $state(null);
  let busy = $state(false);
  let errorMessage = $state('');

  onMount(async () => {
    if (!__ACCOUNTS_ENABLED__) return;
    if (!hasSignedInHint()) {
      status = 'signed-out';
      return;
    }
    try {
      const session = await getSession();
      user = session?.user ?? null;
      if (!user) clearSignedInHint();
      status = user ? 'signed-in' : 'signed-out';
    } catch (e) {
      errorMessage = accountErrorMessage(e);
      status = 'error';
    }
  });

  async function handleSignOut(everywhere = false) {
    busy = true;
    errorMessage = '';
    try {
      if (everywhere) await signOutEverywhere();
      else await signOut();
      user = null;
      status = 'signed-out';
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
    <div class="mx-auto hidden lg:inline-flex"><AppLogo /></div>
  {/snippet}
  {#snippet main()}
    <main
      class="mx-auto my-2 flex w-full max-w-(--breakpoint-sm) flex-col gap-4 px-2"
    >
      <h2 class="h2 text-gradient mt-2 max-lg:hidden">Account</h2>

      {#if !__ACCOUNTS_ENABLED__}
        <p>Accounts aren’t available yet.</p>
      {:else if status === 'loading'}
        <p class="flex items-center gap-2">
          <LoaderCircleIcon class="animate-spin" /> Loading…
        </p>
      {:else if status === 'signed-in' && user}
        <section class="flex flex-col gap-2">
          <h3 class="h4">Profile</h3>
          <DisplayName name={user.name} />
        </section>

        <section class="flex flex-col gap-2">
          <h3 class="h4">Email</h3>
          <ChangeEmail
            email={user.email}
            onchanged={(newEmail) => {
              if (user) user.email = newEmail;
            }}
          />
        </section>

        <section class="flex flex-col gap-2">
          <h3 class="h4">Sign-in methods</h3>
          <SignInMethods email={user.email} />
        </section>

        <section class="flex flex-col gap-2">
          <h3 class="h4">Signing out</h3>
          {#if errorMessage}
            <p class="text-error-700-300" role="alert">{errorMessage}</p>
          {/if}
          <div class="flex flex-wrap gap-2">
            <button
              type="button"
              class="btn preset-tonal-surface w-fit"
              onclick={() => handleSignOut()}
              disabled={busy}
            >
              <LogOutIcon /> Sign out
            </button>
            <button
              type="button"
              class="btn preset-tonal-surface w-fit"
              onclick={() => handleSignOut(true)}
              disabled={busy}
            >
              <MonitorSmartphoneIcon /> Sign out everywhere
            </button>
          </div>
          <p class="text-sm opacity-80">
            Sign out everywhere ends your sessions on every device and browser.
          </p>
        </section>

        <section class="flex flex-col gap-2">
          <h3 class="h4">Your data</h3>
          <a
            href={resolve('/api/account/export')}
            download
            class="btn preset-tonal-surface w-fit"
            ><DownloadIcon /> Download my data</a
          >
        </section>

        <section class="flex flex-col gap-2">
          <h3 class="h4">Delete account</h3>
          <DeleteAccount
            email={user.email}
            ondeleted={() => {
              user = null;
              status = 'deleted';
            }}
          />
        </section>
      {:else if status === 'deleted'}
        <p role="status">Your account was deleted.</p>
      {:else if status === 'signed-out'}
        <p>You’re not signed in.</p>
        <a
          href={resolve('/auth/sign-in')}
          class="btn preset-filled-primary-500 w-fit">Sign in</a
        >
      {:else}
        <p class="text-error-700-300" role="alert">{errorMessage}</p>
      {/if}
    </main>
  {/snippet}
</AppShell>

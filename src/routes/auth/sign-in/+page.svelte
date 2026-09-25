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
  import {
    accountErrorMessage,
    getSignInOptions,
    providerErrorMessage,
    sendSignInCode,
    signInWithCode,
    signInWithProvider,
    type SignInProvider,
  } from '$lib/accounts/client';
  import GoogleIcon from '$lib/components/account/GoogleIcon.svelte';
  import { LoaderCircleIcon, LogInIcon, MailIcon } from '@lucide/svelte';
  import { onMount } from 'svelte';

  let step: 'email' | 'code' = $state('email');
  let email = $state('');
  let code = $state('');
  let busy = $state(false);
  let errorMessage = $state('');
  let providers: Record<SignInProvider, boolean> = $state({
    google: false,
  });

  onMount(async () => {
    if (!__ACCOUNTS_ENABLED__) return;
    // A failed provider sign-in returns here with ?error=
    const error = new URL(window.location.href).searchParams.get('error');
    if (error) errorMessage = providerErrorMessage(error);
    providers = await getSignInOptions();
  });

  async function continueWith(provider: SignInProvider) {
    errorMessage = '';
    busy = true;
    try {
      await signInWithProvider(provider);
    } catch (e) {
      errorMessage = accountErrorMessage(e);
      busy = false;
    }
  }

  async function requestCode(event: Event) {
    event.preventDefault();
    errorMessage = '';
    busy = true;
    try {
      await sendSignInCode(email.trim());
      code = '';
      step = 'code';
    } catch (e) {
      errorMessage = accountErrorMessage(e);
    } finally {
      busy = false;
    }
  }

  async function submitCode(event: Event) {
    event.preventDefault();
    errorMessage = '';
    busy = true;
    try {
      await signInWithCode(email.trim(), code.trim());
      window.location.assign('/account');
    } catch (e) {
      errorMessage = accountErrorMessage(e);
      busy = false;
    }
  }
</script>

<svelte:head>
  <title>Sign In</title>
  <meta name="robots" content="noindex" />
</svelte:head>

<AppShell pageName="Sign In">
  {#snippet stickyHeader()}
    <div class="mx-auto hidden lg:inline-flex"><AppLogo /></div>
  {/snippet}
  {#snippet main()}
    <main
      class="mx-auto my-2 flex w-full max-w-(--breakpoint-sm) flex-col gap-4 px-2"
    >
      <h2 class="h2 text-gradient mt-2 max-lg:hidden">Sign In</h2>

      {#if !__ACCOUNTS_ENABLED__}
        <p>Accounts aren’t available yet.</p>
      {:else if step === 'email'}
        {#if providers.google}
          <button
            type="button"
            class="btn preset-tonal-surface w-full"
            onclick={() => continueWith('google')}
            disabled={busy}><GoogleIcon /> Continue with Google</button
          >
          <p class="text-center text-sm opacity-80">or</p>
        {/if}
        <p>
          Enter your email and we’ll send you a 6-digit code. If you don’t have
          an account yet, this creates one.
        </p>
        <form class="flex flex-col gap-4" onsubmit={requestCode}>
          <label class="label">
            <span class="label-text">Email</span>
            <input
              type="email"
              class="input"
              autocomplete="email"
              placeholder="you@example.com"
              required
              bind:value={email}
              disabled={busy}
            />
          </label>
          {#if errorMessage}
            <p class="text-error-700-300" role="alert">{errorMessage}</p>
          {/if}
          <button
            type="submit"
            class="btn preset-filled-primary-500 w-full"
            disabled={busy}
          >
            {#if busy}<LoaderCircleIcon class="animate-spin" />{:else}<MailIcon
              />{/if}
            Email me a code
          </button>
        </form>
      {:else}
        <p>
          We sent a code to <strong>{email}</strong>. It expires in 5 minutes.
        </p>
        <form class="flex flex-col gap-4" onsubmit={submitCode}>
          <label class="label">
            <span class="label-text">Code</span>
            <input
              type="text"
              class="input tracking-widest"
              inputmode="numeric"
              autocomplete="one-time-code"
              pattern={'[0-9]{6}'}
              maxlength="6"
              required
              bind:value={code}
              disabled={busy}
            />
          </label>
          {#if errorMessage}
            <p class="text-error-700-300" role="alert">{errorMessage}</p>
          {/if}
          <button
            type="submit"
            class="btn preset-filled-primary-500 w-full"
            disabled={busy}
          >
            {#if busy}<LoaderCircleIcon class="animate-spin" />{:else}<LogInIcon
              />{/if}
            Sign in
          </button>
          <button
            type="button"
            class="anchor self-center"
            onclick={() => {
              step = 'email';
              errorMessage = '';
            }}
            disabled={busy}>Use a different email or send a new code</button
          >
        </form>
      {/if}
    </main>
  {/snippet}
</AppShell>

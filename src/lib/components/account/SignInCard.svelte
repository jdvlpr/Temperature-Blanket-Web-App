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

<!-- Sign in with Google, or an emailed code where that's on (not in
     production). Used by /auth/sign-in and by the account page when signed out. -->
<script lang="ts">
  import { goto } from '$app/navigation';
  import {
    AccountError,
    accountErrorMessage,
    getSignInOptions,
    providerErrorMessage,
    sendSignInCode,
    signInWithCode,
    signInWithProvider,
    type AccountUser,
    type SignInProvider,
  } from '#lib/accounts/client.js';
  import { rememberAccountSummary } from '#lib/accounts/summary.svelte.js';
  import { safeSlide } from '#lib/features/transitions/safeSlide.js';
  import { toast } from '#lib/state/page-state.svelte.js';
  import {
    ArrowLeftIcon,
    LoaderCircleIcon,
    LogInIcon,
    MailCheckIcon,
    MailIcon,
  } from '@lucide/svelte';
  import { onMount, tick } from 'svelte';
  import Turnstile from '#lib/components/Turnstile.svelte';
  import CodeInput from './CodeInput.svelte';
  import EmailText from './EmailText.svelte';
  import GoogleIcon from './GoogleIcon.svelte';

  const CODE_LIFETIME_MS = 10 * 60 * 1000;
  const RESEND_WAIT_MS = 60 * 1000;

  let {
    redirectTo = '/account',
    onsignedin,
  }: {
    /** Where to go after signing in (from safeRedirect) */
    redirectTo?: string;
    /** Instead of navigating, hand the user to the page this card is on */
    onsignedin?: (user: AccountUser) => void;
  } = $props();

  let step: 'email' | 'code' = $state('email');
  let email = $state('');
  let code = $state('');
  let busy = $state(false);
  let errorMessage = $state('');
  let noticeMessage = $state('');
  // Sign-ups are closed or full: only an existing account got a code
  let signUpsPaused = $state(false);
  // The page is prerendered: until it hydrates, submitting would reload it
  let ready = $state(false);
  let providers: Record<SignInProvider | 'email', boolean> = $state({
    google: false,
    email: false,
  });
  let providersLoaded = $state(false);
  // With Google on, the email form waits behind "Use email instead": Google
  // sign-ins don't use up the daily email limit
  let showEmail = $state(false);
  let emailOpen = $derived(
    providersLoaded && providers.email && (!providers.google || showEmail),
  );
  let emailInput = $state<HTMLInputElement>();
  let turnstile = $state<Turnstile>();
  let sentAt = $state(0);
  let now = $state(Date.now());

  let secondsLeft = $derived(
    Math.max(0, Math.ceil((sentAt + CODE_LIFETIME_MS - now) / 1000)),
  );
  let resendIn = $derived(
    Math.max(0, Math.ceil((sentAt + RESEND_WAIT_MS - now) / 1000)),
  );

  const clock = (seconds: number) =>
    `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;

  // Tick once a second while a code is waiting to be entered
  $effect(() => {
    if (step !== 'code') return;
    const timer = setInterval(() => (now = Date.now()), 1000);
    return () => clearInterval(timer);
  });

  onMount(async () => {
    ready = true;
    // A failed provider sign-in returns with ?error=
    const error = new URL(window.location.href).searchParams.get('error');
    if (error) errorMessage = providerErrorMessage(error);
    providers = await getSignInOptions();
    providersLoaded = true;
  });

  async function openEmail() {
    showEmail = true;
    await tick();
    emailInput?.focus();
  }

  /** A Turnstile token for the code request; signed out, the server needs one. */
  async function turnstileToken() {
    try {
      if (!turnstile) throw new Error('No Turnstile');
      return await turnstile.getToken();
    } catch {
      throw new AccountError(503, 'TURNSTILE_UNAVAILABLE', 'Turnstile failed');
    }
  }

  async function continueWith(provider: SignInProvider) {
    errorMessage = '';
    busy = true;
    try {
      // A failure comes back here with ?redirect= kept
      await signInWithProvider(
        provider,
        redirectTo,
        window.location.pathname + window.location.search,
      );
    } catch (e) {
      errorMessage = accountErrorMessage(e);
      busy = false;
    }
  }

  async function sendCode() {
    errorMessage = '';
    noticeMessage = '';
    busy = true;
    try {
      ({ signUpsPaused = false } = await sendSignInCode(
        email.trim(),
        await turnstileToken(),
      ));
      code = '';
      sentAt = now = Date.now();
      step = 'code';
      return true;
    } catch (e) {
      errorMessage = accountErrorMessage(e);
      if (
        e instanceof AccountError &&
        e.code === 'EMAIL_LIMIT_REACHED' &&
        providers.google
      )
        errorMessage += ' Or continue with Google.';
      return false;
    } finally {
      busy = false;
    }
  }

  async function requestCode(event: Event) {
    event.preventDefault();
    await sendCode();
  }

  async function resend() {
    if (await sendCode()) noticeMessage = 'We sent a new code.';
  }

  async function submitCode(event: Event) {
    event.preventDefault();
    if (busy) return;
    errorMessage = '';
    noticeMessage = '';
    busy = true;
    try {
      const { user } = await signInWithCode(email.trim(), code.trim());
      rememberAccountSummary(user);
      toast.trigger({ category: 'success', message: 'You’re signed in' });
      if (onsignedin) onsignedin(user);
      // A path on this site, already checked by safeRedirect. goto rejects a
      // path no route matches; load it as a page then, rather than showing a
      // sign-in error after signing in
      else
        // eslint-disable-next-line svelte/no-navigation-without-resolve
        await goto(redirectTo).catch(() => (window.location.href = redirectTo));
    } catch (e) {
      errorMessage = accountErrorMessage(e);
      // Clear a wrong code so the next try starts fresh
      if (e instanceof AccountError && e.code === 'INVALID_OTP') code = '';
      busy = false;
    }
  }

  function changeEmail() {
    step = 'email';
    showEmail = true;
    errorMessage = '';
    noticeMessage = '';
  }
</script>

<div
  class="md:bg-surface-50 dark:md:bg-surface-950 md:rounded-container md:card-border mx-auto w-full max-w-md px-2 text-left md:p-6 md:shadow-lg"
>
  {#if step === 'email'}
    <div class="flex flex-col gap-4" in:safeSlide>
      {#if providers.google}
        <button
          type="button"
          class="btn preset-outlined-surface-300-700 hover:preset-tonal-surface h-12 w-full"
          onclick={() => continueWith('google')}
          disabled={busy}><GoogleIcon /> Continue with Google</button
        >
        {#if emailOpen}
          <div
            class="flex items-center gap-3 text-sm opacity-70"
            role="separator"
          >
            <hr class="border-surface-300-700 flex-1" />
            or
            <hr class="border-surface-300-700 flex-1" />
          </div>
        {/if}
      {/if}
      {#if !providersLoaded}
        <!-- Until it's known whether Google is on, so the form doesn't show, then hide -->
        <div class="h-12" aria-hidden="true"></div>
      {:else if !emailOpen}
        {#if errorMessage}
          <p class="text-error-700-300 text-center" role="alert">
            {errorMessage}
          </p>
        {/if}
        {#if providers.email}
          <button
            type="button"
            class="btn btn-sm hover:preset-tonal-surface self-center"
            onclick={openEmail}
            disabled={busy}><MailIcon /> Use email instead</button
          >
        {/if}
      {:else}
        <form class="flex flex-col gap-4" onsubmit={requestCode} in:safeSlide>
          <label class="label">
            <span class="label-text">Email</span>
            <input
              type="email"
              class="input h-12"
              autocomplete="email"
              autocapitalize="off"
              spellcheck="false"
              inputmode="email"
              enterkeyhint="send"
              placeholder="you@example.com"
              required
              bind:value={email}
              bind:this={emailInput}
              disabled={busy}
            />
          </label>
          {#if errorMessage}
            <p class="text-error-700-300" role="alert">{errorMessage}</p>
          {/if}
          <button
            type="submit"
            class="btn preset-filled-primary-500 h-12 w-full"
            disabled={busy || !ready}
          >
            {#if busy}<LoaderCircleIcon class="animate-spin" />{:else}<MailIcon
              />{/if}
            Email me a code
          </button>
          <p class="text-center text-sm opacity-80">
            You don't need a password for this web app. Instead, you'll be
            emailed sign-in codes.
          </p>
        </form>
      {/if}
    </div>
  {:else}
    <form class="flex flex-col gap-4" onsubmit={submitCode} in:safeSlide>
      <div class="flex flex-col items-center gap-1 text-center">
        <MailCheckIcon class="text-primary-500 size-10" />
        <h3 class="h4">Check your email</h3>
        {#if signUpsPaused}
          <p>
            If <EmailText {email} /> has an account, we sent it a code.
          </p>
          <p class="text-sm opacity-80" data-testid="sign-ups-paused">
            New sign-ups are paused for now. Try again later.
          </p>
        {:else}
          <p>
            We sent a code to <EmailText {email} />
          </p>
        {/if}
      </div>
      <CodeInput bind:value={code} disabled={busy} />
      <p class="text-center text-sm opacity-80" aria-live="polite">
        {#if secondsLeft > 0}
          Expires in {clock(secondsLeft)}
        {:else}
          This code has expired. Send a new one.
        {/if}
      </p>
      {#if errorMessage}
        <p class="text-error-700-300 text-center" role="alert">
          {errorMessage}
        </p>
      {:else if noticeMessage}
        <p class="text-center" role="status">{noticeMessage}</p>
      {/if}
      <button
        type="submit"
        class="btn preset-filled-primary-500 h-12 w-full"
        disabled={busy || secondsLeft === 0}
      >
        {#if busy}<LoaderCircleIcon class="animate-spin" />{:else}<LogInIcon
          />{/if}
        Sign in
      </button>
      <div class="flex flex-wrap items-center justify-between gap-2 text-sm">
        <button
          type="button"
          class="btn btn-sm hover:preset-tonal-surface"
          onclick={changeEmail}
          disabled={busy}><ArrowLeftIcon /> Use a different email</button
        >
        <button
          type="button"
          class="btn btn-sm hover:preset-tonal-surface"
          onclick={resend}
          disabled={busy || resendIn > 0}
        >
          {#if resendIn > 0}Resend in {clock(resendIn)}{:else}Resend code{/if}
        </button>
      </div>
    </form>
  {/if}
  <!-- Outside both steps, so a resend can use it too; shows only when
  Cloudflare needs you to do something -->
  {#if providers.email}
    <Turnstile bind:this={turnstile} />
  {/if}
</div>

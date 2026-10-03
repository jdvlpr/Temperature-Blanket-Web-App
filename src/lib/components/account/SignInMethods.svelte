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
  import {
    accountErrorMessage,
    getSignInOptions,
    linkProvider,
    needsFreshSession,
    listLinkedAccounts,
    providerErrorMessage,
    sendSignInCode,
    signInWithCode,
    unlinkAccount,
    type LinkedAccount,
    type SignInProvider,
  } from '$lib/accounts/client';
  import { safeSlide } from '$lib/features/transitions/safeSlide';
  import { CheckIcon, LoaderCircleIcon, MailIcon } from '@lucide/svelte';
  import CodeInput from './CodeInput.svelte';
  import EmailText from './EmailText.svelte';
  import { onMount } from 'svelte';
  import GoogleIcon from './GoogleIcon.svelte';

  let { email }: { email: string } = $props();

  const PROVIDERS: { id: SignInProvider; name: string }[] = [
    { id: 'google', name: 'Google' },
  ];

  let available: Record<SignInProvider, boolean> = $state({
    google: false,
  });
  let linked: LinkedAccount[] = $state([]);
  let loading = $state(true);
  let busy = $state(false);
  let errorMessage = $state('');
  // Set while waiting for a code to confirm an unlink
  let reconfirming: { id: SignInProvider; name: string } | null = $state(null);
  let code = $state('');

  const isLinked = (provider: SignInProvider) =>
    linked.some((account) => account.providerId === provider);

  onMount(async () => {
    // A failed link returns here with ?error=
    const error = new URL(window.location.href).searchParams.get('error');
    if (error) errorMessage = providerErrorMessage(error);
    try {
      available = await getSignInOptions();
      if (available.google) linked = await listLinkedAccounts();
    } catch (e) {
      errorMessage = accountErrorMessage(e);
    } finally {
      loading = false;
    }
  });

  async function link(provider: SignInProvider) {
    busy = true;
    errorMessage = '';
    try {
      await linkProvider(provider);
    } catch (e) {
      errorMessage = accountErrorMessage(e);
      busy = false;
    }
  }

  async function unlink(provider: { id: SignInProvider; name: string }) {
    busy = true;
    errorMessage = '';
    try {
      for (const account of linked.filter((a) => a.providerId === provider.id))
        await unlinkAccount(account.id);
      linked = linked.filter((a) => a.providerId !== provider.id);
      reconfirming = null;
    } catch (e) {
      if (needsFreshSession(e)) {
        // More than 10 minutes since sign-in: confirm with a new code first
        try {
          await sendSignInCode(email);
          code = '';
          reconfirming = provider;
        } catch (sendError) {
          errorMessage = accountErrorMessage(sendError);
        }
      } else {
        errorMessage = accountErrorMessage(e);
      }
    } finally {
      busy = false;
    }
  }

  async function reconfirm(event: Event) {
    event.preventDefault();
    if (!reconfirming) return;
    busy = true;
    errorMessage = '';
    try {
      await signInWithCode(email, code.trim());
    } catch (e) {
      errorMessage = accountErrorMessage(e);
      busy = false;
      return;
    }
    await unlink(reconfirming);
  }
</script>

<div class="divide-surface-200-800 flex flex-col divide-y">
  <div class="flex min-h-14 items-center gap-3 px-4 py-3">
    <MailIcon class="shrink-0 opacity-70" />
    <div class="min-w-0 flex-1">
      <p class="font-bold">Email code</p>
      <p class="text-sm opacity-70">A 6-digit code sent to your email</p>
    </div>
    <span class="flex shrink-0 items-center gap-1 text-sm opacity-80"
      ><CheckIcon size="16" /> Always on</span
    >
  </div>
  {#if loading}
    <div class="flex min-h-14 items-center px-4 py-3">
      <LoaderCircleIcon class="animate-spin" />
    </div>
  {:else}
    {#each PROVIDERS.filter((p) => available[p.id]) as provider (provider.id)}
      <div
        class="flex min-h-14 items-center gap-3 px-4 py-3"
        data-testid={`provider-${provider.id}`}
      >
        <GoogleIcon />
        <div class="min-w-0 flex-1">
          <p class="font-bold">{provider.name}</p>
          <p class="text-sm opacity-70">
            {#if isLinked(provider.id)}Linked{:else}Sign in with one tap{/if}
          </p>
        </div>
        {#if isLinked(provider.id)}
          <button
            type="button"
            class="btn btn-sm preset-tonal-surface shrink-0"
            aria-label={`Unlink ${provider.name}`}
            onclick={() => unlink(provider)}
            disabled={busy}>Unlink</button
          >
        {:else}
          <button
            type="button"
            class="btn btn-sm preset-filled-primary-500 shrink-0"
            aria-label={`Link ${provider.name}`}
            onclick={() => link(provider.id)}
            disabled={busy}>Link</button
          >
        {/if}
      </div>
    {/each}
  {/if}
  {#if reconfirming}
    <form
      class="flex flex-col gap-3 px-4 py-3"
      onsubmit={reconfirm}
      in:safeSlide
    >
      <p>
        To unlink {reconfirming.name}, confirm it’s you: we sent a code to
        <EmailText {email} />.
      </p>
      <CodeInput bind:value={code} disabled={busy} />
      <div class="flex flex-wrap gap-2">
        <button
          type="submit"
          class="btn preset-filled-primary-500 max-sm:w-full"
          disabled={busy}
          >{#if busy}<LoaderCircleIcon class="animate-spin" />{/if}
          Confirm and unlink</button
        >
        <button
          type="button"
          class="btn preset-tonal-surface max-sm:w-full"
          onclick={() => (reconfirming = null)}
          disabled={busy}>Cancel</button
        >
      </div>
    </form>
  {/if}
  {#if errorMessage}
    <p class="text-error-700-300 px-4 py-3" role="alert">{errorMessage}</p>
  {/if}
</div>

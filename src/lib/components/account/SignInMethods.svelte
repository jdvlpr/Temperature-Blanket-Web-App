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
  import { LoaderCircleIcon } from '@lucide/svelte';
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

<div class="flex flex-col gap-2">
  <p>You can always sign in with a code sent to your email.</p>
  {#if loading}
    <LoaderCircleIcon class="animate-spin" />
  {:else}
    {#each PROVIDERS.filter((p) => available[p.id]) as provider (provider.id)}
      <div
        class="flex flex-wrap items-center gap-2"
        data-testid={`provider-${provider.id}`}
      >
        <GoogleIcon />
        <span class="font-bold">{provider.name}</span>
        {#if isLinked(provider.id)}
          <span>Linked</span>
          <button
            type="button"
            class="btn btn-sm preset-tonal-surface"
            onclick={() => unlink(provider)}
            disabled={busy}>Unlink {provider.name}</button
          >
        {:else}
          <button
            type="button"
            class="btn btn-sm preset-tonal-surface"
            onclick={() => link(provider.id)}
            disabled={busy}>Link {provider.name}</button
          >
        {/if}
      </div>
    {/each}
    {#if reconfirming}
      <form class="flex flex-col gap-2" onsubmit={reconfirm}>
        <p>
          To unlink {reconfirming.name}, confirm it’s you: we sent a code to
          <strong>{email}</strong>.
        </p>
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
        <div class="flex gap-2">
          <button type="submit" class="btn preset-filled w-fit" disabled={busy}
            >{#if busy}<LoaderCircleIcon class="animate-spin" />{/if}
            Confirm and unlink</button
          >
          <button
            type="button"
            class="btn preset-tonal-surface w-fit"
            onclick={() => (reconfirming = null)}
            disabled={busy}>Cancel</button
          >
        </div>
      </form>
    {/if}
  {/if}
  {#if errorMessage}
    <p class="text-error-700-300" role="alert">{errorMessage}</p>
  {/if}
</div>

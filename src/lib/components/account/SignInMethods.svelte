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
    listLinkedProviders,
    providerErrorMessage,
    unlinkProvider,
    type SignInProvider,
  } from '$lib/accounts/client';
  import { LoaderCircleIcon } from '@lucide/svelte';
  import { onMount } from 'svelte';
  import GoogleIcon from './GoogleIcon.svelte';

  const PROVIDERS: { id: SignInProvider; name: string }[] = [
    { id: 'google', name: 'Google' },
  ];

  let available: Record<SignInProvider, boolean> = $state({
    google: false,
  });
  let linked: string[] = $state([]);
  let loading = $state(true);
  let busy = $state(false);
  let errorMessage = $state('');

  onMount(async () => {
    // A failed link returns here with ?error=
    const error = new URL(window.location.href).searchParams.get('error');
    if (error) errorMessage = providerErrorMessage(error);
    try {
      available = await getSignInOptions();
      if (available.google)
        linked = (await listLinkedProviders()).map((a) => a.providerId);
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

  async function unlink(provider: SignInProvider) {
    busy = true;
    errorMessage = '';
    try {
      await unlinkProvider(provider);
      linked = linked.filter((id) => id !== provider);
    } catch (e) {
      errorMessage = accountErrorMessage(e);
    } finally {
      busy = false;
    }
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
        {#if linked.includes(provider.id)}
          <span>Linked</span>
          <button
            type="button"
            class="btn btn-sm preset-tonal-surface"
            onclick={() => unlink(provider.id)}
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
  {/if}
  {#if errorMessage}
    <p class="text-error-700-300" role="alert">{errorMessage}</p>
  {/if}
</div>

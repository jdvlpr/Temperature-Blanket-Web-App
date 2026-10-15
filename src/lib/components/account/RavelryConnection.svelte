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

<!-- On the Account page: connect Ravelry (to post projects there, add photos,
and plan from your stash), or disconnect it. Hidden where Ravelry isn't set up. -->

<script lang="ts">
  import {
    connectRavelry,
    disconnectRavelry,
    getRavelryStatus,
    type RavelryStatus,
  } from '#lib/accounts/ravelry.js';
  import { LinkIcon } from '@lucide/svelte';
  import { onMount } from 'svelte';

  let {
    cardClass,
  }: { /** The Account page's card style */ cardClass: string } = $props();

  let status = $state<RavelryStatus | null>(null);
  let busy = $state(false);
  let message = $state('');

  onMount(async () => {
    // A failed connect returns here with ?ravelry=failed&error=
    const params = new URL(window.location.href).searchParams;
    if (params.get('ravelry') === 'failed')
      message =
        params.get('error') === 'access_denied'
          ? 'Connecting Ravelry was canceled.'
          : 'Ravelry couldn’t be connected. Try again.';
    status = await getRavelryStatus();
  });

  async function connect() {
    busy = true;
    message = '';
    try {
      await connectRavelry();
    } catch {
      message = 'Ravelry couldn’t be connected. Try again.';
      busy = false;
    }
  }

  async function disconnect() {
    busy = true;
    message = '';
    try {
      await disconnectRavelry();
      status = { available: true, connected: false };
      message =
        'Ravelry is disconnected. Your projects and photos on Ravelry are still there.';
    } catch {
      message = 'Ravelry couldn’t be disconnected. Try again.';
    } finally {
      busy = false;
    }
  }
</script>

<!-- Shown once it's known Ravelry is available, so it never flashes up -->
{#if status?.available}
  <section class="flex flex-col gap-2" aria-labelledby="connected-accounts">
    <h3 id="connected-accounts" class="px-2 text-sm font-bold opacity-70">
      Connected accounts
    </h3>
    <div class={cardClass}>
      {#if status?.available}
        <div
          class="flex min-h-14 items-center gap-3 px-4 py-3"
          data-testid="ravelry-connection"
        >
          <LinkIcon class="shrink-0 opacity-70" />
          <div class="min-w-0 flex-1">
            <p class="font-bold">Ravelry</p>
            <p class="text-sm opacity-70">
              {#if status.connected && status.failed}
                Connected, but Ravelry couldn’t be checked just now. Try again
                later.
              {:else if status.connected && status.needsReconnect}
                Ravelry stopped accepting this connection. Connect it again.
              {:else if status.connected}
                Connected{status.username ? ` as ${status.username}` : ''}
              {:else}
                Post projects to Ravelry, add photos, and plan from your stash
              {/if}
            </p>
          </div>
          {#if status.connected && !status.needsReconnect}
            <button
              type="button"
              class="btn btn-sm preset-tonal-surface shrink-0"
              aria-label="Disconnect Ravelry"
              onclick={disconnect}
              disabled={busy}>Disconnect</button
            >
          {:else}
            <button
              type="button"
              class="btn btn-sm preset-filled-primary-500 shrink-0"
              aria-label="Connect Ravelry"
              onclick={connect}
              disabled={busy}>Connect</button
            >
          {/if}
        </div>
      {/if}
      {#if message}
        <p class="px-4 pb-3 text-sm" role="status">{message}</p>
      {/if}
    </div>
  </section>
{/if}

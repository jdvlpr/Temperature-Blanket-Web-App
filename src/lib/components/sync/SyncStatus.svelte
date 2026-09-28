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

<!-- A notice when the account's sync needs attention, with a way to fix it.
Shows nothing while syncing works, which is the usual case. -->

<script lang="ts">
  import { page } from '$app/state';
  import { sync } from '$lib/sync/status.svelte';
  import { CloudAlertIcon, CloudOffIcon } from '@lucide/svelte';

  let { class: className = '' }: { class?: string } = $props();

  const signInHref = $derived(
    `/auth/sign-in?redirect=${encodeURIComponent(page.url.pathname + page.url.search)}`,
  );

  async function syncNow() {
    const { syncNow } = await import('$lib/sync/sync.svelte');
    await syncNow();
  }
</script>

{#if sync.state !== 'idle' && sync.state !== 'syncing'}
  <div
    class="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm {className}"
    aria-live="polite"
    data-testid="sync-status"
  >
    {#if sync.state === 'offline'}
      <CloudOffIcon class="size-4 shrink-0 opacity-70" />
      <span>Offline. Changes sync when you’re back online.</span>
    {:else if sync.state === 'paused'}
      <CloudOffIcon class="size-4 shrink-0 opacity-70" />
      <span>Sync paused. Your projects are safe in this browser.</span>
    {:else if sync.state === 'not-invited'}
      <CloudOffIcon class="size-4 shrink-0 opacity-70" />
      <span>Sync is in a private beta for now.</span>
    {:else if sync.state === 'signed-out'}
      <CloudAlertIcon class="text-warning-700-300 size-4 shrink-0" />
      <span>Your session ended.</span>
      <!-- eslint-disable-next-line svelte/no-navigation-without-resolve -->
      <a class="anchor" href={signInHref}>Sign in to sync</a>
    {:else if sync.state === 'error'}
      <CloudAlertIcon class="text-error-700-300 size-4 shrink-0" />
      <span>Couldn’t sync.</span>
      <button type="button" class="anchor" onclick={syncNow}>Try again</button>
    {/if}
  </div>
{/if}

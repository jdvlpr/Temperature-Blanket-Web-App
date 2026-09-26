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

<!-- The account link in the top bar: the account's picture or initials when
signed in, otherwise a way to sign in. Nothing when accounts are off. -->

<script lang="ts">
  import { resolve } from '$app/paths';
  import { page } from '$app/state';
  import { account, loadAccountSummary } from '$lib/accounts/summary.svelte';
  import AccountAvatar from '$lib/components/account/AccountAvatar.svelte';
  import { CircleUserRoundIcon } from '@lucide/svelte';
  import { onMount } from 'svelte';

  onMount(() => {
    if (__ACCOUNTS_ENABLED__) loadAccountSummary();
  });
</script>

{#if __ACCOUNTS_ENABLED__}
  <a
    href={resolve('/account')}
    class={[
      'hover:preset-tonal-surface inline-flex size-10 shrink-0 items-center justify-center rounded-full',
      page.url.pathname === '/account' && 'preset-tonal-secondary',
    ]}
    aria-label={account.summary ? 'Account' : 'Sign in'}
    title={account.summary
      ? `Account: ${account.summary.name || account.summary.email}`
      : 'Sign in'}
    data-testid="account-button"
  >
    {#if account.summary}
      <AccountAvatar
        summary={account.summary}
        class="aspect-square size-8 max-w-none text-xs"
      />
    {:else}
      <CircleUserRoundIcon />
    {/if}
  </a>
{/if}

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
  import SignInCard from '$lib/components/account/SignInCard.svelte';
  import { safeRedirect } from '$lib/accounts/redirect';
  import { onMount } from 'svelte';

  // Read after mount: the page is prerendered, so there's no query string at build time
  let redirectTo = $state('/account');
  onMount(() => {
    redirectTo = safeRedirect(
      new URL(window.location.href).searchParams.get('redirect'),
    );
  });
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
    <main class="mx-auto flex w-full max-w-(--breakpoint-md) flex-col pb-8">
      <div class="flex flex-col gap-2 px-2 py-4 text-center">
        <h2 class="h1 text-gradient mb-0">Sign In</h2>
        <p>Save your projects and pick them up on any device.</p>
      </div>
      {#if __ACCOUNTS_ENABLED__}
        <SignInCard {redirectTo} />
      {:else}
        <p class="text-center">Accounts aren’t available yet.</p>
      {/if}
    </main>
  {/snippet}
</AppShell>

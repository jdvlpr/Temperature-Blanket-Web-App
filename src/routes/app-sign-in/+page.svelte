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
  import AppShell from '#lib/components/AppShell.svelte';
  import { PAGE, PAGE_TEXT } from '#lib/constants/class-constants.js';
  import type { ActionData, PageData } from './$types';

  let { data, form }: { data: PageData; form: ActionData } = $props();

  const appLink = $derived(form && 'appLink' in form ? form.appLink : null);

  // Back to the app as soon as the code is ready; the link below stays for
  // browsers that ask first
  $effect(() => {
    if (appLink) window.location.href = appLink;
  });
</script>

<svelte:head>
  <title>Sign In to the App</title>
  <meta name="robots" content="noindex" />
</svelte:head>

<AppShell pageName="Sign In to the App">
  {#snippet main()}
    <main class={[PAGE, PAGE_TEXT, 'flex flex-col gap-4 pb-8']}>
      <div class="flex flex-col gap-2 py-4">
        <h2 class="h1 text-gradient mb-0">Sign In to the App</h2>
        <p>
          The Temperature Blanket app on your iPhone is asking to sign in to
          your account.
        </p>
      </div>

      {#if appLink}
        <p role="status">Signed in. Going back to the app…</p>
        <a class="btn preset-filled-primary-500 h-12 w-full" href={appLink}>
          Open the App
        </a>
      {:else}
        <div class="card preset-tonal-surface flex flex-col gap-1 p-4">
          <span class="font-bold break-words">{data.name}</span>
          <span class="break-all">{data.email}</span>
        </div>
        <p>
          The app will see and change this account’s projects, palettes and
          preferences. Only continue if you opened this page from the app
          yourself.
        </p>
        {#if form && 'message' in form}
          <p role="alert" class="text-error-700-300">
            {form.message} Close this page and try again from the app.
          </p>
        {/if}
        <form method="POST" class="flex flex-col gap-2">
          <button class="btn preset-filled-primary-500 h-12 w-full">
            Continue as {data.name}
          </button>
        </form>
        <p class="text-sm">
          Not you? Close this page, sign out on the
          <a class="anchor" href="/account">Account page</a>, then try again
          from the app.
        </p>
      {/if}
    </main>
  {/snippet}
</AppShell>

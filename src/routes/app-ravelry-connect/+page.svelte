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

<!-- In the iPhone app's browser sheet: which account Ravelry would be
     connected to, before going to Ravelry -->
<script lang="ts">
  import AppShell from '#lib/components/AppShell.svelte';
  import { PAGE, PAGE_TEXT } from '#lib/constants/class-constants.js';
  import type { PageData } from './$types';

  let { data }: { data: PageData } = $props();
</script>

<svelte:head>
  <title>Connect Ravelry</title>
  <meta name="robots" content="noindex" />
</svelte:head>

<AppShell pageName="Connect Ravelry">
  {#snippet main()}
    <main class={[PAGE, PAGE_TEXT, 'flex flex-col gap-4 pb-8']}>
      <div class="flex flex-col gap-2 py-4">
        <h2 class="h1 text-gradient mb-0">Connect Ravelry</h2>
        <p>
          The Temperature Blanket app on your iPhone is asking to connect your
          Ravelry account to this account:
        </p>
      </div>
      <div class="card preset-tonal-surface flex flex-col gap-1 p-4">
        <span class="font-bold break-words">{data.name}</span>
        <span class="break-all">{data.email}</span>
      </div>
      <p>
        Next, Ravelry asks you to sign in and approve it. Only continue if you
        opened this page from the app yourself.
      </p>
      <form
        method="POST"
        action="/app-ravelry-connect/continue"
        class="flex flex-col gap-2"
      >
        <input type="hidden" name="code" value={data.code} />
        <button class="btn preset-filled-primary-500 h-12 w-full">
          Continue to Ravelry
        </button>
      </form>
      <p class="text-sm">Not you? Close this page.</p>
    </main>
  {/snippet}
</AppShell>

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

<script>
  import { PUBLIC_BASE_URL, PUBLIC_KOFI_LINK } from '$app/env/public';
  import AppShell from '#lib/components/AppShell.svelte';
  import {
    PAGE,
    PAGE_TEXT,
    PAGE_WIDE,
  } from '#lib/constants/class-constants.js';
  import Supporters from '#lib/components/Supporters.svelte';
  import DonateButton from '#lib/components/buttons/DonateButton.svelte';
</script>

<svelte:head>
  <title>Supporters</title>
  <meta name="description" content="Thanks to the supporters" />

  <meta property="og:title" content="Supporters" />
  <meta property="og:description" content="Thanks to the supporters" />
  <meta property="og:url" content="{PUBLIC_BASE_URL}/supporters" />
  <meta property="og:type" content="website" />
</svelte:head>

<AppShell pageName="Supporters">
  {#snippet main()}
    <main class={[PAGE, PAGE_WIDE, 'mt-2 mb-12 flex flex-col gap-4']}>
      <p class={[PAGE_TEXT, 'mt-2 text-sm']}>
        Thanks to <a
          href={PUBLIC_KOFI_LINK}
          target="_blank"
          rel="noopener noreferrer"
          class="link">generous one-time donors</a
        >
        for their contributions, as well as to the following monthly supporters!
      </p>

      <div class=""><DonateButton /></div>

      <Supporters />
    </main>
  {/snippet}
</AppShell>

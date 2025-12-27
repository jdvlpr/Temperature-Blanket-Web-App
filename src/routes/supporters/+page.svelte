<!-- Copyright (c) 2024, Thomas (https://github.com/jdvlpr)

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
  import { PUBLIC_BASE_URL, PUBLIC_KOFI_LINK } from '$env/static/public';
  import AppLogo from '$lib/components/AppLogo.svelte';
  import AppShell from '$lib/components/AppShell.svelte';
  import Supporters from '$lib/components/Supporters.svelte';
  import DonateButton from '$lib/components/buttons/DonateButton.svelte';
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
  {#snippet stickyHeader()}
    <div class="mx-auto hidden lg:inline-flex"><AppLogo /></div>
  {/snippet}
  {#snippet main()}
    <main class="m-auto mx-auto mb-4 max-w-screen-lg px-2 text-center">
      <div>
        <div class="p-4">
          <p class="mt-2 text-center">
            Thanks to <a
              href={PUBLIC_KOFI_LINK}
              target="_blank"
              rel="noopener noreferrer"
              class="link">generous one-time donors</a
            >
            for their contributions, as well as to the following monthly supporters!
          </p>
        </div>
      </div>
      <div class="pb-4">
        <Supporters />
        <div class="mt-4"><DonateButton /></div>
      </div>
    </main>
  {/snippet}
</AppShell>

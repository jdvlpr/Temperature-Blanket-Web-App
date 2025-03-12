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
  import Card from '$lib/components/Card.svelte';
  import Supporters from '$lib/components/Supporters.svelte';
  import DonateButton from '$lib/components/buttons/DonateButton.svelte';
</script>

<svelte:head>
  <title>Supporters</title>
  <meta
    name="description"
    content="Thanks to the supporters who help contribute to this site."
  />

  <meta property="og:title" content="Supporters" />
  <meta
    property="og:description"
    content="Thanks to the supporters who help contribute to this site."
  />
  <meta property="og:url" content="{PUBLIC_BASE_URL}/supporters" />
  <meta property="og:type" content="website" />
</svelte:head>

<AppShell pageName="Supporters">
  {#snippet stickyHeader()}
    <div class="hidden lg:inline-flex mx-auto"><AppLogo /></div>
  {/snippet}
  {#snippet main()}
    <main class="max-w-(--breakpoint-md) m-auto text-center mb-4 mx-auto px-2">
      <div>
        <div class="p-4">
          <p class="text-center mt-2">
            Thanks to <a
              href={PUBLIC_KOFI_LINK}
              target="_blank"
              rel="noopener noreferrer"
              class="link">many generous one-time donors</a
            >
            for their contributions to this site, as well as to the following monthly
            supporters:
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

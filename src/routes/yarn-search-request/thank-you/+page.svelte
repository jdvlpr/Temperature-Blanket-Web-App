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
  import { PUBLIC_BASE_URL } from '$env/static/public';
  import AppLogo from '$lib/components/AppLogo.svelte';
  import AppShell from '$lib/components/AppShell.svelte';
  import { ICONS } from '$lib/constants';
</script>

<svelte:head>
  <title>Received Yarn Suggestion</title>
  <meta name="description" content="Thanks for your yarn search request." />

  <meta property="og:title" content="Recieved Yarn Suggestion" />
  <meta
    property="og:description"
    content="Thanks for your yarn search request."
  />
  <meta
    property="og:url"
    content="{PUBLIC_BASE_URL}/yarn-search-request/thank-you"
  />
  <meta property="og:type" content="website" />
</svelte:head>

<AppShell pageName="Received Yarn Suggestion">
  <svelte:fragment slot="stickyHeader">
    <div class="hidden lg:inline-flex mx-auto"><AppLogo /></div>
  </svelte:fragment>
  <main
    slot="main"
    class="max-w-screen-xl m-auto text-left flex flex-col gap-4 mx-4 lg:mx-0 mt-4 mb-2"
  >
    <h2 class="text-3xl font-bold flex flex-wrap items-center gap-2">
      <span class="text-success-600-300-token">{@html ICONS.checkCircle}</span> Success!
    </h2>
    <p class="">Your yarn search request has been received, thank you!</p>
    <p class="text-xs">
      Expect up to a few weeks for your request to be processed.
    </p>
  </main>
</AppShell>

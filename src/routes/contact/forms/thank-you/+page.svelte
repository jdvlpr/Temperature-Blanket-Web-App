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
  import { ArrowLeftIcon, CircleCheckBigIcon } from '@lucide/svelte';
</script>

<svelte:head>
  <title>Your form was received</title>
  <meta name="description" content="Thanks for your feedback" />

  <meta property="og:title" content="Your form was received" />
  <meta property="og:description" content="Thanks for your feedback" />
  <meta property="og:url" content="{PUBLIC_BASE_URL}/contact/forms/thank-you" />
  <meta property="og:type" content="website" />
</svelte:head>

<AppShell pageName="Your form was received">
  {#snippet stickyHeader()}
    <div class="mx-auto hidden lg:inline-flex"><AppLogo /></div>
  {/snippet}
  {#snippet main()}
    <main
      class="m-auto mx-auto mt-4 mb-2 flex max-w-(--breakpoint-md) flex-col items-center gap-4 px-2 text-center"
    >
      <a href="/contact" class="link"
        ><ArrowLeftIcon class="relative -top-[2px] mr-1 inline size-4" /> Back to
        contact</a
      >
      <h2 class="h2 text-gradient flex flex-wrap items-center gap-2">
        Success!
      </h2>
      <p class="">
        <span class="text-success-700-300"
          ><CircleCheckBigIcon
            class="relative -top-[2px] mr-1 inline size-4"
          /></span
        > Your feedback has been received, thank you!
      </p>

      <a href="/" class="link">Go to the home page</a>
    </main>
  {/snippet}
</AppShell>

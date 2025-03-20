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
  import SocialIcons from '$lib/components/buttons/SocialIcons.svelte';
</script>

<svelte:head>
  <title>Contact</title>
  <meta name="description" content="Contact" />

  <meta property="og:title" content="Contact " />
  <meta property="og:description" content="Contact" />
  <meta property="og:url" content="{PUBLIC_BASE_URL}/contact" />
  <meta property="og:type" content="website" />
</svelte:head>

<AppShell pageName="Contact">
  {#snippet stickyHeader()}
    <div class="hidden lg:inline-flex"><AppLogo /></div>
  {/snippet}
  {#snippet main()}
    <main
      class="mx-auto flex max-w-(--breakpoint-sm) flex-col gap-4 px-4 lg:px-0"
    >
      <div>
        <h2 class="h2 text-gradient max-lg:hidden">Contact</h2>
        <SocialIcons />
      </div>
      <div class="rounded-container bg-surface-100-900 my-4 w-fit p-2">
        <p>
          See the <a href="/faq" class="link">Frequently Asked Questions</a> for
          answers to common questions.
        </p>
      </div>
    </main>
  {/snippet}
</AppShell>

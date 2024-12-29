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
  import Gallery from '$lib/components/Gallery.svelte';
</script>

<svelte:head>
  <title>Temperature Blanket Project Gallery</title>
  <meta
    name="description"
    content="Browse a collection of temperature blanket projects."
  />

  <meta property="og:title" content="Temperature Blanket Project Gallery" />
  <meta
    property="og:description"
    content="Browse a collection of temperature blanket projects."
  />
  <meta property="og:url" content="{PUBLIC_BASE_URL}/gallery" />
  <meta property="og:type" content="website" />
</svelte:head>

<AppShell pageName="Project Gallery">
  {#snippet stickyHeader()}
  
      <div class="hidden lg:inline-flex mx-auto"><AppLogo /></div>
    
  {/snippet}

  {#snippet main()}
    <main
      
      class="max-w-screen-xl m-auto flex flex-col justify-start gap-2"
    >
      <Gallery />
    </main>
  {/snippet}
</AppShell>

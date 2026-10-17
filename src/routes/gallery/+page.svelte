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
  import { goto } from '$app/navigation';
  import { page } from '$app/state';
  import { onMount } from 'svelte';
  import { resolve } from '$app/paths';
  import { PUBLIC_BASE_URL } from '$app/env/public';
  import AppLogo from '#lib/components/AppLogo.svelte';
  import AppShell from '#lib/components/AppShell.svelte';
  import CollectionNav from '#lib/components/CollectionNav.svelte';
  import { gallerySection } from '#lib/storage/library-section.svelte.js';
  import Gallery from './Gallery.svelte';

  // Links from before the gallery had a page for each kind
  onMount(() => {
    if (page.url.searchParams.get('view') === 'yarn-palettes')
      goto(resolve('/gallery/palettes'), { replaceState: true });
    // The sidebar's Gallery link comes back to this side next time
    else gallerySection.value = 'projects';
  });
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
  <meta property="og:url" content="{PUBLIC_BASE_URL || ''}/gallery" />
  <meta property="og:type" content="website" />
</svelte:head>

<AppShell pageName="Project Gallery">
  {#snippet stickyHeader()}
    <div class="hidden lg:inline-flex"><AppLogo /></div>
  {/snippet}

  {#snippet main()}
    <main
      class="m-auto mb-8 flex max-w-(--breakpoint-xl) flex-col justify-start gap-2"
    >
      <h1 class="h1 text-gradient mt-4 text-center">Gallery</h1>
      <CollectionNav
        label="Gallery"
        current="projects"
        projectsHref={resolve('/gallery')}
        palettesHref={resolve('/gallery/palettes')}
      />
      <Gallery />
    </main>
  {/snippet}
</AppShell>

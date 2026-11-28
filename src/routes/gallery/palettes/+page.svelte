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
  import { resolve } from '$app/paths';
  import { PUBLIC_BASE_URL } from '$app/env/public';
  import AppShell from '#lib/components/AppShell.svelte';
  import { PAGE, PAGE_WIDE } from '#lib/constants/class-constants.js';
  import CollectionNav from '#lib/components/CollectionNav.svelte';
  import YarnPaletteGallery from '#lib/components/YarnPaletteGallery.svelte';
  import { gallerySection } from '#lib/storage/library-section.svelte.js';
  import { replaceState } from '$app/navigation';
  import { page } from '$app/state';
  import { galleryFilters } from '#lib/state/gallery-state.svelte.js';
  import { showsStarred, withoutStarred } from '#lib/state/library-scope.js';
  import { onMount } from 'svelte';

  // Starred from the link, before the gallery asks for its first page
  const starredLink = showsStarred(page.url);
  if (starredLink) galleryFilters.starred = true;

  onMount(() => {
    // The sidebar's Gallery link comes back to this side next time
    gallerySection.value = 'palettes';
    if (starredLink) replaceState(withoutStarred(page.url), page.state);
  });
</script>

<svelte:head>
  <title>Temperature Blanket Yarn Palette Gallery</title>
  <meta
    name="description"
    content="Browse a collection of yarn palettes from user-created projects."
  />

  <meta
    property="og:title"
    content="Temperature Blanket Yarn Palette Gallery"
  />
  <meta
    property="og:description"
    content="Browse a collection of yarn palettes from user-created projects."
  />
  <meta property="og:url" content="{PUBLIC_BASE_URL || ''}/gallery/palettes" />
  <meta property="og:type" content="website" />
</svelte:head>

<AppShell pageName="Yarn Palette Gallery">
  {#snippet main()}
    <main class={[PAGE, PAGE_WIDE, 'mb-8 flex flex-col justify-start gap-2']}>
      <h1 class="h1 text-gradient mt-4">Gallery</h1>
      <CollectionNav
        label="Gallery"
        current="palettes"
        projectsHref={resolve('/gallery')}
        palettesHref={resolve('/gallery/palettes')}
      />
      <YarnPaletteGallery />
    </main>
  {/snippet}
</AppShell>

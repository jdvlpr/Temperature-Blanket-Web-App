<!-- Copyright (c) 2026, Thomas (https://github.com/jdvlpr)

This file is part of Temperature-Blanket-Web-App.

Temperature-Blanket-Web-App is free software: you can redistribute it and/or modify it
under the terms of the GNU General Public License as published by the Free Software Foundation,
either version 3 of the License, or (at your option) any later version.

Temperature-Blanket-Web-App is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY;
without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.
See the GNU General Public License for more details.

You should have received a copy of the GNU General Public License along with Temperature-Blanket-Web-App.
If not, see <https://www.gnu.org/licenses/>. -->

<!-- My Library's Projects page: every saved project (and signed in, ones only
in the gallery), with search, filters and sort once there are a few. -->

<script lang="ts">
  import { browser } from '$app/env';
  import { beforeNavigate, goto } from '$app/navigation';
  import { resolve } from '$app/paths';
  import { PUBLIC_BASE_URL } from '$app/env/public';
  import { account } from '#lib/accounts/summary.svelte.js';
  import { galleryPages } from '#lib/accounts/gallery-pages.svelte.js';
  import AppLogo from '#lib/components/AppLogo.svelte';
  import AppShell from '#lib/components/AppShell.svelte';
  import CollectionToolbar from '#lib/components/CollectionToolbar.svelte';
  import LocalProjects from '#lib/components/LocalProjects.svelte';
  import MyLibrary from '#lib/components/MyLibrary.svelte';
  import LibraryStatusMenu from '#lib/components/LibraryStatusMenu.svelte';
  import { libraryFilters } from '#lib/state/library-filters.svelte.js';
  import { preferences } from '#lib/storage/preferences.svelte.js';
  import { FILTERS_FROM, LIBRARY_SORTS } from '#lib/utils/collection-filter.js';
  import { loadedInPlace } from '#lib/utils/open-saved-project.js';
  import { PlusIcon } from '@lucide/svelte';
  import { onMount } from 'svelte';

  let total = $state<number | null>(null);
  let matching = $state(0);

  const signedIn = $derived(
    __ACCOUNTS_ENABLED__ && Boolean(account.summary?.id),
  );

  // Links from before palettes had their own page
  onMount(() => {
    if (window.location.hash === '#palettes')
      goto(resolve('my-palettes'), { replaceState: true });
  });

  // A project loaded here behind Send to Gallery stays in the app's state, so
  // the next page starts fresh, not with that project's gauges
  beforeNavigate((navigation) => {
    if (!loadedInPlace() || navigation.willUnload || !navigation.to) return;
    if (navigation.to.url.pathname === window.location.pathname) return;
    navigation.cancel();
    window.location.assign(navigation.to.url.href);
  });
</script>

<svelte:head>
  <title>My Projects</title>
  <meta name="description" content="Your saved temperature blanket projects" />
  <meta name="robots" content="noindex" />

  <meta property="og:title" content="My Projects" />
  <meta
    property="og:description"
    content="Your saved temperature blanket projects"
  />
  <meta property="og:url" content="{PUBLIC_BASE_URL}/my-projects" />
  <meta property="og:type" content="website" />
</svelte:head>

<AppShell pageName="My Library">
  {#snippet stickyHeader()}
    <div class="hidden lg:inline-flex"><AppLogo /></div>
  {/snippet}
  {#snippet main()}
    <MyLibrary current="projects" currentTotal={total}>
      {#if browser}
        {@const showFilters =
          (total ?? 0) > FILTERS_FROM ||
          libraryFilters.activeFor('projects') ||
          libraryFilters.sort !== 'recent' ||
          libraryFilters.reversed}
        <CollectionToolbar
          kind="project"
          yarn={false}
          searchIcon="search"
          searchLabel="Search Projects"
          searchPlaceholder="Name or place"
          bind:search={libraryFilters.search}
          bind:patternType={libraryFilters.patternType}
          sortOptions={LIBRARY_SORTS}
          sort={libraryFilters.sort}
          onsort={(sort) => (libraryFilters.sort = sort)}
          reversed={libraryFilters.reversed}
          onreverse={(reversed) => (libraryFilters.reversed = reversed)}
          bind:layout={
            () => preferences.value.myProjectsLayout ?? 'grid',
            (layout) => (preferences.value.myProjectsLayout = layout)
          }
          {showFilters}
        >
          {#snippet menus()}
            {#if signedIn && galleryPages.shown}<LibraryStatusMenu />{/if}
          {/snippet}
          {#snippet actions()}
            <!-- A full load: the project open before stays loaded otherwise -->
            <a
              href={resolve('/')}
              class="btn hover:preset-tonal-surface"
              data-sveltekit-reload
            >
              <PlusIcon />
              New Project
            </a>
          {/snippet}
        </CollectionToolbar>
        <p class="text-surface-700-300 text-center text-sm" aria-live="polite">
          {#if libraryFilters.activeFor('projects') && total}
            {matching} of {total} projects
          {/if}
        </p>
        <LocalProjects
          onMyProjectsPage
          filters={libraryFilters}
          oncount={(count) => ({ total, matching } = count)}
        />
      {/if}
    </MyLibrary>
  {/snippet}
</AppShell>

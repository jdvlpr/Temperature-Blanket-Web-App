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
  import { browser } from '$app/environment';
  import { goto } from '$app/navigation';
  import { page } from '$app/state';
  import { PUBLIC_BASE_URL } from '$env/static/public';
  import AppLogo from '$lib/components/AppLogo.svelte';
  import AppShell from '$lib/components/AppShell.svelte';
  import { NotebookPenIcon, SwatchBookIcon } from '@lucide/svelte';
  import { SegmentedControl } from '@skeletonlabs/skeleton-svelte';
  import Gallery from './Gallery.svelte';
  import YarnPaletteGallery from './YarnPaletteGallery.svelte';

  // Use URL hash to set initial view but default to 'projects'
  let view = $state('projects');

  $effect(() => {
    if (browser && page.url.searchParams.get('view') === 'yarn-palettes') {
      view = 'yarn-palettes';
    } else if (browser && page.url.searchParams.get('view') === 'projects') {
      view = 'projects';
    }
  });
</script>

<svelte:head>
  <title
    >Temperature Blanket {view === 'projects' ? 'Project' : 'Yarn Palette'} Gallery</title
  >
  <meta
    name="description"
    content={view === 'projects'
      ? 'Browse a collection of temperature blanket projects.'
      : 'Browse a collection of yarn palettes from user-created projects.'}
  />

  <meta
    property="og:title"
    content="Temperature Blanket {view === 'projects'
      ? 'Project'
      : 'Yarn Palette'} Gallery"
  />
  <meta
    property="og:description"
    content={view === 'projects'
      ? 'Browse a collection of temperature blanket projects.'
      : 'Browse a collection of yarn palettes from user-created projects.'}
  />
  <meta
    property="og:url"
    content="{PUBLIC_BASE_URL || ''}/gallery?view={view}"
  />
  <meta property="og:type" content="website" />
</svelte:head>

<AppShell pageName="{view === 'projects' ? 'Project' : 'Yarn Palette'} Gallery">
  {#snippet stickyHeader()}
    <div class="mx-auto hidden lg:inline-flex"><AppLogo /></div>
  {/snippet}

  {#snippet main()}
    <main
      class="m-auto mb-8 flex max-w-(--breakpoint-xl) flex-col justify-start gap-2"
    >
      <h2 class="h2 text-gradient text-center">Gallery</h2>
      <div class="mx-auto w-full max-w-sm px-2">
        <SegmentedControl
          value={view}
          onValueChange={(e) => {
            view = e.value;
            // Optionally update search params so links can be shared to specific views
            if (browser) {
              goto(`?view=${e.value}`);
            }
          }}
        >
          <SegmentedControl.Control
            class="bg-surface-100 dark:bg-surface-900 rounded-container border-0 shadow-sm"
          >
            <SegmentedControl.Indicator />
            <SegmentedControl.Item value={'projects'}>
              <SegmentedControl.ItemText
                ><div class="flex items-center justify-center gap-1">
                  <NotebookPenIcon />
                  <span class="">Projects</span>
                </div></SegmentedControl.ItemText
              >
              <SegmentedControl.ItemHiddenInput />
            </SegmentedControl.Item>
            <SegmentedControl.Item value={'yarn-palettes'}>
              <SegmentedControl.ItemText
                ><div class="flex items-center justify-center gap-1">
                  <SwatchBookIcon />
                  <span class=""
                    ><span class="max-sm:hidden">Yarn</span> Palettes</span
                  >
                </div></SegmentedControl.ItemText
              >
              <SegmentedControl.ItemHiddenInput />
            </SegmentedControl.Item>
          </SegmentedControl.Control>
        </SegmentedControl>
      </div>

      {#if view === 'projects'}
        <Gallery />
      {:else}
        <YarnPaletteGallery />
      {/if}
    </main>
  {/snippet}
</AppShell>

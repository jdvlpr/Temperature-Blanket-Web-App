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

<!-- Someone's gallery ("Ada’s Gallery"; their own is Your Gallery): every
gallery page and palette they published from their account with their name,
linked from "By <name>" on their gallery pages: their projects and their yarn
palettes, each on a page of its own. -->

<script lang="ts">
  import { resolve } from '$app/paths';
  import { page } from '$app/state';
  import AppLogo from '#lib/components/AppLogo.svelte';
  import AppShell from '#lib/components/AppShell.svelte';
  import CollectionNav from '#lib/components/CollectionNav.svelte';
  import { ArrowLeftIcon } from '@lucide/svelte';
  import type { Snippet } from 'svelte';
  import type { LayoutData } from './$types';
  import { ownerFilters } from './owner-filters.svelte.js';

  let { data, children }: { data: LayoutData; children: Snippet } = $props();

  const current = $derived(
    page.url.pathname.endsWith('/palettes') ? 'palettes' : 'projects',
  );
  const ownerId = $derived(page.params.ownerId ?? '');
  // Another person's pages start with no filters
  $effect.pre(() => ownerFilters.forOwner(ownerId));
</script>

<AppShell pageName="Gallery">
  {#snippet stickyHeader()}
    <div class="hidden lg:inline-flex"><AppLogo /></div>
  {/snippet}
  {#snippet main()}
    <main
      class="m-auto flex w-full max-w-(--breakpoint-xl) flex-col justify-start gap-4 pb-8"
    >
      <a
        href={resolve('/gallery')}
        class="btn hover:preset-tonal-surface mx-2 mt-2 flex w-fit items-center lg:mx-0 lg:mt-0"
      >
        <ArrowLeftIcon />
        Gallery</a
      >
      <h1 class="h2 text-gradient px-2 text-center">
        {data.name}’s Gallery
      </h1>
      <CollectionNav
        label="Gallery pages by {data.name}"
        {current}
        projectsHref={resolve('/gallery/by/[ownerId]', { ownerId })}
        palettesHref={resolve('/gallery/by/[ownerId]/palettes', { ownerId })}
        projectsCount={data.postIds.length}
        palettesCount={data.paletteIds.length}
      />
      {@render children()}
    </main>
  {/snippet}
</AppShell>

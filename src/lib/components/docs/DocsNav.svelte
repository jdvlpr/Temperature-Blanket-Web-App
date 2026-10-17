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

<!-- The Contents sheet, from the top bar's Contents button: this page's
sections first, then every page of Guides & Help, the current one marked.
Choosing a link closes it (onNavigate). -->

<script lang="ts">
  import { page } from '$app/state';
  import OnThisPage from '#lib/components/docs/OnThisPage.svelte';
  import {
    DOCS_TITLE,
    GUIDES,
    REFERENCE,
    docsHref,
    docsPageAt,
  } from '#lib/docs/docs-index.js';

  let { onNavigate }: { onNavigate?: () => void } = $props();

  const pathname = $derived(page.url.pathname.replace(/\/$/, ''));
  const current = $derived(docsPageAt(pathname));

  const LINK =
    'block rounded-base px-3 py-1.5 hover:bg-surface-200-800 transition-colors';
  const CURRENT = 'bg-surface-200-800 font-bold';
</script>

<div class="flex flex-col gap-6 px-2 pb-6">
  <OnThisPage
    heading={`On this page · ${current?.title ?? DOCS_TITLE}`}
    {onNavigate}
  />

  <nav aria-label={DOCS_TITLE} class="flex flex-col gap-4 text-sm">
    <a
      href="/documentation"
      class={[LINK, pathname === '/documentation' && CURRENT]}
      aria-current={pathname === '/documentation' ? 'page' : undefined}
      onclick={onNavigate}>All {DOCS_TITLE}</a
    >
    {#each [{ heading: 'Guides', pages: GUIDES }, { heading: 'Reference', pages: REFERENCE }] as { heading, pages } (heading)}
      <div class="flex flex-col gap-1">
        <h2 class="px-3 font-bold opacity-80">{heading}</h2>
        <ul class="flex flex-col">
          {#each pages as docsPage (docsPage.slug)}
            {@const href = docsHref(docsPage)}
            <li>
              <a
                {href}
                class={[LINK, pathname === href && CURRENT]}
                aria-current={pathname === href ? 'page' : undefined}
                onclick={onNavigate}>{docsPage.title}</a
              >
            </li>
          {/each}
        </ul>
      </div>
    {/each}
  </nav>
</div>

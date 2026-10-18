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

<!-- One line above each page, once, for people who used the site before
version 7: what's new, until it's dismissed or What's New is opened (see
$lib/storage/whats-new). With accounts on it points to the version 7 blog post,
else to the changelog. -->

<script lang="ts">
  import { page } from '$app/state';
  import { VERSION_7_POST_HREF } from '#lib/constants/version-7-post.js';
  import { whatsNew } from '#lib/storage/whats-new.svelte.js';
  import { isThumbnailFrame } from '#lib/storage/thumbnails.js';
  import { SparklesIcon, XIcon } from '@lucide/svelte';
  import { onMount } from 'svelte';

  const href = __ACCOUNTS_ENABLED__ ? VERSION_7_POST_HREF : '/changelog';

  // Only after loading: the server can't know whether it's been seen
  let mounted = $state(false);
  onMount(() => (mounted = !isThumbnailFrame()));

  // Reading what's new counts as seeing it
  $effect(() => {
    const path = page.url.pathname;
    if (path === '/changelog' || path === VERSION_7_POST_HREF)
      whatsNew.markSeen();
  });
</script>

{#if mounted && whatsNew.show}
  <aside
    class="bg-surface-100-900 rounded-container mb-2 flex items-center gap-2 py-1 pr-1 pl-4 text-sm max-lg:m-2"
    aria-label="What's new"
  >
    <p class="min-w-0 flex-1">
      <span class="font-bold">Version 7 is here</span><span
        class="max-sm:hidden"
        >: {__ACCOUNTS_ENABLED__
          ? 'Accounts, My Library & a New Look'
          : 'My Library & a New Look'}</span
      >
      <!-- eslint-disable-next-line svelte/no-navigation-without-resolve -- a constant path -->
      <a
        {href}
        class="anchor whitespace-nowrap"
        onclick={() => whatsNew.markSeen()}
        >What’s new<span class="sr-only"> in version 7</span></a
      >
    </p>
    <button
      type="button"
      class="btn-icon hover:preset-tonal-surface shrink-0"
      aria-label="Dismiss what's new"
      title="Dismiss"
      onclick={() => whatsNew.markSeen()}
    >
      <XIcon aria-hidden="true" />
    </button>
  </aside>
{/if}

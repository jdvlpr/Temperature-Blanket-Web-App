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

<!-- Preferences › Blocked: the people blocked on the gallery, each by the page
they were blocked from (never their name: the page may be anonymous), with
Unblock. Signed in, the account's; signed out, this browser's. Hidden until
someone's blocked. -->

<script lang="ts">
  import { resolve } from '$app/paths';
  import {
    galleryBlocks,
    type GalleryBlock,
  } from '#lib/accounts/gallery-blocks.svelte.js';
  import { account } from '#lib/accounts/summary.svelte.js';
  import { unblock } from '#lib/utils/gallery-report.js';
  import { tick } from 'svelte';

  let blocks = $state<GalleryBlock[] | null>(null);
  let heading = $state<HTMLElement>();

  async function load() {
    try {
      blocks = await galleryBlocks.list();
    } catch {
      blocks = null;
    }
  }

  $effect(() => {
    void account.summary?.id;
    void load();
  });

  async function remove(block: GalleryBlock) {
    await unblock(block.postId);
    await load();
    // The row is gone: focus stays in the section
    await tick();
    heading?.focus();
  }

  const pageHref = (block: GalleryBlock) =>
    block.kind === 'palette'
      ? resolve('/gallery/palette/[id]', { id: String(block.postId) })
      : resolve('/gallery/[id]', { id: String(block.postId) });
</script>

{#if blocks?.length}
  <section class="flex flex-col gap-2" aria-labelledby="preferences-blocked">
    <h3
      id="preferences-blocked"
      class="px-2 text-sm font-bold opacity-70"
      tabindex="-1"
      bind:this={heading}
    >
      Blocked
    </h3>
    <ul
      class="bg-surface-100 dark:bg-surface-900 rounded-container divide-surface-200-800 flex flex-col divide-y border border-gray-300 dark:border-gray-700"
    >
      {#each blocks as block (block.postId)}
        <li class="flex items-center gap-3 px-4 py-3">
          <div class="flex min-w-0 flex-1 flex-col">
            <span class="text-sm opacity-80">Blocked from</span>
            <a href={pageHref(block)} class="link truncate"
              >{block.title || 'A gallery page'}</a
            >
          </div>
          <button
            type="button"
            class="btn btn-sm preset-tonal shrink-0"
            onclick={() => remove(block)}
            aria-label="Unblock the person blocked from {block.title ||
              'this gallery page'}">Unblock</button
          >
        </li>
      {/each}
    </ul>
    <p class="px-2 text-sm opacity-80">
      Their pages don’t show in the Gallery, on the globe or in Popular. They
      aren’t told.
    </p>
  </section>
{/if}

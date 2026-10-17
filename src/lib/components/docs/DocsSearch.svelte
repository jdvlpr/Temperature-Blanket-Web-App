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

<!-- Search Guides & Help: the pages that match first (by title and everyday
keywords), then pages with the words anywhere in them. The results are
plain links after the field, so Tab reaches them; Enter in the field opens
the first. How many were found is announced as it changes. -->

<script lang="ts">
  import { goto } from '$app/navigation';
  import {
    CARD_BOX,
    CARD_HOVER,
    FIELD_ICON,
  } from '#lib/constants/class-constants.js';
  import { docsHref } from '#lib/docs/docs-index.js';
  import {
    keywordSearch,
    textSearch,
    type TextResult,
  } from '#lib/docs/docs-search.js';
  import { SearchIcon } from '@lucide/svelte';

  let query = $state('');
  let text = $state<TextResult[]>([]);
  let searching = $state(false);

  const pages = $derived(keywordSearch(query));
  const trimmed = $derived(query.trim());
  const count = $derived(pages.length + text.length);

  // The full text waits for a pause in typing, and only the latest search
  // counts
  let timer: ReturnType<typeof setTimeout> | undefined;
  let latest = 0;
  $effect(() => {
    const current = trimmed;
    const skip = pages;
    clearTimeout(timer);
    text = [];
    if (current.length < 2) {
      searching = false;
      return;
    }
    searching = true;
    const run = ++latest;
    timer = setTimeout(async () => {
      const found = await textSearch(current, skip);
      if (run !== latest) return;
      text = found;
      searching = false;
    }, 250);
    return () => clearTimeout(timer);
  });

  function openFirst(event: SubmitEvent) {
    event.preventDefault();
    const first = pages[0] ? docsHref(pages[0]) : text[0]?.url;
    if (first) goto(first);
  }
</script>

<search class="flex flex-col gap-3">
  <form onsubmit={openFirst} class="relative">
    <label for="docs-search" class="sr-only">Search Guides & Help</label>
    <SearchIcon class={[FIELD_ICON, 'top-1/2 -translate-y-1/2 opacity-60']} />
    <input
      id="docs-search"
      type="search"
      class="input pl-11"
      placeholder="Search, e.g. “wrong temperature” or “backup”"
      autocomplete="off"
      aria-describedby="docs-search-status"
      bind:value={query}
    />
  </form>

  <p id="docs-search-status" class="sr-only" aria-live="polite">
    {#if trimmed && !searching}
      {count ? `${count} ${count === 1 ? 'result' : 'results'}` : 'No results'}
    {/if}
  </p>

  {#if trimmed}
    {#if pages.length || text.length}
      <ul class="flex flex-col gap-2">
        {#each pages as page (page.slug)}
          <li>
            <a
              href={docsHref(page)}
              class={[CARD_BOX, CARD_HOVER, 'flex flex-col gap-1 px-3']}
            >
              <span class="font-bold">{page.title}</span>
              <span class="text-sm opacity-80">{page.summary}</span>
            </a>
          </li>
        {/each}
        {#each text as result (result.url)}
          <li>
            <a
              href={result.url}
              class={[CARD_BOX, CARD_HOVER, 'flex flex-col gap-1 px-3']}
            >
              <span class="font-bold">{result.title}</span>
              <!-- Pagefind's excerpt of this site's own pages, with the
              words found in <mark> -->
              <!-- eslint-disable-next-line svelte/no-at-html-tags -->
              <span class="text-sm opacity-80">{@html result.excerpt}</span>
            </a>
          </li>
        {/each}
      </ul>
    {:else if !searching}
      <p class="opacity-80">
        Nothing found for “{trimmed}”. Try other words, or
        <a href="/contact" class="link">ask a question</a>.
      </p>
    {/if}
  {/if}
</search>

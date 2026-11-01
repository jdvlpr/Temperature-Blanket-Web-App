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

<!-- What's New: one chapter for each major version, newest first. A chapter
with a release post starts with its card (ReleaseCard) and the x.0.0 notes
as What's in N.0; then come that version's other changes by month. Changes from
before version 3 are under Earlier. Each change keeps its version as its id
(/whats-new#5.2.35), and each chapter is #v<major>. Once /blog and
/changelog: both redirect here (the root _redirects). -->

<script lang="ts">
  import { browser } from '$app/env';
  import {
    PUBLIC_BASE_DOMAIN_NAME,
    PUBLIC_BASE_URL,
    PUBLIC_GITHUB_LINK,
  } from '$app/env/public';
  import AppShell from '#lib/components/AppShell.svelte';
  import { PAGE, PAGE_TEXT } from '#lib/constants/class-constants.js';
  import ChangelogItem from '#lib/components/ChangelogItem.svelte';
  import ToTopButton from '#lib/components/buttons/ToTopButton.svelte';
  import type { ChangelogItem as Item } from '#lib/types/page-types.js';
  import { onMount } from 'svelte';
  import ReleaseCard from './ReleaseCard.svelte';
  import { entries } from './changelog';
  import { RELEASES, type Release } from './releases.js';

  type Chapter = {
    id: string;
    heading: string;
    release?: Release;
    /** The x.0.0 change, shown in the release card */
    first?: Item;
    months: { label: string; items: Item[] }[];
  };

  const EARLIEST_CHAPTER = 3;

  const chapters: Chapter[] = [];
  for (const { year, months } of entries) {
    for (const { month, items } of months) {
      for (const item of items) {
        const major = Number(item.version?.split('.')[0]);
        const key = major >= EARLIEST_CHAPTER ? major : null;
        const id = key ? `v${key}` : 'earlier';
        let chapter = chapters.find((c) => c.id === id);
        if (!chapter) {
          chapter = {
            id,
            heading: key ? `Version ${key}` : 'Earlier',
            release: RELEASES.find((r) => r.major === key),
            months: [],
          };
          chapters.push(chapter);
        }
        if (chapter.release && item.version === `${key}.0.0`) {
          chapter.first = item;
          continue;
        }
        const label = `${month} ${year}`;
        const sameMonth = chapter.months.find((m) => m.label === label);
        if (sameMonth) sameMonth.items.push(item);
        else chapter.months.push({ label, items: [item] });
      }
    }
  }

  let container: HTMLElement | undefined = $state();
  let showScrollToTopButton = $state(false);

  onMount(() => {
    if (!browser || !container) return;
    const observer = new IntersectionObserver((entries) => {
      showScrollToTopButton = !entries[0].isIntersecting;
    });
    observer.observe(container);
    return () => observer.disconnect();
  });
</script>

<svelte:head>
  <title>What's New</title>
  <meta
    name="description"
    content="Release posts and every change to {PUBLIC_BASE_DOMAIN_NAME}, version by version."
  />
  <meta property="og:title" content="What's New" />
  <meta
    property="og:description"
    content="Release posts and every change to {PUBLIC_BASE_DOMAIN_NAME}, version by version."
  />
  <meta property="og:url" content="{PUBLIC_BASE_URL}/whats-new" />
  <meta property="og:type" content="website" />
</svelte:head>

<AppShell pageName="What's New">
  {#snippet main()}
    <main class={[PAGE, PAGE_TEXT, 'mt-2 mb-6 flex flex-col gap-8']}>
      <header class="flex flex-col gap-3" bind:this={container}>
        <h1 class="h2 text-gradient mt-2">What's New</h1>
        <p class="text-surface-700-300 text-sm">
          Each version's release post, then its changes. To see every change,
          <a
            href="{PUBLIC_GITHUB_LINK}/commits/main/"
            class="link"
            target="_blank">visit the GitHub repository</a
          >.
        </p>
        <nav
          aria-label="Versions"
          class="flex flex-wrap items-center gap-1 text-sm"
        >
          <span class="mr-1 opacity-80">Jump to</span>
          {#each chapters as { id, heading } (id)}
            <a href="#{id}" class="btn btn-sm preset-tonal-surface">{heading}</a
            >
          {/each}
        </nav>
      </header>

      {#each chapters as { id, heading, release, first, months } (id)}
        <section {id} class="flex scroll-mt-24 flex-col gap-4">
          {#if release}
            <ReleaseCard {release} />
          {:else}
            <h2 class="h3">{heading}</h2>
          {/if}
          {#if first}
            <h3 class="text-xl font-bold">What's in {release?.major}.0</h3>
            <ChangelogItem version={first.version} notes={first.notes} />
          {/if}
          {#each months as { label, items } (label)}
            <h3 class="text-xl font-bold">{label}</h3>
            <div class="flex w-full flex-col gap-4">
              {#each items as { version, notes }, i (i)}
                <ChangelogItem {version} {notes} />
              {/each}
            </div>
          {/each}
        </section>
      {/each}
    </main>
  {/snippet}
</AppShell>

{#if showScrollToTopButton}
  <ToTopButton
    onClick={() =>
      container?.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      })}
  />
{/if}

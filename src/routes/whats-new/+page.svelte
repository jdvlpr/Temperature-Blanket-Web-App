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

<!-- What's New: every change by month, newest first. Each major version's
release post is one of them (built from releases.ts, dated by the post), linking
to the post. Each change keeps its version as its id (/whats-new#5.2.35), and a
release post's item is also #v<major>, where the posts link back. Once /blog and
/changelog: both redirect here (the root _redirects). -->

<script lang="ts">
  import { browser } from '$app/env';
  import { page } from '$app/state';
  import {
    PUBLIC_BASE_DOMAIN_NAME,
    PUBLIC_BASE_URL,
    PUBLIC_GITHUB_LINK,
  } from '$app/env/public';
  import AppShell from '#lib/components/AppShell.svelte';
  import { PAGE, PAGE_TEXT } from '#lib/constants/class-constants.js';
  import ChangelogItem from '#lib/components/ChangelogItem.svelte';
  import ToTopButton from '#lib/components/buttons/ToTopButton.svelte';
  import {
    CHANGELOG_TAG_PARAM,
    CHANGELOG_TAGS,
    changelogHref,
    changelogTagOf,
  } from '#lib/constants/changelog-tags.js';
  import type { ChangelogItem as Item } from '#lib/types/page-types.js';
  import { RocketIcon } from '@lucide/svelte';
  import { onMount } from 'svelte';
  import { entries } from './changelog';
  import { RELEASES } from './releases.js';

  const MONTHS = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ];

  type Month = { label: string; order: number; items: Item[] };

  /** Newer versions first */
  const byVersion = (a?: string, b?: string) => {
    const pa = (a ?? '').split('.').map(Number);
    const pb = (b ?? '').split('.').map(Number);
    for (let i = 0; i < 3; i++)
      if ((pa[i] || 0) !== (pb[i] || 0)) return (pb[i] || 0) - (pa[i] || 0);
    return 0;
  };

  const months: Month[] = [];
  const monthOf = (year: number, month: string) => {
    const label = `${month} ${year}`;
    let found = months.find((m) => m.label === label);
    if (!found) {
      found = { label, order: year * 12 + MONTHS.indexOf(month), items: [] };
      months.push(found);
    }
    return found;
  };
  for (const { year, months: yearMonths } of entries)
    for (const { month, items } of yearMonths)
      monthOf(year, month).items.push(...items);

  const releaseVersions = new Set(RELEASES.map((r) => `${r.major}.0.0`));
  for (const release of RELEASES) {
    const [year, month] = release.date.split('-').map(Number);
    const version = `${release.major}.0.0`;
    const { items } = monthOf(year, MONTHS[month - 1]);
    const item: Item = {
      version,
      notes: [
        {
          IconComponent: RocketIcon,
          tag: 'release',
          title: release.title,
          text: release.summary,
          instructions: `<a href="/whats-new/${release.slug}" class="link">Read the release post</a>`,
        },
      ],
    };
    const at = items.findIndex(
      (other) => byVersion(version, other.version) < 0,
    );
    items.splice(at === -1 ? items.length : at, 0, item);
  }
  months.sort((a, b) => b.order - a.order);

  // The page is prerendered, so the address is read only in the browser
  const show = $derived(
    browser
      ? changelogTagOf(page.url.searchParams.get(CHANGELOG_TAG_PARAM))
      : undefined,
  );

  // Only notes of the kind shown, without versions or months left empty
  const shown = $derived(
    show
      ? months
          .map((month) => ({
            ...month,
            items: month.items
              .map((item) => ({
                ...item,
                notes: item.notes.filter((note) => note.tag === show),
              }))
              .filter((item) => item.notes.length),
          }))
          .filter((month) => month.items.length)
      : months,
  );

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
    content="Every change to {PUBLIC_BASE_DOMAIN_NAME}, month by month, with each version's release post."
  />
  <meta property="og:title" content="What's New" />
  <meta
    property="og:description"
    content="Every change to {PUBLIC_BASE_DOMAIN_NAME}, month by month, with each version's release post."
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
          Changes to the site, newest first. To see every change,
          <a
            href="{PUBLIC_GITHUB_LINK}/commits/main/"
            class="link"
            target="_blank">visit the GitHub repository</a
          >.
        </p>
        <nav aria-label="Kinds of change">
          <ul class="flex flex-wrap gap-2">
            {#each [{ tag: undefined, label: 'All' }, ...CHANGELOG_TAGS] as { tag, label } (label)}
              {@const current = show === tag}
              <li class="flex">
                <a
                  href={changelogHref(tag)}
                  data-sveltekit-noscroll
                  data-sveltekit-replacestate
                  aria-current={current ? 'page' : undefined}
                  class={[
                    'btn btn-sm',
                    current ? 'preset-filled' : 'preset-tonal',
                  ]}>{label}</a
                >
              </li>
            {/each}
          </ul>
        </nav>
      </header>

      {#each shown as { label, items } (label)}
        <section class="flex flex-col gap-4">
          <h2 class="text-xl font-bold">{label}</h2>
          <div class="flex w-full flex-col gap-4">
            {#each items as { version, notes }, i (i)}
              {#if version && releaseVersions.has(version)}
                <!-- Where the release posts link back to -->
                <span id="v{version.split('.')[0]}" class="-mb-4 scroll-mt-24"
                ></span>
              {/if}
              <ChangelogItem {version} {notes} />
            {/each}
          </div>
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

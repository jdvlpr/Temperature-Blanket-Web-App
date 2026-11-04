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

<!-- Guides & Help: the index and every guide and reference page. A page here
is only its content; its title, description, breadcrumb, Previous/Next
and a guide's video all come from docs-index. On a guide or reference page, On this page (its
h2/h3 sections, the one being read marked) sits beside the page on wide
screens, with All Guides & Help; on smaller ones a bar under the top bar
names the section being read, and opens the Contents sheet, which holds
the same. A page with only a section or two has no On this page and no bar.
The index lists every page as cards, with nothing beside it and no bar.
Only the page's content (data-pagefind-body) goes into the search index. -->

<script lang="ts">
  import { page } from '$app/state';
  import { PUBLIC_BASE_URL } from '$app/env/public';
  import AppShell from '#lib/components/AppShell.svelte';
  import { PAGE_TEXT } from '#lib/constants/class-constants.js';
  import YouTubeVideo from '#lib/components/YouTubeVideo.svelte';
  import OnThisPageLayout from '#lib/components/docs/OnThisPageLayout.svelte';
  import {
    DOCS_PAGES,
    DOCS_TITLE,
    KIND_HEADINGS,
    docsHref,
    docsShareImage,
    docsPageAt,
  } from '#lib/docs/docs-index.js';
  import { ArrowLeftIcon, ArrowRightIcon } from '@lucide/svelte';

  let { children } = $props();

  const current = $derived(docsPageAt(page.url.pathname));
  const share = $derived(current && docsShareImage(current));
  const index = $derived(current ? DOCS_PAGES.indexOf(current) : -1);
  const previous = $derived(index > 0 ? DOCS_PAGES[index - 1] : undefined);
  const next = $derived(
    index >= 0 && index < DOCS_PAGES.length - 1
      ? DOCS_PAGES[index + 1]
      : undefined,
  );

  const title = $derived(
    current ? `${current.title} · ${DOCS_TITLE}` : DOCS_TITLE,
  );
  const description = $derived(
    current?.summary ??
      'Guides and help for planning a temperature blanket at temperature-blanket.com.',
  );
</script>

<svelte:head>
  <title>{title}</title>
  <meta name="description" content={description} />
  <meta property="og:title" content={title} />
  <meta property="og:description" content={description} />
  <meta
    property="og:url"
    content="{PUBLIC_BASE_URL}{current ? docsHref(current) : '/documentation'}"
  />
  <meta property="og:type" content="website" />
  {#if share}
    <meta property="og:image" content="{PUBLIC_BASE_URL}{share.src}" />
    <meta property="og:image:width" content={String(share.width)} />
    <meta property="og:image:height" content={String(share.height)} />
  {/if}
</svelte:head>

<AppShell pageName={DOCS_TITLE}>
  {#snippet main()}
    <!-- A page reads at a comfortable line length; the index's cards take the width -->
    <OnThisPageLayout
      track={!!current}
      title={current?.title ?? DOCS_TITLE}
      backHref="/documentation"
      backLabel="All {DOCS_TITLE}"
      class={['gap-6 pt-2', current && PAGE_TEXT]}
    >
      {#if current}
        <header class="flex flex-col gap-2" data-on-this-page-ignore>
          <a
            href="/documentation"
            class="text-sm opacity-80 hover:underline hover:opacity-100"
            >{DOCS_TITLE} › {KIND_HEADINGS[current.kind]}</a
          >
          <h1 class="h2 text-gradient" data-pagefind-meta="title">
            {current.title}
          </h1>
          <p class="text-lg opacity-80">{current.summary}</p>
        </header>
        {#if current.video}
          <div class="flex flex-col gap-2" data-on-this-page-ignore>
            <YouTubeVideo
              id={current.video.id}
              start={current.video.start}
              title={current.title}
            />
            <p class="text-sm opacity-80">
              Prefer reading? Every step is written out below.
            </p>
          </div>
        {/if}
        <article data-pagefind-body class="docs-content flex flex-col gap-6">
          {@render children()}
        </article>
        {#if previous || next}
          <nav
            aria-label="Previous and next pages"
            class="border-surface-200-800 mt-4 grid gap-2 border-t pt-4 sm:grid-cols-2"
            data-on-this-page-ignore
          >
            {#if previous}
              <a
                href={docsHref(previous)}
                class="btn hover:preset-tonal-surface h-auto justify-start py-2 text-left whitespace-normal"
              >
                <ArrowLeftIcon class="shrink-0" />
                <span class="flex flex-col">
                  <span class="text-sm opacity-80">Previous</span>
                  {previous.title}
                </span>
              </a>
            {/if}
            {#if next}
              <a
                href={docsHref(next)}
                class="btn hover:preset-tonal-surface h-auto justify-end py-2 text-right whitespace-normal sm:col-start-2"
              >
                <span class="flex flex-col">
                  <span class="text-sm opacity-80">Next</span>
                  {next.title}
                </span>
                <ArrowRightIcon class="shrink-0" />
              </a>
            {/if}
          </nav>
        {/if}
      {:else}
        <div class="contents">
          {@render children()}
        </div>
      {/if}
    </OnThisPageLayout>
  {/snippet}
</AppShell>

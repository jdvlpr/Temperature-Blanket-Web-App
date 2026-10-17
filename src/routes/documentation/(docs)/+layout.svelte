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
is only its content; its title, description, breadcrumb and Previous/Next
all come from docs-index. On this page (its h2/h3 sections, the one being
read marked) sits beside the page on wide screens; on smaller ones a bar
under the top bar names the section being read. Either way, the top bar's
Contents button (and that bar) open the Contents sheet: this page's
sections, then every page. Only the page's content (data-pagefind-body) goes
into the search index. -->

<script lang="ts">
  import { page } from '$app/state';
  import { PUBLIC_BASE_URL } from '$app/env/public';
  import AppLogo from '#lib/components/AppLogo.svelte';
  import AppShell from '#lib/components/AppShell.svelte';
  import DocsNav from '#lib/components/docs/DocsNav.svelte';
  import OnThisPage from '#lib/components/docs/OnThisPage.svelte';
  import {
    DOCS_PAGES,
    DOCS_TITLE,
    docsHref,
    docsPageAt,
  } from '#lib/docs/docs-index.js';
  import { onThisPage, trackSections } from '#lib/docs/on-this-page.svelte.js';
  import { dialog } from '#lib/state/page-state.svelte.js';
  import {
    ArrowLeftIcon,
    ArrowRightIcon,
    ChevronDownIcon,
    TableOfContentsIcon,
  } from '@lucide/svelte';

  let { children } = $props();

  const current = $derived(docsPageAt(page.url.pathname));
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

  function openContents() {
    dialog.trigger({
      type: 'component',
      component: {
        ref: DocsNav,
        props: { onNavigate: () => dialog.close() },
      },
      options: { title: 'Contents' },
    });
  }

  // How far down the top bars reach, so the section being read is the one
  // just below them, and a section's link scrolls its heading to just below
  let topBarHeight = $state(0);
  let sectionBarHeight = $state(0);
  $effect(() => {
    const bar = document.getElementById('top-navbar');
    if (!bar) return;
    const observer = new ResizeObserver(() => {
      topBarHeight = bar.offsetHeight;
    });
    observer.observe(bar);
    return () => observer.disconnect();
  });
  $effect(() => {
    onThisPage.offset = topBarHeight + sectionBarHeight;
  });
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
</svelte:head>

<AppShell pageName={DOCS_TITLE}>
  {#snippet stickyHeader()}
    <div class="hidden lg:inline-flex"><AppLogo /></div>
    <button
      type="button"
      class="btn hover:preset-tonal-surface my-2"
      onclick={openContents}
    >
      <TableOfContentsIcon />
      Contents
    </button>
  {/snippet}
  {#snippet main()}
    <!-- The section being read, below the wide screens' On this page -->
    {#if onThisPage.sections.length}
      <div
        class="bg-surface-50/80 dark:bg-surface-950/80 sticky z-10 px-2 py-1 backdrop-blur-md xl:hidden"
        style:top="{topBarHeight}px"
        bind:clientHeight={sectionBarHeight}
      >
        <button
          type="button"
          class="btn hover:preset-tonal-surface btn-sm w-full max-w-(--breakpoint-md) justify-start"
          onclick={openContents}
        >
          <TableOfContentsIcon />
          <span class="min-w-0 flex-1 truncate text-left">
            <span class="sr-only">On this page: </span>
            {onThisPage.currentSection?.text ?? 'On this page'}
          </span>
          <ChevronDownIcon />
        </button>
      </div>
    {/if}
    <div class="flex gap-8 px-2 pb-12 lg:px-0">
      <main
        class="mx-auto flex w-full max-w-(--breakpoint-md) min-w-0 flex-col gap-6 pt-2"
        style:--section-scroll-margin="{topBarHeight + sectionBarHeight + 16}px"
        {@attach trackSections()}
      >
        {#if current}
          <header class="flex flex-col gap-2" data-on-this-page-ignore>
            <a
              href="/documentation"
              class="text-sm opacity-80 hover:underline hover:opacity-100"
              >{DOCS_TITLE} › {current.kind === 'guide'
                ? 'Guides'
                : 'Reference'}</a
            >
            <h1 class="h2 text-gradient" data-pagefind-meta="title">
              {current.title}
            </h1>
            <p class="text-lg opacity-80">{current.summary}</p>
          </header>
          <article
            data-pagefind-body
            class="docs-content flex flex-col gap-6 [&_[id]]:scroll-mt-(--section-scroll-margin)"
          >
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
          <div class="contents [&_[id]]:scroll-mt-(--section-scroll-margin)">
            {@render children()}
          </div>
        {/if}
      </main>
      <aside
        class="sticky hidden h-fit w-56 shrink-0 [scrollbar-width:thin] overflow-y-auto pt-2 xl:block"
        style:top="{topBarHeight + 8}px"
        style:max-height="calc(100dvh - {topBarHeight + 16}px)"
      >
        <OnThisPage />
      </aside>
    </div>
  {/snippet}
</AppShell>

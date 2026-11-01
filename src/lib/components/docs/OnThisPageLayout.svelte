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

<!-- @component
  A page read from top to bottom with On this page: its h2 and h3 sections
  (on-this-page.svelte.ts) beside it on wide screens, under the link back to
  where it's listed; on smaller ones a bar under the top bar names the section
  being read and opens the same in the Contents sheet. Guides & Help pages and
  What's New's release posts. Without `track` (the Guides & Help index) it's
  only the page.
-->

<script lang="ts">
  import type { Snippet } from 'svelte';
  import type { ClassValue } from 'svelte/elements';
  import ContentsSheet from '#lib/components/docs/ContentsSheet.svelte';
  import OnThisPage from '#lib/components/docs/OnThisPage.svelte';
  import { PAGE } from '#lib/constants/class-constants.js';
  import { onThisPage, trackSections } from '#lib/docs/on-this-page.svelte.js';
  import { dialog } from '#lib/state/page-state.svelte.js';
  import {
    ArrowLeftIcon,
    ChevronDownIcon,
    TableOfContentsIcon,
  } from '@lucide/svelte';

  let {
    track = true,
    title,
    backHref,
    backLabel,
    class: mainClass,
    children,
  }: {
    track?: boolean;
    /** The page's title, in the Contents sheet's heading */
    title: string;
    backHref: string;
    backLabel: string;
    /** For the page's <main> */
    class?: ClassValue;
    children: Snippet;
  } = $props();

  function openContents() {
    dialog.trigger({
      type: 'component',
      component: {
        ref: ContentsSheet,
        props: {
          title,
          backHref,
          backLabel,
          onNavigate: () => dialog.close(),
        },
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
<div class={[PAGE, 'flex gap-8 pb-12']}>
  <main
    class={[
      'flex w-full min-w-0 flex-col [&_[id]]:scroll-mt-(--section-scroll-margin)',
      mainClass,
    ]}
    style:--section-scroll-margin="{topBarHeight + sectionBarHeight + 16}px"
    {@attach track ? trackSections() : undefined}
  >
    {@render children()}
  </main>
  {#if track}
    <aside
      class="sticky ml-auto hidden h-fit w-56 shrink-0 [scrollbar-width:thin] flex-col gap-4 overflow-y-auto pt-2 xl:flex"
      style:top="{topBarHeight + 8}px"
      style:max-height="calc(100dvh - {topBarHeight + 16}px)"
    >
      <OnThisPage />
      <a
        href={backHref}
        class="rounded-base hover:bg-surface-200-800 flex items-center gap-2 px-3 py-1.5 text-sm transition-colors"
        ><ArrowLeftIcon class="icon-sm" />{backLabel}</a
      >
    </aside>
  {/if}
</div>

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
  Share a project or palette, as one list of rows like the Project menu's:
  Copy Link (a copy anyone can open; yours never changes), then its gallery
  page: Publish to Gallery, or once published Edit Gallery Page (its status
  under it) with View beside it. Edit opens the dialog that updates the page,
  changes Anonymous and a project's Ravelry project, and unpublishes it.
  Publishing needs an account; signed out, Copy Link still works. Opened from
  a card's Share button and the planner's Project menu.
-->
<script lang="ts">
  import { resolve } from '$app/paths';
  import type { GalleryPage } from '#lib/accounts/gallery.js';
  import { galleryPages } from '#lib/accounts/gallery-pages.svelte.js';
  import { publishedOn } from '#lib/accounts/gallery-version.js';
  import { account } from '#lib/accounts/summary.svelte.js';
  import CopyIcon from '#lib/components/CopyIcon.svelte';
  import type { StoredProjectIndexItem } from '#lib/storage/projects.svelte.js';
  import { PANEL_LIST, PANEL_ROW } from '#lib/constants/class-constants.js';
  import { inAccount } from '#lib/utils/open-ravelry.js';
  import { copyToClipboard } from '#lib/utils/clipboard-utils.js';
  import { Flash } from '#lib/utils/feedback.svelte.js';
  import {
    ChevronRightIcon,
    ExternalLinkIcon,
    LinkIcon,
    LoaderCircleIcon,
    LogInIcon,
    PencilIcon,
    SendIcon,
  } from '@lucide/svelte';
  import { onMount, type Snippet } from 'svelte';

  let {
    kind,
    id,
    link,
    changed,
    onpublish,
    onedit,
    signInHref,
    ravelryItem,
    children,
  }: {
    kind: 'project' | 'palette';
    /** The saved project's or palette's ID, which its gallery page is of */
    id: string;
    /** Its name, as people see it */
    label: string;
    /** What Copy Link copies; none, no Link row */
    link?: string;
    /** Whether it changed since its page was published or updated */
    changed?: (page: GalleryPage) => boolean;
    /** Publishes it (opens the publish dialog) */
    onpublish?: () => void;
    /** Edits its page: update, Anonymous, Ravelry, Unpublish (opens the publish dialog) */
    onedit?: (page: GalleryPage) => void;
    /** Where Sign In goes, to come back here */
    signInHref?: string;
    /** A saved project, to tell whether it's in the account */
    ravelryItem?: StoredProjectIndexItem;
    /** More places it's shared, after the gallery */
    children?: Snippet;
  } = $props();

  const signedIn = $derived(__ACCOUNTS_ENABLED__ && !!account.summary);

  onMount(() => {
    // Fresh each time: it may have been published from elsewhere since
    if (signedIn) void galleryPages.load();
  });

  // Its page: the newest of this project or palette (each has one now)
  const page = $derived(
    galleryPages.pages
      .filter((p) => p.projectId === id && (p.kind ?? 'project') === kind)
      .sort((a, b) => b.publishedAt - a.publishedAt || b.postId - a.postId)[0],
  );
  const ownerName = $derived(
    (galleryPages.name ?? account.summary?.name ?? '').trim(),
  );
  const isChanged = $derived(Boolean(page && changed?.(page)));

  const pageHref = (p: GalleryPage) =>
    p.kind === 'palette'
      ? resolve('/gallery/palette/[id]', { id: String(p.postId) })
      : resolve('/gallery/[id]', { id: String(p.postId) });

  const linkCopied = new Flash();
  async function copyLink() {
    if (!link) return;
    if (
      await copyToClipboard(
        link,
        'Link copied',
        'Unable to copy to your clipboard',
      )
    )
      linkCopied.trigger();
  }

  // A row that only says something, as tall as the others
  const NOTE_ROW = 'flex min-h-12 items-center gap-3 px-4 py-2 text-sm';

  const status = $derived(
    !page
      ? 'Not published'
      : [
          `Published ${publishedOn(page.publishedAt)}`,
          page.updatedAt && `updated ${publishedOn(page.updatedAt)}`,
        ]
          .filter(Boolean)
          .join(', '),
  );
</script>

<div class="flex flex-col gap-6 p-4 text-left">
  <!-- One list, as the Project menu's: the link first (what most people
  share), then its gallery page -->
  <ul class={PANEL_LIST} aria-label="Share">
    {#if link}
      <li>
        <button type="button" class={PANEL_ROW} onclick={copyLink}>
          <CopyIcon
            copied={linkCopied.is()}
            icon={LinkIcon}
            class="shrink-0 opacity-70"
          />
          <span class="flex flex-1 flex-col">
            <span>Copy Link</span>
            <span class="text-xs opacity-70"
              >Anyone with the link gets their own copy. Yours stays as it is.</span
            >
          </span>
        </button>
      </li>
    {/if}

    {#if !signedIn}
      <li>
        <!-- eslint-disable svelte/no-navigation-without-resolve -- resolved by the opener -->
        <a
          class={PANEL_ROW}
          href={signInHref ?? resolve('/auth/sign-in')}
          data-sveltekit-reload
        >
          <LogInIcon class="shrink-0 opacity-70" aria-hidden="true" />
          <span class="flex flex-1 flex-col">
            <span>Sign In to Publish</span>
            <span class="text-xs opacity-70"
              >A free account lets you publish a public gallery page, then
              update or unpublish it any time.</span
            >
          </span>
        </a>
        <!-- eslint-enable svelte/no-navigation-without-resolve -->
      </li>
    {:else if !galleryPages.loaded}
      <li class={NOTE_ROW}>
        <LoaderCircleIcon
          class="shrink-0 animate-spin opacity-70"
          aria-hidden="true"
        />
        Checking the gallery…
      </li>
    {:else if !page}
      {#if kind === 'project' && ravelryItem && !inAccount(ravelryItem)}
        <!-- Its page follows the account's copy into and out of the Trash -->
        <li class={NOTE_ROW}>
          <SendIcon class="shrink-0 opacity-40" aria-hidden="true" />
          Add this project to your account first (Add to your account, at the top
          of My Projects), then publish it to the gallery.
        </li>
      {:else if galleryPages.publishing && onpublish}
        <li>
          <button
            type="button"
            class={PANEL_ROW}
            data-row="publish"
            onclick={onpublish}
          >
            <SendIcon class="shrink-0 opacity-70" aria-hidden="true" />
            <span class="flex flex-1 flex-col">
              <span>Publish to Gallery</span>
              <span class="text-xs opacity-70"
                >A public page anyone can find. You can update or unpublish it
                any time.</span
              >
            </span>
            <ChevronRightIcon
              class="icon-sm shrink-0 opacity-50"
              aria-hidden="true"
            />
          </button>
        </li>
      {:else}
        <li class={NOTE_ROW}>
          <SendIcon class="shrink-0 opacity-40" aria-hidden="true" />
          Publishing to the gallery is paused right now.
        </li>
      {/if}
    {:else}
      <!-- Edit, with its page beside it: two parts of one row -->
      <li class="divide-surface-200-800 flex divide-x">
        <button
          type="button"
          class={[PANEL_ROW, 'flex-1']}
          onclick={() => page && onedit?.(page)}
          disabled={!onedit}
          aria-describedby={isChanged
            ? 'share-gallery-status share-gallery-changed'
            : 'share-gallery-status'}
        >
          <PencilIcon class="shrink-0 opacity-70" aria-hidden="true" />
          <span class="flex flex-1 flex-col">
            <span>Edit Gallery Page</span>
            <span class="text-xs opacity-70" id="share-gallery-status"
              >{status} · {page.showOwner && ownerName
                ? `By ${ownerName}`
                : 'Anonymous'}</span
            >
            {#if isChanged}
              <span
                class="text-primary-800-200 text-xs font-bold"
                id="share-gallery-changed"
                >Changed since its page was last updated</span
              >
            {/if}
          </span>
          <ChevronRightIcon
            class="icon-sm shrink-0 opacity-50"
            aria-hidden="true"
          />
        </button>
        <a
          href={pageHref(page)}
          target="_blank"
          class={[
            PANEL_ROW,
            'w-auto shrink-0 flex-col justify-center gap-0.5 px-3 text-xs',
          ]}
          title="View Gallery Page"
          ><ExternalLinkIcon class="icon-sm opacity-70" aria-hidden="true" />
          <span class="opacity-80">View</span><span class="sr-only">
            Gallery Page (opens in a new tab)</span
          ></a
        >
      </li>
    {/if}
  </ul>

  {@render children?.()}
</div>

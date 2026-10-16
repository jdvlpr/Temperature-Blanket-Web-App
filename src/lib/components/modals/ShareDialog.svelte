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
  Share a project or palette, in one place: its Link (a copy anyone can open;
  yours never changes) and its Gallery Page (one public page, published from
  the account, updated in place, or unpublished). Publishing and updating,
  with Anonymous and a project's Ravelry project, happen in the publish
  dialog. Publishing needs an account; signed out, Copy Link still works.
  Opened from a card's Share button and the planner's Project menu.
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
  import ShareSectionHeader from '#lib/components/account/ShareSectionHeader.svelte';
  import { inAccount } from '#lib/utils/open-ravelry.js';
  import { copyToClipboard } from '#lib/utils/clipboard-utils.js';
  import { Flash } from '#lib/utils/feedback.svelte.js';
  import {
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
  {#if link}
    <!-- The link first: what most people share -->
    <ul class={PANEL_LIST} aria-label="Link">
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
    </ul>
  {/if}

  <section class="flex flex-col gap-3" aria-labelledby="share-gallery">
    <ShareSectionHeader
      id="share-gallery"
      title="Gallery Page"
      href={page ? pageHref(page) : undefined}
      linkText="View Gallery Page"
    >
      {#if signedIn && !galleryPages.loaded}
        <LoaderCircleIcon
          class="icon-sm inline animate-spin"
          aria-hidden="true"
        />
        Checking…
      {:else}
        {status}{page
          ? ` · ${page.showOwner && ownerName ? `By ${ownerName}` : 'Anonymous'}`
          : ''}
      {/if}
    </ShareSectionHeader>

    {#if !signedIn}
      <div class="flex flex-col items-start gap-1">
        <!-- eslint-disable svelte/no-navigation-without-resolve -- resolved by the opener -->
        <a
          class="btn preset-filled-primary-500"
          href={signInHref ?? resolve('/auth/sign-in')}
          data-sveltekit-reload
        >
          <LogInIcon aria-hidden="true" />Sign In to Publish
        </a>
        <!-- eslint-enable svelte/no-navigation-without-resolve -->
        <p class="text-xs opacity-70">
          A free account lets you publish a public page, then update or
          unpublish it any time.
        </p>
      </div>
    {:else if galleryPages.loaded && !page}
      {#if kind === 'project' && ravelryItem && !inAccount(ravelryItem)}
        <!-- Its page follows the account's copy into and out of the Trash -->
        <p class="text-sm">
          Add this project to your account first (Add to your account, at the
          top of My Projects), then publish it.
        </p>
      {:else if galleryPages.publishing && onpublish}
        <div class="flex flex-col items-start gap-1">
          <button
            type="button"
            class="btn preset-filled-primary-500"
            data-row="publish"
            onclick={onpublish}
          >
            <SendIcon aria-hidden="true" />Publish to Gallery…
          </button>
          <p class="text-xs opacity-70">
            A public page anyone can find. You can update or unpublish it any
            time.
          </p>
        </div>
      {:else if !galleryPages.publishing}
        <p class="text-sm">Publishing to the gallery is paused right now.</p>
      {/if}
    {:else if page}
      <div class="flex flex-col items-start gap-1">
        <button
          type="button"
          class="btn {isChanged
            ? 'preset-filled-primary-500'
            : 'preset-tonal-surface'}"
          onclick={() => page && onedit?.(page)}
          disabled={!onedit}
          aria-describedby={isChanged ? 'share-gallery-changed' : undefined}
        >
          <PencilIcon aria-hidden="true" />Edit Gallery Page…
        </button>
        {#if isChanged}
          <p class="text-xs opacity-70" id="share-gallery-changed">
            Changed since its page was last updated.
          </p>
        {/if}
      </div>
    {/if}
  </section>

  {@render children?.()}
</div>

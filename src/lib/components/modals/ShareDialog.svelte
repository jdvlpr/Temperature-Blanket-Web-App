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
  the account, updated in place, or unpublished). Publishing needs an account;
  signed out, Copy Link still works. Opened from a card's Share button and the
  planner's Project menu.
-->
<script lang="ts">
  import { resolve } from '$app/paths';
  import { anonymousDetail } from '#lib/accounts/anonymous.js';
  import { DISPLAY_NAME_HREF } from '#lib/accounts/display-name-link.js';
  import type { GalleryPage } from '#lib/accounts/gallery.js';
  import { galleryPages } from '#lib/accounts/gallery-pages.svelte.js';
  import { publishedOn } from '#lib/accounts/gallery-version.js';
  import { account } from '#lib/accounts/summary.svelte.js';
  import CopyIcon from '#lib/components/CopyIcon.svelte';
  import RavelryShareSection from '#lib/components/account/RavelryShareSection.svelte';
  import { ravelryLinks } from '#lib/accounts/ravelry-links.svelte.js';
  import type { StoredProjectIndexItem } from '#lib/storage/projects.svelte.js';
  import { PANEL_LIST, PANEL_ROW } from '#lib/constants/class-constants.js';
  import { copyToClipboard } from '#lib/utils/clipboard-utils.js';
  import { Flash } from '#lib/utils/feedback.svelte.js';
  import {
    ExternalLinkIcon,
    EyeOffIcon,
    LinkIcon,
    LoaderCircleIcon,
    LogInIcon,
    RefreshCwIcon,
    SendIcon,
  } from '@lucide/svelte';
  import { onMount, tick, type Snippet } from 'svelte';
  import type { Attachment } from 'svelte/attachments';

  let {
    kind,
    id,
    label,
    link,
    changed,
    onpublish,
    onupdate,
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
    /** Updates its page in place (opens the publish dialog) */
    onupdate?: (page: GalleryPage) => void;
    /** Where Sign In goes, to come back here */
    signInHref?: string;
    /** A saved project: its Ravelry section, when signed in */
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

  let busy = $state(false);
  let errorMessage = $state('');
  let confirming = $state(false);

  async function setAnonymous(anonymous: boolean) {
    if (!page) return;
    errorMessage = '';
    busy = true;
    try {
      await galleryPages.setShowOwner(page.postId, !anonymous);
    } catch {
      errorMessage = 'That change couldn’t be saved. Try again later.';
    } finally {
      busy = false;
    }
  }

  let root = $state<HTMLElement>();
  /** The confirm's first button takes the focus, as the row that asked is gone */
  const takeFocus: Attachment<HTMLButtonElement> = (button) => {
    button.focus({ preventScroll: true });
  };
  async function focusRow(name: string) {
    await tick();
    root
      ?.querySelector<HTMLElement>(`[data-row="${name}"]`)
      ?.focus({ preventScroll: true });
  }

  async function unpublish() {
    if (!page) return;
    busy = true;
    errorMessage = '';
    try {
      await galleryPages.remove(page.postId);
      confirming = false;
      await focusRow('publish');
    } catch {
      errorMessage = 'It couldn’t be unpublished. Try again later.';
    } finally {
      busy = false;
    }
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

<div class="flex flex-col gap-6 p-4 text-left" bind:this={root}>
  {#if link}
    <section class="flex flex-col gap-2" aria-labelledby="share-link">
      <h3 id="share-link" class="font-bold">Link</h3>
      <ul class={PANEL_LIST}>
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
    </section>
  {/if}

  <section class="flex flex-col gap-2" aria-labelledby="share-gallery">
    <div class="flex flex-col">
      <h3 id="share-gallery" class="font-bold">Gallery Page</h3>
      <p class="text-sm opacity-80">
        {#if signedIn && !galleryPages.loaded}
          <LoaderCircleIcon
            class="icon-sm inline animate-spin"
            aria-hidden="true"
          />
          Checking…
        {:else}
          {status}{#if page}
            · {page.showOwner && ownerName
              ? `By ${ownerName}`
              : 'Anonymous'}{/if}{#if isChanged}
            · <span class="font-bold">changed since</span>{/if}
        {/if}
      </p>
    </div>

    {#if !signedIn}
      <ul class={PANEL_LIST}>
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
                >A free account lets you publish a public page, then update or
                unpublish it any time</span
              >
            </span>
          </a>
          <!-- eslint-enable svelte/no-navigation-without-resolve -->
        </li>
      </ul>
    {:else if galleryPages.loaded && !page}
      {#if galleryPages.publishing && onpublish}
        <ul class={PANEL_LIST}>
          <li>
            <button
              type="button"
              class={PANEL_ROW}
              data-row="publish"
              onclick={onpublish}
            >
              <SendIcon class="shrink-0 opacity-70" aria-hidden="true" />
              <span class="flex flex-1 flex-col">
                <span>Publish to Gallery…</span>
                <span class="text-xs opacity-70"
                  >A public page anyone can find. You can update or unpublish it
                  any time.</span
                >
              </span>
            </button>
          </li>
        </ul>
      {:else if !galleryPages.publishing}
        <p class="text-sm">Publishing to the gallery is paused right now.</p>
      {/if}
    {:else if page}
      <ul class={PANEL_LIST}>
        <li>
          <a
            class={PANEL_ROW}
            href={pageHref(page)}
            target="_blank"
            rel="noopener noreferrer"
          >
            <ExternalLinkIcon class="shrink-0 opacity-70" aria-hidden="true" />
            <span class="flex flex-1 flex-col"
              ><span
                >View Gallery Page<span class="sr-only">
                  (opens in a new tab)</span
                ></span
              ><span class="text-xs opacity-70">“{page.title}”</span></span
            >
          </a>
        </li>
        {#if onupdate && galleryPages.publishing}
          <li>
            <button
              type="button"
              class={PANEL_ROW}
              onclick={() => page && onupdate(page)}
            >
              <RefreshCwIcon class="shrink-0 opacity-70" aria-hidden="true" />
              <span class="flex flex-1 flex-col">
                <span>Update Gallery Page…</span>
                <span class="text-xs opacity-70"
                  >{kind === 'palette'
                    ? `To “${label}”, with its colors now.`
                    : 'To the project as it is now.'} Its link stays the same.</span
                >
              </span>
            </button>
          </li>
        {/if}
        <li>
          <label class={PANEL_ROW}>
            <input
              type="checkbox"
              class="checkbox shrink-0"
              checked={!page.showOwner}
              disabled={busy}
              onchange={(e) => void setAnonymous(e.currentTarget.checked)}
            />
            <span class="flex flex-1 flex-col">
              <span>Anonymous</span>
              <span class="text-xs opacity-70"
                >{anonymousDetail(!page.showOwner, ownerName)}{ravelryItem &&
                ravelryLinks.links.has(ravelryItem.id)
                  ? '. Anonymous also hides your Ravelry photos and link.'
                  : ''}</span
              >
            </span>
          </label>
        </li>
        <li>
          {#if confirming}
            <div class="flex flex-col gap-2 px-4 py-3">
              <p class="text-sm">
                Unpublish “{page.title}”? Its gallery page link stops working{kind ===
                'project'
                  ? ', and it comes off the globe'
                  : ''}. Your {kind} stays saved, and links you’ve shared to it still
                work.
              </p>
              <div class="flex flex-wrap gap-2">
                <button
                  type="button"
                  class="btn btn-sm preset-filled-error-500"
                  onclick={unpublish}
                  disabled={busy}
                  {@attach takeFocus}
                  >{#if busy}<LoaderCircleIcon
                      class="animate-spin"
                    />{/if}Unpublish</button
                >
                <button
                  type="button"
                  class="btn btn-sm preset-tonal-surface"
                  onclick={() => {
                    confirming = false;
                    void focusRow('unpublish');
                  }}
                  disabled={busy}>Keep Published</button
                >
              </div>
            </div>
          {:else}
            <button
              type="button"
              class={PANEL_ROW}
              data-row="unpublish"
              onclick={() => (confirming = true)}
              disabled={busy}
            >
              <EyeOffIcon class="shrink-0 opacity-70" aria-hidden="true" />
              <span class="flex-1">Unpublish…</span>
            </button>
          {/if}
        </li>
      </ul>
      {#if page.showOwner && !ownerName}
        <p class="text-warning-700-300 text-sm">
          Add a display name in your
          <a href={DISPLAY_NAME_HREF} class="link">Profile settings</a>
          to be credited.
        </p>
      {/if}
    {/if}
    {#if errorMessage}
      <p class="text-error-700-300 text-sm" role="alert">{errorMessage}</p>
    {/if}
  </section>

  {#if ravelryItem && signedIn}
    <RavelryShareSection item={ravelryItem} />
  {/if}

  {@render children?.()}
</div>

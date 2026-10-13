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
  A saved project's or palette's place in the gallery, on its row in My
  Projects. Not published: Publish to Gallery. Published: a menu to view its
  page, show the account's name on it or not, publish a new version (the
  dialog asks whether to remove the old page), or unpublish it. A gallery page
  is a snapshot from when it was published, so once the project changes it
  offers a new version. (Its link is a copy, always
  shareable, so it isn't a setting here: Copy Link comes in as `children`,
  first on the row.)
-->
<script lang="ts">
  import { resolve } from '$app/paths';
  import type { GalleryPage } from '#lib/accounts/gallery.js';
  import { galleryPages } from '#lib/accounts/gallery-pages.svelte.js';
  import { account } from '#lib/accounts/summary.svelte.js';
  import MenuCheckbox from '#lib/components/buttons/MenuCheckbox.svelte';
  import {
    menuContentClass,
    menuItemClass,
    menuPositioning,
  } from '#lib/components/menu-styles.js';
  import { safeSlide } from '#lib/features/transitions/safeSlide.js';
  import {
    ChevronDownIcon,
    EyeOffIcon,
    ExternalLinkIcon,
    GlobeIcon,
    LoaderCircleIcon,
    SendIcon,
    UserIcon,
  } from '@lucide/svelte';
  import { Menu, Portal } from '@skeletonlabs/skeleton-svelte';
  import type { Snippet } from 'svelte';
  import type { HTMLAnchorAttributes } from 'svelte/elements';

  let {
    kind,
    label,
    page,
    changedSince = false,
    onadd,
    onupdate,
    children,
  }: {
    kind: 'project' | 'palette';
    /** The project's or palette's name, for screen readers */
    label: string;
    /** Its gallery page (the newest), if it has one */
    page?: GalleryPage;
    /** Whether it changed after its gallery page was made */
    changedSince?: boolean;
    /** Publishes it (the dialog asks about the account's name) */
    onadd: () => void;
    /** Publishes a new version after this page (the dialog asks whether to remove it) */
    onupdate: (page: GalleryPage) => void;
    /** First on the row, e.g. Copy Link */
    children?: Snippet;
  } = $props();

  let confirming = $state(false);
  let busy = $state(false);
  let errorMessage = $state('');

  let ownerName = $derived(
    (galleryPages.name ?? account.summary?.name ?? '').trim(),
  );

  let named = $derived(Boolean(page?.showOwner));

  // "Published", or "Published · By Ada" with the name shown
  let status = $derived(
    named && ownerName ? `Published · By ${ownerName}` : 'Published',
  );

  // Publishing (and updating) needs publishing on; the rest works either way
  let canAdd = $derived(galleryPages.publishing);

  function publish() {
    errorMessage = '';
    if (!canAdd) {
      errorMessage =
        'Publishing to the gallery is paused right now. Try again later.';
      return;
    }
    onadd();
  }

  async function setNamed(next: boolean) {
    if (!page || next === named) return;
    errorMessage = '';
    busy = true;
    try {
      await galleryPages.setShowOwner(page.postId, next);
    } catch {
      errorMessage = 'That change couldn’t be saved. Try again later.';
    } finally {
      busy = false;
    }
  }

  function select(value: string) {
    errorMessage = '';
    if (value === 'update' && page) onupdate(page);
    else if (value === 'unpublish') confirming = true;
  }

  async function remove() {
    if (!page) return;
    busy = true;
    errorMessage = '';
    try {
      await galleryPages.removeAllLike(page);
      confirming = false;
    } catch {
      errorMessage = 'It couldn’t be unpublished. Try again later.';
    } finally {
      busy = false;
    }
  }

  // Published more than once: each copy comes off
  let pageCount = $derived(page ? galleryPages.pagesLike(page).length : 0);

  let pageHref = $derived(
    !page
      ? null
      : page.kind === 'palette'
        ? resolve('/gallery/palette/[id]', { id: String(page.postId) })
        : resolve('/gallery/[id]', { id: String(page.postId) }),
  );

  // First on the row, it lines up with the text above
  let triggerClass = $derived(
    `btn btn-sm hover:preset-tonal-surface${children ? '' : ' -ml-2'}`,
  );

  const publishedOn = (time: number) =>
    new Date(time).toLocaleDateString(undefined, { dateStyle: 'medium' });
</script>

<!-- With publishing paused, one without a page has only Copy Link -->
{#if page || canAdd || children}
  <div
    class="mt-2 flex flex-col gap-1 text-sm"
    aria-label="Gallery: {label}"
    role="group"
  >
    <div class="flex flex-wrap items-center gap-x-3 gap-y-1">
      {@render children?.()}
      {#if !page && canAdd}
        <button
          type="button"
          class={triggerClass}
          onclick={publish}
          aria-label="Publish to Gallery: {label}"
          ><SendIcon aria-hidden="true" />Publish to Gallery</button
        >
      {:else if page}
        <Menu
          positioning={menuPositioning('bottom-start')}
          onSelect={(details) => select(details.value)}
        >
          <Menu.Trigger class={triggerClass}>
            <GlobeIcon aria-hidden="true" />
            <span><span class="sr-only">Gallery: </span>{status}</span>
            <ChevronDownIcon class="icon-sm" aria-hidden="true" />
          </Menu.Trigger>
          <Portal>
            <Menu.Positioner>
              <Menu.Content class={menuContentClass}>
                <Menu.Item value="view" class={menuItemClass}>
                  {#snippet element(attributes)}
                    <!-- eslint-disable svelte/no-navigation-without-resolve -- resolved above -->
                    <a
                      {...attributes as HTMLAnchorAttributes}
                      href={pageHref}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <ExternalLinkIcon class="shrink-0" aria-hidden="true" />
                      <span class="flex min-w-0 flex-1 flex-col">
                        <span
                          >View Gallery Page<span class="sr-only">
                            (opens in a new tab)</span
                          ></span
                        >
                        <span class="text-surface-700-300 text-xs"
                          >Published {publishedOn(page.publishedAt)}</span
                        >
                      </span>
                    </a>
                    <!-- eslint-enable svelte/no-navigation-without-resolve -->
                  {/snippet}
                </Menu.Item>
                <!-- Stays open, so the check shows it took -->
                <Menu.OptionItem
                  type="checkbox"
                  value="named"
                  checked={named}
                  closeOnSelect={false}
                  disabled={busy}
                  onCheckedChange={(checked) => void setNamed(checked)}
                  class={menuItemClass}
                >
                  <UserIcon class="shrink-0" aria-hidden="true" />
                  <span class="flex min-w-0 flex-1 flex-col">
                    <span>Show my name</span>
                    <span class="text-surface-700-300 text-xs"
                      >{ownerName
                        ? `Its page says “By ${ownerName}” and your public gallery page lists it`
                        : 'Your public gallery page lists it once you add a display name'}</span
                    >
                  </span>
                  <MenuCheckbox checked={named} />
                </Menu.OptionItem>
                {#if changedSince && canAdd}
                  <Menu.Item value="update" class={menuItemClass}>
                    <SendIcon class="shrink-0" aria-hidden="true" />
                    <span class="flex min-w-0 flex-1 flex-col">
                      <span>Publish New Version…</span>
                      <span class="text-surface-700-300 text-xs"
                        >As it is now. You choose whether to remove the old
                        page.</span
                      >
                    </span>
                  </Menu.Item>
                {/if}
                <Menu.Separator />
                <Menu.Item value="unpublish" class={menuItemClass}>
                  <EyeOffIcon class="shrink-0" aria-hidden="true" />
                  <span class="flex min-w-0 flex-1 flex-col">
                    <span>Unpublish…</span>
                    <span class="text-surface-700-300 text-xs"
                      >Take it off the gallery. Its link still works.</span
                    >
                  </span>
                </Menu.Item>
              </Menu.Content>
            </Menu.Positioner>
          </Portal>
        </Menu>
      {/if}
      {#if busy && !confirming}
        <LoaderCircleIcon class="icon-sm animate-spin" aria-label="Saving" />
      {/if}
    </div>

    {#if page && changedSince && canAdd && !confirming}
      <div class="flex flex-wrap items-center gap-x-2 gap-y-1">
        <span class="opacity-70"
          >Changed since it was published on {publishedOn(
            page.publishedAt,
          )}.</span
        >
        <button
          type="button"
          class="btn btn-sm preset-tonal-surface"
          onclick={() => page && onupdate(page)}
          disabled={busy}
          aria-label="Publish a new version of {label}"
          ><SendIcon class="icon-sm" />Publish New Version</button
        >
      </div>
    {/if}

    {#if named && !ownerName}
      <p class="text-warning-700-300">
        Add a display name on your
        <a href={resolve('account')} class="link">Account page</a>
        to show it.
      </p>
    {/if}

    {#if confirming}
      <div class="flex flex-col gap-2 py-1" in:safeSlide>
        <p>
          Unpublish this {kind}{pageCount > 1
            ? ` (all ${pageCount} of its gallery pages)`
            : ''}?{kind === 'project' ? ' It also comes off the globe.' : ''}
          Your {kind} stays saved, and its link still works.
        </p>
        <div class="flex flex-wrap gap-2">
          <button
            type="button"
            class="btn btn-sm preset-filled-error-500 max-sm:w-full"
            onclick={remove}
            disabled={busy}
          >
            {#if busy}
              <LoaderCircleIcon class="animate-spin" />
            {/if}
            Unpublish
          </button>
          <button
            type="button"
            class="btn btn-sm preset-tonal-surface max-sm:w-full"
            onclick={() => (confirming = false)}
            disabled={busy}>Cancel</button
          >
        </div>
      </div>
    {/if}

    {#if errorMessage}
      <p class="text-error-700-300" role="alert">{errorMessage}</p>
    {/if}
  </div>
{/if}

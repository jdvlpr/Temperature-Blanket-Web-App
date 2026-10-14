<!-- Copyright (c) 2026, Thomas (https://github.com/jdvlpr)

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
  On a gallery page, only for the account that published it: "Your Page ▾"
  beside Open a Copy, with the same options as each version on My Projects:
  Anonymous, a link to a newer version, and Unpublish (it asks first, under the
  buttons). Found in the browser from the account's pages, so visitors get the
  same page as before and make no extra request. Shown even when the page
  can't be loaded, so its owner can still unpublish it.
-->
<script lang="ts">
  import { resolve } from '$app/paths';
  import { anonymousDetail } from '#lib/accounts/anonymous.js';
  import { account } from '#lib/accounts/summary.svelte.js';
  import { galleryPages } from '#lib/accounts/gallery-pages.svelte.js';
  import type { GalleryPage } from '#lib/accounts/gallery.js';
  import MenuCheckbox from '#lib/components/buttons/MenuCheckbox.svelte';
  import {
    menuContentClass,
    menuItemClass,
    menuPositioning,
  } from '#lib/components/menu-styles.js';
  import { safeSlide } from '#lib/features/transitions/safeSlide.js';
  import {
    ArrowRightIcon,
    ChevronDownIcon,
    EyeOffIcon,
    LoaderCircleIcon,
  } from '@lucide/svelte';
  import { Menu, Portal } from '@skeletonlabs/skeleton-svelte';
  import type { HTMLAnchorAttributes } from 'svelte/elements';

  let {
    postId,
    kind,
    onowner,
  }: {
    postId: number;
    kind: 'project' | 'palette';
    /** The name the page shows now, after Anonymous changes (null for none) */
    onowner?: (owner: { name: string; publicId: string } | null) => void;
  } = $props();

  const signedIn = $derived(
    __ACCOUNTS_ENABLED__ && Boolean(account.summary?.id),
  );

  $effect(() => {
    if (signedIn) void galleryPages.load();
  });

  let page = $derived<GalleryPage | undefined>(
    signedIn
      ? galleryPages.pages.find(
          (p) => p.postId === postId && (p.kind ?? 'project') === kind,
        )
      : undefined,
  );
  let latest = $derived(page ? galleryPages.pagesLike(page)[0] : undefined);
  let newer = $derived(latest && latest.postId !== postId ? latest : null);

  let ownerName = $derived(
    (galleryPages.name ?? account.summary?.name ?? '').trim(),
  );

  let confirming = $state(false);
  let busy = $state(false);
  let removed = $state(false);
  let errorMessage = $state('');

  const pageHref = (p: GalleryPage) =>
    (p.kind ?? 'project') === 'palette'
      ? resolve('/gallery/palette/[id]', { id: String(p.postId) })
      : resolve('/gallery/[id]', { id: String(p.postId) });

  async function setNamed(next: boolean) {
    busy = true;
    errorMessage = '';
    try {
      await galleryPages.setShowOwner(postId, next);
      onowner?.(
        next && ownerName && galleryPages.publicId
          ? { name: ownerName, publicId: galleryPages.publicId }
          : null,
      );
    } catch {
      errorMessage = 'That change couldn’t be saved. Try again later.';
    } finally {
      busy = false;
    }
  }

  async function remove() {
    if (busy) return;
    busy = true;
    errorMessage = '';
    try {
      await galleryPages.remove(postId);
      confirming = false;
      removed = true;
    } catch {
      errorMessage = 'It couldn’t be unpublished. Try again later.';
    } finally {
      busy = false;
    }
  }
</script>

{#if removed}
  <p class="basis-full text-sm" role="status" data-testid="gallery-owner-menu">
    Unpublished. This page is no longer in the gallery.
    <a href={resolve('my-projects')} class="link">My Library</a>
  </p>
{:else if page}
  <Menu
    positioning={menuPositioning('bottom-end')}
    onSelect={(details) => {
      if (details.value === 'unpublish') confirming = true;
    }}
  >
    <Menu.Trigger
      class="btn hover:preset-tonal-surface"
      disabled={busy}
      data-testid="gallery-owner-menu"
      >Your Page<ChevronDownIcon
        class="icon-sm"
        aria-hidden="true"
      /></Menu.Trigger
    >
    <Portal>
      <Menu.Positioner>
        <Menu.Content class={menuContentClass}>
          <!-- Stays open, so the check shows it took -->
          <Menu.OptionItem
            type="checkbox"
            value="anonymous"
            checked={!page.showOwner}
            closeOnSelect={false}
            disabled={busy}
            onCheckedChange={(checked) => void setNamed(!checked)}
            class={menuItemClass}
          >
            <span class="flex min-w-0 flex-1 flex-col">
              <span>Anonymous</span>
              <span class="text-surface-700-300 text-xs"
                >{anonymousDetail(!page.showOwner, ownerName)}</span
              >
            </span>
            <MenuCheckbox checked={!page.showOwner} />
          </Menu.OptionItem>
          {#if newer}
            <Menu.Item value="newer" class={menuItemClass}>
              {#snippet element(attributes)}
                <!-- eslint-disable-next-line svelte/no-navigation-without-resolve -- resolved in pageHref -->
                <a
                  {...attributes as HTMLAnchorAttributes}
                  href={pageHref(newer)}
                >
                  <ArrowRightIcon class="shrink-0" aria-hidden="true" />
                  <span class="min-w-0 flex-1">Newer Version</span>
                </a>
              {/snippet}
            </Menu.Item>
          {/if}
          <Menu.Item value="unpublish" class={menuItemClass}>
            <EyeOffIcon class="shrink-0" aria-hidden="true" />
            <span class="min-w-0 flex-1">Unpublish…</span>
          </Menu.Item>
        </Menu.Content>
      </Menu.Positioner>
    </Portal>
  </Menu>
  {#if confirming}
    <div
      class="flex basis-full flex-col items-center gap-2 text-sm"
      in:safeSlide
    >
      <p>
        Unpublish this version? Its gallery page link stops working{kind ===
        'project'
          ? ', and it comes off the globe'
          : ''}. Your {kind} stays saved, and links you’ve shared to the {kind}
        still work.
      </p>
      <div class="flex flex-wrap justify-center gap-2">
        <button
          type="button"
          class="btn btn-sm hover:preset-tonal-surface max-sm:w-full"
          onclick={() => (confirming = false)}
          disabled={busy}>Cancel</button
        >
        <button
          type="button"
          class="btn btn-sm preset-filled-error-500 max-sm:w-full"
          onclick={remove}
          disabled={busy}
        >
          {#if busy}<LoaderCircleIcon class="animate-spin" />{/if}
          Unpublish
        </button>
      </div>
    </div>
  {/if}
{/if}
{#if errorMessage}
  <p class="text-error-700-300 basis-full text-center text-sm" role="alert">
    {errorMessage}
  </p>
{/if}

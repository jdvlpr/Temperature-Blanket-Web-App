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
  On a gallery page, only for the account that published it: when it was
  published (and a link to a newer version), the saved original, and the same
  menu as each version on My Projects: Show my name, and Unpublish (it asks
  first). Found in the browser from the account's pages, so visitors get the
  same page as before and make no extra request.
-->
<script lang="ts">
  import { resolve } from '$app/paths';
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
  import { ProjectStorage } from '#lib/storage/projects.svelte.js';
  import {
    EllipsisVerticalIcon,
    EyeOffIcon,
    FolderOpenIcon,
    LoaderCircleIcon,
    NotebookPenIcon,
  } from '@lucide/svelte';
  import { Menu, Portal } from '@skeletonlabs/skeleton-svelte';

  let {
    postId,
    kind,
    onowner,
  }: {
    postId: number;
    kind: 'project' | 'palette';
    /** The name the page shows now, after Show my name changes (null for none) */
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

  // The saved project, when it's in this browser
  let projectHref = $state<string | null>(null);
  $effect(() => {
    const id = kind === 'project' ? page?.projectId : undefined;
    if (!id) return;
    ProjectStorage.getIndex().then((index) => {
      projectHref = index.find((item) => item.id === id)?.meta.href ?? null;
    });
  });

  let ownerName = $derived(
    (galleryPages.name ?? account.summary?.name ?? '').trim(),
  );

  let confirming = $state(false);
  let busy = $state(false);
  let removed = $state(false);
  let errorMessage = $state('');

  const published = (time: number) =>
    new Date(time).toLocaleString(undefined, {
      dateStyle: 'medium',
      timeStyle: 'short',
    });

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

{#if page || removed}
  <section
    class="bg-surface-50 dark:bg-surface-950 rounded-container flex flex-col gap-2 px-2 py-3 text-sm sm:px-4"
    aria-label="Your gallery page"
    data-testid="gallery-owner-bar"
  >
    {#if removed}
      <p role="status">
        Unpublished. This page is no longer in the gallery.
        <a href={resolve('my-projects')} class="link">My Projects</a>
      </p>
    {:else if page}
      <div class="flex flex-wrap items-center justify-center gap-2">
        <p class="flex flex-wrap items-baseline justify-center gap-x-2">
          <span class="font-semibold">Your gallery page</span>
          <span class="text-surface-700-300"
            >Published {published(page.publishedAt)}</span
          >
          {#if newer}
            <!-- eslint-disable-next-line svelte/no-navigation-without-resolve -- resolved in pageHref -->
            <a href={pageHref(newer)} class="link">Newer version</a>
          {/if}
        </p>
        <div class="flex items-center gap-1">
          {#if kind === 'project' && projectHref}
            <!-- eslint-disable-next-line svelte/no-navigation-without-resolve -- the saved project's own address -->
            <a href={projectHref} class="btn btn-sm hover:preset-tonal-surface"
              ><NotebookPenIcon />Open My Project</a
            >
          {:else if kind === 'palette'}
            <a
              href="{resolve('my-projects')}#palettes"
              class="btn btn-sm hover:preset-tonal-surface"
              ><FolderOpenIcon />My Projects</a
            >
          {/if}
          <Menu
            positioning={menuPositioning('bottom-end')}
            onSelect={(details) => {
              if (details.value === 'unpublish') confirming = true;
            }}
          >
            <Menu.Trigger
              class="btn-icon hover:preset-tonal-surface shrink-0"
              aria-label="Options: your gallery page"
              title="Options"
              disabled={busy}><EllipsisVerticalIcon /></Menu.Trigger
            >
            <Portal>
              <Menu.Positioner>
                <Menu.Content class={menuContentClass}>
                  <!-- Stays open, so the check shows it took -->
                  <Menu.OptionItem
                    type="checkbox"
                    value="named"
                    checked={Boolean(page.showOwner)}
                    closeOnSelect={false}
                    disabled={busy}
                    onCheckedChange={(checked) => void setNamed(checked)}
                    class={menuItemClass}
                  >
                    <span class="flex min-w-0 flex-1 flex-col">
                      <span>Show my name</span>
                      <span class="text-surface-700-300 text-xs"
                        >{ownerName
                          ? `This page says “By ${ownerName}”`
                          : 'Once you add a display name'}</span
                      >
                    </span>
                    <MenuCheckbox checked={Boolean(page.showOwner)} />
                  </Menu.OptionItem>
                  <Menu.Item value="unpublish" class={menuItemClass}>
                    <EyeOffIcon class="shrink-0" aria-hidden="true" />
                    <span class="min-w-0 flex-1">Unpublish…</span>
                  </Menu.Item>
                </Menu.Content>
              </Menu.Positioner>
            </Portal>
          </Menu>
        </div>
      </div>
      {#if confirming}
        <div class="flex flex-col items-center gap-2" in:safeSlide>
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
      <p class="text-error-700-300 text-center" role="alert">
        {errorMessage}
      </p>
    {/if}
  </section>
{/if}

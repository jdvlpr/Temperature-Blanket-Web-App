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
  A saved project on My Projects, as the gallery's project card: its picture
  (taken when the planner saved it; while one is being drawn, a placeholder;
  if it can't be, its colors), its name, when it was saved, and a ⋮ menu
  (Rename, Move to Trash). Its gallery button (`sharing`, Published ▾ or
  Unpublished ▾) sits under it. Tapping it opens it in the planner.

  With `galleryPage` instead of `item`, a project that's only in the gallery
  (deleted or not saved here): when it was published, its picture kept here
  or else the gallery's (`galleryImage`), and a ⋮ menu with Add to My Saved
  Projects. Tapping it opens a copy in the planner, under the same project
  ID, so saving it there makes it a saved project again too.
-->
<script lang="ts">
  import GalleryProjectCard, {
    coverClasses,
    imageClasses,
  } from '#lib/components/GalleryProjectCard.svelte';
  import NameField from '#lib/components/NameField.svelte';
  import MoreMenu, {
    type MoreMenuItem,
  } from '#lib/components/buttons/MoreMenu.svelte';
  import ProjectPicture from '#lib/components/ProjectPicture.svelte';
  import SyncIcon from '#lib/components/sync/SyncIcon.svelte';
  import type { GalleryPage } from '#lib/accounts/gallery.js';
  import {
    lastSavedAt,
    type StoredProjectIndexItem,
  } from '#lib/storage/projects.svelte.js';
  import { fromGalleryLink } from '#lib/utils/gallery-request.js';
  import { resolve } from '$app/paths';
  import type { SyncLabel } from '#lib/sync/status.svelte.js';
  import {
    FolderPlusIcon,
    LoaderCircleIcon,
    PencilIcon,
    Trash2Icon,
  } from '@lucide/svelte';
  import type { Snippet } from 'svelte';
  import type { Attachment } from 'svelte/attachments';

  type Props = {
    /** Bumped when pictures were drawn in the background, to look again */
    picturesVersion?: number;
    /** The background drawing is done with it: without a picture by now,
    it shows its colors instead of a placeholder */
    pictureSettled?: boolean;
    layout?: 'grid' | 'list';
    /** Where it's kept, e.g. "Synced" (see $lib/sync) */
    syncLabel?: SyncLabel;
    /** Its Share button */
    sharing?: Snippet;
    /** Takes keyboard focus (on its name), e.g. once it's been added back */
    focus?: boolean;
    onfocused?: () => void;
  } & (
    | {
        item: StoredProjectIndexItem;
        galleryPage?: never;
        /** Called with the new name ('' clears it) */
        onrename: (name: string) => void;
        onremove: () => void;
        galleryImage?: never;
        onaddback?: never;
        adding?: never;
      }
    | {
        item?: never;
        /** The newest gallery page of a project not saved here */
        galleryPage: GalleryPage;
        /** Its picture on the gallery, when none is kept here */
        galleryImage?: string | null;
        /** Saves it back to My Projects */
        onaddback: () => void;
        /** While it's being saved back */
        adding?: boolean;
        onrename?: never;
        onremove?: never;
      }
  );

  let {
    item,
    galleryPage,
    picturesVersion = 0,
    pictureSettled = false,
    layout = 'grid',
    syncLabel,
    onrename,
    onremove,
    galleryImage,
    onaddback,
    adding = false,
    sharing,
    focus = false,
    onfocused,
  }: Props = $props();

  const takeFocus: Attachment<HTMLElement> = (link) => {
    link.focus({ preventScroll: true });
    onfocused?.();
  };

  const dateOf = (time: number) =>
    new Date(time).toLocaleDateString(undefined, { dateStyle: 'medium' });
  const dateTimeOf = (time: number) =>
    new Date(time).toLocaleString(undefined, {
      dateStyle: 'medium',
      timeStyle: 'short',
    });

  // Its picture and colors are kept and read by this ID and link
  let id = $derived(item?.id ?? galleryPage?.projectId ?? '');
  let projectHref = $derived(item?.meta.href ?? galleryPage?.link ?? '');

  // Opening it: a saved one in the planner (a full page load: the planner
  // reads the project from the URL it starts with, so arriving by client-side
  // navigation skips the saved weather). Only in the gallery: a copy in the
  // planner with the page's weather, or the page itself without its link.
  let href = $derived.by(() => {
    if (item) return item.meta.href;
    if (galleryPage?.link)
      return fromGalleryLink(galleryPage.link, galleryPage.postId);
    return resolve('/gallery/[id]', { id: String(galleryPage?.postId) });
  });
  let reload = $derived(Boolean(item || galleryPage?.link));

  let label = $derived(
    item
      ? item.meta.name || item.meta.title || 'Untitled Project'
      : galleryPage?.title || 'Untitled Project',
  );

  // When it was saved, or only in the gallery, published
  let dateLine = $derived.by(() => {
    if (galleryPage)
      return `Gallery only · Published ${dateOf(galleryPage.publishedAt)}`;
    const saved = item && lastSavedAt(item);
    return `Saved ${saved ? dateTimeOf(saved) : item?.meta.date}`;
  });

  let linkTitle = $derived(
    galleryPage
      ? galleryPage.link
        ? `Open a copy in the Project Planner (${dateLine})`
        : `Open its gallery page (${dateLine})`
      : `Open in the Project Planner (${dateLine})`,
  );

  // A saved one can be renamed or moved to the Trash; one only in the
  // gallery, saved back
  let menu = $derived<MoreMenuItem[]>(
    onaddback
      ? [
          {
            value: 'add-back',
            label: 'Add to My Saved Projects',
            icon: FolderPlusIcon,
            onselect: onaddback,
          },
        ]
      : item && onremove
        ? [
            {
              value: 'rename',
              label: 'Rename',
              icon: PencilIcon,
              onselect: () => {
                editingName = item.meta.name ?? '';
                editing = true;
              },
            },
            {
              value: 'trash',
              label: 'Move to Trash',
              icon: Trash2Icon,
              onselect: onremove,
              separate: true,
            },
          ]
        : [],
  );

  let editing = $state(false);
  let editingName = $state('');
</script>

<div class="w-full">
  <GalleryProjectCard {href} {reload} {layout} title={linkTitle}>
    {#snippet cover()}
      <ProjectPicture
        {id}
        href={projectHref}
        fallbackImage={galleryImage}
        {picturesVersion}
        {pictureSettled}
        imageClass={imageClasses[layout]}
        coverClass={coverClasses[layout]}
      />
    {/snippet}
    {#snippet nameRow()}
      {#if editing}
        <div class="w-full text-left">
          <NameField
            bind:value={editingName}
            placeholder={item?.meta.title}
            onsave={() => {
              editing = false;
              onrename?.(editingName);
            }}
            oncancel={() => (editing = false)}
          />
        </div>
      {:else}
        <div class="flex w-full items-start gap-1 text-left">
          <div class="flex min-w-0 grow flex-col">
            <span class="flex items-start gap-1">
              {#if syncLabel}
                <span class="mt-0.5"><SyncIcon label={syncLabel} /></span>
              {/if}
              <!-- eslint-disable-next-line svelte/no-navigation-without-resolve -- resolved above, or a project link -->
              <a
                {href}
                data-sveltekit-reload={reload ? '' : undefined}
                title={linkTitle}
                {@attach focus ? takeFocus : undefined}
                class="line-clamp-2 min-w-0 text-sm font-semibold break-words"
                >{label}</a
              >
            </span>
            <span
              class="text-surface-700-300 line-clamp-1 text-xs"
              aria-live="polite"
            >
              {#if adding}
                <LoaderCircleIcon
                  class="icon-sm inline animate-spin"
                  aria-hidden="true"
                />
                Adding to My Saved Projects…
              {:else}
                {dateLine}
              {/if}
            </span>
            {#if syncLabel?.tone === 'error'}
              <span class="text-error-700-300 text-xs">{syncLabel.text}</span>
            {/if}
          </div>
          {#if menu.length}
            <MoreMenu items={menu} label="More for {label}" />
          {/if}
        </div>
      {/if}
    {/snippet}
    {#snippet footer()}
      {#if !editing && sharing}
        <div class="w-full text-left">{@render sharing()}</div>
      {/if}
    {/snippet}
  </GalleryProjectCard>
</div>

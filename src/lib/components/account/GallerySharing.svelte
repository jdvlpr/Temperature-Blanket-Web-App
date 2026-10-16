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
  A saved project's or palette's sharing, on its card in My Library: one Share
  button, with what's shared beside it (Published, and whether it changed
  since; On Ravelry, with its photos). It opens the Share dialog: Copy Link, and its one gallery page
  (Publish, or View, Update, Anonymous and Unpublish).
-->
<script lang="ts">
  import type { GalleryPage } from '#lib/accounts/gallery.js';
  import { ravelryLinks } from '#lib/accounts/ravelry-links.svelte.js';
  import type { StoredProjectIndexItem } from '#lib/storage/projects.svelte.js';
  import ShareDialog from '#lib/components/modals/ShareDialog.svelte';
  import { dialog } from '#lib/state/page-state.svelte.js';
  import { GlobeIcon, LinkIcon, Share2Icon } from '@lucide/svelte';

  let {
    kind,
    id,
    label,
    link,
    page,
    changedSince = false,
    changed,
    onadd,
    onupdate,
    ravelryItem,
  }: {
    kind: 'project' | 'palette';
    /** The saved project's or palette's ID */
    id: string;
    /** The project's or palette's name */
    label: string;
    /** What Copy Link copies */
    link?: string;
    /** Its gallery page, if it has one */
    page?: GalleryPage;
    /** Whether it changed after its gallery page was published or updated */
    changedSince?: boolean;
    /** The same, for the page the dialog shows */
    changed?: (page: GalleryPage) => boolean;
    /** Publishes it */
    onadd?: () => void;
    /** Updates its page in place */
    onupdate?: (page: GalleryPage) => void;
    /** A saved project, signed in: its Ravelry part too */
    ravelryItem?: StoredProjectIndexItem;
  } = $props();

  const ravelry = $derived(
    ravelryItem && ravelryLinks.connected
      ? (ravelryLinks.links.get(ravelryItem.id) ?? null)
      : null,
  );

  function open() {
    dialog.trigger({
      type: 'component',
      component: {
        ref: ShareDialog,
        props: {
          kind,
          id,
          label,
          link,
          changed,
          onpublish: onadd,
          onupdate,
          ravelryItem,
        },
      },
      options: { title: `Share “${label}”` },
    });
  }
</script>

<div class="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
  <button
    type="button"
    class="btn btn-sm hover:preset-tonal-surface -ml-2"
    onclick={open}
    aria-label="Share {label}"><Share2Icon aria-hidden="true" />Share</button
  >
  {#if page}
    <span class="flex items-center gap-1 opacity-80"
      ><GlobeIcon class="icon-sm" aria-hidden="true" />Published{changedSince
        ? ' · changed since'
        : ''}</span
    >
  {/if}
  {#if ravelry}
    <span class="flex items-center gap-1 opacity-80"
      ><LinkIcon class="icon-sm" aria-hidden="true" />On Ravelry{ravelry.photos
        .length
        ? ` · ${ravelry.photos.length} ${ravelry.photos.length === 1 ? 'photo' : 'photos'}`
        : ''}</span
    >
  {/if}
</div>

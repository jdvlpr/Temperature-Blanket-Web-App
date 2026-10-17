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
  The top of a gallery page, the same for projects and palettes: its name, a
  line under it, then "Published <date>" and under that "By <name> · 1.2K
  views" (the order gallery cards use too),
  then Open a Copy and, for its owner, Edit Gallery Page (the dialog its
  card's ⋮ in My Library opens).
-->
<script lang="ts">
  import { resolve } from '$app/paths';
  import ViewCount from '#lib/components/ViewCount.svelte';
  import GalleryStarButton from '#lib/components/GalleryStarButton.svelte';
  import GalleryPageEdit from '#lib/components/account/GalleryPageEdit.svelte';
  import type { GalleryOwner } from '#lib/server/gallery/store.js';
  import type { Component, Snippet } from 'svelte';

  interface Props {
    postId: number;
    kind: 'project' | 'palette';
    /** "By" and the name (loaded again after Edit Gallery Page saves) */
    owner: GalleryOwner | null;
    /** When it was published, as the gallery gives it */
    date?: string | null;
    /** When it was last changed (updated in place), as the gallery gives it */
    modified?: string | null;
    /** Its views, all time, as the gallery gives them (none shows nothing) */
    views?: number | null;
    /** The page's name (h1) */
    heading: Snippet;
    /** A line under the name */
    subtitle?: Snippet;
    /** More on the "By · Published" line, each its own element (a dot goes between) */
    details?: Snippet;
    /** Open a Copy: where, its icon, and its tooltip */
    open?: {
      href: string;
      icon: Component;
      title: string;
      target?: string;
    } | null;
  }

  let {
    postId,
    kind,
    owner = $bindable(),
    date,
    modified,
    views,
    heading,
    subtitle,
    details,
    open,
  }: Props = $props();

  // Items on a line, a dot between
  const META_LINE =
    "text-surface-600-400 flex flex-wrap justify-center gap-x-1.5 text-sm [&>*+*]:before:mr-1.5 [&>*+*]:before:content-['·']";

  const dayOf = (value?: string | null) =>
    value
      ? new Date(value).toLocaleDateString(undefined, { dateStyle: 'medium' })
      : '';
  let sharedOn = $derived(dayOf(date));
  // Only when it's a later day than it was published on
  let updatedOn = $derived(
    modified && date && modified.slice(0, 10) > date.slice(0, 10)
      ? dayOf(modified)
      : '',
  );
</script>

<div
  class="bg-surface-100 dark:bg-surface-900 flex flex-col gap-2 p-4 text-center"
>
  <h1 class="text-2xl font-bold break-words">{@render heading()}</h1>
  {#if subtitle}
    <p>{@render subtitle()}</p>
  {/if}
  <div class="flex flex-col gap-0.5 empty:hidden">
    {#if sharedOn || details}
      <p class={META_LINE}>
        {#if sharedOn}<span>Published {sharedOn}</span>{/if}
        {#if updatedOn}<span>Updated {updatedOn}</span>{/if}
        {@render details?.()}
      </p>
    {/if}
    {#if owner || views}
      <p class={META_LINE}>
        {#if owner}
          <span data-testid="gallery-owner"
            >By <a
              class="link"
              href={resolve('/gallery/by/[ownerId]', {
                ownerId: owner.publicId,
              })}>{owner.name}</a
            ></span
          >
        {/if}
        <ViewCount {views} />
      </p>
    {/if}
  </div>

  <div
    class="mt-2 flex flex-wrap items-center justify-center gap-2 empty:hidden"
  >
    {#if open}
      <!-- A link on this site, built from the page's own link -->
      <!-- eslint-disable-next-line svelte/no-navigation-without-resolve -->
      <a
        class="btn preset-filled-primary-500"
        href={open.href}
        target={open.target}
        title={open.title}
      >
        <open.icon />
        Open a Copy
      </a>
    {/if}
    <!-- Starring a page that's there; not one's own -->
    {#if __ACCOUNTS_ENABLED__ && sharedOn}
      <GalleryStarButton {postId} {kind} labelled />
    {/if}
    <!-- Even when the page can't be found, so its owner can unpublish it -->
    {#if __ACCOUNTS_ENABLED__}
      <GalleryPageEdit {postId} {kind} />
    {/if}
  </div>
</div>

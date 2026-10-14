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
  line under it, "By <name> · Published <date>" (the only place either shows),
  then Open a Copy and, for its owner, Your Page ▾. Details go under the
  page's picture or palette, in GalleryDetails.
-->
<script lang="ts">
  import { resolve } from '$app/paths';
  import GalleryOwnerMenu from '#lib/components/account/GalleryOwnerMenu.svelte';
  import type { GalleryOwner } from '#lib/server/gallery/store.js';
  import type { Component, Snippet } from 'svelte';

  interface Props {
    postId: number;
    kind: 'project' | 'palette';
    /** "By" and the name, which the owner bar changes in place */
    owner: GalleryOwner | null;
    /** When it was published, as the gallery gives it */
    date?: string | null;
    /** The page's name (h1) */
    heading: Snippet;
    /** A line under the name */
    subtitle?: Snippet;
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
    heading,
    subtitle,
    open,
  }: Props = $props();

  let sharedOn = $derived(
    date
      ? new Date(date).toLocaleDateString(undefined, { dateStyle: 'medium' })
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
  {#if owner || sharedOn}
    <p
      class="text-surface-600-400 flex flex-wrap justify-center gap-x-1.5 text-sm"
    >
      {#if owner}
        <span data-testid="gallery-owner"
          >By <a
            class="link"
            href={resolve('/gallery/by/[ownerId]', {
              ownerId: owner.publicId,
            })}>{owner.name}</a
          ></span
        >{/if}{#if owner && sharedOn}<span aria-hidden="true">
          ·
        </span>{/if}{#if sharedOn}<span>Published {sharedOn}</span>{/if}
    </p>
  {/if}

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
    <!-- Even when the page can't be found, so its owner can unpublish it -->
    {#if __ACCOUNTS_ENABLED__}
      <GalleryOwnerMenu {postId} {kind} onowner={(next) => (owner = next)} />
    {/if}
  </div>
</div>

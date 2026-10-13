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
  The top of a gallery page, the same for projects and palettes: its owner's
  bar, its name, a line under it, "By <name> · Shared <date>", then Open a
  Copy, Copy Page Link and any `actions` after them.
-->
<script lang="ts">
  import { resolve } from '$app/paths';
  import { PUBLIC_BASE_URL } from '$app/env/public';
  import GalleryOwnerBar from '#lib/components/account/GalleryOwnerBar.svelte';
  import type { GalleryOwner } from '#lib/server/gallery/store.js';
  import { copyToClipboard } from '#lib/utils/clipboard-utils.js';
  import { LinkIcon } from '@lucide/svelte';
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
    /** More buttons after Copy Page Link */
    actions?: Snippet;
  }

  let {
    postId,
    kind,
    owner = $bindable(),
    date,
    heading,
    subtitle,
    open,
    actions,
  }: Props = $props();

  let sharedOn = $derived(
    date
      ? new Date(date).toLocaleDateString(undefined, { dateStyle: 'medium' })
      : '',
  );
  let pageLink = $derived(
    `${PUBLIC_BASE_URL}/gallery/${kind === 'palette' ? 'palette/' : ''}${postId}`,
  );
</script>

<div
  class="bg-surface-100 dark:bg-surface-900 flex flex-col gap-2 p-4 text-center"
>
  <!-- Even when the page can't be found, so its owner can unpublish it -->
  {#if __ACCOUNTS_ENABLED__}
    <GalleryOwnerBar {postId} {kind} onowner={(next) => (owner = next)} />
  {/if}
  <h1 class="text-2xl font-bold break-words">{@render heading()}</h1>
  {#if subtitle}
    <p>{@render subtitle()}</p>
  {/if}
  {#if owner || sharedOn}
    <p class="text-surface-600-400 text-sm">
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
        </span>{/if}{#if sharedOn}<span>Shared {sharedOn}</span>{/if}
    </p>
  {/if}

  {#if open || actions}
    <div class="mt-2 flex flex-wrap items-center justify-center gap-2">
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
        <button
          type="button"
          class="btn hover:preset-tonal-surface"
          title="Copy this gallery page’s link"
          onclick={() => copyToClipboard(pageLink, 'Page link copied')}
        >
          <LinkIcon />
          Copy Page Link
        </button>
      {/if}
      {@render actions?.()}
    </div>
  {/if}
</div>

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

<script lang="ts" module>
  /** The picture's size in each layout, also for whatever stands in for it */
  export const coverClasses = {
    grid: 'w-full max-w-[130px] sm:max-w-[210px] md:max-w-[215px] aspect-[4/5]',
    list: 'h-28 w-24 shrink-0 sm:h-32 sm:w-32',
  };
  /** The picture itself in each layout: whole, at its own shape */
  export const imageClasses = {
    grid: 'max-w-[130px] sm:max-w-[210px] md:max-w-[215px] rounded-nested',
    // The whole picture, in a box beside the name
    list: 'h-28 w-24 shrink-0 object-contain sm:h-32 sm:w-32',
    row: 'max-h-64 max-w-[225px] lg:max-h-[600px] lg:max-w-[370px] rounded-nested',
  };
</script>

<!-- @component
  A project as a card (a raised box, as a palette's): its preview image (or a `cover` in its place), its name
  (or its places and dates), when it was published, then who by and its
  views (as on its gallery page), all one link, as on
  My Library. In a grid or row it stands up, the picture over the name; in a
  list it lies down, the picture beside the name.
  The gallery's cards are only that; My Projects gives its own `nameRow` (with
  its ⋮ menu, outside the link), `details` and a `footer` with its sharing.
-->
<script lang="ts">
  import GalleryCardByline from '#lib/components/GalleryCardByline.svelte';
  import { CARD_BOX, CARD_HOVER } from '#lib/constants/class-constants.js';
  import type { Snippet } from 'svelte';

  interface Props {
    href: string;
    /** The preview image; without it, `cover` */
    image?: string | null;
    /** The name it was given, else its places and dates (plain text) */
    label?: string;
    /** When it was published (the gallery post's date) */
    date?: string | null;
    /** Who published it, when their name shows on its gallery page */
    author?: string | null;
    /** Its gallery page's views, all time (none shows nothing) */
    views?: number | null;
    layout?: 'grid' | 'list' | 'row';
    /** In place of the image, when there's none (sized with `coverClasses`) */
    cover?: Snippet;
    /** In place of the name and places, outside the link; it has the link
    for screen readers and the keyboard then (the picture's is for the mouse) */
    nameRow?: Snippet;
    /** Under the name */
    details?: Snippet;
    footer?: Snippet;
    /** For a link that needs a full page load (a project opened in the planner) */
    reload?: boolean;
    title?: string;
  }

  let {
    href,
    image,
    label = '',
    date,
    author,
    views,
    layout = 'grid',
    cover,
    nameRow,
    details,
    footer,
    reload = false,
    title,
  }: Props = $props();

  let list = $derived(layout === 'list');
</script>

<div
  class={[
    CARD_BOX,
    CARD_HOVER,
    'flex gap-1',
    layout === 'row'
      ? 'mx-auto min-h-[200px] max-w-[245px] shrink-0 snap-center lg:max-w-[350px]'
      : 'w-full',
    list
      ? 'flex-row items-center gap-3 text-left'
      : 'flex-col items-center text-center',
  ]}
>
  <!-- eslint-disable-next-line svelte/no-navigation-without-resolve -->
  <a
    {href}
    {title}
    data-sveltekit-preload-data="tap"
    data-sveltekit-reload={reload ? '' : undefined}
    class={list
      ? ['flex min-w-0 items-center gap-3', nameRow ? 'shrink-0' : 'grow']
      : 'flex w-full flex-col items-center gap-1'}
    aria-hidden={nameRow ? 'true' : undefined}
    tabindex={nameRow ? -1 : undefined}
  >
    {#if image}
      <img src={image} alt="" class={imageClasses[layout]} loading="lazy" />
    {:else}
      {@render cover?.()}
    {/if}
    {#if !nameRow}
      <span class="flex w-full min-w-0 flex-col text-left">
        <span class="line-clamp-2 text-sm font-semibold break-words"
          >{label || 'Untitled Project'}</span
        >
        <GalleryCardByline {date} {author} {views} />
      </span>
    {/if}
  </a>
  {#if nameRow || details || footer}
    <div class={list ? 'flex min-w-0 grow flex-col gap-1' : 'contents'}>
      {@render nameRow?.()}
      {@render details?.()}
      {@render footer?.()}
    </div>
  {/if}
</div>

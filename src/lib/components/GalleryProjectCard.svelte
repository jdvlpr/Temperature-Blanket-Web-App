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
  A project as a card: its preview image (or a `cover` in its place), its name
  and its places and dates, all one link. The gallery's cards are only that;
  My Projects gives its own `nameRow` (with a rename pencil, outside the link),
  `details` and a `footer` with its sharing and ⋮ menu.
-->
<script lang="ts">
  import type { Snippet } from 'svelte';

  interface Props {
    href: string;
    /** The preview image; without it, `cover` */
    image?: string | null;
    /** The name it was given, if any */
    name?: string | null;
    /** Its places and dates, as HTML (escaped by getTitleFromLocationsMeta) */
    placesHtml?: string;
    layout?: 'grid' | 'list' | 'row';
    /** In place of the image, when there's none */
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
    name,
    placesHtml = '',
    layout = 'grid',
    cover,
    nameRow,
    details,
    footer,
    reload = false,
    title,
  }: Props = $props();

  const imageClass = {
    grid: 'max-w-[130px] sm:max-w-[210px] md:max-w-[215px]',
    list: 'max-h-[900px] max-w-full',
    row: 'max-h-64 max-w-[225px] lg:max-h-[600px] lg:max-w-[370px]',
  };
</script>

<div
  class={[
    'rounded-container hover:bg-surface-100-900 flex flex-col gap-1 p-2 text-center',
    layout === 'row'
      ? 'mx-auto min-h-[200px] max-w-[245px] shrink-0 snap-center lg:max-w-[350px]'
      : 'w-full',
    layout === 'list' ? 'items-center justify-start' : 'items-center',
  ]}
>
  <!-- eslint-disable-next-line svelte/no-navigation-without-resolve -->
  <a
    {href}
    {title}
    data-sveltekit-reload={reload ? '' : undefined}
    class="flex w-full flex-col items-center gap-1"
    aria-hidden={nameRow ? 'true' : undefined}
    tabindex={nameRow ? -1 : undefined}
  >
    {#if image}
      <img src={image} alt="" class={imageClass[layout]} loading="lazy" />
    {:else}
      {@render cover?.()}
    {/if}
    {#if !nameRow}
      <p class="line-clamp-4 text-xs">
        {#if name}<span class="block text-sm font-semibold">{name}</span>{/if}
        <!-- Escaped by getTitleFromLocationsMeta -->
        {@html placesHtml}
      </p>
    {/if}
  </a>
  {@render nameRow?.()}
  {@render details?.()}
  {@render footer?.()}
</div>

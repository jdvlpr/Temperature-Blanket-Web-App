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
  A saved project's picture, as on My Library's cards: the one kept in this
  browser for this version of it (see $lib/storage/thumbnails), else
  `fallbackImage`; while one may still be drawn, a placeholder; else its
  colors. Read once it's near the screen. Only a picture: the name beside it
  says what it is.
-->
<script lang="ts">
  import PaletteStrip from '#lib/components/PaletteStrip.svelte';
  import { getThumbnail } from '#lib/storage/thumbnails.js';
  import { getColorsFromInput } from '#lib/utils/color-utils.js';
  import { extraColorsFromProjectHref } from '#lib/utils/extra-colors-utils.js';
  import type { Attachment } from 'svelte/attachments';

  interface Props {
    /** The project's ID and link: its picture is kept by them */
    id: string;
    href: string;
    /** A picture from elsewhere (the gallery's), when none is kept here */
    fallbackImage?: string | null;
    /** Bumped when pictures were drawn in the background, to look again */
    picturesVersion?: number;
    /** Without a picture by now, it shows its colors instead of a placeholder */
    pictureSettled?: boolean;
    /** The picture's size */
    imageClass?: string;
    /** The size of whatever stands in for it */
    coverClass?: string;
    /** The colors' height, when it has no picture */
    stripHeight?: string;
  }

  let {
    id,
    href,
    fallbackImage,
    picturesVersion = 0,
    pictureSettled = true,
    imageClass = '',
    coverClass = '',
    stripHeight = '70px',
  }: Props = $props();

  // Whichever stands for it now: it's what's watched for the screen
  let box = $state<HTMLElement>();
  const watch: Attachment<HTMLElement> = (element) => {
    box = element;
  };
  let thumbnail = $state<string | null>(null);
  $effect(() => {
    if (!box || !href) return;
    void picturesVersion;
    const pictureId = id;
    const pictureHref = href;
    let current = true;
    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) return;
        observer.disconnect();
        getThumbnail(pictureId, pictureHref).then((image) => {
          if (current) thumbnail = image;
        });
      },
      { rootMargin: '400px' },
    );
    observer.observe(box);
    return () => {
      current = false;
      observer.disconnect();
    };
  });

  let image = $derived(thumbnail ?? fallbackImage);

  let colors = $derived(
    href
      ? [
          ...(getColorsFromInput({ string: href }) || []),
          ...extraColorsFromProjectHref(href).map((extra) => extra.color),
        ]
      : [],
  );
</script>

{#if image}
  <img src={image} alt="" class={imageClass} loading="lazy" {@attach watch} />
{:else if !pictureSettled}
  <div
    class="placeholder rounded-container animate-pulse {coverClass}"
    aria-hidden="true"
    {@attach watch}
  ></div>
{:else if colors.length}
  <div
    class="flex items-center {coverClass}"
    aria-hidden="true"
    {@attach watch}
  >
    <div class="w-full">
      <PaletteStrip {colors} height={stripHeight} insideControl />
    </div>
  </div>
{:else}
  <!-- Nothing to show, but its place is kept, so they line up -->
  <div
    class="placeholder rounded-container {coverClass}"
    aria-hidden="true"
    {@attach watch}
  ></div>
{/if}

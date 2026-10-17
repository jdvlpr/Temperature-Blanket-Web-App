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
  A palette from the gallery, as a card. In the gallery (`mode="page"`)
  tapping it opens its gallery page. In the Yarn Palette Creator's Browse
  Palettes (`mode="use"`) tapping it uses it (`onclick`). Either way it says when it was published, who by
  (when their name shows on its page) and its page's views, with a star
  beside the name in the gallery (a palette page's). In a list
  (`layout="list"`) it lies down, the colors beside the name.
-->
<script lang="ts">
  import { resolve } from '$app/paths';
  import PaletteCard from '#lib/components/PaletteCard.svelte';
  import GalleryCardByline from '#lib/components/GalleryCardByline.svelte';
  import GalleryStarButton from '#lib/components/GalleryStarButton.svelte';
  import type { GalleryPalette } from '#lib/utils/color-utils.js';

  interface Props {
    palette: GalleryPalette;
    /** Who published its page, when their name shows there */
    author?: string | null;
    mode?: 'page' | 'use';
    /** Uses the palette (`mode="use"`) */
    onclick?: () => void;
    layout?: 'grid' | 'list';
  }

  let {
    palette,
    author,
    mode = 'page',
    onclick,
    layout = 'grid',
  }: Props = $props();

  // Its own page, or (from a gallery before palette pages) its project's
  let pageHref = $derived(
    palette.page.kind === 'palette'
      ? resolve('/gallery/palette/[id]', { id: String(palette.page.id) })
      : resolve('/gallery/[id]', { id: String(palette.page.id) }),
  );
  let pageLabel = $derived(
    palette.page.kind === 'palette' ? 'Palette Page' : 'Project Page',
  );
</script>

<PaletteCard
  colors={palette.colors}
  name={palette.page.title}
  href={mode === 'page' ? pageHref : undefined}
  onclick={mode === 'use' ? onclick : undefined}
  title={mode === 'page' ? `Open ${pageLabel}` : 'Use This Palette'}
  {layout}
  card={mode === 'use'}
>
  {#snippet action()}
    {#if mode === 'page' && palette.page.kind === 'palette'}
      <GalleryStarButton
        postId={Number(palette.page.id)}
        kind="palette"
        name={palette.page.title || 'Untitled Palette'}
      />
    {/if}
  {/snippet}
  {#snippet details()}
    <GalleryCardByline
      date={palette.page.date}
      {author}
      views={palette.page.views}
    />
  {/snippet}
</PaletteCard>

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
  tapping it opens its gallery page, and its ⋮ menu has Open a Copy (`onopen`
  runs first, to bring its colors) and Copy Page Link. In the Yarn Palette
  Creator's Browse Palettes (`mode="use"`) tapping it uses it (`onclick`), and
  the menu has its page (in a new tab, so the palette being made stays open).
-->
<script lang="ts">
  import { resolve } from '$app/paths';
  import { PUBLIC_BASE_URL } from '$app/env/public';
  import PaletteCard from '#lib/components/PaletteCard.svelte';
  import type { MoreMenuItem } from '#lib/components/buttons/MoreMenu.svelte';
  import type { GalleryPalette } from '#lib/utils/color-utils.js';
  import { copyToClipboard } from '#lib/utils/clipboard-utils.js';
  import { LinkIcon, PaletteIcon, SwatchBookIcon } from '@lucide/svelte';

  interface Props {
    palette: GalleryPalette;
    mode?: 'page' | 'use';
    /** Uses the palette (`mode="use"`) */
    onclick?: () => void;
    /** Brings its colors to the Yarn Palette Creator, before Open a Copy goes there */
    onopen?: () => void;
  }

  let { palette, mode = 'page', onclick, onopen }: Props = $props();

  // Its own page, or (from a gallery before palette pages) its project's
  let pageHref = $derived(
    palette.page.kind === 'palette'
      ? resolve('/gallery/palette/[id]', { id: String(palette.page.id) })
      : resolve('/gallery/[id]', { id: String(palette.page.id) }),
  );
  let copyPageLink: MoreMenuItem = $derived({
    value: 'copy-page-link',
    label: 'Copy Page Link',
    icon: LinkIcon,
    onselect: () =>
      copyToClipboard(`${PUBLIC_BASE_URL}${pageHref}`, 'Page link copied'),
  });
  let menu = $derived<MoreMenuItem[]>(
    mode === 'page'
      ? [
          {
            value: 'open-copy',
            label: 'Open a Copy',
            icon: PaletteIcon,
            href: resolve('/yarn'),
            onselect: onopen,
          },
          copyPageLink,
        ]
      : [
          {
            value: 'page',
            label: palette.page.kind === 'palette' ? 'Palette Page' : 'Project Page',
            icon: SwatchBookIcon,
            href: pageHref,
            newTab: true,
          },
          copyPageLink,
        ],
  );
</script>

<PaletteCard
  colors={palette.colors}
  name={palette.page.title}
  href={mode === 'page' ? pageHref : undefined}
  onclick={mode === 'use' ? onclick : undefined}
  title={mode === 'page'
    ? palette.page.kind === 'palette'
      ? 'Open Palette Page'
      : 'Open Project Page'
    : 'Use This Palette'}
  {menu}
/>

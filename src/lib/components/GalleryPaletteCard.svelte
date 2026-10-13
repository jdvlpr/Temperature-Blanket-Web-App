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
  tapping it opens its gallery page, and the button beside its name opens a
  copy in the Yarn Palette Creator (`onopen` runs first, to bring its colors).
  In the Yarn Palette Creator's Browse Palettes (`mode="use"`) tapping it uses
  it (`onclick`), and the button opens its page in a new tab, so the palette
  being made stays open.
-->
<script lang="ts">
  import { resolve } from '$app/paths';
  import PaletteCard from '#lib/components/PaletteCard.svelte';
  import type { GalleryPalette } from '#lib/utils/color-utils.js';
  import { PaletteIcon, SwatchBookIcon } from '@lucide/svelte';

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
>
  {#snippet action()}
    {#if mode === 'page'}
      <a
        href={resolve('/yarn')}
        onclick={onopen}
        class="btn-icon hover:preset-tonal-surface shrink-0"
        title="Open a copy in the Yarn Palette Creator"
        aria-label="Open a copy of {palette.page.title}"
      >
        <PaletteIcon aria-hidden="true" />
      </a>
    {:else}
      <a
        href={pageHref}
        target="_blank"
        rel="noopener"
        class="btn-icon hover:preset-tonal-surface shrink-0"
        title="{pageLabel} (opens in a new tab)"
        aria-label="{pageLabel}: {palette.page.title} (opens in a new tab)"
      >
        <SwatchBookIcon aria-hidden="true" />
      </a>
    {/if}
  {/snippet}
</PaletteCard>

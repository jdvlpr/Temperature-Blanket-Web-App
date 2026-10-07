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
  A palette from the gallery: the colors and their yarns are one link (`href`)
  or button that uses the palette, and its gallery page is a link of its own
  beside it, not inside it.
-->
<script lang="ts">
  import { resolve } from '$app/paths';
  import PaletteStrip from '$lib/components/PaletteStrip.svelte';
  import type { GalleryPalette } from '$lib/utils/color-utils';
  import { pluralize } from '$lib/utils/string-utils';
  import { ExternalLinkIcon } from '@lucide/svelte';

  interface Props {
    palette: GalleryPalette;
    /** Using the palette opens the Yarn Palette Creator; without it, the palette is a button */
    toYarnPage?: boolean;
    onclick: () => void;
  }

  let { palette, toYarnPage = false, onclick }: Props = $props();

  let count = $derived(palette.colors.length);

  const controlClass = 'flex w-full cursor-pointer flex-col gap-y-1 text-left';
</script>

<div class="flex w-full flex-col gap-y-1 text-left">
  {#snippet content()}
    <PaletteStrip colors={palette.colors} insideControl />
    <span class="line-clamp-1 text-xs">
      <span class="sr-only">{toYarnPage ? 'Open' : 'Use'} palette:</span>
      <span class="mr-4">{count} {pluralize('color', count)}</span>
      {palette.yarns.join(', ')}
    </span>
  {/snippet}
  {#if toYarnPage}
    <a
      href={resolve('/yarn')}
      {onclick}
      class={controlClass}
      title="Open in Yarn Palette Creator">{@render content()}</a
    >
  {:else}
    <button
      type="button"
      {onclick}
      class={controlClass}
      title="Use This Palette">{@render content()}</button
    >
  {/if}
  <a
    href={palette.page.kind === 'palette'
      ? resolve('/gallery/palette/[id]', { id: String(palette.page.id) })
      : resolve('/gallery/[id]', { id: String(palette.page.id) })}
    target="_blank"
    rel="noreferrer"
    class={[
      'line-clamp-1 w-fit text-xs underline',
      palette.page.kind === 'palette' && 'font-semibold',
    ]}
    title={palette.page.kind === 'palette'
      ? 'Open Palette Page'
      : 'Open Project Preview Page'}
  >
    <ExternalLinkIcon class="inline size-4" aria-hidden="true" />
    <span class="whitespace-pre-wrap">{palette.page.title}</span>
  </a>
</div>

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
  beside it, not inside it. Other pages with the same colors are listed under
  "Also published by N others".
-->
<script lang="ts">
  import { resolve } from '$app/paths';
  import PaletteStrip from '#lib/components/PaletteStrip.svelte';
  import type { GalleryPalette } from '#lib/utils/color-utils.js';
  import { pluralize } from '#lib/utils/string-utils.js';
  import { ExternalLinkIcon } from '@lucide/svelte';

  interface Props {
    palette: GalleryPalette;
    /** Using the palette opens the Yarn Palette Creator; without it, the palette is a button */
    toYarnPage?: boolean;
    onclick: () => void;
  }

  let { palette, toYarnPage = false, onclick }: Props = $props();
  let count = $derived(palette.colors.length);
  let othersCount = $derived(palette.others.length);

  const pageHref = (page: GalleryPalette['page']) =>
    page.kind === 'palette'
      ? resolve('/gallery/palette/[id]', { id: String(page.id) })
      : resolve('/gallery/[id]', { id: String(page.id) });
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
      href={resolve('yarn')}
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
    href={pageHref(palette.page)}
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
    <ExternalLinkIcon class="icon-sm inline" aria-hidden="true" />
    <span class="whitespace-pre-wrap">{palette.page.title}</span>
  </a>
  {#if othersCount}
    <details class="text-xs">
      <summary class="w-fit cursor-pointer">
        Also published by {othersCount}
        {pluralize('other', othersCount)}
      </summary>
      <ul class="mt-1 flex flex-col gap-1 pl-4">
        {#each palette.others as other (`${other.kind}-${other.id}`)}
          <li>
            <a
              href={pageHref(other)}
              target="_blank"
              rel="noreferrer"
              class="line-clamp-1 w-fit underline"
              >{other.title}<span class="sr-only">
                (opens in a new tab)</span
              ></a
            >
          </li>
        {/each}
      </ul>
    </details>
  {/if}
</div>

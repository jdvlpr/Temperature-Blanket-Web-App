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
  A palette as a card, wherever palettes are listed: its colors and name are
  one link (`href`) or button (`onclick`), "8 colors · Brand Yarn" under the
  name, and one `action` button beside it. My Projects gives its own
  `nameRow` (with a rename pencil, outside the link) and a `footer`.
  In a list it lies down, as a project's card does: the colors beside the name.
-->
<script lang="ts">
  import PaletteStrip from '#lib/components/PaletteStrip.svelte';
  import type { Color } from '#lib/types/yarn-types.js';
  import { pluralize } from '#lib/utils/string-utils.js';
  import type { Snippet } from 'svelte';

  interface Props {
    colors: Color[];
    name: string;
    /** Opens it; without it, `onclick` */
    href?: string;
    onclick?: () => void;
    /** What tapping it does, e.g. "Open Palette Page" */
    title: string;
    reload?: boolean;
    /** "8 colors · yarns" under the name; off when the name already says that */
    summary?: boolean;
    /** One button beside the name, e.g. Open a Copy */
    action?: Snippet;
    /** In place of the name, outside the link; it has the link or button
    for screen readers and the keyboard then (the colors' is for the mouse) */
    nameRow?: Snippet;
    /** After "8 colors · yarns", e.g. "Saved Oct 13" */
    details?: Snippet;
    footer?: Snippet;
    layout?: 'grid' | 'list';
  }

  let {
    colors,
    name,
    href,
    onclick,
    title,
    reload = false,
    action,
    summary = true,
    nameRow,
    details,
    footer,
    layout = 'grid',
  }: Props = $props();

  let list = $derived(layout === 'list');

  let yarns = $derived([
    ...new Set(
      colors
        .filter((color) => color?.brandName && color?.yarnName)
        .map((color) => `${color.brandName} ${color.yarnName}`),
    ),
  ]);
  let controlClass = $derived([
    'flex min-w-0 cursor-pointer flex-col gap-y-1 text-left',
    list ? 'w-28 shrink-0 sm:w-48' : 'w-full',
  ]);
</script>

<div
  class={[
    'flex w-full min-w-0 gap-1 text-left',
    list ? 'flex-row items-center gap-3' : 'flex-col',
  ]}
>
  {#snippet strip()}
    <PaletteStrip {colors} insideControl />
  {/snippet}
  {#snippet text()}
    <span class="line-clamp-2 font-semibold break-words">{name}</span>
  {/snippet}
  {#if href}
    <!-- eslint-disable-next-line svelte/no-navigation-without-resolve -->
    <a
      {href}
      {onclick}
      {title}
      data-sveltekit-preload-data="tap"
      data-sveltekit-reload={reload ? '' : undefined}
      class={controlClass}
      aria-hidden={nameRow ? 'true' : undefined}
      tabindex={nameRow ? -1 : undefined}
    >
      {@render strip()}
      {#if !nameRow}{@render text()}{/if}
    </a>
  {:else}
    <button
      type="button"
      {onclick}
      {title}
      class={controlClass}
      aria-hidden={nameRow ? 'true' : undefined}
      tabindex={nameRow ? -1 : undefined}
    >
      {@render strip()}
      {#if !nameRow}{@render text()}{/if}
    </button>
  {/if}
  <div class={list ? 'flex min-w-0 grow flex-col gap-1' : 'contents'}>
    <div class="flex items-start gap-1">
      <div class="flex min-w-0 grow flex-col gap-0.5">
        {@render nameRow?.()}
        <span
          class={[
            'text-surface-700-300 line-clamp-1 text-xs',
            !summary && 'hidden',
          ]}
        >
          {colors.length}
          {pluralize(
            'color',
            colors.length,
          )}{#if yarns.length}{' · '}{yarns.join(', ')}{/if}
        </span>
        {@render details?.()}
      </div>
      {@render action?.()}
    </div>
    {@render footer?.()}
  </div>
</div>

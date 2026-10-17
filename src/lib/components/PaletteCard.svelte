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
  In a list (from small screens up) it lies down, as a project's card does:
  the colors beside the name (then the name is the link or button for the
  keyboard); on phones a list is one card per row, the colors full width.
-->
<script lang="ts">
  import PaletteStrip from '#lib/components/PaletteStrip.svelte';
  import type { Color } from '#lib/types/yarn-types.js';
  import { ROW_FOCUS } from '#lib/constants/class-constants.js';
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
    /** The whole thing is one button on a card, for choosing a palette (as in
    Browse Palettes): `onclick` only, no `href`, `nameRow`, `action` or `footer` */
    card?: boolean;
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
    card = false,
  }: Props = $props();

  let list = $derived(layout === 'list');

  let yarns = $derived([
    ...new Set(
      colors
        .filter((color) => color?.brandName && color?.yarnName)
        .map((color) => `${color.brandName} ${color.yarnName}`),
    ),
  ]);
  // The name beside the colors (a list, or the page's own `nameRow`): the
  // colors are then the link or button for the mouse only
  let nameApart = $derived(!!nameRow || list);
  let controlClass = $derived([
    'flex min-w-0 cursor-pointer flex-col gap-y-1 text-left',
    list ? 'w-full sm:w-48 sm:shrink-0' : 'w-full',
  ]);
</script>

{#snippet strip()}
  <PaletteStrip {colors} insideControl smallCorners />
{/snippet}
{#snippet text()}
  <span class="line-clamp-2 font-semibold break-words">{name}</span>
{/snippet}
{#snippet summaryLine()}
  <span
    class={['text-surface-700-300 line-clamp-1 text-xs', !summary && 'hidden']}
  >
    {colors.length}
    {pluralize('color', colors.length)}{#if yarns.length}{' · '}{yarns.join(
        ', ',
      )}{/if}
  </span>
{/snippet}

{#if card}
  <button
    type="button"
    {onclick}
    {title}
    class={[
      'bg-surface-100 dark:bg-surface-900 hover:bg-surface-200 dark:hover:bg-surface-800 rounded-container card-border flex w-full min-w-0 cursor-pointer gap-2 p-2 text-left transition-colors',
      ROW_FOCUS,
      list ? 'flex-col sm:flex-row sm:items-center sm:gap-3' : 'flex-col',
    ]}
  >
    <span class={list ? 'w-full sm:w-48 sm:shrink-0' : 'w-full'}
      >{@render strip()}</span
    >
    <span class="flex min-w-0 grow flex-col gap-0.5">
      <span class="sr-only">Use</span>
      {@render text()}
      {@render summaryLine()}
      {@render details?.()}
    </span>
  </button>
{:else}
  <div
    class={[
      'flex w-full min-w-0 gap-1 text-left',
      list ? 'flex-col sm:flex-row sm:items-center sm:gap-3' : 'flex-col',
    ]}
  >
    {#if href}
      <!-- eslint-disable-next-line svelte/no-navigation-without-resolve -->
      <a
        {href}
        {onclick}
        {title}
        data-sveltekit-preload-data="tap"
        data-sveltekit-reload={reload ? '' : undefined}
        class={controlClass}
        aria-hidden={nameApart ? 'true' : undefined}
        tabindex={nameApart ? -1 : undefined}
      >
        {@render strip()}
        {#if !nameApart}{@render text()}{/if}
      </a>
    {:else}
      <button
        type="button"
        {onclick}
        {title}
        class={controlClass}
        aria-hidden={nameApart ? 'true' : undefined}
        tabindex={nameApart ? -1 : undefined}
      >
        {@render strip()}
        {#if !nameApart}{@render text()}{/if}
      </button>
    {/if}
    <div class={list ? 'flex min-w-0 grow flex-col gap-1' : 'contents'}>
      <div class="flex items-start gap-1">
        <div class="flex min-w-0 grow flex-col gap-0.5">
          {#if nameRow}
            {@render nameRow()}
          {:else if list && href}
            <!-- eslint-disable-next-line svelte/no-navigation-without-resolve -->
            <a
              {href}
              {onclick}
              {title}
              data-sveltekit-preload-data="tap"
              data-sveltekit-reload={reload ? '' : undefined}
              class="text-left">{@render text()}</a
            >
          {:else if list}
            <button
              type="button"
              {onclick}
              {title}
              class="cursor-pointer text-left">{@render text()}</button
            >
          {/if}
          {@render summaryLine()}
          {@render details?.()}
        </div>
        {@render action?.()}
      </div>
      {@render footer?.()}
    </div>
  </div>
{/if}

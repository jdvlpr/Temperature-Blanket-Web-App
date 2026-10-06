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
  A yarn colorway's actions: copy its hex code (and, in a row, its name), and
  buy it or open its page. A colorway that's no longer sold says so instead
  of linking. `layout="card"` fits under a card's name, which copies the name
  itself; `layout="row"` fits on one line.
-->
<script lang="ts">
  import type { Color } from '$lib/types/yarn-types';
  import { CopyIcon, ExternalLinkIcon, ShoppingCartIcon } from '@lucide/svelte';
  import { copyColorwayText } from './colorway-utils';

  interface Props {
    colorway: Color;
    layout?: 'card' | 'row';
  }

  let { colorway, layout = 'card' }: Props = $props();

  let { name, hex, affiliate_variant_href, variant_href, unavailable } =
    $derived(colorway);
</script>

<div
  class={layout === 'card'
    ? 'grid grid-cols-[minmax(0,1fr)_auto] gap-2'
    : 'flex flex-wrap items-center justify-end gap-2'}
>
  {#if name && layout === 'row'}
    <button
      type="button"
      class="btn preset-tonal-surface min-h-11 min-w-0"
      aria-label="Copy name {name}"
      onclick={() => copyColorwayText(name)}
    >
      <CopyIcon size={16} aria-hidden="true" />
      <span class="truncate">Name</span>
    </button>
  {/if}
  {#if hex}
    <button
      type="button"
      class="btn preset-tonal-surface min-h-11 min-w-0 justify-between font-mono"
      aria-label="Copy hex code {hex}"
      onclick={() => copyColorwayText(hex)}
    >
      <span class="truncate">{hex}</span>
      <CopyIcon size={16} aria-hidden="true" />
    </button>
  {/if}

  <!-- eslint-disable svelte/no-navigation-without-resolve -- yarn makers' and shops' own pages -->
  {#if unavailable}
    <p
      class="preset-tonal-surface rounded-container px-3 py-2 text-center text-xs {layout ===
      'card'
        ? 'col-span-2'
        : ''}"
    >
      No longer available
    </p>
  {:else if affiliate_variant_href}
    <a
      class="btn preset-filled-primary min-h-11 {layout === 'card'
        ? 'w-11 px-0'
        : ''}"
      href={affiliate_variant_href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Buy {name} (opens in a new tab)"
      title="Buy {name}"
    >
      <ShoppingCartIcon size={18} aria-hidden="true" />
      {#if layout === 'row'}<span class="sr-only sm:not-sr-only">Buy</span>{/if}
    </a>
  {:else if variant_href}
    <a
      class="btn preset-outlined-surface-300-700 min-h-11 {layout === 'card'
        ? 'w-11 px-0'
        : ''}"
      href={variant_href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="View {name} on the maker's site (opens in a new tab)"
      title="View {name} on the maker's site"
    >
      <ExternalLinkIcon size={18} aria-hidden="true" />
      {#if layout === 'row'}<span class="sr-only sm:not-sr-only">View</span
        >{/if}
    </a>
  {/if}
  <!-- eslint-enable svelte/no-navigation-without-resolve -->
</div>

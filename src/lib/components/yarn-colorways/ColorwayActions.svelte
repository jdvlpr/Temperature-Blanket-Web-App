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
  A yarn colorway's actions: a copy menu (its name or hex code), and buy it
  or open its page. A colorway that's no longer sold says so instead of
  linking. `layout="card"` fills a card's width; `layout="row"` fits on one line.
-->
<script lang="ts">
  import type { Color } from '$lib/types/yarn-types';
  import { ExternalLinkIcon, ShoppingCartIcon } from '@lucide/svelte';
  import CopyColorwayMenu from './CopyColorwayMenu.svelte';

  interface Props {
    colorway: Color;
    layout?: 'card' | 'row';
  }

  let { colorway, layout = 'card' }: Props = $props();

  let { name, affiliate_variant_href, variant_href, unavailable } =
    $derived(colorway);

  // A card's link fills the space beside the copy menu
  let linkWidth = $derived(layout === 'card' ? 'flex-1' : '');
</script>

<div class="flex items-center gap-2 {layout === 'row' ? 'justify-end' : 'justify-between'}">
  <CopyColorwayMenu {colorway} labeled={layout === 'row'} />

  <!-- eslint-disable svelte/no-navigation-without-resolve -- yarn makers' and shops' own pages -->
  {#if unavailable}
    <p
      class="text-surface-700-300 {linkWidth} text-center text-xs leading-tight"
    >
      No longer available
    </p>
  {:else if affiliate_variant_href}
    <a
      class={[layout === 'row' ? 'btn hover:preset-tonal-surface shrink-0 px-2 sm:px-3'
      : 'btn-icon hover:preset-tonal-surface size-8 shrink-0']}
      href={affiliate_variant_href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Buy {name} (opens in a new tab)"
    >
      <ShoppingCartIcon size={18} aria-hidden="true" />
      <span
        class:sr-only={layout === 'card'}
        class:sm:not-sr-only={layout === 'row'}>Buy</span
      >
    </a>
  {:else if variant_href}
    <a
        class={[layout === 'row' ? 'btn hover:preset-tonal-surface shrink-0 px-2 sm:px-3'
        : 'btn-icon hover:preset-tonal-surface size-8 shrink-0']}
      href={variant_href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="View {name} on the maker's site (opens in a new tab)"
    >
      <ExternalLinkIcon size={18} aria-hidden="true" />
      <span
        class:sr-only={layout === 'card'}
        class:sm:not-sr-only={layout === 'row'}>View</span
      >
    </a>
  {/if}
  <!-- eslint-enable svelte/no-navigation-without-resolve -->
</div>

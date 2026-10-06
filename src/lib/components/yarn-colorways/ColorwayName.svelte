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
  A yarn colorway's name, linking to where to buy it (a shopping cart) or to
  the page it's listed on. The icon shows on hover and keyboard focus, and always on
  touch screens, which can't hover, so the cart that marks affiliate links is
  never hidden from anyone. It sits in a zero-width slot, so showing it never
  changes the name's size or wrapping. Not sold anymore, the name is plain text.
-->
<script lang="ts">
  import type { Color } from '$lib/types/yarn-types';
  import { ExternalLinkIcon, ShoppingCartIcon } from '@lucide/svelte';
  import { linkSite } from './colorway-utils';

  interface Props {
    colorway: Color;
    class?: string;
  }

  let { colorway, class: className = '' }: Props = $props();

  let href = $derived(
    colorway.unavailable
      ? undefined
      : colorway.affiliate_variant_href || colorway.variant_href || undefined,
  );
  let isAffiliate = $derived(
    !colorway.unavailable && !!colorway.affiliate_variant_href,
  );
</script>

{#if href}
  <!-- eslint-disable svelte/no-navigation-without-resolve -- yarn shops' and makers' own pages -->
  <a
    {href}
    target="_blank"
    rel="noopener noreferrer"
    class="group rounded-sm underline-offset-2 hover:underline focus-visible:underline {className}"
    title={isAffiliate
      ? `Buy ${colorway.name}`
      : `View ${colorway.name} on ${linkSite(href) ?? 'its site'}`}
  >
    {colorway.name}<span class="sr-only"
      >{isAffiliate
        ? ', buy this colorway'
        : `, on ${linkSite(href) ?? 'its site'}`} (opens in a new tab)</span
    ><span
      class="relative inline-block h-[1lh] w-0 align-top"
      aria-hidden="true"
      ><span
        class="absolute top-1/2 left-1 -translate-y-1/2 opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100 [@media(hover:none)]:opacity-100"
      >
        {#if isAffiliate}
          <ShoppingCartIcon size={14} />
        {:else}
          <ExternalLinkIcon size={14} />
        {/if}
      </span></span
    >
  </a>
  <!-- eslint-enable svelte/no-navigation-without-resolve -->
{:else}
  <span class={className}>{colorway.name}</span>
{/if}

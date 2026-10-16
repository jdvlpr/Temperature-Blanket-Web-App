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
  A Share dialog section's heading and status line, with where it's shared
  (its gallery page, its Ravelry project) as a link beside the heading, apart
  from what can be done with it.
-->
<script lang="ts">
  import { ExternalLinkIcon } from '@lucide/svelte';
  import type { Snippet } from 'svelte';

  let {
    id,
    title,
    href,
    linkText,
    children,
  }: {
    /** The heading's id, which the section is labelled by */
    id: string;
    title: string;
    /** Opens in a new tab; none, no link */
    href?: string;
    linkText: string;
    /** The status line */
    children?: Snippet;
  } = $props();
</script>

<div class="flex flex-col gap-0.5">
  <div class="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
    <h3 {id} class="font-bold">{title}</h3>
    {#if href}
      <!-- eslint-disable svelte/no-navigation-without-resolve -- resolved by the caller, or another site -->
      <a
        class="anchor inline-flex items-center gap-1 text-sm font-bold"
        {href}
        target="_blank"
        rel="noopener noreferrer"
        >{linkText}<ExternalLinkIcon class="icon-sm" aria-hidden="true" /><span
          class="sr-only"
        >
          (opens in a new tab)</span
        ></a
      >
      <!-- eslint-enable svelte/no-navigation-without-resolve -->
    {/if}
  </div>
  {#if children}
    <p class="text-sm opacity-80">{@render children()}</p>
  {/if}
</div>

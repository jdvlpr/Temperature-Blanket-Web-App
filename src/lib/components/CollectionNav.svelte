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
  Projects | Yarn Palettes, between two pages that list the same kind of
  things (My Library, the Gallery, an owner's gallery page). It looks like a
  segmented control, but each side is a link to its own page, marked as the
  current page when it's this one. A count, when given, follows each label.
  Below lg it's pinned to the bottom of the screen, in thumb reach, like Browse
  Palettes' sources; on phones each name sits under its icon.
-->
<script lang="ts">
  import { BOTTOM_BAR } from '#lib/constants/class-constants.js';
  import { NotebookPenIcon, SwatchBookIcon } from '@lucide/svelte';

  let {
    current,
    projectsHref,
    palettesHref,
    projectsCount,
    palettesCount,
    label,
  }: {
    current: 'projects' | 'palettes';
    projectsHref: string;
    palettesHref: string;
    projectsCount?: number | null;
    palettesCount?: number | null;
    /** Names the links for screen readers, e.g. "My Library" */
    label: string;
  } = $props();

  const items = $derived([
    {
      key: 'projects',
      href: projectsHref,
      icon: NotebookPenIcon,
      text: 'Projects',
      count: projectsCount,
    },
    {
      key: 'palettes',
      href: palettesHref,
      icon: SwatchBookIcon,
      text: 'Yarn Palettes',
      count: palettesCount,
    },
  ]);

  // The bottom bar's height (0 from lg, where it's hidden), so the page, its
  // toasts and To Top buttons make room for it
  let barHeight = $state(0);
  const VAR = '--bottom-bar-height';

  $effect(() => {
    const value = `${barHeight}px`;
    const root = document.documentElement.style;
    root.setProperty(VAR, value);
    // Only its own: the next page's bar may have set it already, as pages
    // overlap while navigating
    return () => {
      if (root.getPropertyValue(VAR) === value) root.removeProperty(VAR);
    };
  });
</script>

{#snippet links()}
  <ul
    class="bg-surface-100 dark:bg-surface-900 rounded-container grid grid-cols-2 gap-1 p-1"
  >
    {#each items as { key, href, icon: Icon, text, count } (key)}
      {@const isCurrent = key === current}
      <li class="flex">
        <!-- eslint-disable-next-line svelte/no-navigation-without-resolve -- resolved by the page -->
        <a
          {href}
          data-sveltekit-preload-data="hover"
          aria-current={isCurrent ? 'page' : undefined}
          class={[
            'btn w-full justify-center gap-1 max-sm:h-auto max-sm:flex-col max-sm:gap-0.5 max-sm:py-1 max-sm:text-xs',
            isCurrent
              ? 'preset-filled-surface-50-950 shadow-sm'
              : 'hover:preset-tonal-surface',
          ]}
        >
          <Icon aria-hidden="true" />
          <span class="flex items-center gap-1">
            <span>
              {#if key === 'palettes'}<span class="max-sm:hidden">Yarn</span>
                Palettes{:else}{text}{/if}
            </span>
            {#if typeof count === 'number'}
              <span
                class={[
                  'rounded-full px-1.5 text-xs tabular-nums',
                  isCurrent ? 'bg-surface-200-800' : 'bg-surface-200-800/60',
                ]}
                aria-hidden="true">{count}</span
              >
              <span class="sr-only">({count})</span>
            {/if}
          </span>
        </a>
      </li>
    {/each}
  </ul>
{/snippet}

<!-- Only one shows at a time, so screen readers find one of these -->
<nav class="mx-auto w-full max-w-md px-2 max-lg:hidden" aria-label={label}>
  {@render links()}
</nav>

<!-- Stays still as the page changes between the two -->
<nav
  class={[
    BOTTOM_BAR,
    'fixed inset-x-0 bottom-0 z-20 [view-transition-name:collection-nav] lg:hidden',
  ]}
  aria-label={label}
  data-bottom-bar
  bind:clientHeight={barHeight}
>
  <div class="mx-auto w-full max-w-md">
    {@render links()}
  </div>
</nav>

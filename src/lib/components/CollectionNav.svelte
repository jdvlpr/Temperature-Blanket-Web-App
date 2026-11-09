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
  things (My Library, the Gallery, an owner's gallery page). Two pill links,
  each to its own page, the current one filled. A count, when given, follows
  each label.
  It sits in the page at the top on every screen size.
-->
<script lang="ts">
  import { ThermometerSunIcon, SwatchBookIcon } from '@lucide/svelte';

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
      icon: ThermometerSunIcon,
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
</script>

<nav aria-label={label}>
  <ul class="flex flex-wrap gap-2">
    {#each items as { key, href, icon: Icon, text, count } (key)}
      {@const isCurrent = key === current}
      <li class="flex">
        <!-- eslint-disable-next-line svelte/no-navigation-without-resolve -- resolved by the page -->
        <a
          {href}
          data-sveltekit-preload-data="hover"
          aria-current={isCurrent ? 'page' : undefined}
          class={['btn gap-1', isCurrent ? 'preset-filled' : 'preset-tonal']}
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
                  isCurrent ? 'bg-surface-50-950/20' : 'bg-surface-200-800/60',
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
</nav>

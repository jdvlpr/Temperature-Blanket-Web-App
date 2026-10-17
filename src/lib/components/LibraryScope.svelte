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
  Mine | Starred on a My Library page, under Projects | Palettes: what's
  saved, or gallery pages starred to find again. A segmented control like
  CollectionNav, each side a link (`?show=starred`), with a count when known.
  Always in the page, at the top, also on phones (where Projects | Palettes
  sits in the bottom bar). In a dialog (Get Colors' My Palettes), with
  `onselect` instead of addresses, each side is a button.
-->
<script lang="ts">
  import { StarIcon, UserRoundIcon } from '@lucide/svelte';

  let {
    starred,
    mineHref,
    starredHref,
    onselect,
    mineCount,
    starredCount,
    label,
  }: {
    /** Starred is showing */
    starred: boolean;
    mineHref?: string;
    starredHref?: string;
    /** Chooses a side, in place of the links */
    onselect?: (starred: boolean) => void;
    mineCount?: number | null;
    starredCount?: number | null;
    /** Names the links for screen readers, e.g. "Projects to show" */
    label: string;
  } = $props();

  const items = $derived([
    {
      key: 'mine',
      href: mineHref,
      starred: false,
      icon: UserRoundIcon,
      text: 'Mine',
      count: mineCount,
      current: !starred,
    },
    {
      key: 'starred',
      href: starredHref,
      starred: true,
      icon: StarIcon,
      text: 'Starred',
      count: starredCount,
      current: starred,
    },
  ]);
</script>

{#snippet face(
  Icon: typeof StarIcon,
  text: string,
  count: number | null | undefined,
  current: boolean,
)}
  <Icon aria-hidden="true" />
  <span>{text}</span>
  {#if typeof count === 'number'}
    <span
      class={[
        'rounded-full px-1.5 text-xs tabular-nums',
        current ? 'bg-surface-200-800' : 'bg-surface-200-800/60',
      ]}
      aria-hidden="true">{count}</span
    >
    <span class="sr-only">({count})</span>
  {/if}
{/snippet}

<nav class="mx-auto w-full max-w-xs px-2" aria-label={label}>
  <ul
    class="bg-surface-100 dark:bg-surface-900 rounded-container grid grid-cols-2 gap-1 p-1"
  >
    {#each items as { key, href, starred: side, icon, text, count, current } (key)}
      {@const classes = [
        'btn btn-sm w-full justify-center gap-1',
        current
          ? 'preset-filled-surface-50-950 shadow-sm'
          : 'hover:preset-tonal-surface',
      ]}
      <li class="flex">
        {#if onselect}
          <button
            type="button"
            aria-pressed={current}
            onclick={() => onselect(side)}
            class={classes}
          >
            {@render face(icon, text, count, current)}
          </button>
        {:else}
          <!-- eslint-disable-next-line svelte/no-navigation-without-resolve -- resolved by the page -->
          <a
            {href}
            data-sveltekit-preload-data="hover"
            data-sveltekit-noscroll
            aria-current={current ? 'page' : undefined}
            class={classes}
          >
            {@render face(icon, text, count, current)}
          </a>
        {/if}
      </li>
    {/each}
  </ul>
</nav>

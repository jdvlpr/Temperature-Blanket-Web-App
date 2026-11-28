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
  Mine | Starred in a dialog (the Open picker, Get Colors' My Palettes):
  what's saved, or gallery pages starred to find again. Small pill buttons
  like CollectionNav's, centered, each with a count when known. (My Library's
  pages have no Starred: the Gallery's Starred toggle has those.)
-->
<script lang="ts">
  import { StarIcon, UserRoundIcon } from '@lucide/svelte';

  let {
    starred,
    onselect,
    mineCount,
    starredCount,
    label,
  }: {
    /** Starred is showing */
    starred: boolean;
    /** Chooses a side */
    onselect: (starred: boolean) => void;
    mineCount?: number | null;
    starredCount?: number | null;
    /** Names the links for screen readers, e.g. "Projects to show" */
    label: string;
  } = $props();

  const items = $derived([
    {
      key: 'mine',
      starred: false,
      icon: UserRoundIcon,
      text: 'Mine',
      count: mineCount,
      current: !starred,
    },
    {
      key: 'starred',
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
        current ? 'bg-surface-50-950/20' : 'bg-surface-200-800/60',
      ]}
      aria-hidden="true">{count}</span
    >
    <span class="sr-only">({count})</span>
  {/if}
{/snippet}

<nav class="px-2" aria-label={label}>
  <ul class="flex flex-wrap justify-center gap-2">
    {#each items as { key, starred: side, icon, text, count, current } (key)}
      <li class="flex">
        <button
          type="button"
          aria-pressed={current}
          onclick={() => onselect(side)}
          class={[
            'btn btn-sm gap-1',
            current ? 'preset-filled' : 'preset-tonal',
          ]}
        >
          {@render face(icon, text, count, current)}
        </button>
      </li>
    {/each}
  </ul>
</nav>

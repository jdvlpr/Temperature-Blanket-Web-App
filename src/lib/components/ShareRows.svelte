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
  Share rows (see shareRows) as rows of a side panel's list (the Project and
  Palette menus): list items, to put in the panel's own list. The same rows a
  card's ⋮ menu has, each with its second line. Rows that can't be chosen say
  why under them.
-->
<script lang="ts">
  import type { MoreMenuItem } from '#lib/components/buttons/MoreMenu.svelte';
  import { PANEL_ROW } from '#lib/constants/class-constants.js';
  import { ChevronRightIcon, ExternalLinkIcon } from '@lucide/svelte';

  let { rows }: { rows: MoreMenuItem[] } = $props();
</script>

{#snippet text(row: MoreMenuItem)}
  <span class="flex flex-1 flex-col">
    <span>{row.label}</span>
    {#if row.detail}
      <span class="text-xs opacity-70">{row.detail}</span>
    {/if}
  </span>
{/snippet}

{#each rows as row (row.value)}
  <li>
    {#if row.href && !row.disabled}
      <!-- eslint-disable svelte/no-navigation-without-resolve -- callers resolve their links -->
      <a
        class={PANEL_ROW}
        href={row.href}
        target={row.newTab ? '_blank' : undefined}
        rel={row.newTab ? 'noopener' : undefined}
        data-sveltekit-reload={row.reload ? '' : undefined}
        onclick={() => row.onselect?.()}
      >
        <row.icon class="shrink-0 opacity-70" aria-hidden="true" />
        {@render text(row)}
        {#if row.newTab}
          <ExternalLinkIcon
            class="icon-sm shrink-0 opacity-50"
            aria-hidden="true"
          />
          <span class="sr-only">(opens in a new tab)</span>
        {/if}
      </a>
      <!-- eslint-enable svelte/no-navigation-without-resolve -->
    {:else}
      <button
        type="button"
        class={[PANEL_ROW, 'disabled:opacity-60']}
        disabled={row.disabled}
        onclick={() => row.onselect?.()}
      >
        <row.icon class="shrink-0 opacity-70" aria-hidden="true" />
        {@render text(row)}
        {#if row.label.endsWith('…')}
          <ChevronRightIcon
            class="icon-sm shrink-0 opacity-50"
            aria-hidden="true"
          />
        {/if}
      </button>
    {/if}
  </li>
{/each}

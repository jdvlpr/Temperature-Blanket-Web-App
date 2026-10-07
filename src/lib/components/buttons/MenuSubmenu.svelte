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
  A menu row that opens a submenu of choices, with the current one shown
  under its label, e.g. "Each range includes · From, not To ›". For settings
  with more than two choices, so the menu around them stays short. It opens
  beside the row; on a phone, in the menu's place, with Back to return (the
  menu calls provideMenuDrill and hides its other items while
  `drill.showsMenu` is false).
-->
<script lang="ts">
  import { menuContentClass, menuItemClass } from '$lib/components/menu-styles';
  import { getMenuDrill } from '$lib/components/menu-drill.svelte';
  import { ChevronLeftIcon, ChevronRightIcon } from '@lucide/svelte';
  import { Menu, Portal } from '@skeletonlabs/skeleton-svelte';
  import { tick, type Snippet } from 'svelte';

  interface Props {
    label: string;
    /** The choice now, shown under the label */
    current: string;
    /** A lucide icon before the label, like the menu's other items, or a
     * short mark in its place (e.g. the current choice's, like "[)") */
    icon?: typeof ChevronRightIcon | string;
    children: Snippet;
  }

  // The choices: `children` is also what Menu.Context names its snippet
  let { label, current, icon: RowIcon, children: choices }: Props = $props();

  const drill = getMenuDrill();

  // Opens this submenu in the menu's place (or goes back), then highlights
  // Back (or this row again), so the keyboard and screen readers follow
  function go(
    open: string | null,
    highlight: string,
    menu: () => { setHighlightedValue: (value: string) => void },
  ) {
    if (!drill) return;
    drill.open = open;
    tick().then(() => menu().setHighlightedValue(highlight));
  }

  // Choosing an item, by pointer or keyboard, sends it this event
  function onChoose(handler: () => void) {
    return (el: HTMLElement) => {
      el.addEventListener('menu:select', handler);
      return () => el.removeEventListener('menu:select', handler);
    };
  }
</script>

{#snippet row()}
  {#if typeof RowIcon === 'string'}
    <span
      class="w-[18px] shrink-0 text-center font-mono text-sm leading-none whitespace-nowrap"
      aria-hidden="true">{RowIcon}</span
    >
  {:else if RowIcon}
    <RowIcon size={18} class="shrink-0" aria-hidden="true" />
  {/if}
  <span class="flex min-w-0 flex-1 flex-col">
    <span>{label}</span>
    <span class="text-surface-700-300 text-xs">{current}</span>
  </span>
  <ChevronRightIcon size={18} class="shrink-0" aria-hidden="true" />
{/snippet}

{#if drill?.inPlace}
  <!-- Highlights where the keyboard was, as the items change -->
  <Menu.Context>
    {#snippet children(menu)}
      {#if drill.open === label}
        <Menu.Item value="back" closeOnSelect={false} class={menuItemClass}>
          {#snippet element(attributes)}
            <div
              {...attributes}
              {@attach onChoose(() => go(null, label, menu))}
            >
              <ChevronLeftIcon size={18} class="shrink-0" aria-hidden="true" />
              <span class="flex-1">Back</span>
            </div>
          {/snippet}
        </Menu.Item>
        <p class="text-surface-700-300 px-2 text-xs" aria-hidden="true">
          {label}
        </p>
        {@render choices()}
      {:else if drill.open === null}
        <Menu.Item value={label} closeOnSelect={false} class={menuItemClass}>
          {#snippet element(attributes)}
            <div
              {...attributes}
              {@attach onChoose(() => go(label, 'back', menu))}
            >
              {@render row()}
            </div>
          {/snippet}
        </Menu.Item>
      {/if}
    {/snippet}
  </Menu.Context>
{:else}
  <Menu
    positioning={{
      placement: 'right-start',
      flip: ['left-start', 'bottom-start'],
      overlap: true,
      gutter: 4,
    }}
  >
    <!-- Filled like a highlighted item while its submenu is open, so it's clear
  which row the submenu belongs to -->
    <Menu.TriggerItem
      value={label}
      class="{menuItemClass} data-[state=open]:bg-surface-200-800"
    >
      {@render row()}
    </Menu.TriggerItem>
    <Portal>
      <Menu.Positioner>
        <Menu.Content class={menuContentClass} aria-label={label}>
          {@render choices()}
        </Menu.Content>
      </Menu.Positioner>
    </Portal>
  </Menu>
{/if}

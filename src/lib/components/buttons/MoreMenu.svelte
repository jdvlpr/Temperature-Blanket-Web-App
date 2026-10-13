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
  A card's "more" menu (⋮), as a colorway's: items that act, or links (on this
  site, or in a new tab), with a separator before any item marked `separate`.
-->
<script lang="ts" module>
  import type { Component } from 'svelte';

  export type MoreMenuItem = {
    value: string;
    label: string;
    icon: Component;
    /** A link instead of an action */
    href?: string;
    newTab?: boolean;
    /** A full page load, for a link that opens a project in the planner */
    reload?: boolean;
    /** Runs when chosen (a link's runs before it's followed) */
    onselect?: () => void;
    /** A line before it */
    separate?: boolean;
  };
</script>

<script lang="ts">
  import {
    menuContentClass,
    menuItemClass,
    menuPositioning,
  } from '#lib/components/menu-styles.js';
  import { EllipsisVerticalIcon } from '@lucide/svelte';
  import { Menu, Portal } from '@skeletonlabs/skeleton-svelte';
  import type { HTMLAnchorAttributes } from 'svelte/elements';

  interface Props {
    items: MoreMenuItem[];
    /** Names what it's for, e.g. "More for Autumn" */
    label: string;
  }

  let { items, label }: Props = $props();
</script>

<Menu
  positioning={menuPositioning('bottom-end')}
  onSelect={(details) => {
    const item = items.find((item) => item.value === details.value);
    if (item && !item.href) item.onselect?.();
  }}
>
  <Menu.Trigger
    class="btn-icon hover:preset-tonal-surface active:bg-surface-200-800 data-[state=open]:bg-surface-200-800 shrink-0"
    aria-label={label}
    title="More"
  >
    <EllipsisVerticalIcon aria-hidden="true" />
  </Menu.Trigger>
  <Portal>
    <Menu.Positioner>
      <Menu.Content class={menuContentClass}>
        {#each items as item (item.value)}
          {#if item.separate}<Menu.Separator />{/if}
          <Menu.Item value={item.value} class={menuItemClass}>
            {#snippet element(attributes)}
              {#if item.href}
                <!-- eslint-disable svelte/no-navigation-without-resolve -- callers resolve their links -->
                <!-- The item's menu behavior, typed for its default div -->
                <a
                  {...attributes as HTMLAnchorAttributes}
                  href={item.href}
                  target={item.newTab ? '_blank' : undefined}
                  rel={item.newTab ? 'noopener' : undefined}
                  data-sveltekit-reload={item.reload ? '' : undefined}
                  onclick={() => item.onselect?.()}
                >
                  <item.icon aria-hidden="true" />
                  <span>{item.label}</span>
                  {#if item.newTab}
                    <span class="sr-only">(opens in a new tab)</span>
                  {/if}
                </a>
                <!-- eslint-enable svelte/no-navigation-without-resolve -->
              {:else}
                <div {...attributes}>
                  <item.icon aria-hidden="true" />
                  <span>{item.label}</span>
                </div>
              {/if}
            {/snippet}
          </Menu.Item>
        {/each}
      </Menu.Content>
    </Menu.Positioner>
  </Portal>
</Menu>

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
  An item can say more on a second line (`detail`) or be shown but not
  chosen (`disabled`, with its `detail` saying why). With `children`, the
  button shows those instead of ⋮ (the preview's Share button).
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
    /** A second line under the label */
    detail?: string;
    /** Shown, but does nothing (its `detail` says why). Still reached with
    the arrow keys, so screen readers say why */
    disabled?: boolean;
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
  import type { Snippet } from 'svelte';
  import type { HTMLAnchorAttributes } from 'svelte/elements';

  interface Props {
    items: MoreMenuItem[];
    /** Names what it's for, e.g. "More for Autumn" */
    label: string;
    /** The button's text and icon, in place of ⋮ (`label` still names it) */
    children?: Snippet;
    /** The button's look, with `children` */
    triggerClass?: string;
    /** The button's tooltip */
    title?: string;
    /** Runs as it opens (e.g. to load what its items need) */
    onopen?: () => void;
  }

  let {
    items,
    label,
    children,
    triggerClass,
    title = 'More',
    onopen,
  }: Props = $props();
</script>

{#snippet text(item: MoreMenuItem)}
  {#if item.detail}
    <span class="flex min-w-0 flex-col">
      <span>{item.label}</span>
      <span class="text-surface-700-300 text-xs">{item.detail}</span>
    </span>
  {:else}
    <span>{item.label}</span>
  {/if}
{/snippet}

<Menu
  positioning={menuPositioning('bottom-end')}
  onOpenChange={(details) => {
    if (details.open) onopen?.();
  }}
  onSelect={(details) => {
    const item = items.find((item) => item.value === details.value);
    if (item && !item.href && !item.disabled) item.onselect?.();
  }}
>
  <Menu.Trigger
    class={children
      ? triggerClass
      : 'btn-icon hover:preset-tonal-surface active:bg-surface-200-800 data-[state=open]:bg-surface-200-800 shrink-0'}
    aria-label={children ? undefined : label}
    {title}
  >
    {#if children}
      {@render children()}
    {:else}
      <EllipsisVerticalIcon aria-hidden="true" />
    {/if}
  </Menu.Trigger>
  <Portal>
    <Menu.Positioner>
      <!-- Second lines wrap rather than widen it (it fits a 320px screen) -->
      <Menu.Content
        class={[menuContentClass, items.some((item) => item.detail) && 'w-72']}
      >
        {#each items as item (item.value)}
          {#if item.separate}<Menu.Separator />{/if}
          <!-- Not Zag's `disabled`, which arrow keys skip: aria-disabled,
          and choosing it leaves the menu open -->
          <Menu.Item
            value={item.value}
            class={menuItemClass}
            closeOnSelect={!item.disabled}
          >
            {#snippet element(attributes)}
              {#if item.href && !item.disabled}
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
                  <item.icon class="shrink-0" aria-hidden="true" />
                  {@render text(item)}
                  {#if item.newTab}
                    <span class="sr-only">(opens in a new tab)</span>
                  {/if}
                </a>
                <!-- eslint-enable svelte/no-navigation-without-resolve -->
              {:else}
                <div
                  {...attributes}
                  aria-disabled={item.disabled ? 'true' : undefined}
                >
                  <item.icon class="shrink-0" aria-hidden="true" />
                  {@render text(item)}
                </div>
              {/if}
            {/snippet}
          </Menu.Item>
        {/each}
      </Menu.Content>
    </Menu.Positioner>
  </Portal>
</Menu>

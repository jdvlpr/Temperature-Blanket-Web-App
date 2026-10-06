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
  A yarn colorway's "more" menu (⋮): buy it (a shopping cart, marking an
  affiliate link) or view it on the site it's listed on, then copy its name or hex
  code, each showing what it copies. On a swatch, the trigger has no
  background: a black or white icon, whichever stands out on that color,
  tinted on hover. On the page's surface (list rows) it's a plain icon button.
-->
<script lang="ts">
  import type { Color } from '$lib/types/yarn-types';
  import {
    CopyIcon,
    EllipsisVerticalIcon,
    ExternalLinkIcon,
    ShoppingCartIcon,
  } from '@lucide/svelte';
  import { Menu, Portal } from '@skeletonlabs/skeleton-svelte';
  import { menuContentClass, menuItemClass } from '$lib/components/menu-styles';
  import type { HTMLAnchorAttributes } from 'svelte/elements';
  import {
    colorwayLink,
    copyColorwayText,
    iconColorOn,
  } from './colorway-utils';

  interface Props {
    colorway: Color;
    /** What the trigger sits on: the colorway's swatch, or the page's surface */
    on?: 'swatch' | 'surface';
  }

  let { colorway, on = 'swatch' }: Props = $props();

  let link = $derived.by(() => {
    const link = colorwayLink(colorway);
    if (!link) return null;
    return {
      ...link,
      label: link.isAffiliate
        ? 'Buy this colorway'
        : link.site
          ? `View on ${link.site}`
          : 'View this colorway',
    };
  });

  let copies = $derived(
    [
      { value: 'copy-name', label: 'Copy name', text: colorway.name },
      { value: 'copy-hex', label: 'Copy hex', text: colorway.hex },
    ].filter((copy): copy is typeof copy & { text: string } =>
      Boolean(copy.text),
    ),
  );
</script>

<Menu
  positioning={{ placement: 'bottom-end' }}
  onSelect={(details) => {
    const copy = copies.find((c) => c.value === details.value);
    if (copy) copyColorwayText(copy.text);
  }}
>
  <Menu.Trigger
    class={on === 'swatch'
      ? 'btn-icon hover-on-color size-7 rounded-full focus-visible:outline-2 focus-visible:outline-current'
      : 'btn-icon hover:preset-tonal-surface size-8 shrink-0'}
    style={on === 'swatch' ? `color:${iconColorOn(colorway.hex)}` : undefined}
    aria-label="More for {colorway.name}"
    title="More"
  >
    <EllipsisVerticalIcon size={16} aria-hidden="true" />
  </Menu.Trigger>
  <Portal>
    <Menu.Positioner>
      <Menu.Content class={menuContentClass}>
        {#if link}
          <Menu.Item value="link" class={menuItemClass}>
            {#snippet element(attributes)}
              <!-- eslint-disable svelte/no-navigation-without-resolve -- yarn shops' and makers' own pages -->
              <!-- The item's menu behavior, typed for its default div -->
              <a
                {...attributes as HTMLAnchorAttributes}
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
              >
                {#if link.isAffiliate}
                  <ShoppingCartIcon size={16} aria-hidden="true" />
                {:else}
                  <ExternalLinkIcon size={16} aria-hidden="true" />
                {/if}
                <span>{link.label}</span>
                <span class="sr-only">(opens in a new tab)</span>
              </a>
              <!-- eslint-enable svelte/no-navigation-without-resolve -->
            {/snippet}
          </Menu.Item>
          <Menu.Separator />
        {/if}
        {#each copies as copy (copy.value)}
          <Menu.Item value={copy.value} class={menuItemClass}>
            <CopyIcon size={16} aria-hidden="true" />
            <span>{copy.label}</span>
            <span
              class="text-surface-700-300 ml-auto truncate pl-4 text-xs {copy.value ===
              'copy-hex'
                ? 'font-mono'
                : ''}">{copy.text}</span
            >
          </Menu.Item>
        {/each}
      </Menu.Content>
    </Menu.Positioner>
  </Portal>
</Menu>

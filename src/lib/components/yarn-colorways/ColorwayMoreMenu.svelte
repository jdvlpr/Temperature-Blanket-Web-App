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
  code, each showing what it copies. On the page's surface it's a plain icon
  button. On the yarn's color (a card or row filled with it), it's the same
  size, with a black or white icon, whichever stands out on that color, and
  a tint of that on hover. Either way it stays tinted while its menu is open, so a tap on a
  phone (which has no hover) shows it too.
  With `oninsert`, it offers Add color before / after, and with `onremove`,
  it ends with Remove, for a color in a palette.
-->
<script lang="ts">
  import type { Color } from '$lib/types/yarn-types';
  import {
    BetweenHorizontalEndIcon,
    BetweenHorizontalStartIcon,
    BetweenVerticalEndIcon,
    BetweenVerticalStartIcon,
    CopyIcon,
    EllipsisVerticalIcon,
    ExternalLinkIcon,
    ShoppingCartIcon,
    Trash2Icon,
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
    /** What the trigger sits on: the page's surface, or the colorway's color */
    on?: 'surface' | 'color';
    /** Offers Add Color Before and After, for a new color next to this one */
    oninsert?: (where: 'before' | 'after') => void;
    /** How the palette's colors run, for the Add items' icons: side by side (a grid) or one under another */
    insertAxis?: 'row' | 'column';
    /** Offers Remove, e.g. "Remove color 3" */
    onremove?: () => void;
    removeLabel?: string;
  }

  let {
    colorway,
    on = 'surface',
    oninsert,
    insertAxis = 'column',
    onremove,
    removeLabel = 'Remove',
  }: Props = $props();

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
    else if (details.value === 'insert-before') oninsert?.('before');
    else if (details.value === 'insert-after') oninsert?.('after');
    else if (details.value === 'remove') onremove?.();
  }}
>
  <Menu.Trigger
    class={on === 'color'
      ? 'btn-icon hover-on-color size-8 shrink-0 focus-visible:outline-2 focus-visible:outline-current active:bg-[color-mix(in_oklab,currentColor_18%,transparent)] data-[state=open]:bg-[color-mix(in_oklab,currentColor_18%,transparent)]'
      : 'btn-icon hover:preset-tonal-surface active:bg-surface-200-800 data-[state=open]:bg-surface-200-800 size-8 shrink-0'}
    style={on === 'color' ? `color:${iconColorOn(colorway.hex)}` : undefined}
    aria-label="More for {colorway.name || colorway.hex}"
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
                {#if link.isAffiliate}
                  <span class="flex flex-col">
                    <span>{link.label}</span>
                    <span class="text-surface-700-300 text-xs">
                      Supports the developer at no extra cost
                    </span>
                  </span>
                {:else}
                  <span>{link.label}</span>
                {/if}
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
        {#if oninsert}
          {@const Before =
            insertAxis === 'row'
              ? BetweenVerticalStartIcon
              : BetweenHorizontalStartIcon}
          {@const After =
            insertAxis === 'row'
              ? BetweenVerticalEndIcon
              : BetweenHorizontalEndIcon}
          <Menu.Separator />
          <Menu.Item value="insert-before" class={menuItemClass}>
            <Before size={16} aria-hidden="true" />
            <span>Add color before</span>
          </Menu.Item>
          <Menu.Item value="insert-after" class={menuItemClass}>
            <After size={16} aria-hidden="true" />
            <span>Add color after</span>
          </Menu.Item>
        {/if}
        {#if onremove}
          {#if !oninsert}<Menu.Separator />{/if}
          <Menu.Item value="remove" class={menuItemClass}>
            <Trash2Icon size={16} aria-hidden="true" />
            <span>{removeLabel}</span>
          </Menu.Item>
        {/if}
      </Menu.Content>
    </Menu.Positioner>
  </Portal>
</Menu>

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
  A project's or palette's gallery pages, newest first, as a list like the
  Project menu's: each opens its page and shows when it was published and its
  colors then (when its link is known). The account's own pages each have a
  menu, like the versions in My Projects' Published menu: Show my name, and
  Unpublish (it asks first).
-->
<script lang="ts">
  import PaletteStrip from '#lib/components/PaletteStrip.svelte';
  import { PANEL_LIST, PANEL_ROW } from '#lib/constants/class-constants.js';
  import { getColorsFromInput } from '#lib/utils/color-utils.js';
  import { safeSlide } from '#lib/features/transitions/safeSlide.js';
  import MenuCheckbox from '#lib/components/buttons/MenuCheckbox.svelte';
  import {
    menuContentClass,
    menuItemClass,
    menuPositioning,
  } from '#lib/components/menu-styles.js';
  import {
    EllipsisVerticalIcon,
    ExternalLinkIcon,
    EyeOffIcon,
    LoaderCircleIcon,
  } from '@lucide/svelte';
  import { Menu, Portal } from '@skeletonlabs/skeleton-svelte';
  import { tick } from 'svelte';

  let {
    pages,
    kind,
    ownerName = '',
    onremove,
    onshowowner,
  }: {
    /** Newest first. A page sent without an account has no date here. */
    pages: {
      postId: number;
      href: string;
      publishedAt?: number;
      /** Its link as published, for its colors */
      link?: string | null;
      /** It says "By" and the account's name */
      showOwner?: boolean;
    }[];
    kind: 'project' | 'palette';
    /** The account's display name */
    ownerName?: string;
    /** Unpublishes one page; throws when it can't */
    onremove?: (postId: number) => Promise<void>;
    /** Shows the name on one page or not; throws when it can't */
    onshowowner?: (postId: number, showOwner: boolean) => Promise<void>;
  } = $props();

  let confirming = $state<number | null>(null);
  let busy = $state(false);
  let errorMessage = $state('');
  let list = $state<HTMLElement>();

  const label = (publishedAt?: number) =>
    publishedAt
      ? `Published ${new Date(publishedAt).toLocaleString(undefined, {
          dateStyle: 'medium',
          timeStyle: 'short',
        })}`
      : 'Gallery page';

  const colorsOf = (link?: string | null) =>
    (link && getColorsFromInput({ string: link })) || null;

  async function setNamed(postId: number, next: boolean) {
    if (!onshowowner) return;
    busy = true;
    errorMessage = '';
    try {
      await onshowowner(postId, next);
    } catch {
      errorMessage = 'That change couldn’t be saved. Try again later.';
    } finally {
      busy = false;
    }
  }

  async function remove(postId: number) {
    if (!onremove || busy) return;
    busy = true;
    errorMessage = '';
    try {
      await onremove(postId);
      confirming = null;
      await tick();
      list?.querySelector<HTMLElement>('a')?.focus();
    } catch {
      errorMessage = 'It couldn’t be unpublished. Try again later.';
    } finally {
      busy = false;
    }
  }
</script>

<div class="flex flex-col gap-2">
  <ul class={PANEL_LIST} aria-label="Gallery pages" bind:this={list}>
    {#each pages as page, i (page.postId)}
      {@const colors = colorsOf(page.link)}
      <li class="flex flex-col">
        <div class="flex items-center">
          <!-- eslint-disable svelte/no-navigation-without-resolve -- the gallery page's own address -->
          <a
            href={page.href}
            target="_blank"
            rel="noreferrer"
            class="{PANEL_ROW} flex-1"
          >
            <span class="flex min-w-0 flex-1 flex-col gap-1">
              <span class="flex flex-col">
                <span>{label(page.publishedAt)}</span>
                {#if i === 0 && pages.length > 1}
                  <span class="text-xs opacity-70">Latest</span>
                {/if}
              </span>
              {#if colors}
                <PaletteStrip {colors} height="16px" insideControl />
              {/if}
            </span>
            <span class="sr-only">(opens in a new tab)</span>
            <ExternalLinkIcon
              class="icon-sm shrink-0 opacity-50"
              aria-hidden="true"
            />
          </a>
          <!-- eslint-enable svelte/no-navigation-without-resolve -->
          {#if onremove && onshowowner}
            <Menu
              positioning={menuPositioning('bottom-end')}
              onSelect={(details) => {
                if (details.value === 'unpublish') confirming = page.postId;
              }}
            >
              <Menu.Trigger
                class="btn-icon hover:preset-tonal-surface mx-1 shrink-0"
                aria-label="Options: {label(page.publishedAt)}"
                title="Options"
                disabled={busy}><EllipsisVerticalIcon /></Menu.Trigger
              >
              <Portal>
                <Menu.Positioner>
                  <Menu.Content class={menuContentClass}>
                    <!-- Stays open, so the check shows it took -->
                    <Menu.OptionItem
                      type="checkbox"
                      value="named"
                      checked={Boolean(page.showOwner)}
                      closeOnSelect={false}
                      disabled={busy}
                      onCheckedChange={(checked) =>
                        void setNamed(page.postId, checked)}
                      class={menuItemClass}
                    >
                      <span class="flex min-w-0 flex-1 flex-col">
                        <span>Show my name</span>
                        <span class="text-surface-700-300 text-xs"
                          >{ownerName
                            ? `This page says “By ${ownerName}”`
                            : 'Once you add a display name'}</span
                        >
                      </span>
                      <MenuCheckbox checked={Boolean(page.showOwner)} />
                    </Menu.OptionItem>
                    <Menu.Item value="unpublish" class={menuItemClass}>
                      <EyeOffIcon class="shrink-0" aria-hidden="true" />
                      <span class="min-w-0 flex-1">Unpublish…</span>
                    </Menu.Item>
                  </Menu.Content>
                </Menu.Positioner>
              </Portal>
            </Menu>
          {/if}
        </div>
        {#if confirming === page.postId}
          <div class="flex flex-col gap-2 px-4 pb-3" in:safeSlide>
            <p class="text-sm">
              Unpublish this version? Its gallery page link stops working{kind ===
              'project'
                ? ', and it comes off the globe'
                : ''}. Your {kind} stays saved, and links you’ve shared to the {kind}
              still work.
            </p>
            <div class="flex flex-wrap gap-2">
              <button
                type="button"
                class="btn btn-sm preset-filled-error-500 max-sm:w-full"
                onclick={() => remove(page.postId)}
                disabled={busy}
              >
                {#if busy}<LoaderCircleIcon class="animate-spin" />{/if}
                Unpublish
              </button>
              <button
                type="button"
                class="btn btn-sm preset-tonal-surface max-sm:w-full"
                onclick={() => (confirming = null)}
                disabled={busy}>Cancel</button
              >
            </div>
          </div>
        {/if}
      </li>
    {/each}
  </ul>
  {#if errorMessage}
    <p class="text-error-700-300 text-sm" role="alert">{errorMessage}</p>
  {/if}
</div>

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
  A saved project's place on Ravelry, on its card in My Projects, beside its
  gallery button. Not posted: Not on Ravelry ▾, whose menu has Post to
  Ravelry (or says to add the project to the account first). Posted: On
  Ravelry ▾ with its first photos, and a menu of View on Ravelry, Update on
  Ravelry and Photos. Shown only while Ravelry is connected.
-->
<script lang="ts">
  import { ravelryLinks } from '#lib/accounts/ravelry-links.svelte.js';
  import {
    menuContentClass,
    menuItemClass,
    menuPositioning,
  } from '#lib/components/menu-styles.js';
  import type { StoredProjectIndexItem } from '#lib/storage/projects.svelte.js';
  import {
    inAccount,
    openRavelryPhotos,
    openRavelryPost,
  } from '#lib/utils/open-ravelry.js';
  import {
    ChevronDownIcon,
    ExternalLinkIcon,
    ImagesIcon,
    LinkIcon,
    RefreshCwIcon,
    SendIcon,
  } from '@lucide/svelte';
  import { Menu, Portal } from '@skeletonlabs/skeleton-svelte';
  import type { HTMLAnchorAttributes } from 'svelte/elements';

  let {
    item,
    label,
  }: {
    item: StoredProjectIndexItem;
    /** Its name, for screen readers */ label: string;
  } = $props();

  const link = $derived(ravelryLinks.links.get(item.id) ?? null);

  // Choosing an item, by pointer or keyboard, sends it this event
  const onChoose = (handler: () => void) => (el: HTMLElement) => {
    el.addEventListener('menu:select', handler);
    return () => el.removeEventListener('menu:select', handler);
  };
</script>

{#if ravelryLinks.connected}
  <div
    class="flex items-center gap-2 text-sm"
    role="group"
    aria-label="Ravelry: {label}"
  >
    <Menu positioning={menuPositioning('bottom-start')}>
      <Menu.Trigger class="btn btn-sm hover:preset-tonal-surface -ml-2">
        <LinkIcon aria-hidden="true" />
        <span
          ><span class="sr-only">Ravelry: </span>{link
            ? link.photos.length
              ? `On Ravelry · ${link.photos.length} ${link.photos.length === 1 ? 'photo' : 'photos'}`
              : 'On Ravelry'
            : 'Not on Ravelry'}</span
        >
        <ChevronDownIcon class="icon-sm" aria-hidden="true" />
      </Menu.Trigger>
      <Portal>
        <Menu.Positioner>
          <Menu.Content class="{menuContentClass} pointer-events-auto">
            {#if !link}
              {#if inAccount(item)}
                <Menu.Item value="post" class={menuItemClass}>
                  {#snippet element(attributes)}
                    <div
                      {...attributes}
                      {@attach onChoose(() => openRavelryPost(item))}
                    >
                      <SendIcon class="shrink-0" aria-hidden="true" />
                      <span class="min-w-0 flex-1">Post to Ravelry…</span>
                    </div>
                  {/snippet}
                </Menu.Item>
              {:else}
                <p class="text-surface-700-300 max-w-72 px-2 py-1 text-xs">
                  Add this project to your account first, then post it to
                  Ravelry.
                </p>
              {/if}
            {:else}
              <Menu.Item value="view" class={menuItemClass}>
                {#snippet element(attributes)}
                  <!-- eslint-disable svelte/no-navigation-without-resolve -- Ravelry's site -->
                  <a
                    {...attributes as HTMLAnchorAttributes}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <ExternalLinkIcon class="shrink-0" aria-hidden="true" />
                    <span class="min-w-0 flex-1"
                      >View on Ravelry<span class="sr-only">
                        (opens in a new tab)</span
                      ></span
                    >
                  </a>
                  <!-- eslint-enable svelte/no-navigation-without-resolve -->
                {/snippet}
              </Menu.Item>
              <Menu.Item value="update" class={menuItemClass}>
                {#snippet element(attributes)}
                  <div
                    {...attributes}
                    {@attach onChoose(() => openRavelryPost(item))}
                  >
                    <RefreshCwIcon class="shrink-0" aria-hidden="true" />
                    <span class="min-w-0 flex-1">Update on Ravelry…</span>
                  </div>
                {/snippet}
              </Menu.Item>
              <Menu.Item value="photos" class={menuItemClass}>
                {#snippet element(attributes)}
                  <div
                    {...attributes}
                    {@attach onChoose(() => openRavelryPhotos(item))}
                  >
                    <ImagesIcon class="shrink-0" aria-hidden="true" />
                    <span class="min-w-0 flex-1">Photos…</span>
                  </div>
                {/snippet}
              </Menu.Item>
            {/if}
          </Menu.Content>
        </Menu.Positioner>
      </Portal>
    </Menu>
  </div>
{/if}

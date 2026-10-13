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
  A saved project on My Projects, as the gallery's project card: its picture
  (taken when the planner saved it; until then its colors), its name, its
  places and dates when it has a name, and a ⋮ menu (Rename, Publish to
  Gallery, Move to Trash). Once published, its Published menu (`sharing`)
  sits under it. Tapping it opens it in the planner.
-->
<script lang="ts">
  import GalleryProjectCard from '#lib/components/GalleryProjectCard.svelte';
  import NameField from '#lib/components/NameField.svelte';
  import MoreMenu, {
    type MoreMenuItem,
  } from '#lib/components/buttons/MoreMenu.svelte';
  import PaletteStrip from '#lib/components/PaletteStrip.svelte';
  import SyncIcon from '#lib/components/sync/SyncIcon.svelte';
  import type { StoredProjectIndexItem } from '#lib/storage/projects.svelte.js';
  import { getThumbnail } from '#lib/storage/thumbnails.js';
  import type { SyncLabel } from '#lib/sync/status.svelte.js';
  import { getColorsFromInput } from '#lib/utils/color-utils.js';
  import { extraColorsFromProjectHref } from '#lib/utils/extra-colors-utils.js';
  import { PencilIcon, SendIcon, Trash2Icon } from '@lucide/svelte';
  import type { Snippet } from 'svelte';

  interface Props {
    item: StoredProjectIndexItem;
    /** Bumped when pictures were drawn in the background, to look again */
    picturesVersion?: number;
    layout?: 'grid' | 'list';
    /** Where it's kept, e.g. "Synced" (see $lib/sync) */
    syncLabel?: SyncLabel;
    /** Called with the new name ('' clears it) */
    onrename: (name: string) => void;
    onremove: () => void;
    /** Publish to Gallery, in its menu, when it can be published */
    onpublish?: () => void;
    /** Its gallery pages: Publish to Gallery, or Published ▾ */
    sharing?: Snippet;
  }

  let {
    item,
    picturesVersion = 0,
    layout = 'grid',
    syncLabel,
    onrename,
    onremove,
    onpublish,
    sharing,
  }: Props = $props();

  let meta = $derived(item.meta);
  let label = $derived(meta.name || meta.title || 'Untitled Project');
  // Its places and dates under its name, unless the name already says where
  let places = $derived.by(() => {
    if (!meta.name || !meta.title) return '';
    const place = meta.title.split(' from ')[0].trim();
    return place && meta.name.includes(place) ? '' : meta.title;
  });

  // Its picture, read once the card is near the screen (there can be many)
  let card = $state<HTMLElement>();
  let thumbnail = $state<string | null>(null);
  $effect(() => {
    if (!card) return;
    void picturesVersion;
    const id = item.id;
    const href = item.meta.href;
    let current = true;
    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) return;
        observer.disconnect();
        getThumbnail(id, href).then((image) => {
          if (current) thumbnail = image;
        });
      },
      { rootMargin: '400px' },
    );
    observer.observe(card);
    return () => {
      current = false;
      observer.disconnect();
    };
  });

  // Its colors, the cover until it has a picture
  let colors = $derived([
    ...(getColorsFromInput({ string: meta.href }) || []),
    ...extraColorsFromProjectHref(meta.href).map((extra) => extra.color),
  ]);

  let menu = $derived<MoreMenuItem[]>([
    {
      value: 'rename',
      label: 'Rename',
      icon: PencilIcon,
      onselect: () => {
        editingName = meta.name ?? '';
        editing = true;
      },
    },
    ...(onpublish
      ? [
          {
            value: 'publish',
            label: 'Publish to Gallery',
            icon: SendIcon,
            onselect: onpublish,
          },
        ]
      : []),
    {
      value: 'trash',
      label: 'Move to Trash',
      icon: Trash2Icon,
      onselect: onremove,
      separate: true,
    },
  ]);

  let editing = $state(false);
  let editingName = $state('');
</script>

<div bind:this={card} class="w-full">
  <GalleryProjectCard
    href={meta.href}
    reload
    image={thumbnail}
    {layout}
    title="Open in the Project Planner (saved {meta.date})"
    imageClass="rounded-container {layout === 'grid'
      ? 'w-full h-auto'
      : 'max-h-[240px] w-auto'}"
  >
    {#snippet cover()}
      {#if colors.length}
        <div class="w-full" aria-hidden="true">
          <PaletteStrip
            {colors}
            height={layout === 'grid' ? '140px' : '70px'}
            insideControl
          />
        </div>
      {/if}
    {/snippet}
    {#snippet nameRow()}
      {#if editing}
        <div class="w-full text-left">
          <NameField
            bind:value={editingName}
            placeholder={meta.title}
            onsave={() => {
              editing = false;
              onrename(editingName);
            }}
            oncancel={() => (editing = false)}
          />
        </div>
      {:else}
        <div class="flex w-full items-start gap-1 text-left">
          <div class="flex min-w-0 grow flex-col">
            <span class="flex items-start gap-1">
              {#if syncLabel}
                <span class="mt-0.5"><SyncIcon label={syncLabel} /></span>
              {/if}
              <!-- A full page load: the planner reads the project from the URL it
              starts with, so arriving by client-side navigation skips the saved weather -->
              <!-- eslint-disable-next-line svelte/no-navigation-without-resolve -->
              <a
                href={meta.href}
                data-sveltekit-reload
                class="line-clamp-2 min-w-0 text-sm font-semibold break-words"
                >{label}</a
              >
            </span>
            {#if places}
              <span class="text-surface-700-300 line-clamp-1 text-xs"
                >{places}</span
              >
            {/if}
            {#if syncLabel?.tone === 'error'}
              <span class="text-error-700-300 text-xs">{syncLabel.text}</span>
            {/if}
          </div>
          <MoreMenu items={menu} label="More for {label}" />
        </div>
      {/if}
    {/snippet}
    {#snippet footer()}
      {#if !editing && sharing}
        <div class="w-full text-left">{@render sharing()}</div>
      {/if}
    {/snippet}
  </GalleryProjectCard>
</div>

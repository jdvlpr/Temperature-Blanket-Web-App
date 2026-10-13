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
  (taken when the planner saved it; until then its colors), its name with a
  rename pencil, its places and dates, when it was saved, then its gallery
  sharing (`sharing`) and Move to Trash. Tapping
  it opens it in the planner.
-->
<script lang="ts">
  import GalleryProjectCard from '#lib/components/GalleryProjectCard.svelte';
  import NameField from '#lib/components/NameField.svelte';
  import PaletteStrip from '#lib/components/PaletteStrip.svelte';
  import SyncIcon from '#lib/components/sync/SyncIcon.svelte';
  import type { StoredProjectIndexItem } from '#lib/storage/projects.svelte.js';
  import { getThumbnail } from '#lib/storage/thumbnails.js';
  import type { SyncLabel } from '#lib/sync/status.svelte.js';
  import { getColorsFromInput } from '#lib/utils/color-utils.js';
  import { extraColorsFromProjectHref } from '#lib/utils/extra-colors-utils.js';
  import { PencilIcon, Trash2Icon } from '@lucide/svelte';
  import type { Snippet } from 'svelte';

  interface Props {
    item: StoredProjectIndexItem;
    layout?: 'grid' | 'list';
    /** Where it's kept, e.g. "Synced" (see $lib/sync) */
    syncLabel?: SyncLabel;
    /** Called with the new name ('' clears it) */
    onrename: (name: string) => void;
    onremove: () => void;
    /** Its gallery pages: Publish to Gallery, or Published ▾ */
    sharing?: Snippet;
  }

  let {
    item,
    layout = 'grid',
    syncLabel,
    onrename,
    onremove,
    sharing,
  }: Props = $props();

  let meta = $derived(item.meta);
  let label = $derived(meta.name || meta.title || 'Untitled Project');

  // Its picture, read once the card is near the screen (there can be many)
  let card = $state<HTMLElement>();
  let thumbnail = $state<string | null>(null);
  $effect(() => {
    if (!card) return;
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

  let editing = $state(false);
  let editingName = $state('');
</script>

<div bind:this={card} class="w-full">
  <GalleryProjectCard
    href={meta.href}
    reload
    image={thumbnail}
    {layout}
    title="Open in the Project Planner"
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
        <div class="flex max-w-full items-start justify-center gap-1">
          {#if syncLabel}
            <span class="mt-0.5"><SyncIcon label={syncLabel} /></span>
          {/if}
          <!-- A full page load: the planner reads the project from the URL it
          starts with, so arriving by client-side navigation skips the saved weather -->
          <!-- eslint-disable-next-line svelte/no-navigation-without-resolve -->
          <a
            href={meta.href}
            data-sveltekit-reload
            class="line-clamp-3 min-w-0 text-sm font-semibold break-words"
            >{label}</a
          >
          <!-- Right by the name so it's clear what it edits -->
          <button
            type="button"
            class="hover:bg-surface-200-800 rounded-base -my-0.5 inline-flex size-7 shrink-0 items-center justify-center opacity-70 hover:opacity-100"
            title="Rename Project"
            aria-label="Rename {label}"
            onclick={() => {
              editingName = meta.name ?? '';
              editing = true;
            }}
          >
            <PencilIcon class="icon-sm" />
          </button>
        </div>
      {/if}
      {#if meta.name && meta.title}
        <p class="line-clamp-3 text-xs">{meta.title}</p>
      {/if}
    {/snippet}
    {#snippet details()}
      <p class="text-surface-700-300 text-xs">
        Saved {meta.date}{#if meta.isCustomWeatherData}
          · Custom Weather Data{/if}
      </p>
      {#if syncLabel?.tone === 'error'}
        <p class="text-error-700-300 text-xs">{syncLabel.text}</p>
      {/if}
    {/snippet}
    {#snippet footer()}
      {#if !editing}
        <div class="flex w-full items-start justify-center gap-1">
          <div class="min-w-0">{@render sharing?.()}</div>
          <div class="mt-2">
            <button
              type="button"
              class="btn-icon hover:preset-tonal-surface"
              title="Move to Trash"
              aria-label="Move {label} to the Trash"
              onclick={onremove}
            >
              <Trash2Icon aria-hidden="true" />
            </button>
          </div>
        </div>
      {/if}
    {/snippet}
  </GalleryProjectCard>
</div>

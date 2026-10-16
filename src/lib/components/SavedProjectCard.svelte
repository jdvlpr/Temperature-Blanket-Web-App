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
  (taken when the planner saved it; while one is being drawn, a placeholder;
  if it can't be, its colors), its name, when it was saved, and a ⋮ menu
  (Rename, Move to Trash). Its gallery button (`sharing`, Published ▾ or
  Unpublished ▾) sits under it. Tapping it opens it in the planner.
-->
<script lang="ts">
  import GalleryProjectCard, {
    coverClasses,
    imageClasses,
  } from '#lib/components/GalleryProjectCard.svelte';
  import NameField from '#lib/components/NameField.svelte';
  import MoreMenu, {
    type MoreMenuItem,
  } from '#lib/components/buttons/MoreMenu.svelte';
  import ProjectPicture from '#lib/components/ProjectPicture.svelte';
  import SyncIcon from '#lib/components/sync/SyncIcon.svelte';
  import {
    lastSavedAt,
    type StoredProjectIndexItem,
  } from '#lib/storage/projects.svelte.js';
  import type { SyncLabel } from '#lib/sync/status.svelte.js';
  import { PencilIcon, Trash2Icon } from '@lucide/svelte';
  import type { Snippet } from 'svelte';

  type Props = {
    item: StoredProjectIndexItem;
    /** Bumped when pictures were drawn in the background, to look again */
    picturesVersion?: number;
    /** The background drawing is done with it: without a picture by now,
    it shows its colors instead of a placeholder */
    pictureSettled?: boolean;
    layout?: 'grid' | 'list';
    /** Where it's kept, e.g. "Synced" (see $lib/sync) */
    syncLabel?: SyncLabel;
    /** Called with the new name ('' clears it) */
    onrename: (name: string) => void;
    onremove: () => void;
    /** Its Share button */
    sharing?: Snippet;
  };

  let {
    item,
    picturesVersion = 0,
    pictureSettled = false,
    layout = 'grid',
    syncLabel,
    onrename,
    onremove,
    sharing,
  }: Props = $props();

  const dateTimeOf = (time: number) =>
    new Date(time).toLocaleString(undefined, {
      dateStyle: 'medium',
      timeStyle: 'short',
    });

  // Opening it: in the planner (a full page load: the planner reads the
  // project from the URL it starts with, so arriving by client-side
  // navigation skips the saved weather)
  let href = $derived(item.meta.href);

  let label = $derived(item.meta.name || item.meta.title || 'Untitled Project');

  // When it was saved
  let dateLine = $derived.by(() => {
    const saved = lastSavedAt(item);
    return `Saved ${saved ? dateTimeOf(saved) : item.meta.date}`;
  });

  let linkTitle = $derived(`Open in the Project Planner (${dateLine})`);

  // It can be renamed or moved to the Trash
  let menu = $derived<MoreMenuItem[]>([
    {
      value: 'rename',
      label: 'Rename',
      icon: PencilIcon,
      onselect: () => {
        editingName = item.meta.name ?? '';
        editing = true;
      },
    },
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

<div class="w-full">
  <GalleryProjectCard {href} reload {layout} title={linkTitle}>
    {#snippet cover()}
      <ProjectPicture
        id={item.id}
        href={item.meta.href}
        {picturesVersion}
        {pictureSettled}
        imageClass={imageClasses[layout]}
        coverClass={coverClasses[layout]}
      />
    {/snippet}
    {#snippet nameRow()}
      {#if editing}
        <div class="w-full text-left">
          <NameField
            bind:value={editingName}
            placeholder={item.meta.title}
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
              <!-- eslint-disable-next-line svelte/no-navigation-without-resolve -- resolved above, or a project link -->
              <a
                {href}
                data-sveltekit-reload
                title={linkTitle}
                class="line-clamp-2 min-w-0 text-sm font-semibold break-words"
                >{label}</a
              >
            </span>
            <span
              class="text-surface-700-300 line-clamp-1 text-xs"
              aria-live="polite"
            >
              {dateLine}
            </span>
            {#if syncLabel?.tone === 'error'}
              <span class="text-error-700-300 text-xs">{syncLabel.text}</span>
            {/if}
          </div>
          {#if menu.length}
            <MoreMenu items={menu} label="More for {label}" />
          {/if}
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

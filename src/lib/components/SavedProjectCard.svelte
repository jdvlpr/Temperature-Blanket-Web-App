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
  if it can't be, its colors), its name, its info (see LibraryInfoLine)
  and a flat ⋮ menu: Edit in Project Planner, Duplicate, its share rows
  (`shareRows`: a Gallery Page group, Ravelry), Move to Trash. Tapping it opens
  it in the planner. It's renamed there (or in its Edit Gallery Page dialog).
-->
<script lang="ts">
  import LibraryInfoLine from '#lib/components/LibraryInfoLine.svelte';
  import GalleryProjectCard, {
    coverClasses,
    imageClasses,
  } from '#lib/components/GalleryProjectCard.svelte';
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
  import { CopyIcon, NotebookPenIcon, Trash2Icon } from '@lucide/svelte';

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
    onremove: () => void;
    /** Duplicate: saves it again as a new project */
    oncopy: () => void;
    /** Its gallery page and Ravelry rows, in its ⋮ menu */
    shareRows?: MoreMenuItem[];
    /** When its gallery page was published; none, not published */
    publishedAt?: number | null;
    /** Its gallery page's views */
    views?: number | null;
    /** It changed since its gallery page was published or updated */
    changed?: boolean;
    /** On Ravelry, with this many photos there */
    ravelryPhotos?: number | null;
  };

  let {
    item,
    picturesVersion = 0,
    pictureSettled = false,
    layout = 'grid',
    syncLabel,
    onremove,
    oncopy,
    shareRows = [],
    publishedAt = null,
    views,
    changed = false,
    ravelryPhotos = null,
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

  // Its info line's, by day
  let savedOn = $derived.by(() => {
    const saved = lastSavedAt(item);
    return `Saved ${
      saved
        ? new Date(saved).toLocaleDateString(undefined, { dateStyle: 'medium' })
        : item.meta.date
    }`;
  });

  // Edited or duplicated, shared, or moved to the Trash: flat, in groups
  let menu = $derived<MoreMenuItem[]>([
    {
      value: 'edit',
      label: 'Edit in Project Planner',
      icon: NotebookPenIcon,
      href,
      reload: true,
    },
    {
      value: 'copy',
      label: 'Duplicate Project',
      icon: CopyIcon,
      onselect: oncopy,
    },
    ...shareRows.map((row, i) => ({ ...row, separate: i === 0 })),
    {
      value: 'trash',
      label: 'Move to Trash',
      icon: Trash2Icon,
      onselect: onremove,
      separate: true,
    },
  ]);
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
        corners="nested"
      />
    {/snippet}
    {#snippet nameRow()}
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
          <LibraryInfoLine
            saved={savedOn}
            {publishedAt}
            {views}
            {changed}
            {ravelryPhotos}
          />
          {#if syncLabel?.tone === 'error'}
            <span class="text-error-700-300 text-xs">{syncLabel.text}</span>
          {/if}
        </div>
        {#if menu.length}
          <MoreMenu items={menu} label="More for {label}" />
        {/if}
      </div>
    {/snippet}
  </GalleryProjectCard>
</div>

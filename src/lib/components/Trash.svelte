<!-- Copyright (c) 2026, Thomas (https://github.com/jdvlpr)

This file is part of Temperature-Blanket-Web-App.

Temperature-Blanket-Web-App is free software: you can redistribute it and/or modify it
under the terms of the GNU General Public License as published by the Free Software Foundation,
either version 3 of the License, or (at your option) any later version.

Temperature-Blanket-Web-App is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY;
without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.
See the GNU General Public License for more details.

You should have received a copy of the GNU General Public License along with Temperature-Blanket-Web-App.
If not, see <https://www.gnu.org/licenses/>. -->

<!-- Deleted projects and palettes, in a dialog from the My Projects page:
restore them, or delete them forever. Each is deleted forever after
TRASH_DAYS anyway. Signed in, it's the account's Trash: what was deleted on any
device, restored everywhere (see $lib/storage/account-trash). -->

<script lang="ts">
  import ColorPalette from '$lib/components/ColorPalette.svelte';
  import { ensureYarnData } from '$lib/data/yarns/colorways.svelte';
  import { toast } from '$lib/state/page-state.svelte';
  import {
    accountTrash,
    deleteTrashEntryForever,
    emptyProjectTrash,
    loadProjectTrash,
    refreshAccountTrash,
    restoreTrashEntry,
    trashedProject,
    type ProjectTrashEntry,
  } from '$lib/storage/account-trash.svelte';
  import { PaletteStorage, savedPalettes } from '$lib/storage/palettes.svelte';
  import { savedProjects } from '$lib/storage/projects.svelte';
  import { TRASH_DAYS } from '$lib/storage/trash';
  import type { Color } from '$lib/types/yarn-types';
  import {
    getColorsFromInput,
    getPaletteFallbackName,
  } from '$lib/utils/color-utils';
  import { formatDateTime } from '$lib/utils/date-utils';
  import {
    ArchiveRestoreIcon,
    NotebookPenIcon,
    SwatchBookIcon,
    Trash2Icon,
    XIcon,
  } from '@lucide/svelte';
  import { onMount } from 'svelte';

  type Entry = {
    kind: 'project' | 'palette';
    id: string;
    label: string;
    colors: Color[];
    deletedAt: number;
    project?: ProjectTrashEntry;
  };

  let yarnDataReady = $state(false);
  let trashedProjects = $state<ProjectTrashEntry[]>([]);
  // Links of projects only the account has, once downloaded, for their colors
  let downloadedHrefs = $state<Record<string, string>>({});
  // `${kind}:${id}` of the entry asking to be deleted forever, or 'all'
  let confirming = $state<string | null>(null);

  let entries = $derived.by((): Entry[] => {
    if (!yarnDataReady) return [];
    const projects = trashedProjects.map((project) => {
      const href = project.local?.item.meta.href ?? downloadedHrefs[project.id];
      return {
        kind: 'project' as const,
        id: project.id,
        label: project.label,
        colors: (href && getColorsFromInput({ string: href })) || [],
        deletedAt: project.deletedAt,
        project,
      };
    });
    const palettes = savedPalettes.deleted.map((palette) => {
      const colors = getColorsFromInput({ string: palette.code }) || [];
      return {
        kind: 'palette' as const,
        id: palette.id,
        label: palette.name || getPaletteFallbackName(colors),
        colors,
        deletedAt: palette.deletedAt ?? 0,
      };
    });
    return [...projects, ...palettes].sort((a, b) => b.deletedAt - a.deletedAt);
  });

  onMount(async () => {
    await Promise.all([
      ensureYarnData(),
      savedPalettes.refresh(),
      refreshAccountTrash(),
    ]);
    yarnDataReady = true;
  });

  $effect(() => {
    // Reload when projects move in or out of the Trash, here or in the account
    void savedProjects.version;
    void accountTrash.list;
    loadProjectTrash().then((trash) => (trashedProjects = trash));
  });

  $effect(() => {
    for (const project of trashedProjects)
      if (
        project.account &&
        !project.local &&
        !(project.id in downloadedHrefs)
      ) {
        // Marked first, so a sync pass meanwhile doesn't download it again
        downloadedHrefs[project.id] = '';
        trashedProject(project.id, project.account.rev).then((p) => {
          if (p) downloadedHrefs[project.id] = p.href;
        });
      }
  });

  async function run(action: () => Promise<void>, errorMessage: string) {
    confirming = null;
    try {
      await action();
    } catch {
      toast.trigger({ message: errorMessage, category: 'error' });
    }
    await savedPalettes.refresh();
  }

  const restore = ({ kind, id, project }: Entry) =>
    run(
      () =>
        kind === 'project'
          ? restoreTrashEntry(project!)
          : PaletteStorage.restore(id),
      'Unable to restore it',
    );

  const deleteForever = ({ kind, id, project }: Entry) =>
    run(
      () =>
        kind === 'project'
          ? deleteTrashEntryForever(project!)
          : PaletteStorage.deleteForever(id),
      'Unable to delete it',
    );

  const emptyTrash = () =>
    run(async () => {
      await emptyProjectTrash(trashedProjects);
      await PaletteStorage.emptyTrash();
    }, 'Unable to empty the Trash');
</script>

<div class="flex w-full flex-col gap-2 px-4 pb-4 md:min-w-[40rem]">
  <p class="text-surface-700-300 text-center text-sm">
    Deleted projects and palettes stay here for {TRASH_DAYS} days before they're permanently removed.
  </p>

  {#if !entries.length}
    <p class="my-4 text-center text-sm">The Trash is empty</p>
  {:else}
    <ul class="flex w-full flex-col gap-4" aria-label="Trash">
      {#each entries as entry (`${entry.kind}:${entry.id}`)}
        {@const key = `${entry.kind}:${entry.id}`}
        {@const KindIcon =
          entry.kind === 'project' ? NotebookPenIcon : SwatchBookIcon}
        <li
          class="bg-surface-100 dark:bg-surface-900 rounded-container flex w-full flex-col gap-3 p-4"
        >
          <div class="flex flex-wrap items-center gap-x-3 gap-y-1">
            <span class="badge bg-surface-200-800 gap-1 text-sm">
              <KindIcon size={16} />
              {entry.kind === 'project' ? 'Project' : 'Yarn Palette'}
            </span>
            <span class="font-bold">{entry.label}</span>
          </div>
          <ColorPalette
            colors={entry.colors}
            height="24px"
            schemeName="Deleted {formatDateTime(entry.deletedAt)}"
          />
          {#if confirming === key}
            <div class="flex flex-wrap items-center gap-2" role="group">
              <span class="text-sm">This action cannot be undone.</span>
              <button
                type="button"
                class="btn preset-filled-error-500"
                onclick={() => deleteForever(entry)}
              >
                <Trash2Icon />
                Yes, Delete Forever
              </button>
              <button
                type="button"
                class="btn hover:preset-tonal-surface"
                onclick={() => (confirming = null)}
              >
                  <XIcon/>
                Cancel
              </button>
            </div>
          {:else}
            <div class="flex flex-wrap items-center gap-2">
              <button
                type="button"
                class="btn hover:preset-tonal-surface"
                aria-label="Restore {entry.label}"
                onclick={() => restore(entry)}
              >
                <ArchiveRestoreIcon />
                Restore
              </button>
              <button
                type="button"
                class="btn hover:preset-tonal-surface"
                aria-label="Delete {entry.label} forever"
                onclick={() => (confirming = key)}
              >
                <Trash2Icon />
                Delete Forever
              </button>
            </div>
          {/if}
        </li>
      {/each}
    </ul>

    {#if confirming === 'all'}
      <div class="mt-4 flex flex-wrap items-center gap-2" role="group">
        <span class="text-sm"
          >Delete everything in the Trash forever? This can't be undone.</span
        >
        <button
          type="button"
          class="btn preset-filled-error-500"
          onclick={emptyTrash}
        >
          <Trash2Icon />
          Yes, Empty Trash
        </button>
        <button
          type="button"
          class="btn hover:preset-tonal-surface"
          onclick={() => (confirming = null)}
        >
          Cancel
        </button>
      </div>
    {:else}
      <button
        type="button"
        class="btn hover:preset-tonal-surface mt-4 w-fit"
        onclick={() => (confirming = 'all')}
      >
        <Trash2Icon />
        Empty Trash
      </button>
    {/if}
  {/if}
</div>

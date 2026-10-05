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

<!-- "Add the projects on this device to your account?" Shown once per account
and device, after signing in, and again whenever someone asks to add projects
(`later`). Saved palettes go along unless someone chooses otherwise. -->

<script lang="ts">
  import { ROW_FOCUS } from '$lib/constants/class-constants';
  import ProjectDetails from '$lib/components/ProjectDetails.svelte';
  import { dialog, toast } from '$lib/state/page-state.svelte';
  import {
    ProjectStorage,
    type StoredProjectIndexItem,
  } from '$lib/storage/projects.svelte';
  import { sync } from '$lib/sync/status.svelte';
  import { addToAccount, markImportAsked } from '$lib/sync/sync.svelte';
  import {
    ChevronRightIcon,
    ClockIcon,
    CloudUploadIcon,
    ListChecksIcon,
    XIcon,
  } from '@lucide/svelte';
  import { onMount, untrack } from 'svelte';

  let {
    userId,
    ids,
    paletteIds = [],
    later = false,
  }: {
    userId: string;
    ids: string[];
    paletteIds?: string[];
    later?: boolean;
  } = $props();

  let projects = $state<StoredProjectIndexItem[]>([]);
  // Everything is chosen to start with
  let chosen = $state<string[]>(untrack(() => [...ids]));
  let addPalettes = $state(true);
  let choosing = $state(false);
  let busy = $state(false);

  onMount(async () => {
    const index = await ProjectStorage.getIndex();
    projects = index.filter((item) => ids.includes(item.id)).reverse();
  });

  // The first and last rows round their own outer corners, so the first row's
  // fill fits inside the list's border
  const ROW = `flex w-full items-start gap-3 px-4 py-3 text-left transition-colors first:rounded-t-container last:rounded-b-container disabled:opacity-50 ${ROW_FOCUS}`;
  const ICON = 'mt-0.5 size-5 shrink-0';
  const DETAIL = 'block text-sm opacity-75';

  const plural = (n: number) => (n === 1 ? 'project' : 'projects');
  const palettesLabel = (n: number) =>
    `${n} ${n === 1 ? 'palette' : 'palettes'}`;
  /** "2 projects and 1 palette" */
  const describe = (projects: number, palettes: number) =>
    [
      projects && `${projects} ${plural(projects)}`,
      palettes && palettesLabel(palettes),
    ]
      .filter(Boolean)
      .join(' and ');

  async function answer(add: string[], addPaletteIds: string[] = []) {
    busy = true;
    await markImportAsked(userId);
    dialog.close();
    if (!add.length && !addPaletteIds.length) return;
    await addToAccount(userId, add, addPaletteIds);
    const added = describe(add.length, addPaletteIds.length);
    // Problems have toasts of their own (see $lib/sync/sync.svelte)
    if (sync.state === 'idle')
      toast.trigger({
        message: `Added ${added} to your account`,
        category: 'success',
      });
    else if (sync.state === 'offline')
      toast.trigger({
        message: `${added} will be added to your account when you’re back online`,
        category: 'info',
      });
  }
</script>

<div
  class="flex flex-col gap-4 p-4"
  role="dialog"
  aria-modal="true"
  aria-labelledby="sync-import-title"
>
  <div class="flex items-start gap-3">
    <CloudUploadIcon class="text-primary-500 mt-1 size-6 shrink-0" />
    <div class="flex flex-col gap-1">
      <h2 id="sync-import-title" class="h4">
        {later
          ? `Add ${ids.length ? 'projects' : 'palettes'} to your account`
          : `Add your ${ids.length ? 'projects' : 'palettes'} to your account?`}
      </h2>
      <p class="text-sm opacity-80">
        This browser has {describe(ids.length, paletteIds.length)} that
        {ids.length + paletteIds.length === 1 ? 'isn’t' : 'aren’t'} in your account
        yet.
      </p>
    </div>
  </div>

  {#if choosing}
    <!-- The same cards as in Saved Projects, so projects are easy to tell apart -->
    <fieldset>
      <legend class="sr-only">Projects to add</legend>
      <!-- A fieldset can't reliably be a flex box, so the list is a div -->
      <div class="flex flex-col gap-3">
        {#each projects as project (project.id)}
          <label class="flex cursor-pointer items-center gap-3">
            <input
              type="checkbox"
              class="checkbox shrink-0"
              value={project.id}
              aria-label="Add {project.meta.title || 'Untitled project'}"
              bind:group={chosen}
            />
            <span class="block min-w-0 flex-1">
              <ProjectDetails project={project.meta} canRemove={false} />
            </span>
          </label>
        {/each}
        {#if paletteIds.length}
          <label class="flex cursor-pointer items-center gap-3">
            <input
              type="checkbox"
              class="checkbox shrink-0"
              bind:checked={addPalettes}
            />
            <span>Also add {palettesLabel(paletteIds.length)}</span>
          </label>
        {/if}
      </div>
    </fieldset>
  {/if}

  <!-- Each choice is one row: what it does, and what that means. Pinned to the
  bottom of the dialog, so they stay in reach while scrolling a long list. -->
  <div
    class="bg-surface-50 dark:bg-surface-950 sticky bottom-0 -mx-4 -mb-4 px-4 pt-2 pb-4"
  >
    <div
      class="rounded-container border-surface-200-800 divide-surface-200-800 flex flex-col divide-y border"
    >
      <button
        type="button"
        class="bg-primary-50-950 hover:bg-primary-100-900 {ROW}"
        disabled={busy ||
          (choosing && !chosen.length && !(addPalettes && paletteIds.length))}
        onclick={() =>
          choosing
            ? answer(chosen, addPalettes ? paletteIds : [])
            : answer(ids, paletteIds)}
      >
        <CloudUploadIcon class="text-primary-600-400 {ICON}" />
        <span class="flex-1">
          <span class="block font-bold">
            {#if choosing}
              Add {describe(
                chosen.length,
                addPalettes ? paletteIds.length : 0,
              ) || 'nothing'}
            {:else if ids.length + paletteIds.length === 1}
              Add it
            {:else}
              Add all {ids.length + paletteIds.length}
            {/if}
          </span>
          <span class={DETAIL}> Synced to every device you sign in on. </span>
        </span>
      </button>

      {#if !choosing}
        <button
          type="button"
          class="hover:bg-surface-100-900 {ROW}"
          disabled={busy}
          onclick={() => (choosing = true)}
        >
          <ListChecksIcon class={ICON} />
          <span class="flex-1">
            <span class="block font-bold">Choose…</span>
            <span class={DETAIL}>Pick what to add.</span>
          </span>
          <ChevronRightIcon class="mt-0.5 size-5 shrink-0 opacity-50" />
        </button>
      {/if}

      <button
        type="button"
        class="hover:bg-surface-100-900 {ROW}"
        disabled={busy}
        onclick={() => answer([])}
      >
        {#if later}
          <XIcon class={ICON} />
        {:else}
          <ClockIcon class={ICON} />
        {/if}
        <span class="flex-1">
          <span class="block font-bold">{later ? 'Cancel' : 'Not now'}</span>
          <span class={DETAIL}>
            They stay in this browser. Add them later from My Projects.
          </span>
        </span>
      </button>
    </div>
  </div>
</div>

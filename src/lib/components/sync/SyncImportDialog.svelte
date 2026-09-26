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
and device, after signing in. -->

<script lang="ts">
  import { dialog } from '$lib/state/page-state.svelte';
  import {
    ProjectStorage,
    type StoredProjectIndexItem,
  } from '$lib/storage/projects.svelte';
  import { addToAccount, markImportAsked } from '$lib/sync/sync.svelte';
  import { CloudUploadIcon } from '@lucide/svelte';
  import { onMount, untrack } from 'svelte';

  let { userId, ids }: { userId: string; ids: string[] } = $props();

  let projects = $state<StoredProjectIndexItem[]>([]);
  // Everything is chosen to start with
  let chosen = $state<string[]>(untrack(() => [...ids]));
  let choosing = $state(false);
  let busy = $state(false);

  onMount(async () => {
    const index = await ProjectStorage.getIndex();
    projects = index.filter((item) => ids.includes(item.id)).reverse();
  });

  async function answer(add: string[]) {
    busy = true;
    await markImportAsked(userId);
    dialog.close();
    if (add.length) await addToAccount(userId, add);
  }

  const plural = (n: number) => (n === 1 ? 'project' : 'projects');
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
        Add your projects to your account?
      </h2>
      <p class="text-sm opacity-80">
        This browser has {ids.length}
        {plural(ids.length)} saved. Add them to your account to open them on your
        other devices.
      </p>
    </div>
  </div>

  {#if choosing}
    <fieldset
      class="rounded-container border-surface-200-800 flex max-h-72 flex-col overflow-auto border"
    >
      <legend class="sr-only">Projects to add</legend>
      {#each projects as project (project.id)}
        <label
          class="hover:preset-tonal-surface flex min-h-12 items-center gap-3 px-3 py-2"
        >
          <input
            type="checkbox"
            class="checkbox"
            value={project.id}
            bind:group={chosen}
          />
          <span class="flex min-w-0 flex-col">
            <span class="truncate font-bold"
              >{project.meta.title || 'Untitled project'}</span
            >
            <span class="text-xs opacity-70">Saved {project.meta.date}</span>
          </span>
        </label>
      {/each}
    </fieldset>
  {/if}

  <div class="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
    <button
      type="button"
      class="btn hover:preset-tonal-surface max-sm:w-full"
      disabled={busy}
      onclick={() => answer([])}>Not now</button
    >
    {#if !choosing}
      <button
        type="button"
        class="btn preset-outlined-surface-300-700 max-sm:w-full"
        disabled={busy}
        onclick={() => (choosing = true)}>Choose…</button
      >
    {/if}
    <button
      type="button"
      class="btn preset-filled-primary-500 max-sm:w-full"
      disabled={busy || (choosing && !chosen.length)}
      onclick={() => answer(choosing ? chosen : ids)}
    >
      {#if choosing}
        Add {chosen.length} {plural(chosen.length)}
      {:else}
        Add {ids.length === 1 ? 'it' : `all ${ids.length}`}
      {/if}
    </button>
  </div>
</div>

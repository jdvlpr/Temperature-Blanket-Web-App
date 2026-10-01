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

<!-- The open project's name at the top of the Project menu on phones (wider
screens have it in the top bar, see ProjectTitle), falling back to
the location title, with renaming once it's saved (or was opened from My
Projects). The name shows on My Projects instead of the location title, and
syncs like any other change. -->

<script lang="ts">
  import { projectMenu, toast } from '$lib/state/page-state.svelte';
  import { locations } from '$lib/state/location-state.svelte';
  import { project } from '$lib/state/project-state.svelte';
  import { renameOpenProject, storedItem } from '$lib/storage/autosave.svelte';
  import {
    MAX_SAVED_PROJECT_NAME_LENGTH,
    savedProjects,
  } from '$lib/storage/projects.svelte';
  import { CheckIcon, PencilIcon, XIcon } from '@lucide/svelte';
  import { untrack } from 'svelte';

  let id = $state<string | null>(null);
  let savedName = $state('');
  let title = $state('');
  let editing = $state(false);
  let name = $state('');

  $effect(() => {
    void project.url.href;
    void savedProjects.version;
    storedItem().then((item) => {
      id = item?.id ?? null;
      savedName = item?.meta.name ?? '';
      title = item?.meta.title ?? '';
      // Opened from the "Name it" toast after saving
      if (id && untrack(() => projectMenu.renameNext)) {
        projectMenu.renameNext = false;
        name = savedName;
        editing = true;
      }
    });
  });

  async function save() {
    if (!id) return;
    editing = false;
    try {
      await renameOpenProject(name);
      savedName = name.trim();
      toast.trigger({
        message: savedName ? 'Project renamed' : 'Name removed',
        category: 'success',
      });
    } catch {
      toast.trigger({
        message: 'Unable to rename the project',
        category: 'error',
      });
    }
  }
</script>

{#if editing && id}
  <div class="input-group w-full grid-cols-[1fr_auto_auto]">
    <!-- svelte-ignore a11y_autofocus -->
    <input
      type="text"
      class="ig-input"
      aria-label="Project name"
      autocomplete="off"
      autofocus
      maxlength={MAX_SAVED_PROJECT_NAME_LENGTH}
      placeholder={title}
      bind:value={name}
      onkeydown={(e) => {
        if (e.key === 'Enter') save();
        if (e.key === 'Escape') {
          e.stopPropagation();
          editing = false;
        }
      }}
    />
    <button
      type="button"
      class="ig-btn hover:preset-tonal-surface"
      title="Save Name"
      aria-label="Save name"
      onclick={save}
    >
      <CheckIcon />
    </button>
    <button
      type="button"
      class="ig-btn hover:preset-tonal-surface"
      title="Cancel"
      aria-label="Cancel renaming"
      onclick={() => (editing = false)}
    >
      <XIcon />
    </button>
  </div>
{:else}
  <div class="flex items-center gap-1">
    <p
      class="text-lg leading-tight font-bold break-words"
      data-testid="project-name"
    >
      {savedName || locations.projectTitle || 'Untitled Project'}
    </p>
    {#if id}
      <button
        type="button"
        class="hover:bg-surface-200-800 rounded-base inline-flex size-7 shrink-0 items-center justify-center opacity-70 hover:opacity-100"
        title={savedName ? 'Rename Project' : 'Name this project'}
        aria-label={savedName ? `Rename ${savedName}` : 'Name this project'}
        onclick={() => {
          name = savedName;
          editing = true;
        }}
      >
        <PencilIcon class="size-3.5" />
      </button>
    {/if}
  </div>
  {#if savedName && locations.projectTitle}
    <p class="text-sm opacity-70">{locations.projectTitle}</p>
  {/if}
{/if}

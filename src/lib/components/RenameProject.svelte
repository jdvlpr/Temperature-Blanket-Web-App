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
  import ProjectNameField from '$lib/components/ProjectNameField.svelte';
  import { toast } from '$lib/state/page-state.svelte';
  import { locations } from '$lib/state/location-state.svelte';
  import { project } from '$lib/state/project-state.svelte';
  import { renameOpenProject, storedItem } from '$lib/storage/autosave.svelte';
  import { savedProjects } from '$lib/storage/projects.svelte';
  import { PencilIcon } from '@lucide/svelte';

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
  <ProjectNameField
    bind:value={name}
    placeholder={title}
    onsave={save}
    oncancel={() => (editing = false)}
  />
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

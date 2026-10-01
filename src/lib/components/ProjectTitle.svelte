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

<!-- The open project's name in the top bar, on wider screens (phones rename in
the Project menu). It's a text field styled as the title, as in Google Docs:
click to rename in place; Enter or clicking away keeps the name, Escape puts
it back. Not saved yet, clicking it saves the project first, since naming it
means keeping it. Save (or whether it's saved) is beside it. -->

<script lang="ts">
  import SaveButton from '$lib/components/buttons/SaveButton.svelte';
  import { locations } from '$lib/state/location-state.svelte';
  import { toast } from '$lib/state/page-state.svelte';
  import { project } from '$lib/state/project-state.svelte';
  import {
    autosave,
    renameOpenProject,
    storedItem,
  } from '$lib/storage/autosave.svelte';
  import {
    MAX_SAVED_PROJECT_NAME_LENGTH,
    savedProjects,
  } from '$lib/storage/projects.svelte';
  import { saveProject } from '$lib/utils/save-project.svelte';
  import { tick } from 'svelte';

  let savedName = $state('');
  let name = $state('');
  let focused = $state(false);

  $effect(() => {
    void project.url.href;
    void savedProjects.version;
    storedItem().then((item) => {
      savedName = item?.meta.name ?? '';
      if (!focused) name = savedName;
    });
  });

  // No name: the location title shows in its place
  const fallback = $derived(locations.projectTitle || 'Untitled Project');

  async function onfocus(e: FocusEvent & { currentTarget: HTMLInputElement }) {
    focused = true;
    const input = e.currentTarget;
    // No name yet: the location title is there to edit, or type over
    if (!name) name = fallback;
    await tick();
    input.select();
    if (!autosave.stored) await saveProject();
  }

  async function onblur() {
    focused = false;
    let renamed = name.trim();
    // Left as the location title: still no name, so it follows the locations
    if (!savedName && renamed === fallback) renamed = '';
    name = renamed;
    if (renamed === savedName || !autosave.stored) return;
    try {
      await renameOpenProject(renamed);
      savedName = renamed;
      toast.trigger({
        message: renamed ? 'Project renamed' : 'Name removed',
        category: 'success',
      });
    } catch {
      name = savedName;
      toast.trigger({
        message: 'Unable to rename the project',
        category: 'error',
      });
    }
  }
</script>

<!-- The hidden copy of the text sizes the field to it, so it's exactly as
wide as the title, focused or not -->
<div
  class="inline-grid max-w-full min-w-0 grid-cols-[minmax(0,max-content)] font-bold"
>
  <span
    class="invisible col-start-1 row-start-1 truncate border border-transparent px-2 whitespace-pre"
    aria-hidden="true">{name || fallback}</span
  >
  <input
    type="text"
    class="rounded-base hover:border-surface-300-700 focus:border-surface-300-700 focus:bg-surface-50-950 col-start-1 row-start-1 h-9 w-full min-w-0 truncate border border-transparent bg-transparent px-2 outline-none placeholder:text-current"
    class:placeholder:opacity-70={!autosave.stored}
    aria-label="Project name"
    title={autosave.stored ? 'Rename Project' : 'Save and name this project'}
    autocomplete="off"
    spellcheck="false"
    maxlength={MAX_SAVED_PROJECT_NAME_LENGTH}
    placeholder={fallback}
    bind:value={name}
    {onfocus}
    {onblur}
    onkeydown={(e) => {
      if (e.key === 'Enter') e.currentTarget.blur();
      if (e.key === 'Escape') {
        e.stopPropagation();
        name = savedName;
        e.currentTarget.blur();
      }
    }}
    data-testid="top-bar-project-name"
  />
</div>
<SaveButton beside="title" />

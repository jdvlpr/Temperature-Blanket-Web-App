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

<!-- The open project's name in the top bar, on wider screens (it can be
renamed in the Project menu too). It's a text field styled as the title, as in Google Docs:
click to rename in place; Enter or clicking away keeps the name, Escape puts
it back. Not saved yet, a changed name asks whether to save the project when
the field loses focus. Until the project saves by itself, a dot on the Project
button says it isn't saved; then the button shows the save state. -->

<script lang="ts">
  import { account } from '#lib/accounts/summary.svelte.js';
  import { locations } from '#lib/state/location-state.svelte.js';
  import { dialog, toast } from '#lib/state/page-state.svelte.js';
  import { project } from '#lib/state/project-state.svelte.js';
  import {
    autosave,
    renameOpenProject,
    storedItem,
  } from '#lib/storage/autosave.svelte.js';
  import {
    MAX_PROJECT_NAME_LENGTH,
    savedProjects,
  } from '#lib/storage/projects.svelte.js';
  import { saveProject } from '#lib/utils/save-project.svelte.js';
  import { tick } from 'svelte';

  let savedName = $state('');
  let name = $state('');
  let focused = $state(false);
  const signedIn = $derived(
    __ACCOUNTS_ENABLED__ && Boolean(account.summary?.id),
  );

  $effect(() => {
    void project.url.href;
    void savedProjects.version;
    // Not saved here yet: the name its shared link carried, if any
    const linkName = project.linkName;
    storedItem().then((item) => {
      savedName = item ? (item.meta.name ?? '') : linkName;
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
  }

  async function onblur() {
    focused = false;
    let renamed = name.trim();
    // Left as the location title: still no name, so it follows the locations
    if (!savedName && renamed === fallback) renamed = '';
    name = renamed;
    if (renamed === savedName) return;
    if (!autosave.stored) {
      const save = await new Promise<boolean>((resolve) => {
        const respond = (response: boolean) => {
          dialog.escapeAction = null;
          resolve(response);
        };
        dialog.trigger({
          type: 'confirm',
          title: 'Save this project?',
          body: `Save this project as "${renamed || fallback}"? It will be saved ${
            signedIn ? 'to your account' : 'in this browser'
          }.`,
          confirmText: 'Save project',
          response: respond,
        });
        dialog.escapeAction = () => {
          respond(false);
          dialog.close();
        };
      });
      if (!save) {
        name = savedName;
        return;
      }
      try {
        if (!(await saveProject())) {
          name = savedName;
          return;
        }
        await renameOpenProject(renamed);
        savedName = renamed;
        name = renamed;
        if (renamed)
          toast.trigger({
            message: 'Project renamed',
            category: 'success',
          });
      } catch {
        name = savedName;
        toast.trigger({
          message: 'Unable to rename the project',
          category: 'error',
        });
      }
      return;
    }
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
  <!-- size=1: otherwise its default width (20 characters) widens the column
  past a short name -->
  <input
    type="text"
    size={1}
    class="rounded-base hover:border-surface-300-700 focus:border-surface-300-700 focus:bg-surface-50-950 col-start-1 row-start-1 h-10 w-full min-w-0 truncate border border-transparent bg-transparent px-2 outline-none placeholder:text-current"
    class:placeholder:opacity-70={!autosave.stored}
    aria-label="Project name"
    title={autosave.stored ? 'Rename Project' : 'Save and name this project'}
    autocomplete="off"
    spellcheck="false"
    maxlength={MAX_PROJECT_NAME_LENGTH}
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

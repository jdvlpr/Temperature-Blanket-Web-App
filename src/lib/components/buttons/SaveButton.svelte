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

<!-- Save, in the top bar: saves right away (see saveProject), and shows the
state. Projects in the account save by themselves, so for them it's a status
(Saved, Saving…, Not saved); a problem opens the Project menu. -->

<script lang="ts">
  import { project } from '$lib/state/project-state.svelte';
  import { autosave } from '$lib/storage/autosave.svelte';
  import { saveProject } from '$lib/utils/save-project.svelte';
  import {
    BookmarkCheckIcon,
    BookmarkIcon,
    CloudAlertIcon,
    CloudCheckIcon,
    LoaderCircleIcon,
  } from '@lucide/svelte';

  let busy = $state(false);

  const status = $derived.by(() => {
    if (autosave.on) {
      if (autosave.state === 'error' || autosave.state === 'conflict')
        return 'problem';
      if (autosave.state === 'saved') return 'synced';
      return 'saving';
    }
    if (busy) return 'saving';
    if (autosave.stored) return project.status.saved ? 'saved' : 'changed';
    return 'new';
  });

  const label = $derived(
    {
      problem: 'Not saved',
      synced: 'Saved',
      saving: 'Saving…',
      saved: 'Saved',
      changed: 'Save',
      new: 'Save',
    }[status],
  );

  const title = $derived(
    {
      problem: 'Not saved: see the Project menu',
      synced: 'Saved to your account. Changes save by themselves.',
      saving: 'Saving…',
      saved: 'Saved in this browser',
      changed: 'Save changes [Cmd ⌘]+[s] or [Ctrl]+[s]',
      new: 'Save Project [Cmd ⌘]+[s] or [Ctrl]+[s]',
    }[status],
  );

  async function save() {
    busy = true;
    try {
      await saveProject();
    } finally {
      busy = false;
    }
  }
</script>

<button
  type="button"
  aria-label={label}
  {title}
  class="max-md:btn-icon md:btn hover:preset-tonal-surface relative"
  onclick={save}
  disabled={status === 'saving'}
  data-testid="save-button"
>
  {#if status === 'problem'}
    <CloudAlertIcon class="text-error-700-300" />
  {:else if status === 'synced'}
    <CloudCheckIcon class="text-success-700-300" />
  {:else if status === 'saving'}
    <LoaderCircleIcon class="animate-spin opacity-70" />
  {:else if status === 'saved'}
    <BookmarkCheckIcon class="text-success-700-300" />
  {:else}
    <BookmarkIcon />
  {/if}
  <span class="inline-block max-md:hidden">{label}</span>
  {#if status === 'changed'}
    <!-- Changes since the last save -->
    <span
      class="bg-primary-500 absolute top-1 right-1 size-2 rounded-full"
      aria-hidden="true"
    ></span>
  {/if}
</button>

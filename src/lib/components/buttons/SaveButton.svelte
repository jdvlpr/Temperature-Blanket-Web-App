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

<!-- Save, in the top bar: saves right away (see saveProject). Only until the
project saves by itself: then the Project button's icon shows the save state
(see ProjectMenuButton). Beside the project's name on wider screens. -->

<script lang="ts">
  import { project } from '$lib/state/project-state.svelte';
  import { autosave } from '$lib/storage/autosave.svelte';
  import { saveProject } from '$lib/utils/save-project.svelte';
  import {
    BookmarkCheckIcon,
    BookmarkIcon,
    LoaderCircleIcon,
  } from '@lucide/svelte';

  let { beside }: { beside?: 'title' } = $props();

  let busy = $state(false);
  // Briefly true after a save from this button, to give the check icon a little pop
  let justSaved = $state(false);

  const status = $derived.by(() => {
    if (busy) return 'saving';
    // Another account's project, here signed out: Save as before
    if (autosave.stored) return project.status.saved ? 'saved' : 'changed';
    return 'new';
  });

  const label = $derived(
    { saving: 'Saving…', saved: 'Saved', changed: 'Save', new: 'Save' }[status],
  );

  const title = $derived(
    {
      saving: 'Saving…',
      saved: 'Saved in this browser',
      changed: 'Save changes [Cmd ⌘]+[s] or [Ctrl]+[s]',
      new: 'Save Project [Cmd ⌘]+[s] or [Ctrl]+[s]',
    }[status],
  );

  async function save() {
    busy = true;
    try {
      if (await saveProject()) {
        justSaved = true;
        setTimeout(() => (justSaved = false), 600);
      }
    } finally {
      busy = false;
    }
  }
</script>

{#snippet icon()}
  {#if status === 'saving'}
    <LoaderCircleIcon class="animate-spin opacity-70" />
  {:else if status === 'saved'}
    <BookmarkCheckIcon class={[justSaved && 'feedback-pop']} />
  {:else}
    <BookmarkIcon />
  {/if}
{/snippet}

{#if autosave.on}
  <!-- Saves by itself: the Project button shows how it's going -->
{:else if beside === 'title' && status !== 'new' && status !== 'changed'}
  <span
    role="img"
    aria-label={label}
    {title}
    class="flex size-8 shrink-0 items-center justify-center [&_svg]:size-5"
    data-testid="save-button"
  >
    {@render icon()}
  </span>
{:else}
  <button
    type="button"
    aria-label={label}
    {title}
    class="max-md:btn-icon md:btn hover:preset-tonal-surface relative shrink-0"
    onclick={save}
    disabled={status === 'saving'}
    data-testid="save-button"
  >
    {@render icon()}
    <span class="inline-block max-md:hidden">{label}</span>
    {#if status === 'changed'}
      <!-- Changes since the last save -->
      <span
        class="bg-primary-500 absolute top-1 right-1 size-2 rounded-full"
        aria-hidden="true"
      ></span>
    {/if}
  </button>
{/if}

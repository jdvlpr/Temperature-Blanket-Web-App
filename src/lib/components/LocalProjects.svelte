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

<script lang="ts">
  import { browser } from '$app/environment';
  import { resolve } from '$app/paths';
  import ProjectDetails from '$lib/components/ProjectDetails.svelte';
  import { toast } from '$lib/state/page-state.svelte';
  import type { StoredProjectIndexItem } from '$lib/storage/projects.svelte';
  import { ProjectStorage, savedProjects } from '$lib/storage/projects.svelte';
  import { account } from '$lib/accounts/summary.svelte';
  import AddToAccountButton from '$lib/components/sync/AddToAccountButton.svelte';
  import SyncStatus from '$lib/components/sync/SyncStatus.svelte';
  import { sync, syncLabelFor } from '$lib/sync/status.svelte';
  import { FolderOpenIcon, Undo2Icon } from '@lucide/svelte';

  // The Menu shows a few recent projects with a link to the My Projects page,
  // which shows them all under its own heading, with rename and delete
  let {
    limit,
    onMyProjectsPage = false,
  }: { limit?: number; onMyProjectsPage?: boolean } = $props();

  let projects = $state<StoredProjectIndexItem[]>([]);
  let loaded = $state(false);
  let shown = $derived(limit ? projects.slice(0, limit) : projects);

  // A quick undo for the project just moved to the Trash
  let lastDeleted = $state<{ id: string; label: string } | null>(null);

  const labelFor = (item: StoredProjectIndexItem) =>
    item.meta.name || item.meta.title || 'Untitled Project';

  async function run(action: () => Promise<void>, errorMessage: string) {
    try {
      await action();
    } catch {
      toast.trigger({ message: errorMessage, category: 'error' });
    }
  }

  async function remove(item: StoredProjectIndexItem) {
    lastDeleted = { id: item.id, label: labelFor(item) };
    await run(
      () => ProjectStorage.moveToTrash(item.id),
      'Unable to delete the project',
    );
  }

  async function undoRemove() {
    if (!lastDeleted) return;
    const { id } = lastDeleted;
    lastDeleted = null;
    await run(
      () => ProjectStorage.restoreFromTrash(id),
      'Unable to restore the project',
    );
  }

  async function rename(id: string, name: string) {
    await run(
      () => ProjectStorage.rename(id, name),
      'Unable to rename the project',
    );
  }

  // Signed in: show where each project is kept
  const signedIn = $derived(
    __ACCOUNTS_ENABLED__ && Boolean(account.summary?.id),
  );

  async function loadProjects() {
    if (browser) {
      projects = await ProjectStorage.getProjectsForDisplay();
    } else {
      projects = [];
    }
    loaded = true;
  }

  $effect(() => {
    // Reload whenever saved projects change (here, in the Trash or by a
    // sync), and when someone signs in or out
    void savedProjects.version;
    void sync.version;
    void account.summary?.id;
    loadProjects();
  });
</script>

{#if lastDeleted}
  <div
    class="card preset-tonal-surface mt-2 flex w-full items-center justify-between gap-2 p-2 pl-4 text-left text-sm"
    role="status"
  >
    <span class="line-clamp-1">Moved {lastDeleted.label} to the Trash</span>
    <button
      type="button"
      class="btn btn-sm hover:preset-tonal-surface"
      onclick={undoRemove}
    >
      <Undo2Icon />
      Undo
    </button>
  </div>
{/if}

{#key projects}
  {#if projects?.length}
    <div class="mb-2 flex w-full flex-col items-start justify-center">
      {#if !onMyProjectsPage}
        <h2 class="mt-4 text-xl font-bold">Saved Projects</h2>
      {/if}
      {#if signedIn && sync.active}
        <SyncStatus class="text-surface-700-300 mb-2" />
        <AddToAccountButton class="mb-2" />
      {:else if !onMyProjectsPage}
        <p class="text-surface-700-300 mb-2 text-sm">Stored in this browser</p>
      {/if}
      <div class="flex w-full flex-col items-start justify-center gap-2">
        {#each shown as project (project.id)}
          {@const { meta } = project}
          <ProjectDetails
            project={meta}
            newTab={!onMyProjectsPage}
            canRemove={onMyProjectsPage}
            syncLabel={__ACCOUNTS_ENABLED__
              ? syncLabelFor(project, signedIn)
              : undefined}
            onclick={() => remove(project)}
            onrename={onMyProjectsPage
              ? (name) => rename(project.id, name)
              : undefined}
          />
        {/each}
      </div>
      {#if limit}
        <a
          href={resolve('/my-projects')}
          class="btn hover:preset-tonal-surface mt-2"
        >
          <FolderOpenIcon />
          {projects.length > shown.length
            ? `See All ${projects.length} Projects`
            : 'My Projects'}
        </a>
      {/if}
    </div>
  {:else if onMyProjectsPage && loaded}
    <div class="my-8 flex w-full flex-col gap-2 text-center">
      <p class="font-bold">No saved projects yet</p>
      <p class="text-sm">
        In the Project Planner, press Save to keep a project here. On a small
        screen, press Project, then Save.
      </p>
    </div>
  {/if}
{/key}

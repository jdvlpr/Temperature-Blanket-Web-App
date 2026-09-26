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

<!-- The account's projects, for the account page, shown as in the list of saved
projects. Syncing downloads every one of them, so the list on this device is the
account's list; removing one removes it from the account too. -->

<script lang="ts">
  import ProjectDetails from '$lib/components/ProjectDetails.svelte';
  import {
    ProjectStorage,
    sortByRecent,
    type StoredProjectIndexItem,
  } from '$lib/storage/projects.svelte';
  import { sync, syncLabelFor } from '$lib/sync/status.svelte';

  let { userId }: { userId: string } = $props();

  let projects = $state<StoredProjectIndexItem[] | null>(null);

  async function load() {
    const index = await ProjectStorage.getIndex();
    projects = sortByRecent(
      index.filter((item) => item.sync?.ownerUserId === userId),
    );
  }

  $effect(() => {
    // Reload after each sync pass
    void sync.version;
    load();
  });
</script>

{#if projects}
  {#if projects.length}
    <ul class="flex flex-col gap-2 p-2" aria-label="Your projects">
      {#each projects as project (project.id)}
        <li>
          <ProjectDetails
            project={project.meta}
            syncLabel={syncLabelFor(project, true)}
            onclick={async () => {
              await ProjectStorage.removeById(project.id);
              await load();
            }}
          />
        </li>
      {/each}
    </ul>
  {:else}
    <p class="px-4 py-3 text-sm opacity-70">No projects yet.</p>
  {/if}
{/if}

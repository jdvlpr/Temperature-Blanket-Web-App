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
  import type { StoredProjectIndexItem } from '$lib/storage/projects.svelte';
  import { ProjectStorage } from '$lib/storage/projects.svelte';
  import { FolderOpenIcon } from '@lucide/svelte';

  // The Menu shows a few recent projects with a link to the My Projects page,
  // which shows them all under its own heading
  let {
    limit,
    onMyProjectsPage = false,
  }: { limit?: number; onMyProjectsPage?: boolean } = $props();

  let projects = $state<StoredProjectIndexItem[]>([]);
  let loaded = $state(false);
  let shown = $derived(limit ? projects.slice(0, limit) : projects);

  async function loadProjects() {
    if (browser) {
      projects = await ProjectStorage.getProjectsForDisplay();
    } else {
      projects = [];
    }
    loaded = true;
  }

  $effect(() => {
    loadProjects();
  });
</script>

{#key projects}
  {#if projects?.length}
    <div class="mb-2 flex w-full flex-col items-start justify-center">
      {#if !onMyProjectsPage}
        <h2 class="mt-4 text-xl font-bold">Saved Projects</h2>
        <p class="text-surface-700-300 mb-2 text-sm">Stored in this browser</p>
      {/if}
      <div class="flex w-full flex-col items-start justify-center gap-2">
        {#each shown as project (project.id)}
          {@const { meta } = project}
          <ProjectDetails
            project={meta}
            newTab={!onMyProjectsPage}
            onclick={async () => {
              await ProjectStorage.removeByHref(meta.href);
              await loadProjects();
            }}
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

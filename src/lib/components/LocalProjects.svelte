<!-- Copyright (c) 2024, Thomas (https://github.com/jdvlpr)

This file is part of Temperature-Blanket-Web-App.

Temperature-Blanket-Web-App is free software: you can redistribute it and/or modify it
under the terms of the GNU General Public License as published by the Free Software Foundation, 
either version 3 of the License, or (at your option) any later version.

Temperature-Blanket-Web-App is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; 
without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. 
See the GNU General Public License for more details.

You should have received a copy of the GNU General Public License along with Temperature-Blanket-Web-App. 
If not, see <https://www.gnu.org/licenses/>. -->

<script>
  import { browser } from '$app/environment';
  import ProjectDetails from '$lib/components/ProjectDetails.svelte';
  import { ProjectStorage } from '$lib/storage/projects.svelte';

  let projects = $state([]);

  async function loadProjects() {
    if (browser) {
      projects = await ProjectStorage.getProjectsForDisplay();
    } else {
      projects = [];
    }
  }

  $effect(() => {
    loadProjects();
  });
</script>

{#key projects}
  {#if projects?.length}
    <div class="mb-2 flex w-full flex-col items-start justify-center">
      <h2 class="mt-4 text-xl font-bold">Saved Projects</h2>
      <p class="text-surface-700-300 mb-2 text-sm">Stored in this browser</p>
      <div class="flex w-full flex-col items-start justify-center gap-2">
        {#each projects as project}
          {@const { meta } = project}
          <ProjectDetails
            project={meta}
            onclick={async () => {
              await ProjectStorage.removeByHref(meta.href);
              await loadProjects();
            }}
          />
        {/each}
      </div>
    </div>
  {/if}
{/key}

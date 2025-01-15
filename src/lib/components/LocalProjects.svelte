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

  $: projects =
    browser && localStorage.getItem('projects')
      ? JSON.parse(localStorage.getItem('projects'))?.reverse()
      : [];
</script>

{#key projects}
  {#if projects?.length}
    <div class="my-2 flex flex-col justify-center items-start w-full">
      <h2 class="mt-8 text-xl font-bold">Saved Projects</h2>
      <p class="text-sm mb-2">Stored in this browser</p>
      <div class="flex flex-col items-start justify-center gap-2 w-full">
        {#each projects as project}
          {@const { href } = project}
          <ProjectDetails
            {project}
            on:click={() => {
              const newProjects = projects.filter(
                (project) => project.url.href !== href,
              );
              localStorage.setItem('projects', JSON.stringify(newProjects));
              projects = newProjects;
            }}
          />
        {/each}
      </div>
    </div>
  {/if}
{/key}

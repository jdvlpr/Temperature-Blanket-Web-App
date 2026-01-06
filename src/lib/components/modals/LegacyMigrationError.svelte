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

<script lang="ts">
  import { project, toast } from '$lib/state';
  import { pluralize } from '$lib/utils';
  import { ClipboardCopyIcon, TriangleAlertIcon } from '@lucide/svelte';

  let { uid, error } = $props();

  let projects = $state(project.status.temporaryProjectsBackup);
  let projectHrefs = $derived(projects.map((p) => p.href).join('\r\n\r\n'));
</script>

<div class="flex flex-col items-start gap-2 p-4">
  <h2 class="my-2 flex items-center gap-2 text-xl font-bold">
    <TriangleAlertIcon /> Copy the text below to save your {pluralize(
      'project',
      projects.length,
    )}
  </h2>
  <p class="text-warning-800-200">
    During an update to this site, there was an issue accessing your saved
    {pluralize('project', projects.length)}. To make sure your data is not lost,
    please copy the {pluralize('URL', projects.length)} below to a safe place like
    a note or document.
  </p>
  <p class="text-warning-800-200">
    Once you have saved the text below somewhere where you can access it again
    later, you can close this and continue using the site. You can open a
    project using its URL. Sorry for any inconvenience.
  </p>
  <p
    class="card bg-primary-50 dark:bg-primary-950 w-full basis-full overflow-x-scroll p-4 text-sm break-all whitespace-pre select-all"
  >
    {projectHrefs}
  </p>
  <button
    class="btn preset-filled-primary-500 w-fit"
    onclick={() => {
      navigator.clipboard.writeText(projectHrefs);
      toast.trigger({
        category: 'success',
        message: 'Copied to clipboard!',
      });
    }}
  >
    <ClipboardCopyIcon />
    Copy Project {pluralize('URL', projects.length)} to Clipboard
  </button>

  <p>
    {#if !error}This issue has been logged so the developer can review it.{/if} Your
    unique ID is: <span class="opacity-60 select-all">{uid}</span>
  </p>

  <p>
    For more information or questions, please send an email to <a
      href="mailto:hello@temperature-blanket.com?subject=Project Issue&body=Include this ID: {uid}"
      class="link">hello@temperature-blanket.com</a
    >, and include the above ID.
  </p>
</div>

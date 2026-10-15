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

<!-- The preview's Share button: the open project's Share dialog (Copy Link
and its gallery page), as in the Project menu. -->
<script>
  import { storedItem } from '#lib/storage/autosave.svelte.js';
  import { project } from '#lib/state/project-state.svelte.js';
  import { savedProjects } from '#lib/storage/projects.svelte.js';
  import { openProjectShare } from '#lib/utils/open-project-share.js';
  import { Share2Icon } from '@lucide/svelte';

  let { isPrimary = false } = $props();

  // The project's name, ready before the dialog opens (see openProjectShare)
  let name = $state('');
  $effect(() => {
    void project.url.href;
    void savedProjects.version;
    const linkName = project.linkName;
    storedItem().then((item) => {
      name = item ? (item.meta.name ?? '') : linkName;
    });
  });
</script>

<button
  class={[
    'btn w-fit whitespace-pre-wrap',
    isPrimary
      ? 'bg-primary-50-950 border-primary-500 hover:preset-tonal-primary border'
      : 'hover:preset-tonal-surface',
  ]}
  onclick={() => openProjectShare(name)}
  title="Copy a link, or publish it to the gallery"
>
  <Share2Icon />
  Share
</button>

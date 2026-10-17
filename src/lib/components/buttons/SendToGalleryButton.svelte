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

<!-- The preview's Share button: a menu of the open project's share rows
(Copy Link and its gallery page), as in the Project menu. -->
<script lang="ts">
  import { loadShareState } from '#lib/accounts/share-rows.js';
  import MoreMenu from '#lib/components/buttons/MoreMenu.svelte';
  import { storedItem } from '#lib/storage/autosave.svelte.js';
  import { project } from '#lib/state/project-state.svelte.js';
  import {
    savedProjects,
    type StoredProjectIndexItem,
  } from '#lib/storage/projects.svelte.js';
  import { projectShareRows } from '#lib/utils/project-share.js';
  import { Share2Icon } from '@lucide/svelte';

  let { isPrimary = false } = $props();

  // The project's name, ready before Copy Link is chosen (see projectShareRows)
  let name = $state('');
  let shareItem = $state<StoredProjectIndexItem>();
  $effect(() => {
    void project.url.href;
    void savedProjects.version;
    const linkName = project.linkName;
    storedItem().then((item) => {
      name = item ? (item.meta.name ?? '') : linkName;
      shareItem = item;
    });
  });

  let rows = $derived(projectShareRows(name, shareItem));
</script>

<MoreMenu
  items={rows}
  label="Share"
  title="Copy a link, or publish it to the gallery"
  onopen={() => loadShareState('project')}
  triggerClass={[
    'btn w-fit whitespace-pre-wrap',
    isPrimary
      ? 'bg-primary-50-950 border-primary-500 hover:preset-tonal-primary border'
      : 'hover:preset-tonal-surface data-[state=open]:preset-tonal-surface',
  ].join(' ')}
>
  <Share2Icon aria-hidden="true" />
  Share
</MoreMenu>

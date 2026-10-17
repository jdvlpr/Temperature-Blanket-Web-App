<!-- Copyright (c) 2026, Thomas (https://github.com/jdvlpr)

This file is part of Temperature-Blanket-Web-App.

Temperature-Blanket-Web-App is free software: you can redistribute it and/or modify it
under the terms of the GNU General Public License as published by the Free Software Foundation,
either version 3 of the License, or (at your option) any later version.

Temperature-Blanket-Web-App is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY;
without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.
See the GNU General Public License for more details.

You should have received a copy of the GNU General Public License along with Temperature-Blanket-Web-App.
If not, see <https://www.gnu.org/licenses/>. -->

<!-- The Project menu's Open (and Cmd/Ctrl+O): the saved projects, most
recently changed first, or (signed in) starred gallery pages. Choosing one
opens it here, in the open project's place, asking first when that would lose
changes (leaveFor); Cmd-click opens it in a new tab. The open one is marked,
not a link. -->

<script lang="ts">
  import { browser } from '$app/env';
  import { resolve } from '$app/paths';
  import { account } from '#lib/accounts/summary.svelte.js';
  import ProjectPicture from '#lib/components/ProjectPicture.svelte';
  import {
    OPEN_NOW_ROW,
    PANEL_LIST,
    PANEL_ROW,
  } from '#lib/constants/class-constants.js';
  import { project } from '#lib/state/project-state.svelte.js';
  import { ProjectPictures } from '#lib/storage/project-pictures.svelte.js';
  import {
    ProjectStorage,
    savedProjects,
    type StoredProjectIndexItem,
  } from '#lib/storage/projects.svelte.js';
  import { sync } from '#lib/sync/status.svelte.js';
  import { matchesSearch } from '#lib/utils/collection-filter.js';
  import { openHere } from '#lib/utils/leave-project.js';
  import { savedLine } from '#lib/utils/saved-line.js';
  import OpenShell from './OpenShell.svelte';

  // Every saved project, most recently changed first
  let all = $state<StoredProjectIndexItem[] | null>(null);
  $effect(() => {
    void savedProjects.version;
    void sync.version;
    void account.summary?.id;
    if (!browser) return;
    ProjectStorage.getProjectsForDisplay().then((items) => (all = items));
  });
  const openId = $derived(
    new URL(project.url.href).searchParams.get('project'),
  );
  const labelOf = (item: StoredProjectIndexItem) =>
    item.meta.name || item.meta.title || 'Untitled Project';

  // Their pictures, drawn while this shows if they have none yet
  const pictures = new ProjectPictures();
  $effect(() => {
    if (all)
      pictures.draw(all.map(({ id, meta }) => ({ id, href: meta.href })));
  });
</script>

{#snippet picture(item: StoredProjectIndexItem)}
  <ProjectPicture
    id={item.id}
    href={item.meta.href}
    picturesVersion={pictures.version}
    pictureSettled={pictures.isSettled(item.id, item.meta.href)}
    imageClass="h-14 w-12 shrink-0 object-contain"
    coverClass="h-14 w-12 shrink-0"
    stripHeight="40px"
  />
{/snippet}

{#snippet mine(search: string)}
  {@const shown = (all ?? []).filter((item) =>
    matchesSearch(search, [item.meta.name, item.meta.title]),
  )}
  {#if !all}
    <p class="text-surface-700-300 text-sm" role="status">Loading…</p>
  {:else if !all.length}
    <p class="text-surface-700-300 text-sm">No saved projects yet.</p>
  {:else if !shown.length}
    <p class="text-surface-700-300 text-sm">No projects match “{search}”.</p>
  {:else}
    <ul class={PANEL_LIST} aria-label="Saved projects">
      {#each shown as item (item.id)}
        <li>
          {#if item.id === openId}
            <!-- The open one: nothing to open -->
            <div class={OPEN_NOW_ROW} aria-current="true">
              {@render picture(item)}
              <span class="flex min-w-0 flex-1 flex-col">
                <span class="line-clamp-2 text-sm font-semibold break-words"
                  >{labelOf(item)}</span
                >
                <span class="text-surface-700-300 text-xs">Open now</span>
              </span>
            </div>
          {:else}
            <!-- eslint-disable svelte/no-navigation-without-resolve -- the saved project's address -->
            <a
              href={item.meta.href}
              data-sveltekit-reload
              class={PANEL_ROW}
              onclick={(event) => openHere(event, item.meta.href)}
            >
              {@render picture(item)}
              <span class="flex min-w-0 flex-1 flex-col">
                <span class="line-clamp-2 text-sm font-semibold break-words"
                  >{labelOf(item)}</span
                >
                <span class="text-surface-700-300 line-clamp-1 text-xs"
                  >{savedLine(item)}</span
                >
              </span>
            </a>
            <!-- eslint-enable svelte/no-navigation-without-resolve -->
          {/if}
        </li>
      {/each}
    </ul>
  {/if}
{/snippet}

<OpenShell
  kind="project"
  mineCount={all?.length ?? null}
  libraryHref={resolve('/my-projects')}
  {mine}
  onopen={openHere}
/>

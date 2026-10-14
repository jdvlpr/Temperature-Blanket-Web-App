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
  import { TrashSlots, TrashUndos } from '#lib/utils/trash-undo.svelte.js';
  import TrashUndo from '#lib/components/TrashUndo.svelte';
  import { browser } from '$app/env';
  import { resolve } from '$app/paths';
  import ProjectDetails from '#lib/components/ProjectDetails.svelte';
  import SavedProjectCard from '#lib/components/SavedProjectCard.svelte';
  import { drawInFrame, hasThumbnail } from '#lib/storage/thumbnails.js';
  import { preferences } from '#lib/storage/preferences.svelte.js';
  import { toast } from '#lib/state/page-state.svelte.js';
  import type { StoredProjectIndexItem } from '#lib/storage/projects.svelte.js';
  import {
    lastSavedAt,
    ProjectStorage,
    savedProjects,
  } from '#lib/storage/projects.svelte.js';
  import { galleryPages } from '#lib/accounts/gallery-pages.svelte.js';
  import GallerySharing from '#lib/components/account/GallerySharing.svelte';
  import type { GalleryRequest } from '#lib/utils/gallery-request.js';
  import { openGalleryDialog } from '#lib/utils/open-saved-project.js';
  import { account } from '#lib/accounts/summary.svelte.js';
  import AddToAccountButton from '#lib/components/sync/AddToAccountButton.svelte';
  import SyncStatus from '#lib/components/sync/SyncStatus.svelte';
  import { sync, syncLabelFor } from '#lib/sync/status.svelte.js';
  import { withoutVersion } from '#lib/utils/gallery-link-utils.js';
  import { FolderOpenIcon } from '@lucide/svelte';
  import { SvelteSet } from 'svelte/reactivity';

  // The Menu shows a few recent projects with a link to the My Projects page,
  // which shows them all under its own heading, as cards (the gallery's), with
  // rename and delete
  let {
    limit,
    onMyProjectsPage = false,
  }: { limit?: number; onMyProjectsPage?: boolean } = $props();

  let projects = $state<StoredProjectIndexItem[]>([]);
  let loaded = $state(false);
  let shown = $derived(limit ? projects.slice(0, limit) : projects);

  // Quick undos for projects just moved to the Trash, each where it was
  const undos = new TrashUndos();
  const slots = new TrashSlots();
  const undoSpots = $derived(undos.placed(shown.map((project) => project.id)));
  const layout = $derived(preferences.value.myProjectsLayout ?? 'grid');

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
    slots.remember(item.id, layout);
    undos.add(
      item.id,
      labelFor(item),
      shown.map((project) => project.id),
    );
    await run(
      () => ProjectStorage.moveToTrash(item.id),
      'Unable to delete the project',
    );
  }

  async function undoRemove(id: string) {
    undos.remove(id);
    slots.forget(id);
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
    // So My Projects can tell which gallery pages have a project here
    if (onMyProjectsPage)
      galleryPages.projectIds = projects.map((project) => project.id);
  }

  // Signed in on My Projects: who can see each project
  const showSharing = $derived(
    onMyProjectsPage && signedIn && galleryPages.shown,
  );

  // Adding or updating a gallery page: its dialog opens here, drawing the
  // preview from the project loaded behind it
  function openForGallery(
    item: StoredProjectIndexItem,
    request: GalleryRequest,
  ) {
    void openGalleryDialog(item.meta.href, request);
  }

  // On My Projects, each project without a picture of its current version
  // gets one in the background, one at a time (see thumbnails.ts); its card
  // shows it as soon as it's kept, and a placeholder until the drawing is
  // done with it (by version: an edited project is drawn again)
  let picturesVersion = $state(0);
  const settled = new SvelteSet<string>();
  const pictureKey = (id: string, href: string) =>
    `${id} ${withoutVersion(href)}`;
  $effect(() => {
    if (!onMyProjectsPage || !loaded) return;
    const queue = projects.map(({ id, meta }) => ({ id, href: meta.href }));
    let stopped = false;
    let cancel: (() => void) | null = null;
    void (async () => {
      for (const { id, href } of queue) {
        if (stopped) return;
        if (await hasThumbnail(id, href)) {
          settled.add(pictureKey(id, href));
          continue;
        }
        const drawing = drawInFrame(id, href);
        cancel = drawing.cancel;
        const ok = await drawing.done;
        cancel = null;
        if (stopped) return;
        settled.add(pictureKey(id, href));
        if (ok) picturesVersion++;
      }
    })();
    return () => {
      stopped = true;
      cancel?.();
    };
  });

  $effect(() => {
    // Reload whenever saved projects change (here, in the Trash or by a
    // sync), and when someone signs in or out
    void savedProjects.version;
    void sync.version;
    void account.summary?.id;
    loadProjects();
  });
</script>

{#snippet undoAt(anchor: string | null, inSlot = false)}
  {#each undoSpots.get(anchor) ?? [] as entry (entry.id)}
    <!-- On My Projects, it keeps the space its project left -->
    <div
      class={['w-full', inSlot && 'self-stretch']}
      style={inSlot ? slots.style(entry.id, layout) : undefined}
    >
      <TrashUndo
        fill={inSlot}
        label={entry.label}
        onundo={() => undoRemove(entry.id)}
        focus={undos.focusId === entry.id}
        onfocused={() => (undos.focusId = null)}
      />
    </div>
  {/each}
{/snippet}

{#snippet gallerySharing(project: StoredProjectIndexItem)}
  {@const page = galleryPages.grouped.byProject.get(project.id)}
  <GallerySharing
    compact
    kind="project"
    label={labelFor(project)}
    {page}
    changedSince={Boolean(
      page && (lastSavedAt(project) ?? 0) > page.publishedAt,
    )}
    onadd={() => openForGallery(project, { action: 'add' })}
    onupdate={(old) =>
      openForGallery(project, {
        action: 'replace',
        postId: old.postId,
      })}
  />
{/snippet}

<!-- With nothing left to list, they show on their own -->
{#if !shown.length && undoSpots.size}
  <div class="mt-2 flex w-full flex-col gap-2">{@render undoAt(null)}</div>
{/if}

{#key projects}
  {#if projects?.length}
    <div class="mb-2 flex w-full flex-col items-start justify-center">
      {#if !onMyProjectsPage}
        <h2 class="mb-1 text-sm font-bold opacity-70">Recent Projects</h2>
      {/if}
      {#if signedIn && sync.active}
        <SyncStatus class="text-surface-700-300 mb-2" />
        <AddToAccountButton class="mb-2" kind="projects" />
      {:else if !onMyProjectsPage}
        <p class="text-surface-700-300 mb-2 text-sm">Stored in this browser</p>
      {/if}
      {#if onMyProjectsPage}
        {@const grid = layout === 'grid'}
        <div
          class={grid
            ? 'grid w-full grid-cols-2 items-start gap-2 md:grid-cols-3 xl:grid-cols-4'
            : 'grid w-full grid-cols-1 items-start gap-2 md:grid-cols-2'}
        >
          {#each shown as project (project.id)}
            {@render undoAt(project.id, true)}
            <div class="w-full" {@attach slots.track(project.id)}>
              <SavedProjectCard
                item={project}
                {picturesVersion}
                pictureSettled={settled.has(
                  pictureKey(project.id, project.meta.href),
                )}
                layout={grid ? 'grid' : 'list'}
                syncLabel={__ACCOUNTS_ENABLED__
                  ? syncLabelFor(project, signedIn)
                  : undefined}
                onrename={(name) => rename(project.id, name)}
                onremove={() => remove(project)}
              >
                {#snippet sharing()}
                  {#if showSharing}{@render gallerySharing(project)}{/if}
                {/snippet}
              </SavedProjectCard>
            </div>
          {/each}
          {@render undoAt(null, true)}
        </div>
      {:else}
        <div class="flex w-full flex-col items-start justify-center gap-2">
          {#each shown as project (project.id)}
            {@const { meta } = project}
            {@render undoAt(project.id)}
            <ProjectDetails
              project={meta}
              canRemove={false}
              syncLabel={__ACCOUNTS_ENABLED__
                ? syncLabelFor(project, signedIn)
                : undefined}
            />
          {/each}
          {@render undoAt(null)}
        </div>
      {/if}
      {#if limit}
        <a
          href={resolve('my-projects')}
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
    </div>
  {/if}
{/key}

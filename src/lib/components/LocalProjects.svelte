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
  import { page as appPage } from '$app/state';
  import { signInHref } from '#lib/accounts/redirect.js';
  import { shareRows } from '#lib/accounts/share-rows.js';
  import { ownPageViews } from '#lib/accounts/own-page-views.svelte.js';
  import SavedProjectCard from '#lib/components/SavedProjectCard.svelte';
  import { ProjectPictures } from '#lib/storage/project-pictures.svelte.js';
  import { preferences } from '#lib/storage/preferences.svelte.js';
  import { masonry } from '#lib/state/attachments/masonry.js';
  import { toast } from '#lib/state/page-state.svelte.js';
  import type { StoredProjectIndexItem } from '#lib/storage/projects.svelte.js';
  import type { GalleryPage } from '#lib/accounts/gallery.js';
  import { confirmTrash } from '#lib/utils/confirm-trash.js';
  import {
    lastChanged,
    lastSavedAt,
    ProjectStorage,
    savedProjects,
  } from '#lib/storage/projects.svelte.js';
  import { galleryPages } from '#lib/accounts/gallery-pages.svelte.js';
  import { ravelryLinks } from '#lib/accounts/ravelry-links.svelte.js';
  import type { GalleryRequest } from '#lib/utils/gallery-request.js';
  import { openGalleryDialog } from '#lib/utils/open-saved-project.js';
  import { withProjectName } from '#lib/utils/project-name-link.js';
  import { account } from '#lib/accounts/summary.svelte.js';
  import AddToAccountButton from '#lib/components/sync/AddToAccountButton.svelte';
  import SyncStatus from '#lib/components/sync/SyncStatus.svelte';
  import { sync, syncLabelFor } from '#lib/sync/status.svelte.js';
  import { previews } from '#lib/state/preview-state.svelte.js';
  import type { LibraryFilters } from '#lib/state/library-filters.svelte.js';
  import { ensureYarnData } from '#lib/data/yarns/colorways.svelte.js';
  import { getColorsFromInput } from '#lib/utils/color-utils.js';
  import {
    matchesSearch,
    matchesYarn,
    matchesStatus,
    patternIdOf,
    sortLibrary,
  } from '#lib/utils/collection-filter.js';
  import { FolderOpenIcon, XIcon } from '@lucide/svelte';

  // The Menu shows a few recent projects with a link to the My Projects page,
  // which shows them all under its own heading, as cards (the gallery's), with
  // rename and delete
  // With filters (My Library), only what matches shows, sorted as chosen;
  // oncount says how many
  let {
    limit,
    onMyProjectsPage = false,
    filters,
    oncount,
  }: {
    limit?: number;
    onMyProjectsPage?: boolean;
    filters?: LibraryFilters;
    /** How many there are without the filters, once known, and how many show */
    oncount?: (count: { total: number; matching: number }) => void;
  } = $props();

  let projects = $state<StoredProjectIndexItem[]>([]);
  let loaded = $state(false);
  let shown = $derived(limit ? projects.slice(0, limit) : projects);

  // Quick undos for projects just moved to the Trash, each where it was
  const undos = new TrashUndos();
  const slots = new TrashSlots();
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
    // Its gallery page comes down with it, so it asks first
    if (
      galleryPages.grouped.byProject.has(item.id) &&
      !(await confirmTrash({ ravelry: ravelryLinks.links.has(item.id) }))
    )
      return;
    slots.remember(item.id, layout);
    // Back from the Trash, its card waits for the drawing to look again
    pictures.forget(item.id, item.meta.href);
    undos.add(
      item.id,
      labelFor(item),
      cards.map((card) => card.key),
    );
    await run(
      () => ProjectStorage.moveToTrash(item.id),
      'Unable to delete the project',
    );
  }

  async function undoRemove(id: string) {
    await run(
      () => ProjectStorage.restoreFromTrash(id),
      'Unable to restore the project',
    );
    await loadProjects();
    undos.remove(id);
    slots.forget(id);
    // Its gallery page, if it had one, comes back too
    galleryPages.refreshSoon();
  }

  async function copy(item: StoredProjectIndexItem) {
    await run(async () => {
      if (!(await ProjectStorage.duplicate(item.id))) throw new Error();
      toast.trigger({
        message: `Created a copy of ${labelFor(item)}`,
        category: 'success',
      });
    }, 'Unable to copy the project');
    await loadProjects();
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

  // Signed in on My Projects: which projects are on Ravelry, for each card's
  // info line and menu (one request for the whole page)
  $effect(() => {
    if (onMyProjectsPage && signedIn) void ravelryLinks.load();
  });

  // And the views of their gallery pages (one request for all of them)
  $effect(() => {
    if (!showSharing) return;
    ownPageViews.load(
      'project',
      galleryPages.pages
        .filter((p) => (p.kind ?? 'project') === 'project')
        .map((p) => p.postId),
    );
  });

  /** Since its page was published or last updated */
  const changedSince = (item: StoredProjectIndexItem) => (p: GalleryPage) =>
    (lastSavedAt(item) ?? 0) > (p.updatedAt ?? p.publishedAt);

  // Newest first, by when each was saved
  const allCards = $derived(
    shown.map((project) => ({
      key: project.id,
      time: lastChanged(project),
      project,
    })),
  );

  const previewIds = previews.all.map((preview) => preview.id);

  // Which yarn each color is, read from the project's link: only once a yarn
  // is chosen, after the yarn data that tells brands apart has loaded
  const yarnChosen = $derived(!!(filters?.brandId || filters?.yarnId));
  let yarnDataReady = $state(false);
  $effect(() => {
    if (yarnChosen && !yarnDataReady)
      ensureYarnData().then(() => (yarnDataReady = true));
  });
  const colorsByLink = $derived.by(() => {
    void yarnDataReady;
    return new Map<string, ReturnType<typeof colorsOfLink>>();
  });
  function colorsOfLink(link: string | null | undefined) {
    return (link && getColorsFromInput({ string: link })) || [];
  }
  const colorsOf = (link: string | null | undefined) => {
    const key = link ?? '';
    let colors = colorsByLink.get(key);
    if (!colors) {
      colors = colorsOfLink(link);
      colorsByLink.set(key, colors);
    }
    return colors;
  };

  // What the filters let through, sorted as chosen
  const cards = $derived.by(() => {
    if (!filters) return allCards;
    const patternId = filters.patternType
      ? (previews.all.find((p) => p.wpTagSlug === filters.patternType)?.id ??
        null)
      : null;
    const yarn = {
      brandId: filters.brandId,
      yarnId: filters.yarnId,
      only: filters.onlyThisYarn,
    };
    const kept = allCards.filter(({ project }) => {
      const link = project.meta.href;
      return (
        (!yarnChosen || (yarnDataReady && matchesYarn(colorsOf(link), yarn))) &&
        matchesSearch(filters.search, [
          project.meta.name,
          project.meta.title,
        ]) &&
        (!patternId || patternIdOf(link, previewIds) === patternId) &&
        matchesStatus(filters.status, {
          published: galleryPages.grouped.byProject.has(project.id),
          ravelry: ravelryLinks.links.has(project.id),
        })
      );
    });
    return sortLibrary(kept, filters.sort, filters.reversed, {
      time: (card) => card.time,
      name: (card) => labelFor(card.project),
    });
  });
  $effect(() => {
    if (loaded) oncount?.({ total: allCards.length, matching: cards.length });
  });
  const undoSpots = $derived(undos.placed(cards.map((card) => card.key)));

  // Adding or updating a gallery page: its dialog opens here, drawing the
  // preview from the project loaded behind it
  function openForGallery(
    item: StoredProjectIndexItem,
    request: GalleryRequest,
  ) {
    void openGalleryDialog(item.meta.href, request);
  }

  // On My Projects, each project without a picture of its current version
  // gets one in the background (see project-pictures.svelte.ts)
  const pictures = new ProjectPictures();
  $effect(() => {
    if (!onMyProjectsPage || !loaded) return;
    return pictures.draw(
      projects.map(({ id, meta }) => ({ id, href: meta.href })),
    );
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

{#snippet projectCard(project: StoredProjectIndexItem)}
  {@const page = showSharing
    ? galleryPages.grouped.byProject.get(project.id)
    : undefined}
  {@const ravelry =
    signedIn && ravelryLinks.connected
      ? ravelryLinks.links.get(project.id)
      : undefined}
  <SavedProjectCard
    item={project}
    picturesVersion={pictures.version}
    pictureSettled={pictures.isSettled(project.id, project.meta.href)}
    layout={layout === 'grid' ? 'grid' : 'list'}
    syncLabel={__ACCOUNTS_ENABLED__
      ? syncLabelFor(project, signedIn)
      : undefined}
    onrename={(name) => rename(project.id, name)}
    onremove={() => remove(project)}
    oncopy={() => copy(project)}
    publishedAt={page?.publishedAt ?? null}
    views={page ? ownPageViews.of(page.postId) : null}
    changed={!!page && changedSince(project)(page)}
    ravelryPhotos={ravelry ? ravelry.photos.length : null}
    shareRows={shareRows({
      kind: 'project',
      id: project.id,
      link: withProjectName(
        project.meta.href,
        project.meta.name,
        project.meta.title,
      ),
      changed: changedSince(project),
      signInHref: signInHref(appPage.url),
      item: signedIn ? project : undefined,
      onpublish: () => openForGallery(project, { action: 'add' }),
      onedit: (old) =>
        openForGallery(project, { action: 'replace', postId: old.postId }),
    })}
  />
{/snippet}

<!-- With nothing left to list, they show on their own -->
{#if !cards.length && undoSpots.size}
  <div class="mt-2 flex w-full flex-col gap-2">{@render undoAt(null)}</div>
{/if}

{#if cards.length}
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
          ? 'grid w-full grid-cols-2 gap-2 md:grid-cols-3 xl:grid-cols-4'
          : 'grid w-full grid-cols-1 items-start gap-2 md:grid-cols-2'}
        {@attach grid ? masonry : undefined}
      >
        {#each cards as card (card.key)}
          {@const project = card.project}
          {@render undoAt(card.key, true)}
          <div class="w-full" {@attach slots.track(card.key)}>
            {@render projectCard(project)}
          </div>
        {/each}
        {@render undoAt(null, true)}
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
{:else if onMyProjectsPage && loaded && filters && allCards.length}
  <div class="my-8 flex w-full flex-col items-center gap-2 text-center">
    <p>No projects match these filters.</p>
    <button
      type="button"
      class="btn preset-tonal-primary border-primary-500 border"
      onclick={() => filters.clear()}
    >
      <XIcon />
      Clear Filters
    </button>
  </div>
{:else if onMyProjectsPage && loaded}
  <div class="my-8 flex w-full flex-col gap-2 text-center">
    <p class="font-bold">No saved projects yet</p>
  </div>
{/if}

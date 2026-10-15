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
  import type { GalleryPage } from '#lib/accounts/gallery.js';
  import {
    lastChanged,
    lastSavedAt,
    ProjectStorage,
    savedProjects,
  } from '#lib/storage/projects.svelte.js';
  import { galleryPages } from '#lib/accounts/gallery-pages.svelte.js';
  import GallerySharing from '#lib/components/account/GallerySharing.svelte';
  import type { GalleryRequest } from '#lib/utils/gallery-request.js';
  import { openGalleryDialog } from '#lib/utils/open-saved-project.js';
  import { withProjectName } from '#lib/utils/project-name-link.js';
  import { account } from '#lib/accounts/summary.svelte.js';
  import AddToAccountButton from '#lib/components/sync/AddToAccountButton.svelte';
  import SyncStatus from '#lib/components/sync/SyncStatus.svelte';
  import { sync, syncLabelFor } from '#lib/sync/status.svelte.js';
  import { withoutVersion } from '#lib/utils/gallery-link-utils.js';
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
  import { SvelteSet } from 'svelte/reactivity';

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
    slots.remember(item.id, layout);
    // Back from the Trash, its card waits for the drawing to look again
    settled.delete(pictureKey(item.id, item.meta.href));
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
    // Only once it's listed again, so its gallery-only card (when published)
    // doesn't show in between
    await loadProjects();
    undos.remove(id);
    slots.forget(id);
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

  // On My Projects, signed in: projects only in the gallery (deleted or not
  // saved here) are cards too, all newest first, by when each was saved or
  // published. One just moved to the Trash shows as its undo, not again.
  type Card =
    | { key: string; time: number; project: StoredProjectIndexItem }
    | { key: string; time: number; page: GalleryPage };
  const allCards = $derived.by((): Card[] => {
    const saved: Card[] = shown.map((project) => ({
      key: project.id,
      time: lastChanged(project),
      project,
    }));
    // Only once the projects here are known, so none show here for a moment
    if (!showSharing || limit || !loaded) return saved;
    const undoing = new Set(undos.entries.map((entry) => entry.id));
    const galleryOnly: Card[] = [
      ...galleryPages.grouped.galleryOnlyProjects.values(),
    ]
      .filter((page) => !undoing.has(page.projectId))
      .map((page) => ({
        key: `gallery-${page.postId}`,
        time: page.publishedAt,
        page,
      }));
    if (!galleryOnly.length) return saved;
    // A stable sort: the saved ones keep their order
    return [...saved, ...galleryOnly].sort((a, b) => b.time - a.time);
  });

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

  const cardName = (card: Card) =>
    'project' in card ? labelFor(card.project) : card.page.title;

  // What the filters let through, sorted as chosen
  const cards = $derived.by((): Card[] => {
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
    const kept = allCards.filter((card) => {
      const project = 'project' in card ? card.project : null;
      const page = 'page' in card ? card.page : null;
      const link = project ? project.meta.href : page?.link;
      return (
        (!yarnChosen || (yarnDataReady && matchesYarn(colorsOf(link), yarn))) &&
        matchesSearch(
          filters.search,
          project ? [project.meta.name, project.meta.title] : [page?.title],
        ) &&
        (!patternId || patternIdOf(link, previewIds) === patternId) &&
        matchesStatus(filters.status, {
          published: project
            ? galleryPages.grouped.byProject.has(project.id)
            : true,
          galleryOnly: !project,
        })
      );
    });
    return sortLibrary(kept, filters.sort, filters.reversed, {
      time: (card) => card.time,
      name: cardName,
    });
  });
  $effect(() => {
    if (loaded) oncount?.({ total: allCards.length, matching: cards.length });
  });
  const undoSpots = $derived(undos.placed(cards.map((card) => card.key)));

  // Gallery-only projects' pictures from the gallery, for those without one
  // kept here, and older pages' links: one request for them all, filtered out
  // or not, as the filters need the links
  $effect(() => {
    const postIds = allCards.flatMap((card) =>
      'page' in card ? [card.page.postId] : [],
    );
    if (postIds.length) void galleryPages.loadImages(postIds);
  });

  // Saving a gallery-only project back: its card says so meanwhile, and
  // becomes a saved project's card once it's listed
  const adding = new SvelteSet<string>();
  // Its card, once saved: focus moves there, as its old card is gone
  let focusId = $state<string | null>(null);
  async function addBack(page: GalleryPage) {
    if (adding.has(page.projectId)) return;
    adding.add(page.projectId);
    try {
      const { addProjectBack } =
        await import('#lib/accounts/gallery-add-back.js');
      await addProjectBack(page);
      await loadProjects();
      focusId = page.projectId;
    } catch {
      toast.trigger({
        message: `“${page.title}” couldn’t be added to My Saved Projects. Try opening it and saving it in the Project Planner.`,
        category: 'error',
      });
    } finally {
      adding.delete(page.projectId);
    }
  }

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
  {@const page = showSharing
    ? galleryPages.grouped.byProject.get(project.id)
    : undefined}
  {@const changed = (p: GalleryPage) =>
    (lastSavedAt(project) ?? 0) > (p.updatedAt ?? p.publishedAt)}
  <GallerySharing
    kind="project"
    id={project.id}
    label={labelFor(project)}
    link={withProjectName(
      project.meta.href,
      project.meta.name,
      project.meta.title,
    )}
    {page}
    changedSince={Boolean(page && changed(page))}
    {changed}
    onadd={() => openForGallery(project, { action: 'add' })}
    onupdate={(old) =>
      openForGallery(project, {
        action: 'replace',
        postId: old.postId,
      })}
  />
{/snippet}

<!-- With nothing left to list, they show on their own -->
{#if !cards.length && undoSpots.size}
  <div class="mt-2 flex w-full flex-col gap-2">{@render undoAt(null)}</div>
{/if}

{#key projects}
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
            ? 'grid w-full grid-cols-2 items-start gap-2 md:grid-cols-3 xl:grid-cols-4'
            : 'grid w-full grid-cols-1 items-start gap-2 md:grid-cols-2'}
        >
          {#each cards as card (card.key)}
            {@render undoAt(card.key, true)}
            <div class="w-full" {@attach slots.track(card.key)}>
              {#if 'project' in card}
                {@const project = card.project}
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
                  focus={focusId === project.id}
                  onfocused={() => (focusId = null)}
                >
                  {#snippet sharing()}
                    {#if onMyProjectsPage}{@render gallerySharing(project)}{/if}
                  {/snippet}
                </SavedProjectCard>
              {:else}
                <!-- Only in the gallery: its picture kept here or the
                gallery's, never drawn (that would load the weather), else
                its colors -->
                <SavedProjectCard
                  galleryPage={card.page}
                  galleryImage={galleryPages.images.get(card.page.postId)}
                  pictureSettled
                  layout={grid ? 'grid' : 'list'}
                  adding={adding.has(card.page.projectId)}
                  onaddback={() => addBack(card.page)}
                >
                  {#snippet sharing()}
                    <GallerySharing
                      kind="project"
                      id={card.page.projectId}
                      label={card.page.title}
                      link={card.page.link ?? undefined}
                      page={card.page}
                      galleryOnly
                    />
                  {/snippet}
                </SavedProjectCard>
              {/if}
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
{/key}

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

<!-- @component
  My Library's frame, around its Projects page or its Yarn Palettes page: where
  things are kept, whose name gallery pages show, Sign In, Projects | Yarn
  Palettes with how many of each, and the Trash. Signed in, projects, palettes
  and the Trash sync to the account, and each project and palette can be
  published to the gallery as a snapshot, with the account's name or without.
-->
<script lang="ts" module>
  // Projects | Yarn Palettes switches pages, so these ask the server once per
  // account while the app is open, not on every switch: requests are shared
  // by everyone on the free plan. Changes still reload the gallery pages, and
  // the Trash dialog refreshes its own list.
  let galleryLoadedFor: string | null = null;
  let trashRefreshedFor: string | null = null;
</script>

<script lang="ts">
  import { browser } from '$app/env';
  import { resolve } from '$app/paths';
  import { page } from '$app/state';
  import { backHereOnClick, signInHref } from '#lib/accounts/redirect.js';
  import { DISPLAY_NAME_HREF } from '#lib/accounts/display-name-link.js';
  import { account } from '#lib/accounts/summary.svelte.js';
  import { galleryPages } from '#lib/accounts/gallery-pages.svelte.js';
  import { sync } from '#lib/sync/status.svelte.js';
  import CollectionNav from '#lib/components/CollectionNav.svelte';
  import StarredGalleryPages from '#lib/components/StarredGalleryPages.svelte';
  import Trash from '#lib/components/Trash.svelte';
  import { preferences } from '#lib/storage/preferences.svelte.js';
  import { dialog } from '#lib/state/page-state.svelte.js';
  import { librarySection } from '#lib/storage/library-section.svelte.js';
  import { savedPalettes } from '#lib/storage/palettes.svelte.js';
  import {
    ProjectStorage,
    savedProjects,
  } from '#lib/storage/projects.svelte.js';
  import {
    accountTrash,
    loadProjectTrash,
    refreshAccountTrash,
  } from '#lib/storage/account-trash.svelte.js';
  import { onMount, type Snippet } from 'svelte';
  import { PANEL_LIST, PANEL_ROW } from '#lib/constants/class-constants.js';
  import { TRASH_DAYS } from '#lib/storage/trash.js';
  import {
    ChevronRightIcon,
    ExternalLinkIcon,
    GlobeIcon,
    LogInIcon,
    PencilIcon,
    Trash2Icon,
  } from '@lucide/svelte';

  let {
    current,
    currentTotal,
    children,
  }: {
    current: 'projects' | 'palettes';
    /** How many the list on this page has, once it knows */
    currentTotal?: number | null;
    children: Snippet;
  } = $props();

  // The sidebar's My Library link comes back to this side next time
  $effect(() => {
    librarySection.value = current;
  });

  let trashedProjectCount = $state(0);
  // Each page's Trash has only its own kind
  let trashCount = $derived(
    current === 'projects' ? trashedProjectCount : savedPalettes.deleted.length,
  );

  const signedIn = $derived(
    __ACCOUNTS_ENABLED__ && Boolean(account.summary?.id),
  );
  // Signed in with sync on: projects are kept in the account
  const synced = $derived(signedIn && sync.active);
  const showGallery = $derived(signedIn && galleryPages.shown);

  // Signed in: the account's gallery pages, shown on each project and
  // palette they came from (once for the page, not per row)
  $effect(() => {
    const id = account.summary?.id;
    if (!signedIn || !id) return;
    const load = !galleryPages.loaded || galleryLoadedFor !== id;
    galleryLoadedFor = id;
    return galleryPages.start({ load });
  });

  let ownerName = $derived(
    (galleryPages.name ?? account.summary?.name ?? '').trim(),
  );
  let anyWithName = $derived(galleryPages.pages.some((p) => p.showOwner));

  // How many of each, for Projects | Yarn Palettes: saved here
  let projectIds = $state<string[] | null>(null);
  let palettesLoaded = $state(false);
  const projectsCount = $derived(
    projectIds === null ? null : projectIds.length,
  );
  const palettesCount = $derived(
    palettesLoaded ? savedPalettes.items.length : null,
  );

  // The account's Trash once (and again in the dialog), not on every change
  onMount(async () => {
    const id = account.summary?.id;
    if (signedIn && id && trashRefreshedFor !== id) {
      trashRefreshedFor = id;
      refreshAccountTrash();
    }
    await savedPalettes.refresh();
    palettesLoaded = true;
  });

  $effect(() => {
    // Again whenever saved projects change (here, in the Trash or by a sync),
    // and when someone signs in or out
    void savedProjects.version;
    void sync.version;
    void accountTrash.list;
    void account.summary?.id;
    if (!browser) return;
    loadProjectTrash().then((trash) => (trashedProjectCount = trash.length));
    ProjectStorage.getProjectsForDisplay().then((projects) => {
      projectIds = projects.map((project) => project.id);
      // So either page can tell which gallery pages have a project here
      galleryPages.projectIds = projectIds;
    });
  });
</script>

<main
  class="m-auto mx-auto mt-2 mb-12 flex w-full max-w-(--breakpoint-lg) flex-col gap-6 px-2 text-left"
>
  <h1 class="h1 text-gradient mt-2 text-center">My Library</h1>

  <div class="-mt-2 flex flex-col gap-2">
    <p class="text-surface-700-300 mx-auto max-w-3xl text-center text-sm">
      {#if synced}
        Your projects and yarn palettes are saved to your account and show up on
        every device where you're signed in.
      {:else}
        Your saved projects and yarn palettes are stored in this browser, so
        they won't show up on other devices. If this browser's site data is
        cleared, they'll be lost.
      {/if}
    </p>
  </div>

  <!-- Signed out: an account keeps them safe, and on every device -->
  {#if browser && __ACCOUNTS_ENABLED__ && !signedIn}
    <div
      class="bg-surface-100-900 rounded-container mx-auto flex w-full max-w-3xl flex-col items-center gap-3 p-4 text-center"
    >
      <p class="text-sm">
        Sign in to keep your projects and yarn palettes on all your devices.
      </p>

      <a
        href={signInHref(page.url)}
        onclick={backHereOnClick}
        class="btn preset-filled-primary-500"><LogInIcon />Sign In</a
      >
    </div>
  {/if}

  <CollectionNav
    label="My Library"
    {current}
    projectsHref={resolve('my-projects')}
    palettesHref={resolve('my-palettes')}
    projectsCount={current === 'projects'
      ? (currentTotal ?? projectsCount)
      : projectsCount}
    palettesCount={current === 'palettes'
      ? (currentTotal ?? palettesCount)
      : palettesCount}
  />

  <section class="flex flex-col gap-2" aria-labelledby="library-list">
    <h2 id="library-list" class="sr-only">
      {current === 'projects' ? 'Projects' : 'Yarn Palettes'}
    </h2>
    {@render children()}
  </section>

  <!-- Gallery pages starred to find again: links, not copies -->
  {#if browser && signedIn}
    <StarredGalleryPages
      kind={current === 'projects' ? 'project' : 'palette'}
      layout={preferences.value.myProjectsLayout ?? 'grid'}
    />
  {/if}

  <!-- Out of the way, below the list, as rows like the Project menu's: whose
  name gallery pages show (it's changed in Profile settings), where those pages
  are listed, and deleted things, in a dialog. Trash only shows when there's
  something in it. -->
  {#if browser && (showGallery || trashCount)}
    <ul class={[PANEL_LIST, 'w-full']}>
      {#if showGallery}
        {#if ownerName}
          {#if anyWithName && galleryPages.publicId}
            <li>
              <a
                href={resolve('/gallery/by/[ownerId]', {
                  ownerId: galleryPages.publicId,
                })}
                target="_blank"
                class={PANEL_ROW}
                data-testid="gallery-owner-page"
              >
                <GlobeIcon class="shrink-0 opacity-70" />
                <span class="flex flex-1 flex-col">
                  <span>Your Gallery</span>
                  <span class="text-xs opacity-70"
                    >Everything you've published with your name, for anyone to
                    see</span
                  >
                </span>
                <ExternalLinkIcon class="icon-sm shrink-0 opacity-50" />
              </a>
            </li>
          {/if}
          <li data-testid="gallery-name-status">
            <a href={DISPLAY_NAME_HREF} class={PANEL_ROW}>
              <PencilIcon class="shrink-0 opacity-70" />
              <span class="flex flex-1 flex-col">
                <span>Your Gallery Name</span>
                <span class="text-xs opacity-70"
                  >Pages you publish say “By {ownerName}” unless they're
                  Anonymous. Change it in Profile settings.</span
                >
              </span>
            </a>
          </li>
        {:else}
          <li data-testid="gallery-name-status">
            <a href={DISPLAY_NAME_HREF} class={PANEL_ROW}>
              <PencilIcon class="shrink-0 opacity-70" />
              <span class="flex flex-1 flex-col">
                <span>Add a Name for Gallery Pages</span>
                <span class="text-xs opacity-70"
                  >Get credit for what you publish, in Profile settings</span
                >
              </span>
            </a>
          </li>
        {/if}
      {/if}
      {#if trashCount}
        <li>
          <button
            type="button"
            class={PANEL_ROW}
            onclick={() =>
              dialog.trigger({
                type: 'component',
                component: {
                  ref: Trash,
                  props: {
                    kind: current === 'projects' ? 'project' : 'palette',
                  },
                },
                options: { size: 'large', title: 'Trash' },
              })}
          >
            <Trash2Icon class="shrink-0 opacity-70" />
            <span class="flex flex-1 flex-col">
              <span>Trash ({trashCount})</span>
              <span class="text-xs opacity-70"
                >Restore what you deleted. It's gone for good after {TRASH_DAYS}
                days.</span
              >
            </span>
            <ChevronRightIcon class="icon-sm shrink-0 opacity-50" />
          </button>
        </li>
      {/if}
    </ul>
  {/if}
</main>

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
  import { DISPLAY_NAME_HREF } from '#lib/accounts/display-name-link.js';
  import { account } from '#lib/accounts/summary.svelte.js';
  import { galleryPages } from '#lib/accounts/gallery-pages.svelte.js';
  import { sync } from '#lib/sync/status.svelte.js';
  import CollectionNav from '#lib/components/CollectionNav.svelte';
  import Trash from '#lib/components/Trash.svelte';
  import { dialog } from '#lib/state/page-state.svelte.js';
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
  import { ExternalLinkIcon, LogInIcon, Trash2Icon } from '@lucide/svelte';

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

  let trashedProjectCount = $state(0);
  let trashCount = $derived(trashedProjectCount + savedPalettes.deleted.length);

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

  // How many of each, for Projects | Yarn Palettes: saved here, and signed in,
  // those only in the gallery too, as the lists show them
  let projectIds = $state<string[] | null>(null);
  let palettesLoaded = $state(false);
  const projectsCount = $derived(
    projectIds === null
      ? null
      : projectIds.length +
          (showGallery ? galleryPages.grouped.galleryOnlyProjects.size : 0),
  );
  const palettesCount = $derived(
    palettesLoaded
      ? savedPalettes.items.length +
          (showGallery ? galleryPages.grouped.galleryOnlyPalettes.size : 0)
      : null,
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

    <!-- Signed in: whose name gallery pages show, and where those pages are listed -->
    {#if browser && showGallery}
      <p
        class="text-surface-700-300 mx-auto max-w-3xl text-center text-sm"
        data-testid="gallery-name-status"
      >
        {#if ownerName}
          Gallery pages you publish without “Anonymous” checked are credited
          <strong>By {ownerName}</strong>.
          <a href={DISPLAY_NAME_HREF} class="link"
            >Change your name in Profile settings</a
          >.
          {#if anyWithName && galleryPages.publicId}
            <a
              href={resolve('/gallery/by/[ownerId]', {
                ownerId: galleryPages.publicId,
              })}
              target="_blank"
              class="link whitespace-nowrap"
              data-testid="gallery-owner-page"
              >Your public gallery page<ExternalLinkIcon
                class="icon-sm ml-0.5 inline"
                aria-hidden="true"
              /></a
            >
          {/if}
        {:else}
          To be credited by name on your gallery pages, add a display name in <a
            href={DISPLAY_NAME_HREF}
            class="link">Profile settings</a
          >.
        {/if}
      </p>
    {/if}
  </div>

  <!-- Signed out: an account keeps them safe, and on every device -->
  {#if browser && __ACCOUNTS_ENABLED__ && !signedIn}
    <div
      class="bg-surface-100-900 rounded-container mx-auto flex w-full max-w-3xl flex-col items-center gap-3 p-4 text-center"
    >
      <p class="text-sm">
        Sign in to keep your projects and yarn palettes on all your devices.
      </p>

      <a href={resolve('account')} class="btn preset-filled-primary-500"
        ><LogInIcon />Sign In</a
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

  <!-- Out of the way: deleted things are in a dialog, and the button only
  shows when there's something in it -->
  {#if browser && trashCount}
    <div class="flex justify-center">
      <button
        type="button"
        class="btn hover:preset-tonal-surface"
        onclick={() =>
          dialog.trigger({
            type: 'component',
            component: { ref: Trash },
            options: { size: 'large', title: 'Trash' },
          })}
      >
        <Trash2Icon />
        Trash ({trashCount})
      </button>
    </div>
  {/if}
</main>

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

<!-- Everything someone has saved, in one place. Signed in, projects, palettes
and the Trash sync to the account, and each project and palette can be
published to the gallery as a snapshot, with the account's name or without. -->

<script lang="ts">
  import { browser } from '$app/env';
  import { resolve } from '$app/paths';
  import { DISPLAY_NAME_HREF } from '#lib/accounts/display-name-link.js';
  import { PUBLIC_BASE_URL } from '$app/env/public';
  import AppLogo from '#lib/components/AppLogo.svelte';
  import AppShell from '#lib/components/AppShell.svelte';
  import { account } from '#lib/accounts/summary.svelte.js';
  import { galleryPages } from '#lib/accounts/gallery-pages.svelte.js';
  import { sync } from '#lib/sync/status.svelte.js';
  import GallerySharing from '#lib/components/account/GallerySharing.svelte';
  import AddToAccountButton from '#lib/components/sync/AddToAccountButton.svelte';
  import LocalProjects from '#lib/components/LocalProjects.svelte';
  import SavedPalettes from '#lib/components/SavedPalettes.svelte';
  import SharePalette from '#lib/components/modals/SharePalette.svelte';
  import Trash from '#lib/components/Trash.svelte';
  import ViewMenu from '#lib/components/buttons/ViewMenu.svelte';
  import { preferences } from '#lib/storage/preferences.svelte.js';
  import { dialog } from '#lib/state/page-state.svelte.js';
  import { savedPalettes } from '#lib/storage/palettes.svelte.js';
  import { savedProjects } from '#lib/storage/projects.svelte.js';
  import {
    accountTrash,
    loadProjectTrash,
    refreshAccountTrash,
  } from '#lib/storage/account-trash.svelte.js';
  import { onMount } from 'svelte';
  import { beforeNavigate } from '$app/navigation';
  import { loadedInPlace } from '#lib/utils/open-saved-project.js';
  import {
    ExternalLinkIcon,
    LogInIcon,
    PlusIcon,
    Trash2Icon,
  } from '@lucide/svelte';
  import type { Color } from '#lib/types/yarn-types.js';
  import {
    paletteNameDiffers,
    type GalleryPage,
  } from '#lib/accounts/gallery.js';

  let trashedProjectCount = $state(0);
  let trashCount = $derived(trashedProjectCount + savedPalettes.deleted.length);

  const signedIn = $derived(
    __ACCOUNTS_ENABLED__ && Boolean(account.summary?.id),
  );
  // Signed in with sync on: projects are kept in the account
  const synced = $derived(signedIn && sync.active);

  // Signed in: the account's gallery pages, shown on each project and
  // palette they came from (once for the page, not per row)
  $effect(() => {
    if (signedIn) return galleryPages.start();
  });

  let ownerName = $derived(
    (galleryPages.name ?? account.summary?.name ?? '').trim(),
  );
  let anyWithName = $derived(galleryPages.pages.some((p) => p.showOwner));

  function sharePalette(
    palette: { id: string },
    colors: Color[],
    label: string,
    options: { replace?: GalleryPage; rename?: GalleryPage } = {},
  ) {
    const old = options.rename ?? options.replace;
    dialog.trigger({
      type: 'component',
      component: {
        ref: SharePalette,
        props: {
          paletteId: palette.id,
          colors,
          name: label,
          showOwner: old?.showOwner,
          // Kept for renaming too: an older gallery plugin can't rename, so
          // it falls back to a new version
          versions: old ? galleryPages.pagesLike(old) : undefined,
          rename: options.rename,
        },
      },
      options: {
        title: options.rename
          ? 'Update Gallery Name'
          : options.replace
            ? 'Publish New Version'
            : 'Publish to Gallery',
      },
    });
  }

  // The account's Trash once when the page opens (and again in the dialog),
  // not on every change: requests are shared by everyone on the free plan
  onMount(() => {
    if (signedIn) refreshAccountTrash();
  });

  // A project loaded here behind Send to Gallery stays in the app's state, so
  // the next page starts fresh, not with that project's gauges
  beforeNavigate((navigation) => {
    if (!loadedInPlace() || navigation.willUnload || !navigation.to) return;
    if (navigation.to.url.pathname === window.location.pathname) return;
    navigation.cancel();
    window.location.assign(navigation.to.url.href);
  });

  $effect(() => {
    void savedProjects.version;
    void accountTrash.list;
    void account.summary?.id;

    if (browser)
      loadProjectTrash().then((trash) => (trashedProjectCount = trash.length));
  });
</script>

<svelte:head>
  <title>My Projects</title>
  <meta
    name="description"
    content="Your saved temperature blanket projects and yarn palettes"
  />
  <meta name="robots" content="noindex" />

  <meta property="og:title" content="My Projects" />
  <meta
    property="og:description"
    content="Your saved temperature blanket projects and yarn palettes"
  />
  <meta property="og:url" content="{PUBLIC_BASE_URL}/my-projects" />
  <meta property="og:type" content="website" />
</svelte:head>

{#snippet viewMenu()}
  <!-- Both sections' menus are the same setting -->
  <ViewMenu
    bind:value={
      () => preferences.value.myProjectsLayout ?? 'grid',
      (layout) => (preferences.value.myProjectsLayout = layout)
    }
  />
{/snippet}

<AppShell pageName="My Projects">
  {#snippet stickyHeader()}
    <div class="hidden lg:inline-flex"><AppLogo /></div>
  {/snippet}
  {#snippet main()}
    <main
      class="m-auto mx-auto mt-2 mb-12 flex w-full max-w-(--breakpoint-lg) flex-col gap-8 px-2 text-left"
    >
      <p class="text-surface-700-300 mx-auto max-w-3xl text-center text-sm">
        {#if synced}
          Your projects and yarn palettes are saved to your account and show up
          on every device where you're signed in.
        {:else}
          Your saved projects and yarn palettes are stored in this browser, so
          they won't show up on other devices. If this browser's site data is
          cleared, they'll be lost.
        {/if}
      </p>

      <!-- Signed in: whose name gallery pages show, and where those pages are listed -->
      {#if browser && signedIn && galleryPages.shown}
        <p
          class="text-surface-700-300 mx-auto -mt-6 max-w-3xl text-center text-sm"
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

      <section class="flex flex-col gap-2" aria-labelledby="projects">
        <div class="flex flex-wrap items-center justify-between gap-2">
          <h2 id="projects" class="h3">My Projects</h2>
          <div class="flex flex-wrap items-center gap-2">
            {#if browser}{@render viewMenu()}{/if}
            <!-- A full load: the project open before stays loaded otherwise -->
            <a
              href={resolve('/')}
              class="btn hover:preset-tonal-surface"
              data-sveltekit-reload
            >
              <PlusIcon />
              New Project
            </a>
          </div>
        </div>
        {#if browser}
          <LocalProjects onMyProjectsPage />
        {/if}
      </section>

      <section class="flex flex-col gap-2" aria-labelledby="palettes">
        <div class="flex flex-wrap items-center justify-between gap-2">
          <h2 id="palettes" class="h3">My Yarn Palettes</h2>
          <div class="flex flex-wrap items-center gap-2">
            {#if browser}{@render viewMenu()}{/if}
            <a href={resolve('yarn')} class="btn hover:preset-tonal-surface"
              ><PlusIcon />New Palette</a
            >
          </div>
        </div>
        {#if browser}
          {#if synced}
            <AddToAccountButton kind="palettes" />
          {/if}
          <SavedPalettes
            galleryOnly={signedIn && galleryPages.shown
              ? [...galleryPages.grouped.galleryOnlyPalettes.values()]
              : []}
          >
            {#snippet sharing({ palette, colors, label })}
              {#if signedIn && galleryPages.shown}
                {@const page = galleryPages.grouped.byPalette.get(palette.id)}
                <GallerySharing
                  compact
                  kind="palette"
                  {label}
                  {page}
                  changedSince={Boolean(
                    page && paletteNameDiffers(label, page),
                  )}
                  onadd={() => sharePalette(palette, colors, label)}
                  onupdate={(old) =>
                    sharePalette(palette, colors, label, { rename: old })}
                />
              {/if}
            {/snippet}
          </SavedPalettes>
        {/if}
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
  {/snippet}
</AppShell>

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
and the Trash sync to the account, and palettes can be shared to the gallery. -->

<script>
  import { LIST_ENDS } from '$lib/constants/class-constants';
  import { browser } from '$app/environment';
  import { resolve } from '$app/paths';
  import { PUBLIC_BASE_URL } from '$env/static/public';
  import AppLogo from '$lib/components/AppLogo.svelte';
  import AppShell from '$lib/components/AppShell.svelte';
  import { account } from '$lib/accounts/summary.svelte';
  import { getGalleryPages } from '$lib/accounts/gallery';
  import { sync } from '$lib/sync/status.svelte';
  import GalleryPages from '$lib/components/account/GalleryPages.svelte';
  import AddToAccountButton from '$lib/components/sync/AddToAccountButton.svelte';
  import LocalProjects from '$lib/components/LocalProjects.svelte';
  import SavedPalettes from '$lib/components/SavedPalettes.svelte';
  import SharePalette from '$lib/components/modals/SharePalette.svelte';
  import Trash from '$lib/components/Trash.svelte';
  import { dialog } from '$lib/state/page-state.svelte';
  import { savedPalettes } from '$lib/storage/palettes.svelte';
  import { savedProjects } from '$lib/storage/projects.svelte';
  import {
    accountTrash,
    loadProjectTrash,
    refreshAccountTrash,
  } from '$lib/storage/account-trash.svelte';
  import { onMount } from 'svelte';
  import { PlusIcon, Trash2Icon } from '@lucide/svelte';

  let trashedProjectCount = $state(0);
  let trashCount = $derived(trashedProjectCount + savedPalettes.deleted.length);

  const signedIn = $derived(
    __ACCOUNTS_ENABLED__ && Boolean(account.summary?.id),
  );
  // Signed in with sync on: projects are kept in the account
  const synced = $derived(signedIn && sync.active);

  // Palettes can be shared only while publishing from accounts is on
  let canShare = $state(false);
  $effect(() => {
    if (!signedIn) {
      canShare = false;
      return;
    }
    let current = true;
    getGalleryPages().then((gallery) => {
      if (current) canShare = Boolean(gallery?.publishing);
    });
    return () => (current = false);
  });

  // The account's Trash once when the page opens (and again in the dialog),
  // not on every change: requests are shared by everyone on the free plan
  onMount(() => {
    if (signedIn) refreshAccountTrash();
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

<AppShell pageName="My Projects">
  {#snippet stickyHeader()}
    <div class="hidden lg:inline-flex"><AppLogo /></div>
  {/snippet}
  {#snippet main()}
    <main
      class="m-auto mx-auto mt-2 mb-12 flex w-full max-w-3xl flex-col gap-8 px-2 text-left"
    >
      <p class="text-surface-700-300 text-center text-sm">
        {#if synced}
          Your projects, yarn palettes, and Trash are saved to your account and
          show up on every device where you're signed in.
        {:else}
          Your saved projects and yarn palettes are stored in this browser, so
          they won't show up on other devices. If this browser's site data is
          cleared, they'll be lost.
        {/if}
      </p>

      <section class="flex flex-col gap-2" aria-labelledby="projects">
        <div class="flex flex-wrap items-center justify-between gap-2">
          <h2 id="projects" class="h3">My Projects</h2>
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
        {#if browser}
          <LocalProjects onMyProjectsPage />
        {/if}
      </section>

      <section class="flex flex-col gap-2" aria-labelledby="palettes">
        <div class="flex flex-wrap items-center justify-between gap-2">
          <h2 id="palettes" class="h3">My Yarn Palettes</h2>
          <a href={resolve('/yarn')} class="btn hover:preset-tonal-surface">
            <PlusIcon />
            New Palette
          </a>
        </div>
        {#if browser}
          {#if synced}
            <AddToAccountButton kind="palettes" />
          {/if}
          <SavedPalettes
            onshare={canShare
              ? (props) =>
                  dialog.trigger({
                    type: 'component',
                    component: { ref: SharePalette, props },
                  })
              : undefined}
          />
        {/if}
      </section>

      <!-- Signed in: pages published to the gallery from the account -->
      {#if browser && signedIn}
        <GalleryPages
          name={account.summary?.name ?? ''}
          cardClass="bg-surface-100 dark:bg-surface-900 rounded-container divide-surface-200-800 flex flex-col divide-y overflow-hidden {LIST_ENDS} card-border"
        />
      {/if}

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

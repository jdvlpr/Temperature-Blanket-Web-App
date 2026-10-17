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

<!-- My Library's Yarn Palettes page: every saved palette, or (Starred,
`?show=starred`) gallery palettes starred to find again, with search, filters
and sort once there are a few. -->

<script lang="ts">
  import { browser } from '$app/env';
  import { resolve } from '$app/paths';
  import { page as appPage } from '$app/state';
  import { ownPageViews } from '#lib/accounts/own-page-views.svelte.js';
  import { signInHref } from '#lib/accounts/redirect.js';
  import { shareRows } from '#lib/accounts/share-rows.js';
  import { PUBLIC_BASE_URL } from '$app/env/public';
  import { account } from '#lib/accounts/summary.svelte.js';
  import { galleryPages } from '#lib/accounts/gallery-pages.svelte.js';
  import {
    paletteNameDiffers,
    type GalleryPage,
  } from '#lib/accounts/gallery.js';
  import { sync } from '#lib/sync/status.svelte.js';
  import AppLogo from '#lib/components/AppLogo.svelte';
  import AppShell from '#lib/components/AppShell.svelte';
  import MyLibrary from '#lib/components/MyLibrary.svelte';
  import SavedPalettes from '#lib/components/SavedPalettes.svelte';
  import SavedPalettesToolbar from '#lib/components/SavedPalettesToolbar.svelte';
  import StarredGalleryPages from '#lib/components/StarredGalleryPages.svelte';
  import { showsStarred } from '#lib/state/library-scope.js';
  import { preferences } from '#lib/storage/preferences.svelte.js';
  import SharePalette from '#lib/components/modals/SharePalette.svelte';
  import AddToAccountButton from '#lib/components/sync/AddToAccountButton.svelte';
  import { dialog } from '#lib/state/page-state.svelte.js';
  import {
    colorsToPaletteCode,
    getColorsFromInput,
    getYarnPageURL,
  } from '#lib/utils/color-utils.js';
  import { libraryFilters } from '#lib/state/library-filters.svelte.js';
  import type { SavedPalette } from '#lib/storage/palettes.svelte.js';
  import type { Color } from '#lib/types/yarn-types.js';
  import { PlusIcon } from '@lucide/svelte';

  let total = $state<number | null>(null);
  let matching = $state(0);
  // Starred's, apart from Mine's (Mine's total is also Mine's count)
  let starredTotal = $state<number | null>(null);
  let starredMatching = $state(0);
  const starred = $derived(showsStarred(appPage.url));

  const signedIn = $derived(
    __ACCOUNTS_ENABLED__ && Boolean(account.summary?.id),
  );
  // Signed in with sync on: palettes are kept in the account
  const synced = $derived(signedIn && sync.active);
  const showGallery = $derived(signedIn && galleryPages.shown);

  function sharePalette(
    palette: { id: string },
    colors: Color[],
    label: string,
    update?: GalleryPage,
  ) {
    dialog.trigger({
      type: 'component',
      component: {
        ref: SharePalette,
        props: {
          paletteId: palette.id,
          colors,
          name: label,
          showOwner: update?.showOwner,
          update,
        },
      },
      options: {
        title: update ? 'Edit Gallery Page' : 'Publish to Gallery',
      },
    });
  }

  // The views of the palettes' gallery pages (one request for all of them)
  $effect(() => {
    if (!showGallery) return;
    ownPageViews.load(
      'palette',
      galleryPages.pages
        .filter((p) => p.kind === 'palette')
        .map((p) => p.postId),
    );
  });

  /** A card's info line and share rows */
  function galleryFor({
    palette,
    colors,
    label,
  }: {
    palette: SavedPalette;
    colors: Color[];
    label: string;
  }) {
    const page = showGallery
      ? galleryPages.grouped.byPalette.get(palette.id)
      : undefined;
    const changed = (p: GalleryPage) => paletteChanged(colors, label, p);
    return {
      published: !!page,
      views: page ? ownPageViews.of(page.postId) : null,
      changed: !!page && changed(page),
      rows: shareRows({
        kind: 'palette',
        id: palette.id,
        link: getYarnPageURL({
          colors,
          origin: browser ? location.origin : PUBLIC_BASE_URL,
        }),
        changed,
        signInHref: signInHref(appPage.url),
        onpublish: () => sharePalette(palette, colors, label),
        onedit: (old) => sharePalette(palette, colors, label, old),
      }),
    };
  }

  /** Its name or colors differ from its gallery page's */
  const paletteChanged = (colors: Color[], label: string, page: GalleryPage) =>
    paletteNameDiffers(label, page) ||
    Boolean(
      page.link &&
      colorsToPaletteCode(getColorsFromInput({ string: page.link }) || []) !==
        colorsToPaletteCode(colors),
    );
</script>

<svelte:head>
  <title>My Palettes</title>
  <meta name="description" content="Your saved yarn palettes" />
  <meta name="robots" content="noindex" />

  <meta property="og:title" content="My Palettes" />
  <meta property="og:description" content="Your saved yarn palettes" />
  <meta property="og:url" content="{PUBLIC_BASE_URL}/my-palettes" />
  <meta property="og:type" content="website" />
</svelte:head>

<AppShell pageName="My Library">
  {#snippet stickyHeader()}
    <div class="hidden lg:inline-flex"><AppLogo /></div>
  {/snippet}
  {#snippet main()}
    <MyLibrary current="palettes" currentTotal={total}>
      {#if browser && starred}
        <!-- Signed out, Starred is only a prompt to sign in -->
        {#if signedIn}
          <SavedPalettesToolbar
            starred
            total={starredTotal}
            matching={starredMatching}
          />
        {/if}
        <StarredGalleryPages
          kind="palette"
          layout={preferences.value.myProjectsLayout ?? 'grid'}
          filters={libraryFilters}
          oncount={(count) =>
            ({ total: starredTotal, matching: starredMatching } = count)}
        />
      {:else if browser}
        <SavedPalettesToolbar {total} {matching}>
          {#snippet actions()}
            <a href={resolve('yarn')} class="btn preset-tonal-primary"
              ><PlusIcon />New Palette</a
            >
          {/snippet}
        </SavedPalettesToolbar>
        {#if synced}
          <AddToAccountButton kind="palettes" />
        {/if}
        <SavedPalettes
          filters={libraryFilters}
          oncount={(count) => ({ total, matching } = count)}
          gallery={galleryFor}
        />
      {/if}
    </MyLibrary>
  {/snippet}
</AppShell>

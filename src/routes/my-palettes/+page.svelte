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

<!-- My Library's Yarn Palettes page: every saved palette (and signed in, ones
only in the gallery), with search, filters and sort once there are a few. -->

<script lang="ts">
  import { browser } from '$app/env';
  import { resolve } from '$app/paths';
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
  import GallerySharing from '#lib/components/account/GallerySharing.svelte';
  import MyLibrary from '#lib/components/MyLibrary.svelte';
  import SavedPalettes from '#lib/components/SavedPalettes.svelte';
  import SavedPalettesToolbar from '#lib/components/SavedPalettesToolbar.svelte';
  import SharePalette from '#lib/components/modals/SharePalette.svelte';
  import AddToAccountButton from '#lib/components/sync/AddToAccountButton.svelte';
  import { dialog } from '#lib/state/page-state.svelte.js';
  import {
    colorsToPaletteCode,
    getColorsFromInput,
    getYarnPageURL,
  } from '#lib/utils/color-utils.js';
  import { libraryFilters } from '#lib/state/library-filters.svelte.js';
  import type { Color } from '#lib/types/yarn-types.js';
  import { PlusIcon } from '@lucide/svelte';

  let total = $state<number | null>(null);
  let matching = $state(0);

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
      {#if browser}
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
        >
          {#snippet sharing({ palette, colors, label })}
            {@const page = showGallery
              ? galleryPages.grouped.byPalette.get(palette.id)
              : undefined}
            <GallerySharing
              kind="palette"
              id={palette.id}
              {label}
              link={getYarnPageURL({
                colors,
                origin: browser ? location.origin : PUBLIC_BASE_URL,
              })}
              {page}
              changedSince={Boolean(
                page && paletteChanged(colors, label, page),
              )}
              changed={(p) => paletteChanged(colors, label, p)}
              onadd={() => sharePalette(palette, colors, label)}
              onedit={(old) => sharePalette(palette, colors, label, old)}
            />
          {/snippet}
        </SavedPalettes>
      {/if}
    </MyLibrary>
  {/snippet}
</AppShell>

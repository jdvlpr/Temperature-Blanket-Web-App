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

<!-- Publish to Gallery, from Save & Export (the Yarn page and the Project
Planner). Publishing a palette on its own needs an account: signed out, it says
so, with a way to sign in that comes back to these colors, and Save Palette.
Signed in, the palette is saved first (the gallery page belongs to a saved
palette, as on My Projects), then it's published with SharePalette, or, when
it's published already, its page is shown, with Update Gallery Name when the
names differ. -->

<script lang="ts">
  import { resolve } from '$app/paths';
  import {
    getGalleryPages,
    groupGalleryPages,
    paletteNameDiffers,
    type GalleryPage,
  } from '#lib/accounts/gallery.js';
  import { account } from '#lib/accounts/summary.svelte.js';
  import PaletteStrip from '#lib/components/PaletteStrip.svelte';
  import SavePalette from '#lib/components/modals/SavePalette.svelte';
  import SharePalette from '#lib/components/modals/SharePalette.svelte';
  import Spinner from '#lib/components/Spinner.svelte';
  import { dialog } from '#lib/state/page-state.svelte.js';
  import { PaletteStorage } from '#lib/storage/palettes.svelte.js';
  import type { Color } from '#lib/types/yarn-types.js';
  import {
    colorsToPaletteCode,
    getPaletteFallbackName,
  } from '#lib/utils/color-utils.js';
  import { ExternalLinkIcon, LogInIcon, PencilIcon } from '@lucide/svelte';
  import { onMount } from 'svelte';

  let {
    colors,
    suggestedName = '',
    returnTo,
  }: {
    colors: Color[];
    /** A name to save it with when it isn't saved yet (a gallery palette's) */
    suggestedName?: string;
    /** Where signing in comes back to, with these colors (a path on this site) */
    returnTo: string;
  } = $props();

  type View =
    | { name: 'signed-out' }
    | { name: 'loading' }
    | { name: 'problem'; message: string }
    | { name: 'share'; paletteId: string; label: string }
    | { name: 'existing'; paletteId: string; label: string; page: GalleryPage }
    | { name: 'rename'; paletteId: string; label: string; page: GalleryPage };

  let view = $state<View>(
    __ACCOUNTS_ENABLED__ && account.summary?.id
      ? { name: 'loading' }
      : { name: 'signed-out' },
  );
  // Saved here, so the dialog says so
  let savedNow = $state(false);
  let versions = $state<GalleryPage[]>([]);

  const signInHref = $derived(
    `${resolve('/auth/sign-in')}?redirect=${encodeURIComponent(returnTo)}`,
  );

  onMount(async () => {
    if (view.name !== 'loading') return;
    let palette;
    try {
      const saved = await PaletteStorage.add({
        code: colorsToPaletteCode(colors),
        name: suggestedName,
      });
      palette = saved.palette;
      savedNow = saved.added;
    } catch {
      view = {
        name: 'problem',
        message:
          'It couldn’t be saved in this browser, which publishing needs. Try again later.',
      };
      return;
    }
    const label = palette.name || getPaletteFallbackName(colors);

    const gallery = await getGalleryPages();
    if (!gallery) {
      view = {
        name: 'problem',
        message: 'The gallery couldn’t be reached. Try again later.',
      };
      return;
    }
    const page = groupGalleryPages(
      gallery.posts,
      [],
      [palette.id],
    ).byPalette.get(palette.id);
    if (page) {
      versions = gallery.posts
        .filter((p) => p.kind === 'palette' && p.projectId === palette.id)
        .sort((a, b) => b.publishedAt - a.publishedAt || b.postId - a.postId);
      view = { name: 'existing', paletteId: palette.id, label, page };
      return;
    }
    if (!gallery.publishing) {
      view = {
        name: 'problem',
        message:
          'Publishing to the gallery is paused right now. Try again later.',
      };
      return;
    }
    view = { name: 'share', paletteId: palette.id, label };
  });

  function saveFirst() {
    dialog.trigger({
      type: 'component',
      component: { ref: SavePalette, props: { colors, suggestedName } },
      options: { size: 'medium', title: 'Save Palette' },
    });
  }
</script>

{#if view.name === 'share'}
  {#if savedNow}
    <p class="px-4 pt-4 text-left text-sm opacity-80" role="status">
      It’s saved to your palettes, where its gallery page will show.
    </p>
  {/if}
  <SharePalette paletteId={view.paletteId} {colors} name={view.label} />
{:else if view.name === 'rename'}
  <SharePalette
    paletteId={view.paletteId}
    {colors}
    name={view.label}
    showOwner={view.page.showOwner}
    {versions}
    rename={view.page}
  />
{:else}
  <div class="flex w-full max-w-(--breakpoint-sm) flex-col gap-4 p-4 text-left">
    <PaletteStrip {colors} />

    {#if view.name === 'signed-out'}
      <p>
        Publishing a palette to the
        <a href={resolve('/gallery/palettes')} target="_blank" class="link"
          >Yarn Palette Gallery</a
        >
        needs a free account. Sign in or create one, and you’ll come back to these
        colors to publish them.
      </p>
      <div class="flex flex-wrap gap-2">
        <!-- eslint-disable svelte/no-navigation-without-resolve -- resolved above -->
        <a href={signInHref} class="btn preset-filled-primary-500"
          ><LogInIcon />Sign In or Create Account</a
        >
        <!-- eslint-enable svelte/no-navigation-without-resolve -->
        <button
          type="button"
          class="btn hover:preset-tonal-surface"
          onclick={saveFirst}>Save Palette</button
        >
      </div>
    {:else if view.name === 'loading'}
      <div class="flex justify-center py-6" role="status">
        <Spinner />
        <span class="sr-only">Getting it ready…</span>
      </div>
    {:else if view.name === 'problem'}
      <p class="text-error-700-300" role="alert">{view.message}</p>
    {:else if view.name === 'existing'}
      {@const differs = paletteNameDiffers(view.label, view.page)}
      <div class="flex flex-col gap-2" role="status">
        <p>
          You’ve published this palette already, as “{view.page.title}”.
          {#if savedNow}It’s saved to your palettes now too.{/if}
        </p>
        {#if differs}
          <p class="text-sm opacity-80">
            It’s saved as “{view.label}”. You can give its gallery page that
            name.
          </p>
        {/if}
      </div>
      <div class="flex flex-wrap gap-2">
        <a
          href={resolve('/gallery/palette/[id]', {
            id: String(view.page.postId),
          })}
          target="_blank"
          class="btn hover:preset-tonal-surface"
          >View Gallery Page<ExternalLinkIcon class="icon-sm" /><span
            class="sr-only">(opens in a new tab)</span
          ></a
        >
        {#if differs}
          {@const { paletteId, label, page } = view}
          <button
            type="button"
            class="btn preset-filled-primary-500"
            onclick={() => (view = { name: 'rename', paletteId, label, page })}
            ><PencilIcon />Update Gallery Name</button
          >
        {/if}
      </div>
    {/if}
  </div>
{/if}

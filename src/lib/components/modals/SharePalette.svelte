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

<!-- Publishes a saved palette to the Yarn Palette Gallery, from My Projects
while signed in: a snapshot of it as it is now, linked to the account. As a
new version of a published one, it asks whether to remove the old page. With
`rename`, it renames the published page in place instead (its link stays),
falling back to a new version when the gallery can't rename yet. When the
gallery says these colors are published already, it shows that page, and can
rename it. -->

<script lang="ts">
  import { resolve } from '$app/paths';
  import PaletteStrip from '#lib/components/PaletteStrip.svelte';
  import {
    GALLERY_PAGES_CHANGED,
    getGalleryPages,
    paletteNameDiffers,
    removeGalleryPage,
    renameGalleryPage,
    sharePalette,
  } from '#lib/accounts/gallery.js';
  import { account } from '#lib/accounts/summary.svelte.js';
  import ShowOwnerToggle from '#lib/components/account/ShowOwnerToggle.svelte';
  import UnpublishVersions from '#lib/components/account/UnpublishVersions.svelte';
  import { onMount, untrack } from 'svelte';
  import type { Color } from '#lib/types/yarn-types.js';
  import { getYarnPageURL } from '#lib/utils/color-utils.js';
  import { cleanName } from '#lib/utils/string-utils.js';
  import {
    CheckIcon,
    ExternalLinkIcon,
    LoaderCircleIcon,
    PencilIcon,
    SendIcon,
  } from '@lucide/svelte';

  // The gallery's limit (MAX_PALETTE_TITLE_LENGTH on the server)
  const MAX_NAME_LENGTH = 80;

  let {
    paletteId,
    colors,
    name: savedName,
    showOwner: chosenShowOwner,
    versions = [],
    rename,
  }: {
    paletteId: string;
    colors: Color[];
    name: string;
    /** Chosen already on My Projects: with or without the account's name */
    showOwner?: boolean;
    /** Publishing a new version: the versions there now, newest first */
    versions?: { postId: number; publishedAt: number; link?: string | null }[];
    /** Renaming this published page in place (its name differs from the palette's) */
    rename?: { postId: number; title: string };
  } = $props();

  // The page to rename: the one given, or the one the gallery says has these
  // colors already
  let renameTarget = $state(untrack(() => rename));
  // Renaming, until the gallery says it can't (an older plugin): then it
  // publishes a new version with the name instead
  let renaming = $state(Boolean(untrack(() => rename)));
  // The page these colors are published on already, when the gallery says so
  let existing = $state<{ postId: number; title: string } | null>(null);
  let renamed = $state(false);

  // Its versions to unpublish once the new one is in (the latest, at first)
  // svelte-ignore state_referenced_locally
  let unpublishIds = $state<number[]>(versions[0] ? [versions[0].postId] : []);
  // The newest of them takes the new page's place (the gallery may say it's
  // the same palette); the rest come off after
  let replacePostId = $derived(
    versions.find((v) => unpublishIds.includes(v.postId))?.postId,
  );
  // Of the rest: how many came off, and whether any couldn't
  let extrasRemoved = $state(0);
  let extrasFailed = $state(false);

  // svelte-ignore state_referenced_locally
  let name = $state(cleanName(savedName, MAX_NAME_LENGTH));
  let busy = $state(false);
  let shared = $state(false);
  // The palette's gallery page, once shared
  let postId = $state<number | null>(null);
  let errorMessage = $state('');
  // Include it on the account's public gallery, starting from the last choice
  let showOwner = $state(false);
  let serverName = $state<string | null>(null);
  let ownerName = $derived((serverName ?? account.summary?.name ?? '').trim());

  onMount(async () => {
    const gallery = await getGalleryPages();
    if (!gallery) return;
    showOwner = chosenShowOwner ?? gallery.settings.showOwnerDefault;
    if (typeof gallery.name === 'string') serverName = gallery.name;
  });

  // Whether the old page came off, when replacing one
  let oldRemoved = $state<boolean | null>(null);

  async function removeOld() {
    if (!replacePostId) return true;
    try {
      await removeGalleryPage(replacePostId);
      return true;
    } catch {
      return false;
    }
  }

  async function share(event?: Event) {
    event?.preventDefault();
    const title = cleanName(name, MAX_NAME_LENGTH);
    if (!title || busy) return;
    busy = true;
    errorMessage = '';
    if (renaming && renameTarget) {
      const result = await renameGalleryPage(renameTarget.postId, title);
      busy = false;
      if (result.status === 'renamed') {
        renamed = shared = true;
        postId = renameTarget.postId;
        window.dispatchEvent(new Event(GALLERY_PAGES_CHANGED));
      } else if (result.status === 'unsupported') {
        renaming = false;
        errorMessage =
          'The gallery can’t rename pages yet. Publish a new version with this name instead.';
      } else errorMessage = result.message;
      return;
    }
    const share = () =>
      sharePalette({
        paletteId,
        title,
        // Without the app version, so the same palette is the same link and
        // the gallery can tell it's already there
        yarnUrl: getYarnPageURL({ colors, origin: window.location.origin }),
        showOwner,
      });
    let result = await share();
    // Replacing, and the gallery has these colors on the old page (or an older
    // plugin doesn't say which): it goes first (removed pages don't count)
    if (
      replacePostId &&
      ((result.status === 'error' && result.code === 409) ||
        (result.status === 'published-already' &&
          result.postId === replacePostId))
    ) {
      oldRemoved = await removeOld();
      if (oldRemoved) result = await share();
    }
    if (result.status === 'shared' && replacePostId && oldRemoved === null)
      oldRemoved = await removeOld();
    // The other versions chosen, now that the new one is in
    if (result.status === 'shared' && oldRemoved !== false) {
      const extras = unpublishIds.filter((id) => id !== replacePostId);
      const results = await Promise.allSettled(
        extras.map((id) => removeGalleryPage(id)),
      );
      extrasRemoved = results.filter((r) => r.status === 'fulfilled').length;
      extrasFailed = extrasRemoved < extras.length;
    }
    if (unpublishIds.length)
      window.dispatchEvent(new Event(GALLERY_PAGES_CHANGED));
    busy = false;
    if (result.status === 'shared') {
      shared = true;
      postId = result.postId;
    } else if (result.status === 'published-already') {
      existing = { postId: result.postId, title: result.title };
      if (oldRemoved)
        errorMessage =
          'Its old gallery page was removed. You can share it again from My Projects.';
    } else {
      errorMessage = result.message;
      if (oldRemoved)
        errorMessage +=
          ' Its old gallery page was removed. You can share it again from My Projects.';
    }
  }
</script>

<div class="flex w-full max-w-(--breakpoint-sm) flex-col gap-4 p-4 text-left">
  <PaletteStrip {colors} />

  {#if shared}
    <div class="flex flex-col items-center gap-2 text-center" role="status">
      <CheckIcon class="text-success-700-300 size-8" />
      <p class="font-bold">{renamed ? 'Renamed' : 'Published'}</p>
      {#if renamed}
        <p class="text-sm">
          Its gallery page has the new name. Its link stays the same.
        </p>
      {:else if replacePostId && oldRemoved !== null}
        {@const count = (oldRemoved ? 1 : 0) + extrasRemoved}
        <p class="text-sm">
          {#if count}
            {count === 1
              ? 'The older version was unpublished.'
              : `${count} older versions were unpublished.`}
          {/if}
          {#if oldRemoved === false || extrasFailed}
            Some couldn’t be unpublished. You can unpublish them from My
            Projects.
          {/if}
        </p>
      {/if}
      {#if postId}
        <a
          href={resolve('/gallery/palette/[id]', { id: String(postId) })}
          target="_blank"
          class="link">View Gallery Page</a
        >
      {/if}
    </div>
  {:else if existing}
    {@const differs = paletteNameDiffers(name, existing)}
    <div class="flex flex-col gap-2" role="status">
      <p>
        You’ve published this palette already{existing.title
          ? `, as “${existing.title}”`
          : ''}.
      </p>
      {#if differs}
        <p class="text-sm opacity-80">
          You can give its gallery page the name “{cleanName(
            name,
            MAX_NAME_LENGTH,
          )}”. Its link stays the same.
        </p>
      {/if}
      {#if errorMessage}
        <p class="text-error-700-300" role="alert">{errorMessage}</p>
      {/if}
    </div>
    <div class="flex flex-wrap gap-2">
      <a
        href={resolve('/gallery/palette/[id]', {
          id: String(existing.postId),
        })}
        target="_blank"
        class="btn hover:preset-tonal-surface"
        >View Gallery Page<ExternalLinkIcon class="icon-sm" /><span
          class="sr-only">(opens in a new tab)</span
        ></a
      >
      {#if differs}
        <button
          type="button"
          class="btn preset-filled-primary-500"
          onclick={() => {
            renameTarget = existing ?? undefined;
            renaming = true;
            existing = null;
            share();
          }}><PencilIcon />Update Gallery Name</button
        >
      {/if}
    </div>
  {:else}
    <form class="flex flex-col gap-4" onsubmit={share}>
      <label class="label">
        <span class="label-text">Name</span>
        <input
          type="text"
          class="input"
          autocomplete="off"
          maxlength={MAX_NAME_LENGTH}
          required
          bind:value={name}
          disabled={busy}
        />
      </label>
      <p>
        {#if renaming}
          Changes the name on its gallery page. Its link stays the same.
        {:else if versions.length}
          Publishes a new version of this palette, as it is now.
        {:else}
          Publishes a snapshot of this palette, with this name and its colors,
          to the public
          <a
            href="{resolve('gallery')}?view=yarn-palettes"
            target="_blank"
            class="link">Yarn Palette Gallery</a
          >.
        {/if}
      </p>
      {#if versions.length && !renaming}
        <UnpublishVersions
          {versions}
          {ownerName}
          bind:selected={unpublishIds}
          disabled={busy}
        />
      {/if}
      {#if !renaming}
        <ShowOwnerToggle
          bind:checked={showOwner}
          name={ownerName}
          disabled={busy}
        />
      {/if}
      {#if errorMessage}
        <p class="text-error-700-300" role="alert">{errorMessage}</p>
      {/if}
      <button
        type="submit"
        class="btn preset-filled-primary-500 w-full sm:w-fit"
        disabled={busy || !cleanName(name, MAX_NAME_LENGTH)}
      >
        {#if busy}<LoaderCircleIcon
            class="animate-spin"
          />{:else if renaming}<PencilIcon />{:else}<SendIcon />{/if}
        {renaming
          ? 'Update Gallery Name'
          : versions.length
            ? 'Publish New Version'
            : 'Publish'}
      </button>
    </form>
  {/if}
</div>

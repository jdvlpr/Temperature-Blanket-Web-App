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

<!-- Publishes a saved palette to the Yarn Palette Gallery while signed in,
linked to the account, or with `update` edits its gallery page (Edit Gallery
Page): its name and colors, updated in place (its link stays the same),
Anonymous, and Unpublish. Each palette has one page. When the gallery says
these colors are published already, it shows that page, and can update it.
From the gallery page itself (`onsaved`), Done closes it. -->

<script lang="ts">
  import { resolve } from '$app/paths';
  import PaletteStrip from '#lib/components/PaletteStrip.svelte';
  import {
    GALLERY_PAGES_CHANGED,
    getGalleryPages,
    paletteNameDiffers,
    sharePalette,
    updatePalettePage,
  } from '#lib/accounts/gallery.js';
  import { galleryPages } from '#lib/accounts/gallery-pages.svelte.js';
  import { account } from '#lib/accounts/summary.svelte.js';
  import AnonymousCheckbox from '#lib/components/account/AnonymousCheckbox.svelte';
  import UnpublishConfirm from '#lib/components/account/UnpublishConfirm.svelte';
  import DialogFooter from '#lib/components/modals/DialogFooter.svelte';
  import {
    BTN_PRIMARY,
    BTN_SECONDARY,
  } from '#lib/constants/class-constants.js';
  import { dialog } from '#lib/state/page-state.svelte.js';
  import {
    PaletteStorage,
    savedPalettes,
  } from '#lib/storage/palettes.svelte.js';
  import { onMount, tick, untrack } from 'svelte';
  import type { Color } from '#lib/types/yarn-types.js';
  import {
    colorsToPaletteCode,
    getColorsFromInput,
    getYarnPageURL,
  } from '#lib/utils/color-utils.js';
  import { cleanName } from '#lib/utils/string-utils.js';
  import {
    CheckIcon,
    ExternalLinkIcon,
    EyeOffIcon,
    LoaderCircleIcon,
    RefreshCwIcon,
    SendIcon,
  } from '@lucide/svelte';

  // The gallery's limit (MAX_PALETTE_TITLE_LENGTH on the server)
  const MAX_NAME_LENGTH = 80;

  let {
    paletteId,
    colors,
    name: savedName,
    showOwner: chosenShowOwner,
    update,
    onsaved,
    onunpublished,
  }: {
    paletteId: string;
    colors: Color[];
    name: string;
    /** Chosen already: with or without the account's name */
    showOwner?: boolean;
    /** Editing this published page */
    update?: {
      postId: number;
      title: string;
      showOwner?: boolean;
      link?: string | null;
    };
    /** From its own gallery page, which shows what changed: Done closes */
    onsaved?: () => void;
    /** From its own gallery page: unpublished, and the dialog closes */
    onunpublished?: () => void;
  } = $props();

  // The page to update: the one given, or the one the gallery says has these
  // colors already
  let target = $state(untrack(() => update));
  // The page these colors are published on already, when the gallery says so
  let existing = $state<{ postId: number; title: string } | null>(null);

  // svelte-ignore state_referenced_locally
  let name = $state(cleanName(savedName, MAX_NAME_LENGTH));
  let busy = $state(false);
  let done = $state<'published' | 'saved' | 'unpublished' | null>(null);
  // The palette's gallery page, once shared
  let postId = $state<number | null>(null);
  let errorMessage = $state('');
  // Include a new page on the account's public gallery, starting from the last choice
  let showOwner = $state(untrack(() => update?.showOwner ?? false));
  let serverName = $state<string | null>(null);
  let ownerName = $derived((serverName ?? account.summary?.name ?? '').trim());
  let doneHeading = $state<HTMLElement>();

  onMount(async () => {
    const gallery = await getGalleryPages();
    if (!gallery) return;
    showOwner =
      update?.showOwner ?? chosenShowOwner ?? gallery.settings.showOwnerDefault;
    if (typeof gallery.name === 'string') serverName = gallery.name;
  });

  // Editing: what differs from its page now
  // Its page's choice, once saved here
  let pageShowOwner = $state(untrack(() => update?.showOwner));
  const ownerChanged = $derived(
    pageShowOwner !== undefined && showOwner !== pageShowOwner,
  );
  const pageChanged = $derived(
    !update ||
      paletteNameDiffers(name, update) ||
      Boolean(
        update.link &&
        colorsToPaletteCode(
          getColorsFromInput({ string: update.link }) || [],
        ) !== colorsToPaletteCode(colors),
      ),
  );
  const nothingChanged = $derived(!!update && !pageChanged && !ownerChanged);

  // Without the app version, so the same palette is the same link and the
  // gallery can tell it's already there
  const yarnUrl = () =>
    getYarnPageURL({ colors, origin: window.location.origin });

  async function updatePage(page: { postId: number }, title: string) {
    const result = await updatePalettePage(page.postId, {
      title,
      yarnUrl: yarnUrl(),
    });
    if (result.status === 'answered') {
      const code = Number(result.response.code);
      if (code === 200) {
        postId = page.postId;
        window.dispatchEvent(new Event(GALLERY_PAGES_CHANGED));
        return true;
      }
      errorMessage =
        code === 409
          ? 'Another of your palette pages has these colors already.'
          : String(result.response.message ?? '') ||
            'It couldn’t be updated. Try again later.';
    } else
      errorMessage =
        result.status === 'error'
          ? result.message
          : result.status === 'unsupported'
            ? 'The gallery can’t update pages yet. Try again later.'
            : result.status === 'paused'
              ? 'Publishing to the gallery is paused right now. Try again later.'
              : result.status === 'signed-out'
                ? 'Sign in again, then try again.'
                : 'Its gallery page is gone. Refresh My Library to see it.';
    return false;
  }

  async function finish(next: typeof done) {
    done = next;
    if (next === 'saved') onsaved?.();
    await tick();
    doneHeading?.focus();
  }

  // One name: the palette's, which its gallery page shows too. Renamed
  // here, the saved palette is renamed with its page
  async function renameSaved(title: string) {
    if (title === cleanName(savedName, MAX_NAME_LENGTH)) return;
    try {
      await PaletteStorage.rename(paletteId, title);
      await savedPalettes.refresh();
    } catch {
      // Its page has the name; the saved palette keeps its old one
    }
  }

  async function share(event?: Event) {
    event?.preventDefault();
    const title = cleanName(name, MAX_NAME_LENGTH);
    if (!title || busy || nothingChanged) return;
    busy = true;
    errorMessage = '';
    try {
      await renameSaved(title);
      if (target) {
        if (update && ownerChanged) {
          try {
            await galleryPages.setShowOwner(update.postId, showOwner);
          } catch {
            errorMessage =
              'Its name on the page couldn’t be changed. Try again later.';
            return;
          }
          pageShowOwner = showOwner;
        }
        if (pageChanged && !(await updatePage(target, title))) return;
        postId = target.postId;
        return await finish('saved');
      }
      const result = await sharePalette({
        paletteId,
        title,
        yarnUrl: yarnUrl(),
        showOwner,
      });
      if (result.status === 'shared') {
        postId = result.postId;
        await finish('published');
      } else if (result.status === 'published-already')
        existing = { postId: result.postId, title: result.title };
      else errorMessage = result.message;
    } finally {
      busy = false;
    }
  }

  // ---- Unpublish, asked first in place of the form
  let unpublishing = $state(false);
  let unpublishButton = $state<HTMLButtonElement>();
  async function unpublished() {
    unpublishing = false;
    if (onunpublished) {
      dialog.close();
      onunpublished();
      return;
    }
    postId = null;
    await finish('unpublished');
  }
  async function keepPublished() {
    unpublishing = false;
    await tick();
    unpublishButton?.focus();
  }
</script>

<div
  class="flex w-full max-w-(--breakpoint-sm) flex-col gap-4 px-4 pt-4 text-left"
>
  <PaletteStrip {colors} />

  {#if done}
    <div class="flex flex-col items-center gap-2 text-center">
      <CheckIcon class="text-success-700-300 size-8" aria-hidden="true" />
      <h2 class="h4" tabindex="-1" bind:this={doneHeading}>
        {done === 'saved'
          ? 'Saved'
          : done === 'unpublished'
            ? 'Unpublished'
            : 'Published'}
      </h2>
      {#if done === 'unpublished'}
        <p class="text-sm">Its gallery page link no longer works.</p>
      {/if}
      {#if postId && !onsaved}
        <a
          href={resolve('/gallery/palette/[id]', { id: String(postId) })}
          target="_blank"
          class="link">View Gallery Page</a
        >
      {:else}
        <button
          type="button"
          class="btn preset-filled-primary-500"
          onclick={() => dialog.close()}>Done</button
        >
      {/if}
    </div>
  {:else if existing}
    <div class="flex flex-col gap-2" role="status">
      <p>
        You’ve published this palette already{existing.title
          ? `, as “${existing.title}”`
          : ''}.
      </p>
      {#if errorMessage}
        <p class="text-error-700-300" role="alert">{errorMessage}</p>
      {/if}
    </div>
    <DialogFooter>
      <a
        href={resolve('/gallery/palette/[id]', {
          id: String(existing.postId),
        })}
        target="_blank"
        class={BTN_SECONDARY}
        >View Gallery Page<ExternalLinkIcon class="icon-sm" /><span
          class="sr-only">(opens in a new tab)</span
        ></a
      >
      <button
        type="button"
        class={BTN_PRIMARY}
        disabled={busy}
        onclick={() => {
          target = existing ?? undefined;
          existing = null;
          share();
        }}><RefreshCwIcon />Update Gallery Page</button
      >
    </DialogFooter>
  {:else if unpublishing && update}
    <UnpublishConfirm
      kind="palette"
      postId={update.postId}
      title={update.title}
      ondone={unpublished}
      oncancel={keepPublished}
    />
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
        {#if update && !pageChanged}
          Its gallery page has this name and these colors.
        {:else if target}
          Updates its gallery page to this name and these colors. Its link stays
          the same.
        {:else}
          Publishes this palette, with this name and its colors, to the public
          <a href={resolve('/gallery/palettes')} target="_blank" class="link"
            >Yarn Palette Gallery</a
          >. You can update or unpublish it later.
        {/if}
      </p>
      {#if !target || update}
        <AnonymousCheckbox
          bind:checked={showOwner}
          name={ownerName}
          disabled={busy}
        />
      {/if}
      {#if errorMessage}
        <p class="text-error-700-300" role="alert">{errorMessage}</p>
      {/if}
      {#if nothingChanged}
        <p class="text-sm opacity-80" id="palette-up-to-date">
          Everything is up to date.
        </p>
      {/if}
      <DialogFooter>
        {#if update && !busy}
          <button
            type="button"
            class={BTN_SECONDARY}
            bind:this={unpublishButton}
            onclick={() => (unpublishing = true)}
          >
            <EyeOffIcon aria-hidden="true" />Unpublish…
          </button>
        {/if}
        <button
          type="submit"
          class={BTN_PRIMARY}
          disabled={busy || nothingChanged || !cleanName(name, MAX_NAME_LENGTH)}
          aria-describedby={nothingChanged ? 'palette-up-to-date' : undefined}
        >
          {#if busy}<LoaderCircleIcon
              class="animate-spin"
            />{:else if !target}<SendIcon
              aria-hidden="true"
            />{:else if !update}<RefreshCwIcon aria-hidden="true" />{/if}
          {update ? 'Save' : target ? 'Update' : 'Publish'}
        </button>
      </DialogFooter>
    </form>
  {/if}
</div>

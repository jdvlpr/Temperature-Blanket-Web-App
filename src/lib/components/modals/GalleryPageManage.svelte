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

<!-- @component
  Edit Gallery Page from the gallery page, when its project or palette isn't
  saved on this device yet (before a sync): Anonymous and Unpublish, which need
  only the page. Updating it needs the project or palette, so that waits.
-->
<script lang="ts">
  import { anonymousDetail } from '#lib/accounts/anonymous.js';
  import { galleryPages } from '#lib/accounts/gallery-pages.svelte.js';
  import {
    RavelryLinkedError,
    type GalleryPage,
  } from '#lib/accounts/gallery.js';
  import { account } from '#lib/accounts/summary.svelte.js';
  import AnonymousCheckbox from '#lib/components/account/AnonymousCheckbox.svelte';
  import UnpublishConfirm from '#lib/components/account/UnpublishConfirm.svelte';
  import DialogFooter from '#lib/components/modals/DialogFooter.svelte';
  import {
    BTN_PRIMARY,
    BTN_SECONDARY,
  } from '#lib/constants/class-constants.js';
  import { dialog } from '#lib/state/page-state.svelte.js';
  import { CheckIcon, EyeOffIcon, LoaderCircleIcon } from '@lucide/svelte';
  import { tick, untrack } from 'svelte';

  let {
    kind,
    page,
    onsaved,
    onunpublished,
  }: {
    kind: 'project' | 'palette';
    page: GalleryPage;
    onsaved: () => void;
    onunpublished: () => void;
  } = $props();

  let showOwner = $state(untrack(() => !!page.showOwner));
  let pageShowOwner = $state(untrack(() => !!page.showOwner));
  const ownerName = $derived(
    (galleryPages.name ?? account.summary?.name ?? '').trim(),
  );
  const changed = $derived(showOwner !== pageShowOwner);
  // On Ravelry, which links to the page under the name: saving unlinks it
  let unlinks = $state(false);

  let busy = $state(false);
  let saved = $state(false);
  let errorMessage = $state('');
  let unpublishing = $state(false);
  let unpublishButton = $state<HTMLButtonElement>();
  let savedHeading = $state<HTMLElement>();

  async function save() {
    if (!changed || busy) return;
    busy = true;
    errorMessage = '';
    try {
      await galleryPages.setShowOwner(page.postId, showOwner, {
        unlinkRavelry: unlinks,
      });
      pageShowOwner = showOwner;
      saved = true;
      onsaved();
      await tick();
      savedHeading?.focus();
    } catch (e) {
      if (e instanceof RavelryLinkedError) unlinks = true;
      else errorMessage = 'That change couldn’t be saved. Try again later.';
    } finally {
      busy = false;
    }
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
  {#if saved}
    <div class="flex flex-col items-center gap-2 py-6 text-center">
      <CheckIcon class="text-success-700-300 size-8" aria-hidden="true" />
      <h2 class="h4" tabindex="-1" bind:this={savedHeading}>Saved</h2>
      <p class="text-sm">{anonymousDetail(!showOwner, ownerName)}</p>
      <button type="button" class={BTN_PRIMARY} onclick={() => dialog.close()}
        >Done</button
      >
    </div>
  {:else if unpublishing}
    <UnpublishConfirm
      {kind}
      postId={page.postId}
      title={page.title}
      ondone={() => {
        dialog.close();
        onunpublished();
      }}
      oncancel={keepPublished}
    />
  {:else}
    <p class="text-sm opacity-80">
      This {kind} isn’t on this device yet. Once it syncs, you can update its page
      here or from My Library.
    </p>
    <AnonymousCheckbox
      bind:checked={showOwner}
      name={ownerName}
      disabled={busy}
    />
    {#if unlinks && !showOwner}
      <p class="text-sm" role="status">
        It’s on Ravelry, which links to this page under your name. Saving it as
        Anonymous unlinks it; the Ravelry project stays.
      </p>
    {/if}
    {#if errorMessage}
      <p class="text-error-700-300 text-sm" role="alert">{errorMessage}</p>
    {/if}
    <DialogFooter>
      <button
        type="button"
        class={BTN_SECONDARY}
        bind:this={unpublishButton}
        onclick={() => (unpublishing = true)}
        disabled={busy}
      >
        <EyeOffIcon aria-hidden="true" />Unpublish…
      </button>
      <button
        type="button"
        class={BTN_PRIMARY}
        onclick={save}
        disabled={busy || !changed}
      >
        {#if busy}<LoaderCircleIcon class="animate-spin" />{/if}Save
      </button>
    </DialogFooter>
  {/if}
</div>

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
  Unpublish, asked first, in the Edit Gallery Page dialogs: what goes (its
  link, the globe, a project's Ravelry link) and what stays. Unpublish takes
  the focus, as the button that asked is gone.
-->
<script lang="ts">
  import { galleryPages } from '#lib/accounts/gallery-pages.svelte.js';
  import { LoaderCircleIcon } from '@lucide/svelte';
  import type { Attachment } from 'svelte/attachments';

  let {
    kind,
    postId,
    title,
    onRavelry = false,
    ondone,
    oncancel,
  }: {
    kind: 'project' | 'palette';
    postId: number;
    /** The page's name */
    title: string;
    /** A project on Ravelry, which Unpublish unlinks */
    onRavelry?: boolean;
    /** Unpublished */
    ondone: () => void;
    /** Kept published */
    oncancel: () => void;
  } = $props();

  let busy = $state(false);
  let errorMessage = $state('');

  const takeFocus: Attachment<HTMLButtonElement> = (button) => {
    button.focus({ preventScroll: true });
  };

  async function unpublish() {
    busy = true;
    errorMessage = '';
    try {
      await galleryPages.remove(postId);
      ondone();
    } catch {
      errorMessage = 'It couldn’t be unpublished. Try again later.';
    } finally {
      busy = false;
    }
  }
</script>

<div class="flex flex-col gap-2" role="group" aria-label="Unpublish">
  <p class="text-sm">
    Unpublish{title ? ` “${title}”` : ' this page'}? Its gallery page link stops
    working{kind === 'project' ? ', and it comes off the globe' : ''}{onRavelry
      ? '. It’s unlinked from Ravelry too (the Ravelry project stays)'
      : ''}. Your {kind} stays saved, and links you’ve shared to it still work.
  </p>
  <div class="flex flex-wrap gap-2">
    <button
      type="button"
      class="btn preset-filled-error-500"
      onclick={unpublish}
      disabled={busy}
      {@attach takeFocus}
      >{#if busy}<LoaderCircleIcon class="animate-spin" />{/if}Unpublish</button
    >
    <button
      type="button"
      class="btn preset-tonal-surface"
      onclick={oncancel}
      disabled={busy}>Keep Published</button
    >
  </div>
  {#if errorMessage}
    <p class="text-error-700-300 text-sm" role="alert">{errorMessage}</p>
  {/if}
</div>

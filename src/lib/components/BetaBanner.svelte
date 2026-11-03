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

<!-- One line above each page of the beta (in place of WhatsNewBanner): that it
is one, where its tradeoffs are, and where to send feedback, until dismissed
(Local Storage beta_note_dismissed). About the Beta stays in the sidebar. -->

<script lang="ts">
  import { resolve } from '$app/paths';
  import { page } from '$app/state';
  import { isThumbnailFrame } from '#lib/storage/thumbnails.js';
  import { FlaskConicalIcon, XIcon } from '@lucide/svelte';
  import { onMount } from 'svelte';

  const KEY = 'beta_note_dismissed';

  // Only after loading: the server can't know whether it was dismissed
  let show = $state(false);
  onMount(() => {
    if (isThumbnailFrame()) return;
    try {
      show = !localStorage.getItem(KEY);
    } catch {
      show = true;
    }
  });

  function dismiss() {
    show = false;
    try {
      localStorage.setItem(KEY, String(Date.now()));
    } catch {
      // Private browsing: it shows again next time
    }
  }

  const onBetaPage = $derived(page.url.pathname.startsWith('/beta'));
</script>

{#if show && !onBetaPage}
  <aside
    class="bg-surface-100-900 rounded-container mb-2 flex items-center gap-2 py-1 pr-1 pl-4 text-sm max-lg:m-2"
    aria-label="Beta"
  >
    <FlaskConicalIcon class="icon-sm shrink-0" aria-hidden="true" />
    <p class="min-w-0 flex-1">
      <span class="font-bold">Beta</span><span class="max-sm:hidden"
        >: the next version, here to try early</span
      >
      <a href={resolve('/beta')} class="anchor whitespace-nowrap"
        >About the beta</a
      >
      ·
      <a href="{resolve('/beta')}#feedback" class="anchor whitespace-nowrap"
        >Send feedback</a
      >
    </p>
    <button
      type="button"
      class="btn-icon hover:preset-tonal-surface shrink-0"
      aria-label="Dismiss the beta note"
      title="Dismiss"
      onclick={dismiss}
    >
      <XIcon aria-hidden="true" />
    </button>
  </aside>
{/if}

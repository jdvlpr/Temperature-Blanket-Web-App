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
  import { isThumbnailFrame } from '#lib/storage/thumbnails.js';
  import { resolve } from '$app/paths';
  import { FlaskConicalIcon, ExternalLinkIcon } from '@lucide/svelte';
  import { onMount } from 'svelte';
  onMount(() => {
    if (isThumbnailFrame()) return;
  });
</script>

<aside
  class="bg-surface-100-900 rounded-container mb-2 flex items-center gap-2 py-2 pr-4 pl-4 text-sm max-lg:m-2"
  aria-label="Beta"
>
  <FlaskConicalIcon class="icon-sm shrink-0" aria-hidden="true" />
  <div
    class="flex min-w-0 flex-1 flex-wrap items-center justify-between gap-x-2 gap-y-1"
  >
    <p>
      <span class="font-bold">Beta</span><span class="max-sm:hidden"
        >: you're viewing a preview of the next version</span
      >
    </p>
    <div class="flex flex-wrap items-center gap-x-4 gap-y-1">
      <a href={resolve('/beta')} class="anchor whitespace-nowrap"
        >About <span class="max-sm:hidden">the beta</span></a
      >

      <a href="{resolve('/beta')}#feedback" class="anchor whitespace-nowrap"
        >Send feedback</a
      >
      <a
        href="https://temperature-blanket.com"
        class="anchor flex items-center gap-1 whitespace-nowrap"
        >Exit Beta <ExternalLinkIcon
          class="icon-sm shrink-0"
          aria-hidden="true"
        /></a
      >
    </div>
  </div>
</aside>

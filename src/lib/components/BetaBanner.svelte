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

<!-- A strip across the top of each page of the beta, above the top bar (in place
of WhatsNewBanner): that it is one, where its tradeoffs are, where to send
feedback and the way back to the main site. It can't be dismissed. Its id,
top-banner, is what the planner's steps scroll past (page-state). -->

<script lang="ts">
  import { isThumbnailFrame } from '#lib/storage/thumbnails.js';
  import { resolve } from '$app/paths';
  import { openBetaFeedback } from '#lib/utils/open-beta-feedback.js';
  import { FlaskConicalIcon, ExternalLinkIcon } from '@lucide/svelte';
  import { onMount } from 'svelte';
  onMount(() => {
    if (isThumbnailFrame()) return;
  });
</script>

<aside
  class="bg-secondary-100-900 flex w-full items-center justify-center gap-2 px-4 py-2 text-sm [view-transition-name:top-banner]"
  id="top-banner"
  aria-label="Beta"
>
  <div
    class="flex min-w-0 flex-wrap items-center gap-x-4 gap-y-1 max-md:justify-start md:justify-center"
  >
    <p class="flex items-center gap-1 font-bold">
      <FlaskConicalIcon
        class="icon-sm relative -top-[1px] shrink-0"
        aria-hidden="true"
      />
      Beta <span class="max-sm:hidden">Preview</span>
    </p>
    <div class="flex flex-wrap items-center gap-x-4 gap-y-1">
      <a href={resolve('/beta')} class="link whitespace-nowrap"
        >About <span class="max-sm:hidden">the beta</span></a
      >

      <button
        type="button"
        class="link whitespace-nowrap"
        onclick={() => openBetaFeedback()}>Send feedback</button
      >
      <a
        href="https://temperature-blanket.com"
        target="_blank"
        class="link flex items-center gap-1 whitespace-nowrap"
        >Switch to standard version <ExternalLinkIcon
          class="icon-sm shrink-0"
          aria-hidden="true"
        /></a
      >
    </div>
  </div>
</aside>

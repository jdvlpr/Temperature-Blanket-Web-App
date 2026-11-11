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

<!-- After launch the beta's address (next.temperature-blanket.com) answers with
the main site's build for a few weeks. This strip, in BetaBanner's place, says
version 7 is now at the main site, goes to the same page on the main site and moves the projects
saved only in this browser there (modals/MoveToMainSite.svelte). It can't be
dismissed. AppShell shows it only there (onRetiredBeta). Its id, top-banner, is
what the planner's steps scroll past (page-state). -->

<script lang="ts">
  import { page } from '$app/state';
  import MoveToMainSite from '#lib/components/modals/MoveToMainSite.svelte';
  import { MAIN_SITE_ORIGIN } from '#lib/constants/site.js';
  import { dialog } from '#lib/state/page-state.svelte.js';
  import { ExternalLinkIcon, PartyPopperIcon } from '@lucide/svelte';

  const main = MAIN_SITE_ORIGIN ?? 'https://temperature-blanket.com';
  const mainName = new URL(main).host;

  /** The same page on the main site, which has the same pages */
  const samePage = $derived(`${main}${page.url.pathname}${page.url.search}`);

  function openMove() {
    dialog.trigger({
      type: 'component',
      component: { ref: MoveToMainSite },
      options: { title: 'Move My Projects', size: 'small' },
    });
  }
</script>

<svelte:head>
  <!-- Search engines list only the main site -->
  <meta name="robots" content="noindex" />
</svelte:head>

<aside
  class="bg-secondary-100-900 flex w-full items-center justify-center gap-2 px-4 py-2 text-sm [view-transition-name:top-banner]"
  id="top-banner"
  aria-label="Version 7 has moved"
>
  <div
    class="flex min-w-0 flex-wrap items-center gap-x-4 gap-y-1 max-md:justify-start md:justify-center"
  >
    <p class="flex items-center gap-1 font-bold">
      <PartyPopperIcon
        class="icon-sm relative -top-[1px] shrink-0"
        aria-hidden="true"
      />
      Version 7 is now at {mainName}
    </p>
    <div class="flex flex-wrap items-center gap-x-4 gap-y-1">
      <button type="button" class="link whitespace-nowrap" onclick={openMove}
        >Move My Projects</button
      >
      <!-- eslint-disable-next-line svelte/no-navigation-without-resolve -- the main site, another origin -->
      <a href={samePage} class="link flex items-center gap-1 whitespace-nowrap"
        >Go to {mainName}
        <ExternalLinkIcon class="icon-sm shrink-0" aria-hidden="true" /></a
      >
    </div>
  </div>
</aside>

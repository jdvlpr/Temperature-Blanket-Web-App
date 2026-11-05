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

<!-- Opened on the beta's first page of each visit (once a tab) (utils/open-beta-warning.ts)
until "Don't show this again" is ticked: that it's a beta, not for critical
projects yet, that its projects stay separate, and the way back to the same
page on the main site. -->

<script lang="ts">
  import { page } from '$app/state';
  import DialogFooter from '#lib/components/modals/DialogFooter.svelte';
  import {
    BTN_PRIMARY,
    BTN_SECONDARY,
  } from '#lib/constants/class-constants.js';
  import { MAIN_SITE_ORIGIN } from '#lib/constants/site.js';
  import { dialog } from '#lib/state/page-state.svelte.js';
  import { persistedState } from '#lib/storage/preferences.svelte.js';
  import { BETA_WARNING_KEY, mainSitePath } from '#lib/utils/beta-warning.js';
  import { ExternalLinkIcon } from '@lucide/svelte';

  const mainSite = MAIN_SITE_ORIGIN ?? 'https://temperature-blanket.com';
  const mainName = new URL(mainSite).host;
  const href = $derived(mainSite + mainSitePath(page.url.pathname));

  const dismissed = persistedState<boolean>(BETA_WARNING_KEY, false);
</script>

<div class="flex flex-col gap-4 px-4 pt-2 text-left">
  <p>
    This is a preview of the next version of the site. Things may change or
    break, so please don’t use it for critical projects yet.
  </p>
  <p>
    Projects saved here stay on this beta site. They don’t show on {mainName}.
  </p>
  <label class="flex items-center gap-3">
    <input
      type="checkbox"
      class="checkbox shrink-0"
      bind:checked={dismissed.value}
    />
    <span>Don’t show this again</span>
  </label>
  <DialogFooter>
    <!-- eslint-disable svelte/no-navigation-without-resolve -- the main site, another origin -->
    <a {href} class={BTN_SECONDARY}>
      Go to {mainName}
      <ExternalLinkIcon class="icon-sm" aria-hidden="true" />
    </a>
    <!-- eslint-enable svelte/no-navigation-without-resolve -->
    <button type="button" class={BTN_PRIMARY} onclick={() => dialog.close()}
      >Continue to Beta</button
    >
  </DialogFooter>
</div>

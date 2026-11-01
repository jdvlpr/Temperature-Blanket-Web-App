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

<!-- Help text, shown in a help dialog and on its Guides & Help page. Yarn
Sources opens in place in a dialog (Back returns to what was open), and
goes to Data Sources & Credits from the page. -->

<script lang="ts">
  import { dialog } from '#lib/state/page-state.svelte.js';
  import { openYarnSources } from '#lib/utils/open-yarn-sources.js';
</script>

<div class="flex flex-col gap-2">
  <p>
    <span class="font-bold">Link Unavailable</span> means the yarn's own web page,
    where its colors came from, can't be found anymore. The yarn may have been discontinued
    or renamed, or its website may have changed.
  </p>
  <p>
    Its colors are still here, so projects that use it keep working. For a new
    project, you may want a yarn you can still buy.
  </p>
  <p>
    Each yarn's source and the day its colors were found are in
    <a
      href="/documentation/credits#yarn-sources"
      class="link"
      onclick={(event) => {
        if (!dialog.opened || !event.currentTarget.closest('[role="dialog"]'))
          return;
        event.preventDefault();
        openYarnSources({ opener: event.currentTarget });
      }}>Yarn Sources</a
    >.
  </p>
</div>

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

<!-- One line under pages showing yarn colors: they're approximate, Yarn
Sources (the help, in a dialog, with where each yarn's colors came from and
the affiliate and trademark notes) and Data Sources & Credits. `children`
goes first, for the page's own attributions. -->

<script lang="ts">
  import { openYarnSources } from '#lib/utils/open-yarn-sources.js';
  import type { Snippet } from 'svelte';

  let { children }: { children?: Snippet } = $props();
</script>

<p>
  {@render children?.()}
  Colors on screen are approximate.
  <span aria-hidden="true">·</span>
  <button
    type="button"
    class="link"
    aria-haspopup="dialog"
    onclick={(event) => openYarnSources({ opener: event.currentTarget })}
    >Yarn Sources</button
  >
  <span aria-hidden="true">·</span>
  <a href="/documentation/credits" class="link">Data Sources & Credits</a>
</p>

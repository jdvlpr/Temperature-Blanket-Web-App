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

<!-- A guide still being written: points to the reference section that
covers it until then, and holds the ids its sections will
have, so links to them (and old links sent on here) already land. -->

<script lang="ts">
  import { page } from '$app/state';
  import { OLD_ANCHORS, docsHref, docsPageAt } from '#lib/docs/docs-index.js';

  const current = $derived(docsPageAt(page.url.pathname));
  const ids = $derived(
    current
      ? Object.values(OLD_ANCHORS)
          .filter((target) => target.startsWith(`${docsHref(current)}#`))
          .map((target) => target.split('#')[1])
      : [],
  );
</script>

<p class="card preset-tonal-surface p-4">
  This guide is being written.
  {#if current?.until}
    Until it's ready, see <a href={current.until} class="link"
      >the reference page that covers it</a
    >.
  {/if}
</p>

{#each ids as id (id)}
  <span {id}></span>
{/each}

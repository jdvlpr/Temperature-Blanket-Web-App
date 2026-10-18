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

<!-- The end of a guide: the reference pages with every option, by slug, with
their titles and summaries from docs-index.ts (RelatedGuides' twin) -->

<script lang="ts">
  import { REFERENCE, docsHref } from '#lib/docs/docs-index.js';

  let { slugs }: { slugs: string[] } = $props();

  const pages = $derived(
    slugs.flatMap((slug) => REFERENCE.filter((page) => page.slug === slug)),
  );
</script>

<section class="flex flex-col gap-3">
  <h2 id="more-detail" class="text-2xl font-bold">More Detail</h2>
  <ul class="flex flex-col gap-2">
    {#each pages as page (page.slug)}
      <li>
        <a href={docsHref(page)} class="link font-bold">{page.title}</a>
        <span class="opacity-80">: {page.summary}</span>
      </li>
    {/each}
  </ul>
</section>

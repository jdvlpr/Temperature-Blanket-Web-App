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

<!-- The end of a reference page: the guides that go with it, by slug, with
their titles and summaries from docs-index.ts -->

<script lang="ts">
  import { GUIDES, docsHref } from '#lib/docs/docs-index.js';

  let { slugs }: { slugs: string[] } = $props();

  const guides = $derived(
    slugs.flatMap((slug) => GUIDES.filter((guide) => guide.slug === slug)),
  );
</script>

<section class="flex flex-col gap-3">
  <h2 id="related-guides" class="text-2xl font-bold">Related Guides</h2>
  <ul class="flex flex-col gap-2">
    {#each guides as guide (guide.slug)}
      <li>
        <a href={docsHref(guide)} class="link font-bold">{guide.title}</a>
        <span class="opacity-80">: {guide.summary}</span>
      </li>
    {/each}
  </ul>
</section>

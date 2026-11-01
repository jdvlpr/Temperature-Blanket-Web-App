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

<!-- The start of a major version's chapter on What's New: its release post's
picture, date, title and summary, and a link to the whole post -->

<script lang="ts">
  import { ArrowRightIcon } from '@lucide/svelte';
  import type { Release } from './releases.js';

  let { release }: { release: Release } = $props();

  // At noon, so the date is the same day in every time zone
  const date = $derived(
    new Date(`${release.date}T12:00:00`).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'long',
    }),
  );
</script>

<article
  class="card bg-surface-100 dark:bg-surface-900 flex flex-col overflow-hidden"
>
  <img
    src={release.image}
    alt={release.imageAlt}
    class="h-36 w-full object-cover"
    loading="lazy"
  />
  <div class="flex flex-col items-start gap-2 p-4">
    <p class="text-sm opacity-80">Version {release.major} · {date}</p>
    <h2 class="h3 text-gradient">{release.title}</h2>
    <p>{release.summary}</p>
    <a
      href="/whats-new/{release.slug}"
      class="btn preset-filled-primary-500 mt-1"
      >Read the Release Post<ArrowRightIcon /></a
    >
  </div>
</article>

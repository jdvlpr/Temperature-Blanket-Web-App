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

<script lang="ts">
  import { resolve } from '$app/paths';
  import { page } from '$app/state';
  import { PUBLIC_BASE_URL } from '$app/env/public';
  import GalleryProjectCard from '#lib/components/GalleryProjectCard.svelte';
  import { getTitleFromLocationsMeta } from '#lib/utils/project-utils.svelte.js';
  import { decodeHtmlEntities } from '#lib/utils/string-utils.js';
  import type { PageData } from './$types';

  let { data }: { data: PageData } = $props();

  let heading = $derived(`Projects by ${data.name}`);
</script>

<svelte:head>
  <title>Gallery: {heading}</title>
  <meta name="description" content="Temperature blanket {heading}" />
  <meta property="og:title" content="Gallery: {heading}" />
  <meta
    property="og:url"
    content="{PUBLIC_BASE_URL}/gallery/by/{page.params.ownerId}"
  />
  <meta property="og:type" content="website" />
</svelte:head>

{#if data.projects === null}
  <p class="my-8 text-center" role="alert">
    The gallery couldn’t be reached. Try again later.
  </p>
{:else if !data.projects.length}
  <p class="my-8 text-center">No projects yet.</p>
{:else}
  <ul
    class="grid w-full grid-cols-2 items-start justify-center gap-2 px-2 md:grid-cols-3 xl:grid-cols-4"
    aria-label="Projects by {data.name}"
  >
    {#each data.projects as { databaseId, featuredImage, locations, projectName } (databaseId)}
      <li>
        <GalleryProjectCard
          href={resolve('/gallery/[id]', { id: String(databaseId) })}
          image={featuredImage?.node?.mediaDetails.sizes?.[0]?.sourceUrl ||
            featuredImage?.node?.mediaItemUrl}
          name={projectName ? decodeHtmlEntities(projectName) : null}
          placesHtml={getTitleFromLocationsMeta(locations)}
        />
      </li>
    {/each}
  </ul>
{/if}

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

<!--
  The projects in one region, shown inside an expanded row of the places panel.

  This was previously a floating popup mounted imperatively into a globe.gl
  htmlElements layer, which meant anchoring an overlay to a spinning sphere.
  Living in the panel removes that problem entirely; what carries over is the
  markup, because project titles are user-submitted and Svelte's escaping is
  what keeps them from being interpreted as HTML.
-->

<script lang="ts">
  import type { GlobeRegion } from './globe-utils';

  interface Props {
    region: GlobeRegion;
  }

  let { region }: Props = $props();
</script>

<ul class="flex flex-col gap-1 pt-1 pb-2 pl-7">
  {#each region.projects as project (project.id)}
    <li>
      <!-- A real link rather than a button + goto: SvelteKit still handles it
           client-side, and middle-click / open-in-new-tab work as expected. -->
      <a
        href="/gallery/{project.id}"
        class="hover:bg-surface-200-800 flex items-start gap-2 rounded p-1 transition-colors"
      >
        {#if project.image}
          <img
            src={project.image}
            alt=""
            loading="lazy"
            class="border-surface-300-700 size-14 shrink-0 rounded border object-cover"
          />
        {/if}
        <span class="line-clamp-3 text-xs leading-tight font-medium">
          {project.title}
        </span>
      </a>
    </li>
  {/each}
</ul>

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

<!-- The page's sections, the one being read marked with a line beside it:
beside the page on wide screens, and at the top of the Contents sheet. -->

<script lang="ts">
  import { onThisPage } from '#lib/docs/on-this-page.svelte.js';

  let {
    heading = 'On this page',
    onNavigate,
  }: { heading?: string; onNavigate?: () => void } = $props();
</script>

{#if onThisPage.sections.length}
  <nav aria-label="On this page" class="flex flex-col gap-1 text-sm">
    <h2 class="px-3 font-bold opacity-80">{heading}</h2>
    <ul class="border-surface-200-800 flex flex-col border-l-2">
      {#each onThisPage.sections as section (section.id)}
        {@const current = onThisPage.current === section.id}
        <li>
          <a
            href="#{section.id}"
            class={[
              '-ml-0.5 block border-l-2 py-1 pr-2 transition-colors',
              section.level === 3 ? 'pl-6' : 'pl-3',
              current
                ? 'border-primary-500 font-bold'
                : 'border-transparent opacity-80 hover:opacity-100',
            ]}
            aria-current={current ? 'location' : undefined}
            onclick={onNavigate}>{section.text}</a
          >
        </li>
      {/each}
    </ul>
  </nav>
{/if}

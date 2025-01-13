<!-- Copyright (c) 2024, Thomas (https://github.com/jdvlpr)

This file is part of Temperature-Blanket-Web-App.

Temperature-Blanket-Web-App is free software: you can redistribute it and/or modify it
under the terms of the GNU General Public License as published by the Free Software Foundation, 
either version 3 of the License, or (at your option) any later version.

Temperature-Blanket-Web-App is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; 
without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. 
See the GNU General Public License for more details.

You should have received a copy of the GNU General Public License along with Temperature-Blanket-Web-App. 
If not, see <https://www.gnu.org/licenses/>. -->

<script>
  import { pageSections } from '$lib/state';

  /**
   * @typedef {Object} Props
   * @property {string} [title]
   * @property {number} [sectionIndex]
   * @property {import('svelte').Snippet} [description]
   */

  /** @type {Props} */
  let { title = '', sectionIndex = 0, description } = $props();

  let pinned = $derived(
    pageSections.items.find((section) => section.index === sectionIndex)
      ?.pinned,
  );
</script>

<div data-pinned={pinned}></div>
{#if title || description}
  <div class="bg-surface-200-700-token text-token p-4">
    {#if title}
      <p class="font-bold text-lg">{title}</p>
    {/if}
    {#if description}
      <div>
        {@render description?.()}
      </div>
    {/if}
  </div>
{/if}

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
  import { goToProjectSection } from '$lib/utils';

  /**
   * @typedef {Object} Props
   * @property {number} [thisSectionIndex]
   */

  /** @type {Props} */
  let { thisSectionIndex = 1 } = $props();

  let previousSectionIndex = thisSectionIndex > 1 ? thisSectionIndex - 1 : null;
  let previousSectionTitle = pageSections.items.find(
    (section) => section.index === previousSectionIndex,
  )?.title;
  let nextSectionIndex = thisSectionIndex < 4 ? thisSectionIndex + 1 : null;
  let nextSectionTitle = pageSections.items.find(
    (section) => section.index === nextSectionIndex,
  )?.title;
</script>

<div
  class="flex flex-wrap justify-between items-center mb-4 mx-2 sm:mx-4 xl:mx-0 mt-2 lg:mt-4 gap-y-2"
>
  {#if previousSectionIndex}
    <button
      class="btn preset-tonal-tertiary base-font-color"
      onclick={() => goToProjectSection(previousSectionIndex)}
    >
      <span class="flex gap-2 items-center">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          stroke-width="1.5"
          stroke="currentColor"
          class="w-6 h-6"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            d="M11.25 9l-3 3m0 0l3 3m-3-3h7.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        {previousSectionTitle}
      </span>
    </button>
  {:else}
    <div></div>
  {/if}
  {#if nextSectionIndex}
    <button
      class="btn preset-tonal-tertiary base-font-color"
      onclick={() => goToProjectSection(nextSectionIndex)}
    >
      <span class="flex gap-2 items-center">
        {nextSectionTitle}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          stroke-width="1.5"
          stroke="currentColor"
          class="w-6 h-6"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            d="M12.75 15l3-3m0 0l-3-3m3 3h-7.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      </span>
    </button>
  {:else}
    <div></div>
  {/if}
</div>

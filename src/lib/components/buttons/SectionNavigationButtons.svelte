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
  import { ArrowLeftIcon, ArrowRightIcon } from '@lucide/svelte';

  /**
   * @typedef {Object} Props
   * @property {number} [thisSectionIndex]
   */

  /** @type {Props} */
  let { thisSectionIndex = 1 } = $props();

  let previousSectionIndex = $derived(
    thisSectionIndex > 1 ? thisSectionIndex - 1 : null,
  );
  let previousSectionTitle = $derived(
    pageSections.items.find((section) => section.index === previousSectionIndex)
      ?.title,
  );
  let nextSectionIndex = $derived(
    thisSectionIndex < 4 ? thisSectionIndex + 1 : null,
  );
  let nextSectionTitle = $derived(
    pageSections.items.find((section) => section.index === nextSectionIndex)
      ?.title,
  );
</script>

<div class="mx-2 my-4 flex flex-wrap items-center justify-between gap-y-2">
  {#if previousSectionIndex}
    <button
      class="btn preset-tonal-tertiary shadow-sm"
      onclick={() => goToProjectSection(previousSectionIndex)}
    >
      <ArrowLeftIcon />
      {previousSectionTitle}
    </button>
  {:else}
    <div></div>
  {/if}
  {#if nextSectionIndex}
    <button
      class="btn preset-tonal-tertiary shadow-sm"
      onclick={() => goToProjectSection(nextSectionIndex)}
    >
      {nextSectionTitle}
      <ArrowRightIcon />
    </button>
  {:else}
    <div></div>
  {/if}
</div>

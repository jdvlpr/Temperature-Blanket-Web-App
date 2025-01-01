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
  import RowsPerPage from '$lib/components/datatable/RowsPerPage.svelte';
  import Search from '$lib/components/datatable/Search.svelte';
  import { weather, weatherGrouping } from '$lib/stores';
  import { dateToISO8601String } from '$lib/utils';

  /**
   * @typedef {Object} Props
   * @property {any} handler
   * @property {boolean} [search]
   * @property {boolean} [hidePageLabel]
   * @property {import('svelte').Snippet} [children]
   */

  /** @type {Props} */
  let { handler, search = true, hidePageLabel = false, children } = $props();

  let element = $state();

  const triggerChange = handler.getTriggerChange();

  const scrollTop = () => {
    if (typeof element !== 'undefined') element.scrollTop = 0;
  };

  const rowCount = handler.getRowCount();
  const pageNumber = handler.getPageNumber();
  const pageCount = handler.getPageCount();
  const rowsPerPage = handler.getRowsPerPage();
  const pages = handler.getPages({ ellipsis: false });
  const sorted = handler.getSorted();

  $effect(() => {
    $triggerChange, scrollTop();
  });

  function getFrom({ page }) {
    let from = '';
    if (
      $sorted.identifier === 'date' ||
      $sorted.identifier === 'row' ||
      $sorted.identifier === null
    ) {
      if ($sorted.direction === 'asc' || $sorted.direction === null)
        from = `(${dateToISO8601String($weather[page * $rowsPerPage - $rowsPerPage].date)})`;
      else
        from = `(${dateToISO8601String($weather[$weather?.length - 1 - (page * $rowsPerPage - $rowsPerPage)].date)})`;
    }
    return from;
  }
</script>

<section class="relative w-full">
  <article class="relative overflow-x-scroll" bind:this={element}>
    {@render children?.()}
  </article>
  <div
    class="flex flex-wrap gap-x-8 gap-y-4 justify-center sm:justify-between items-start mt-2 mb-4 w-full mx-auto"
  >
    <p class="text-sm">
      {#if $rowCount.total > 0}
        Showing {$rowCount.start} to {$rowCount.end} of {$rowCount.total}
        {$weatherGrouping}s
      {:else}
        No {$weatherGrouping}s found
      {/if}
    </p>
    <div class="flex flex-wrap gap-4 items-end justify-center">
      {#if $pageCount > 1 || $rowsPerPage !== 10}
        <RowsPerPage {handler} />
      {/if}
      {#if $pageCount > 1}
        <section class="flex flex-wrap items-end gap-2">
          <button
            aria-label="Previous Page"
            class="btn-icon bg-secondary-hover-token"
            title="Previous Page"
            disabled={$pageNumber === 1}
            onclick={() => handler.setPage('previous')}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke-width="1.5"
              stroke="currentColor"
              class="w-6 h-6"
              ><path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M11.25 9l-3 3m0 0l3 3m-3-3h7.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              /></svg
            >
          </button>
          <label class="label flex flex-col items-start">
            <span class="text-sm">Page</span>
            <select
              class="select"
              id="datatable-page"
              bind:value={$pageNumber}
              onchange={() => {
                handler.setPage($pageNumber);
              }}
            >
              {#each $pages as page}
                {@const from = getFrom({
                  page,
                })}
                <option value={page}
                  >{page}
                  {#if !hidePageLabel}
                    {from}
                  {/if}
                </option>
              {/each}
            </select>
          </label>

          <button
            aria-label="Next Page"
            class="btn-icon bg-secondary-hover-token"
            title="Next Page"
            disabled={$pageNumber === $pageCount}
            onclick={() => handler.setPage('next')}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke-width="1.5"
              stroke="currentColor"
              class="w-6 h-6"
              ><path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M12.75 15l3-3m0 0l-3-3m3 3h-7.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              /></svg
            >
          </button>
        </section>
      {/if}
    </div>
    {#if search}
      <Search {handler} />
    {/if}
  </div>
</section>

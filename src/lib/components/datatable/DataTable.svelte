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

<script lang="ts">
  import RowsPerPage from '$lib/components/datatable/RowsPerPage.svelte';
  import { weather } from '$lib/state';
  import { CircleArrowLeftIcon, CircleArrowRightIcon } from '@lucide/svelte';
  import type { TableHandler } from '@vincjo/datatables';
  import { onMount, type Snippet } from 'svelte';

  interface Props {
    table: TableHandler;
    search?: boolean;
    hidePageLabel?: boolean;
    children: Snippet;
  }

  let { table = $bindable(), search = true, children }: Props = $props();

  let searchInput = $state(null);

  $effect(() => {
    table;
    searchInput = table.createSearch();
  });
</script>

<section class="relative w-full">
  <article class="relative overflow-x-scroll">
    {@render children?.()}
  </article>

  <div
    class="mx-auto mt-2 mb-4 flex w-full flex-wrap items-start justify-center gap-4 sm:justify-between"
  >
    <p class="text-sm">
      {#if table.rowCount.total > 0}
        Showing {table.rowCount.start} to {table.rowCount.end} of {table
          .rowCount.total}
        {weather.grouping}s
      {:else}
        No {weather.grouping}s found
      {/if}
    </p>

    <div
      class="flex flex-auto flex-wrap items-end justify-between gap-x-8 gap-y-2 max-sm:w-full sm:justify-center"
    >
      {#if table.pageCount > 1 || table.rowsPerPage !== 10}
        <RowsPerPage {table} />
      {/if}
      {#if table.pageCount > 1}
        <section class="flex flex-wrap items-end justify-end gap-2">
          <button
            aria-label="Previous Page"
            class="btn-icon hover:preset-tonal"
            title="Previous Page"
            disabled={table.currentPage === 1}
            onclick={() => table.setPage('previous')}
          >
            <CircleArrowLeftIcon />
          </button>

          <label class="label flex w-20 flex-col items-start">
            <span class="text-sm">Page</span>
            <select
              class="select mx-auto w-fit min-w-[60px]"
              id="datatable-page"
              bind:value={table.currentPage}
              onchange={() => {
                table.setPage(table.currentPage);
                weather.table.page = table.currentPage;
              }}
            >
              {#each table.pages as page}
                <option value={page}>{page} </option>
              {/each}
            </select>
          </label>

          <button
            aria-label="Next Page"
            class="btn-icon hover:preset-tonal"
            title="Next Page"
            disabled={table.currentPage === table.pages.length}
            onclick={() => table.setPage('next')}
          >
            <CircleArrowRightIcon />
          </button>
        </section>
      {/if}
    </div>
    {#if search && searchInput !== null}
      <input
        type="text"
        class="input w-full sm:max-w-[200px]"
        bind:value={searchInput.value}
        placeholder="Search weather data..."
        oninput={() => searchInput.set()}
      />
    {/if}
  </div>
</section>

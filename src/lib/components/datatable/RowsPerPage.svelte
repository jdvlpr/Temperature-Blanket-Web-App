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
  import type { TableHandler } from '@vincjo/datatables';

  interface Props {
    table: TableHandler;
  }

  let { table }: Props = $props();

  const options = createOptions(table.rowCount.total);
  function createOptions(totalCount) {
    if (totalCount < 10) return [10];
    if (totalCount < 50) return [10, totalCount];
    if (totalCount < 190) return [10, 50, totalCount];
    return [10, 50, 190, totalCount];
  }
</script>

<label class="label flex flex-col items-start">
  <span class="text-sm">Rows Per Page</span>
  <select
    class="select"
    bind:value={table.rowsPerPage}
    id="rows-per-page"
    title="Choose how many rows per page"
    onchange={() => {
      if (table.currentPage > table.pages.length) table.setPage(1);
    }}
  >
    {#each options as option}
      <option value={option}>
        {option}
      </option>
    {/each}
  </select>
</label>

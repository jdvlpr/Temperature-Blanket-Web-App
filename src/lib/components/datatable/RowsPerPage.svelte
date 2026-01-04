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
  import { weather } from '$lib/state';
  import type { TableHandler } from '@vincjo/datatables';

  interface Props {
    table: TableHandler;
  }

  let { table }: Props = $props();

  const options = $derived.by(() => {
    const totalCount = table.rowCount.total;
     if (totalCount < 10) return [10];
    if (totalCount < 50) return [10, totalCount];
    if (totalCount < 190) return [10, 50, totalCount];
    return [10, 50, 190, totalCount];
  });
  
</script>

<label class="label flex flex-col items-start w-24">
  <span class="text-sm">Rows Per Page</span>
  <select
    class="select"
    value={table.rowsPerPage}
    id="rows-per-page"
    title="Choose how many rows per page"
    onchange={(e) => {
      weather.table.rowsPerPage = +e.target.value;
      table.setRowsPerPage(+e.target.value);

      if (table.currentPage > table.pages.length) {
        weather.table.page = 1;
        table.setPage(1);
      }
    }}
  >
    {#each options as option}
      <option value={option}>
        {option}
      </option>
    {/each}
  </select>
</label>

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
  import { KEYBOARD_SHORTCUTS } from '$lib/constants';
</script>

<div>
  <h2 class="font-bold my-2 text-2xl">Keyboard Shortcuts</h2>

  {#each KEYBOARD_SHORTCUTS as { group, items, details }}
    <p class="mt-2 font-bold text-xl">{group}</p>
    <p class="mb-2 italic">{details}</p>
    <table
      class="table-auto m-auto border border-surface-300-700 py-1 px-2 text-left w-full mb-8"
    >
      <thead class="divide-y border-b border-surface-300-700">
        <tr>
          <th class=" py-0 px-2">Shortcut</th>
          <th class=" py-0 px-2">Description</th>
        </tr>
      </thead>
      <tbody class="divide-y divide-surface-300 dark:divide-surface-600">
        {#each items as { keys, description }}
          <tr>
            <td
              class="py-0 px-2 flex flex-col sm:flex-row sm:flex-wrap justify-start sm:gap-2 items-start sm:items-center gap-0"
            >
              {#each keys as keys, index}
                {#if index > 0}<span class="-my-2">or</span>{/if}
                {@const shortcut =
                  typeof keys === 'object' ? keys.join(' + ') : keys}
                <kbd class="kbd my-2">{shortcut}</kbd>
              {/each}
            </td>
            <td class="py-0 px-2">{description}</td>
          </tr>
        {/each}
      </tbody>
    </table>
  {/each}
  <p class="font-ornament text-5xl mt-8 text-center w-full">O</p>
</div>

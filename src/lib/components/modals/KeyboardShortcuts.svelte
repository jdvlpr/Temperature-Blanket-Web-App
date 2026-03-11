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

<div class="p-4">
  <h2 class="my-2 text-2xl font-bold">Keyboard Shortcuts</h2>

  {#each KEYBOARD_SHORTCUTS as { group, items, details }}
    <p class="mt-2 text-xl font-bold">{group}</p>
    <p class="mb-2 italic">{details}</p>
    <table
      class="border-surface-300-700 m-auto mb-8 w-full table-auto border px-2 py-1 text-left"
    >
      <thead class="border-surface-300-700 divide-y border-b">
        <tr>
          <th class=" px-2 py-0">Shortcut</th>
          <th class=" px-2 py-0">Description</th>
        </tr>
      </thead>
      <tbody class="divide-surface-300 dark:divide-surface-600 divide-y">
        {#each items as { keys, description }}
          <tr>
            <td
              class="flex flex-col items-start justify-start gap-0 px-2 py-0 sm:flex-row sm:flex-wrap sm:items-center sm:gap-2"
            >
              {#each keys as keys, index}
                {#if index > 0}<span class="-my-2">or</span>{/if}
                {@const shortcut =
                  typeof keys === 'object' ? keys.join(' + ') : keys}
                <kbd class="kbd my-2">{shortcut}</kbd>
              {/each}
            </td>
            <td class="px-2 py-0">{description}</td>
          </tr>
        {/each}
      </tbody>
    </table>
  {/each}
</div>

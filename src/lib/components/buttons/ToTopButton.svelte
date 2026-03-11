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
  import { ChevronUpIcon } from '@lucide/svelte';
  import { fade } from 'svelte/transition';

  /**
   * @typedef {Object} Props
   * @property {any} onClick
   * @property {string} [bottom]
   * @property {string} [position]
   */

  /** @type {Props} */
  let { onClick, bottom = '0px', position = 'sticky' } = $props();
</script>

<div
  class="flex w-full justify-end"
  style="bottom:{bottom};position:{position}"
>
  <button
    aria-label="Back to Top"
    transition:fade
    class="btn-icon preset-filled-primary-500 z-20 m-2 inline-flex items-center justify-center p-2 opacity-80 shadow-sm backdrop-blur-xs transition-all"
    onclick={onClick}
  >
    <ChevronUpIcon />
  </button>
</div>

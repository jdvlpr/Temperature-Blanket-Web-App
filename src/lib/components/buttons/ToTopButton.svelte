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
  class="w-full flex justify-end"
  style="bottom:{bottom};position:{position}"
>
  <button
    aria-label="Back to Top"
    transition:fade
    class="btn-icon backdrop-blur-xs p-2 m-2 z-20 shadow-sm preset-filled-primary-500 opacity-80 transition-all inline-flex justify-center items-center"
    onclick={onClick}
  >
    <ChevronUpIcon />
  </button>
</div>

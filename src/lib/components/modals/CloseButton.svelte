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
  /**
   * @typedef {Object} Props
   * @property {any} onClose
   * @property {boolean} [absolute]
   * @property {string} [text]
   */

  /** @type {Props} */
  let { onClose, text = '' } = $props();
</script>

<button
  aria-label="Close"
  class=" {text
    ? 'btn'
    : 'btn-icon'} relative preset-tonal-secondary flex justify-center items-center float-right"
  onclick={onClose}
>
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    stroke-width="1.5"
    stroke="currentColor"
    class="w-5 h-5"
  >
    <path
      stroke-linecap="round"
      stroke-linejoin="round"
      d="M6 18L18 6M6 6l12 12"
    />
  </svg>
  {#if text}
    <span class="font-bold">{text}</span>
  {/if}
</button>

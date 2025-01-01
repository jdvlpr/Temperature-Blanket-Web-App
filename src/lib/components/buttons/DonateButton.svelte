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
  import { PUBLIC_KOFI_LINK } from '$env/static/public';

  /**
   * @typedef {Object} Props
   * @property {boolean} [showlink]
   */

  /** @type {Props} */
  let { showlink = true } = $props();
  let url = new URL(PUBLIC_KOFI_LINK || 'https://kofi.com');
  let linkTitle = url?.hostname + url?.pathname;
</script>

{#if PUBLIC_KOFI_LINK}
  <a
    href={PUBLIC_KOFI_LINK}
    target="_blank"
    rel="noopener noreferrer"
    class="btn variant-soft-primary text-token inline-flex gap-1 justify-center items-center"
  >
    <span class="flex items-center justify-center gap-1">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 20 20"
        fill="currentColor"
        stroke="white"
        class="w-8 h-8 transition-all text-red-400 flex-shrink-0 group-hover:text-red-500"
      >
        <path
          d="M9.653 16.915l-.005-.003-.019-.01a20.759 20.759 0 01-1.162-.682 22.045 22.045 0 01-2.582-1.9C4.045 12.733 2 10.352 2 7.5a4.5 4.5 0 018-2.828A4.5 4.5 0 0118 7.5c0 2.852-2.044 5.233-3.885 6.82a22.049 22.049 0 01-3.744 2.582l-.019.01-.005.003h-.002a.739.739 0 01-.69.001l-.002-.001z"
        />
      </svg>
      <span class="whitespace-pre-wrap text-left"
        >Donate{#if showlink}&nbsp;at <span class="link">{linkTitle}</span
          >{/if}</span
      >
    </span>
  </a>
{/if}

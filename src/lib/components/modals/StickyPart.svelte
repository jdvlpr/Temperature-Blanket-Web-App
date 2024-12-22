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
   * @property {string} [position]
   * @property {import('svelte').Snippet} [children]
   */

  /** @type {Props} */
  let { position = 'top', children } = $props();

  let classPosition = $derived(position === 'top' ? 'top-0' : 'bottom-0');
  let paddingTop = $derived(position === 'top' ? 'pt-2 sm:pt-0' : 'pb-2 sm:pb-0');
</script>

<div
  class="sticky {classPosition} {paddingTop} rounded-br-container-token rounded-bl-container-token z-10 bg-surface-200-700-token px-0 mx-0"
>
  {@render children?.()}
</div>

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
   * @property {string} [unit]
   * @property {string} [duration]
   * @property {string} [size]
   */

  /** @type {Props} */
  let { unit = 'px', duration = '0.7s', size = '30' } = $props();
</script>

<div
  class="circle mx-auto border-y-primary-500 border-r-transparent border-l-primary-500 dark:border-y-primary-500 dark:border-l-primary-500"
  style="--size: {size}{unit}; --duration: {duration}"
></div>

<style>
  .circle {
    height: var(--size);
    width: var(--size);
    border-width: calc(var(--size) / 7);
    border-style: solid;
    border-image: initial;
    border-radius: 50%;
    animation: var(--duration) linear 0s infinite normal none running rotate;
  }
  @keyframes rotate {
    0% {
      transform: rotate(0);
    }
    100% {
      transform: rotate(360deg);
    }
  }
</style>

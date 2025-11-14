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
  import { CircleQuestionMarkIcon } from '@lucide/svelte';

  /**
   * @typedef {Object} Props
   * @property {any} href
   * @property {string} [title]
   * @property {import('svelte').Snippet} [text]
   */

  /** @type {Props} */
  let { href, title = 'Get Help', text } = $props();
</script>

<a
  {href}
  rel="noopener noreferrer"
  target="_blank"
  {title}
  class="relative inline-flex items-end justify-start gap-1 underline"
  class:top-[5px]={!text}
>
  <CircleQuestionMarkIcon class="relative bottom-[2px] size-5" />

  {@render text?.()}
</a>

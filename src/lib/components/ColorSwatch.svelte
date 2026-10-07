<!-- Copyright (c) 2024 - 2026, Thomas (https://github.com/jdvlpr)

This file is part of Temperature-Blanket-Web-App.

Temperature-Blanket-Web-App is free software: you can redistribute it and/or modify it
under the terms of the GNU General Public License as published by the Free Software Foundation,
either version 3 of the License, or (at your option) any later version.

Temperature-Blanket-Web-App is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY;
without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.
See the GNU General Public License for more details.

You should have received a copy of the GNU General Public License along with Temperature-Blanket-Web-App.
If not, see <https://www.gnu.org/licenses/>. -->

<!-- @component
  A color's round swatch in a palette's list or grid, with its number on it.
  It's where View › Fill with color grows from, and it pops when its color
  changes and glows when undo or redo changes it.
-->
<script lang="ts">
  import { iconColorOn } from '$lib/components/yarn-colorways/colorway-utils';

  interface Props {
    hex: string | undefined;
    /** Its number in the palette; without one, the swatch is blank */
    number?: number;
    /** Whether its card or row is filled with its color */
    filled?: boolean;
    pop?: boolean;
    flash?: boolean;
    /** Smaller, as in a pop-up's footer */
    small?: boolean;
  }

  let {
    hex,
    number,
    filled = false,
    pop = false,
    flash = false,
    small = false,
  }: Props = $props();
</script>

<span
  class={[
    'grid shrink-0 place-items-center rounded-full font-semibold shadow-[inset_0_0_0_1px_rgb(0_0_0/0.12)]',
    small ? 'size-9 text-xs' : 'size-12 text-sm',
    filled && 'ring-2 ring-current/40',
    pop && 'feedback-pop',
    flash && 'history-flash',
  ]}
  style:--pop-scale="1.12"
  style:background={hex}
  style:color={iconColorOn(hex ?? '#fff')}
  data-fill-origin
>
  {#if number !== undefined}<span class="sr-only">Color</span> {number}{/if}
</span>

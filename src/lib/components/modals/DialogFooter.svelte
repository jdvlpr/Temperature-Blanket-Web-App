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

<script lang="ts">
  import {
    DIALOG_BUTTONS,
    DIALOG_FOOTER,
  } from '#lib/constants/class-constants.js';
  import type { Snippet } from 'svelte';
  import type { ClassValue } from 'svelte/elements';

  interface Props {
    /** Full-width content shown with the buttons, above them */
    above?: Snippet;
    /** Pinned to the dialog's bottom as its content scrolls */
    sticky?: boolean;
    class?: ClassValue;
    children: Snippet;
  }

  let { above, sticky = true, class: className, children }: Props = $props();
</script>

<div class={[sticky ? DIALOG_FOOTER : 'flex flex-col gap-2', className]}>
  {@render above?.()}
  <div class={DIALOG_BUTTONS}>
    {@render children()}
  </div>
</div>

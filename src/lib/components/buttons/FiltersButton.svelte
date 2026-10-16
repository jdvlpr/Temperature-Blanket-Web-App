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
  The Filters button that shows or hides a list's filter panel (`controls`,
  the panel's id; the page hides it with `hidden={!open}`), with how many
  filters are on. `focus()` is for after a chip removes a filter.
-->
<script lang="ts">
  import { menuTriggerClass } from '#lib/components/menu-styles.js';
  import { ChevronDownIcon, ListFilterIcon } from '@lucide/svelte';

  let {
    open = $bindable(false),
    count = 0,
    controls,
  }: {
    open?: boolean;
    /** Filters on */
    count?: number;
    /** The filter panel's id */
    controls: string;
  } = $props();

  let button = $state<HTMLButtonElement>();

  export function focus() {
    button?.focus();
  }
</script>

<button
  bind:this={button}
  type="button"
  class={menuTriggerClass}
  aria-expanded={open}
  aria-controls={controls}
  onclick={() => (open = !open)}
>
  <ListFilterIcon aria-hidden="true" />
  <span
    >Filters{#if count}<span aria-hidden="true"> · {count}</span><span
        class="sr-only">, {count} on</span
      >{/if}</span
  >
  <ChevronDownIcon
    class={['icon-sm transition-transform', open && 'rotate-180']}
    aria-hidden="true"
  />
</button>

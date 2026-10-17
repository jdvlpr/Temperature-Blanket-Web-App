<!-- Copyright (c) 2026, Thomas (https://github.com/jdvlpr)

This file is part of Temperature-Blanket-Web-App.

Temperature-Blanket-Web-App is free software: you can redistribute it and/or modify it
under the terms of the GNU General Public License as published by the Free Software Foundation,
either version 3 of the License, or (at your option) any later version.

Temperature-Blanket-Web-App is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY;
without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.
See the GNU General Public License for more details.

You should have received a copy of the GNU General Public License along with Temperature-Blanket-Web-App.
If not, see <https://www.gnu.org/licenses/>. -->

<!-- A group of rows in the Project and Palette menus: its small heading, then
its rows (each an <li>) in one boxed list. Without a heading, the list alone,
named for screen readers by `label`. -->

<script lang="ts">
  import { PANEL_LIST } from '#lib/constants/class-constants.js';
  import type { Snippet } from 'svelte';

  let {
    heading,
    label,
    children,
  }: {
    /** Shown above the list */
    heading?: string;
    /** Its name for screen readers when it has no heading */
    label?: string;
    children: Snippet;
  } = $props();

  const id = $props.id();
</script>

{#if heading}
  <section class="flex flex-col gap-2" aria-labelledby={id}>
    <h2 {id} class="text-sm font-bold opacity-70">{heading}</h2>
    <ul class={PANEL_LIST}>{@render children()}</ul>
  </section>
{:else}
  <section aria-label={label}>
    <ul class={PANEL_LIST}>{@render children()}</ul>
  </section>
{/if}

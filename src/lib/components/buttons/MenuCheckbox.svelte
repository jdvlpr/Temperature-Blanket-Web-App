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
  The mark beside a menu item that turns something on or off, drawn like the
  check circles on the Choose Colorways cards: an empty circle when off, so
  it's clear choosing it adds a check, and a circle with a check, in the
  primary color, when on. (Choices of one among several show just a check on
  the chosen one.) The item itself tells screen readers whether it's checked.
-->
<script lang="ts">
  import { CircleCheckIcon, CircleIcon } from '@lucide/svelte';

  let { checked }: { checked: boolean } = $props();
</script>

{#if checked}
  <CircleCheckIcon

    class="shrink-0 size-5"
    aria-hidden="true"
  />
{:else}
  <CircleIcon class="shrink-0 size-5" aria-hidden="true" />
{/if}

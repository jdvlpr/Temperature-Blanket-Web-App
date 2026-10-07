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
  The box beside a menu item that turns something on or off: empty when off,
  so it's clear choosing it adds a check, and filled with a check when on.
  (Choices of one among several show just a check on the chosen one.) The
  item itself tells screen readers whether it's checked.
-->
<script lang="ts">
  import { CheckIcon } from '@lucide/svelte';

  let { checked }: { checked: boolean } = $props();
</script>

<span
  class={[
    'rounded-base grid size-5 shrink-0 place-items-center border-2',
    checked
      ? 'border-primary-500 bg-primary-500 text-primary-contrast-500'
      : 'border-surface-600-400',
  ]}
  aria-hidden="true"
>
  {#if checked}<CheckIcon size={14} strokeWidth={3} />{/if}
</span>

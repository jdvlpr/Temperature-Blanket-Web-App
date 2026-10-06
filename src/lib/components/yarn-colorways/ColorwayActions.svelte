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
  A yarn colorway row's actions: a copy menu (its name or hex code), and a
  note when it's no longer sold. Buying or viewing it is the name's link.
-->
<script lang="ts">
  import type { Color } from '$lib/types/yarn-types';
  import CopyColorwayMenu from './CopyColorwayMenu.svelte';

  interface Props {
    colorway: Color;
  }

  let { colorway }: Props = $props();
</script>

<div class="flex items-center justify-end gap-2">
  {#if colorway.unavailable}
    <p class="text-surface-700-300 text-xs leading-tight">
      No longer available
    </p>
  {/if}
  <CopyColorwayMenu {colorway} variant="labeled" />
</div>

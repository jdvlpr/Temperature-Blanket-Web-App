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

<!-- @component
  A gallery page's details under its picture or palette, the same for projects
  and palettes: a list of GalleryDetail rows, each a label and its value.
-->
<script lang="ts">
  import { PANEL_LIST } from '#lib/constants/class-constants.js';
  import type { Snippet } from 'svelte';

  let { children }: { children: Snippet } = $props();
</script>

<dl class="{PANEL_LIST} mx-auto w-full max-w-2xl text-left">
  {@render children()}
</dl>

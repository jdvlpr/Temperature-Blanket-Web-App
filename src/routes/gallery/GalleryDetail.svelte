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
  One row of GalleryDetails: its label, then its value (beside it on wider
  screens, under it on phones).
-->
<script lang="ts">
  import type { Snippet } from 'svelte';

  let { label, children }: { label: string; children: Snippet } = $props();
</script>

<div class="flex min-h-12 flex-col gap-x-4 gap-y-0.5 px-4 py-2 sm:flex-row">
  <dt class="shrink-0 font-semibold sm:w-32">{label}</dt>
  <dd class="min-w-0 flex-1 break-words">{@render children()}</dd>
</div>

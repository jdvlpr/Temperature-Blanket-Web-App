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

<!-- The Palette menu's Getting Started, as the planner's is the Project
menu's: a short note on making a palette -->

<script lang="ts">
  import { LightbulbIcon } from '@lucide/svelte';
</script>

<div class="mb-4 flex w-full flex-col items-center justify-center gap-4 p-4">
  <p class="flex items-center gap-2 text-2xl font-bold">
    <LightbulbIcon /> Make a Yarn Palette
  </p>

  <p class="text-center">
    Add colors with <strong>Get Colors</strong>: from a photo, a gradient, or
    yarn you search for. Drag to reorder; tap a color to change it or find a
    close yarn.
  </p>

  <p class="text-center">
    <strong>Save Palette</strong> keeps it in My Library, and after that every
    change saves by itself. From the <strong>Palette</strong> menu you can
    download it, share a link, publish it to the gallery, or
    <strong>Start a Project with It</strong> in the Project Planner.
  </p>
</div>

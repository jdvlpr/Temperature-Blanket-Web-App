<!-- Copyright (c) 2024, Thomas (https://github.com/jdvlpr)

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
  import { LightbulbIcon } from '@lucide/svelte';
</script>

<div class="mb-4 flex w-full flex-col items-center justify-center gap-4 p-4">
  <p class="flex items-center gap-2 text-2xl font-bold">
    <LightbulbIcon /> Welcome!
  </p>

  <p class="text-center">
    This Project Planner tool helps crocheters, knitters, and craftspeople to
    visualize designs inspired by the weather. Watch the video below for more
    information.
  </p>

  <div class="w-fit">
    <iframe
      width="560"
      height="315"
      src="https://www.youtube.com/embed/7NRLrpZb0Lo?si=n4fmzlt9_0GKGNad"
      title="YouTube video player"
      frameborder="0"
      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
      referrerpolicy="strict-origin-when-cross-origin"
      allowfullscreen
    ></iframe>
  </div>
</div>

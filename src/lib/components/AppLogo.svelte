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

<script>
  import { PUBLIC_SITE_TITLE } from '$env/static/public';
</script>

<div
  class="flex items-center gap-2 [view-transition-name:app-logo] min-h-[43px] mx-4"
>
  <!-- <img src="/images/icon.png" class="size-8" alt="Logo" /> -->
  <div class="flex">
    <div
      class="flex flex-col rounded-[0.2rem] overflow-hidden gap-[2px] size-8 relative"
    >
      <div class="flex flex-col items-center absolute translate-x-1/2">
        <div class="h-4 w-2 bg-surface-50-950 rounded-t-sm"></div>
        <div
          class="size-4 bg-surface-50-950 rounded-full relative -top-1"
        ></div>
      </div>

      <div class="w-full flex-auto bg-surface-900 dark:bg-surface-50"></div>
      <div
        class="w-full flex-auto bg-surface-900/90 dark:bg-surface-50/90"
      ></div>
      <div
        class="w-full flex-auto bg-surface-900/80 dark:bg-surface-50/80"
      ></div>
      <div
        class="w-full flex-auto bg-surface-900/70 dark:bg-surface-50/70"
      ></div>
      <div
        class="w-full flex-auto bg-surface-900/60 dark:bg-surface-50/60"
      ></div>
      <div
        class="w-full flex-auto bg-surface-900/50 dark:bg-surface-50/50"
      ></div>
      <div
        class="w-full flex-auto bg-surface-900/40 dark:bg-surface-50/40"
      ></div>
    </div>
  </div>
  <h1 class="h5 site-title">{PUBLIC_SITE_TITLE}</h1>
</div>

<style>
  .site-title {
    font-variation-settings:
      'opsz' 28,
      'wght' 400,
      'SOFT' 10,
      'WONK' 0 !important;
  }
</style>

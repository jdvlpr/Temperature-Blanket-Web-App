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

<div class="[view-transition-name:app-logo]">
  <div class="flex items-center gap-2 mx-4">
    <div class="rounded-[0.2rem] overflow-hidden shrink-0">
      <div class="flex flex-col items-center size-8 relative">
        <div class="flex flex-col items-center absolute">
          <div class="h-4 w-2 bg-surface-50-950 rounded-t-sm"></div>
          <div
            class="size-4 bg-surface-50-950 rounded-full relative -top-1"
          ></div>
        </div>

        <div class="w-full flex-auto bg-amber-400"></div>
        <div class="w-full flex-auto bg-rose-400"></div>
        <div class="w-full flex-auto bg-blue-400"></div>
      </div>
    </div>
    <h5 class="h5 text-surface-700 dark:text-surface-100 leading-tight">
      {PUBLIC_SITE_TITLE}
    </h5>
  </div>
</div>

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
  import { goto } from '$app/navigation';
  import { page } from '$app/state';
  import { PUBLIC_SITE_TITLE } from '$env/static/public';
  import { modal } from '$lib/state';
</script>

<button
  class="[view-transition-name:app-logo]"
  onclick={() => {
    modal.close();
    if (page.url.pathname !== '/') goto('/');
    else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }}
>
  <div class="flex items-center gap-2 mx-4">
    <div class="rounded-[0.2rem] overflow-hidden shrink-0 shadow">
      <div class="flex flex-col items-center size-8 relative">
        <div class="flex flex-col items-center absolute">
          <div class="h-4 w-2 bg-surface-50 dark:bg-surface-950"></div>
          <div
            class="size-4 bg-surface-50 dark:bg-surface-950 rounded-full relative -top-1"
          ></div>
        </div>
        <!-- These are yarn colorways from the year's most popular project as of March, 2025: /gallery/14729 -->
        <div
          class="w-full flex-auto bg-gradient-to-r from-[#e77e79]/90 to-[#e77e79]"
        ></div>

        <div
          class="w-full flex-auto bg-gradient-to-r from-[#f3d488]/90 to-[#f3d488]"
        ></div>
        <div
          class="w-full flex-auto bg-gradient-to-r from-[#789fb8]/90 to-[#789fb8]"
        ></div>
        <div
          class="w-full flex-auto bg-gradient-to-r from-[#295d7d]/90 to-[#295d7d]"
        ></div>
      </div>
    </div>
    <h5 class="h5 text-surface-700 dark:text-surface-100 leading-tight">
      {PUBLIC_SITE_TITLE}
    </h5>
  </div>
</button>

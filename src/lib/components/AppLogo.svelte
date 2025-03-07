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
  <div class="flex items-center gap-2 mx-6 lg:mx-4">
    <img
      src="/images/temperature-blanket-com-logo.png"
      alt="Temperature Blanket Logo"
      class="h-10"
    />
    <h5 class="h5 text-surface-700 dark:text-surface-100 leading-tight">
      {PUBLIC_SITE_TITLE}
    </h5>
  </div>
</button>

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

<!-- Help text, shown in a help dialog and on its Guides & Help page: weather
is kept (a saved project, a gallery page's copy) or searched (a link) -->

<div class="flex flex-col gap-2">
  <p>
    Saved projects keep their weather, and so do copies opened from a gallery
    page. Their days only change when you choose
    <span class="font-bold">Only New Days</span> or
    <span class="font-bold">Search Again</span>.
  </p>
  <p>
    A link holds a project's settings but not its weather, so you search for it
    after opening one. Weather sources sometimes update past days, mostly recent
    ones, so they can come out a little different.
  </p>
  {#if __ACCOUNTS_ENABLED__}
    <p>
      To share a project with its weather, share its gallery page. Copy Link
      includes the weather too, while your gallery page is up to date.
    </p>
  {/if}
</div>

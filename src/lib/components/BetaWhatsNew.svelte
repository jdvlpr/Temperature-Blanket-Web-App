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

<!-- The beta's few highlights of what's new, shared by the beta warning
(modals/BetaWarning.svelte) and About the Beta (/beta), so they say the same.
The whole story is the Version 7 post (whats-new/version-7). -->

<ul class="list-disc space-y-1 pl-6 text-left">
  {#if __ACCOUNTS_ENABLED__}
    <li>
      <strong>Accounts:</strong> sign in with Google to keep your projects, palettes
      and preferences on every device.
    </li>
  {/if}
  <li>
    <strong>My Library:</strong> everything you’ve saved, in one place. {#if __ACCOUNTS_ENABLED__}
      Star other people’s gallery pages to find them again there.{/if}
  </li>
  {#if __ACCOUNTS_ENABLED__}
    <li>
      <strong>Gallery pages you can update:</strong> one page per project or palette,
      keeping its link and views.
    </li>
    <li>
      <strong>Post to Ravelry:</strong> add a project to your Ravelry projects with
      its preview, yarns and photos.
    </li>
  {/if}
</ul>

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

<!-- Help text, shown in a help dialog and on its Guides & Help page -->

<div class="flex flex-col gap-2">
  <p>
    A saved project opens with the weather it was saved with. Its days never
    change unless you choose to change them.
  </p>
  <ul class="ml-6 list-disc space-y-1">
    <li>
      <span class="font-bold">Get New Days</span> adds the days since you last got
      its weather, for a project that's still going.
    </li>
    <li>
      <span class="font-bold">Search Again</span> gets every day again. New days are
      added, and if any saved day's weather is different now, you choose which to
      keep.
    </li>
    <li>
      The newest days are early data at first, and weather sources can update
      them for about a week. Once they've settled, Search Again lets you check
      them.
    </li>
  </ul>
  <p>
    A link doesn't hold weather (see <a
      href="/documentation/weather#link-weather"
      class="link">Weather and Links</a
    >). A gallery page keeps the weather it was published with.
  </p>
</div>

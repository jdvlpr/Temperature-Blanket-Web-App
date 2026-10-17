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

<!-- Help text, shown in a help dialog and on its Guides & Help page. Only the
Rows pattern has Seasons (rows/Settings.svelte); days in no season get the
extras color, and the first season that includes a day wins
(getSeasonForDate). -->

<div class="flex flex-col gap-2">
  <p>
    Seasons color each row by different weather at different times of year: say,
    high temperatures in spring and summer, and low temperatures in fall and
    winter.
  </p>
  <ol class="ml-6 list-decimal space-y-1">
    <li>
      In the preview's settings, turn on <span class="font-bold">Seasons</span>.
      It's there for the Rows pattern.
    </li>
    <li>Choose the weather for each season.</li>
    <li>
      To change when a season starts and ends, press its name, then pick a
      preset or set your own dates.
    </li>
  </ol>
  <p>
    A day that isn't in any season uses the
    <span class="font-bold">Accent Color</span>. If seasons overlap, a day takes
    the first one it's in: spring, then summer, fall, winter.
  </p>
  <p>
    Seasons are new (in beta). If something doesn't work as you expect, please
    <a href="/contact" class="link">let me know</a>.
  </p>
</div>

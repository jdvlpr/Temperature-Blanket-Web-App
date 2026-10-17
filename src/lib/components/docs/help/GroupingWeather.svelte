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
    Use the weather of each day, or group the days into weeks for a shorter
    project.
  </p>
  <ul class="ml-6 list-disc space-y-1">
    <li>
      <span class="font-bold">Daily:</span> one row or square for each day.
    </li>
    <li>
      <span class="font-bold">Weekly:</span> one for each week, starting on the
      day chosen in <span class="font-bold">Weeks Start On</span>. Each week
      has:
      <ul class="mt-1 ml-6 list-disc space-y-1">
        <li>the highest high temperature of its days,</li>
        <li>the average of their average temperatures,</li>
        <li>the lowest low temperature,</li>
        <li>all their rain and snow added together,</li>
        <li>and their average daylight.</li>
      </ul>
    </li>
  </ul>
  <p>
    The averages shown above the weather chart can be a little different for
    daily and weekly weather. That's expected: they're worked out from days in
    one case and from weeks in the other.
  </p>
</div>

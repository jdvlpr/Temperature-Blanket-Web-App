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
    <span class="font-bold">Error: Mixed Parameters</span> shows under the snow when
    your locations get their weather from different sources. Meteostat measures how
    deep the snow is, and Open-Meteo measures how much fell, so the snow totals mix
    two different things and won't be accurate.
  </p>
  <p>
    To fix it, choose <span class="font-bold">Open-Meteo</span> as the weather source
    for every location. You can keep the mix if you like; just know the snow numbers
    don't mean the same thing for every location.
  </p>
</div>

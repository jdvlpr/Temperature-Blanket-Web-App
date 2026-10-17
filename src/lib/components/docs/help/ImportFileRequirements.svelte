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

<!-- Help text, shown in a help dialog and on its Guides & Help page. The
headings are the ones ImportWeatherData reads. -->

<div class="flex flex-col gap-2">
  <p>
    The easiest way: download your project's weather as a spreadsheet (CSV),
    change it, and import it back. Choose
    <span class="font-bold">Daily</span> weather before downloading: a weekly download
    has a Week Of column instead of Date, which can't be imported. Any CSV file works,
    though, if its first row has these headings.
  </p>
  <p class="font-bold">Always:</p>
  <ul class="ml-6 list-disc space-y-1">
    <li>
      <span class="font-bold">Date</span>: written like 2026-03-10. Dates
      outside your project's dates are left out.
    </li>
    <li>
      <span class="font-bold">Location Index</span>: 0 for your first location,
      1 for the second, and so on. With one location, it's always 0.
    </li>
  </ul>
  <p class="font-bold">Then any of these, in either units:</p>
  <ul class="ml-6 list-disc space-y-1">
    <li>High Temperature (°F) or High Temperature (°C)</li>
    <li>Average Temperature (°F) or Average Temperature (°C)</li>
    <li>Low Temperature (°F) or Low Temperature (°C)</li>
    <li>Rain (in) or Rain (mm)</li>
    <li>Snow (in) or Snow (mm)</li>
    <li>Daytime (h:m), as hours:minutes (08:12 is 8 hours 12 minutes)</li>
  </ul>
  <p>
    Type the headings exactly, with the spaces, brackets and symbols. Weather
    without a column in your file stays as it is. In the columns you include,
    leave no cell empty: an empty cell is read as 0. Save the file as UTF-8 if
    your spreadsheet app asks.
  </p>
  <img
    src="/images/documentation/csv-file-requirements.png"
    alt="An example spreadsheet with the columns Date, Location Index, High Temperature (°F), Average Temperature (°F) and Low Temperature (°F): one row for each day from 2022-01-01 to 2022-01-10, all with location index 0."
    class="rounded-container w-full"
    loading="lazy"
  />
</div>

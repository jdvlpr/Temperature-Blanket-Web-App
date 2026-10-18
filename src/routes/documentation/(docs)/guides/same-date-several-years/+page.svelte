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

<!-- The Same Date Across Several Years (from the FAQ's "specific date over
multiple years"): one location per year, each a Custom single day (From =
To counts as 1 day, location-state). A new location starts empty
(locations.add), so the place is chosen again each time. -->

<script lang="ts">
  import DocsShot from '#lib/components/docs/DocsShot.svelte';
  import RelatedReference from '#lib/components/docs/RelatedReference.svelte';
  import { MAXIMUM_LOCATIONS } from '#lib/constants/location-constants.js';
</script>

<p>
  A birthday in every year since someone was born, or your wedding day in each
  year since: one row or square for the same date, year after year. The Project
  Planner wasn't made for this, so it takes some setting up, but it works.
</p>

<section class="flex flex-col gap-3">
  <h2 id="what-you-need" class="text-2xl font-bold">What You Need</h2>
  <ul class="ml-6 list-disc space-y-1">
    <li>The place, and the date.</li>
    <li>
      The years: up to {MAXIMUM_LOCATIONS}, since each year is its own location.
      Weather goes back to 1940.
    </li>
    <li>
      Some patience. Each year is set up by hand, and searching for many of them
      takes a while.
    </li>
  </ul>
</section>

<section class="flex flex-col gap-3">
  <h2 id="set-up-the-years" class="text-2xl font-bold">Set Up the Years</h2>
  <ol class="ml-6 list-decimal space-y-1">
    <li>Choose your place from the list, as usual.</li>
    <li>
      Set <span class="font-bold">Duration</span> to
      <span class="font-bold">Custom</span>.
    </li>
    <li>
      Set both <span class="font-bold">From</span> and
      <span class="font-bold">To</span> to the date in the first year, like
      March 10, 1985. It shows <span class="font-bold">1 Day</span>.
    </li>
    <li>
      Press <span class="font-bold">Add Location</span>. A new, empty location
      appears below.
    </li>
    <li>
      Choose the same place again, set it to <span class="font-bold"
        >Custom</span
      >, and set From and To to the same date in the next year.
    </li>
    <li>
      Repeat for every year, then press <span class="font-bold">Search</span>.
    </li>
  </ol>
  <DocsShot
    src="same-date-several-years/locations"
    alt="Three locations in the Project Planner, all London, England, United Kingdom, each with Duration Custom and From and To on the same day: 2023-03-10, 2024-03-10 and 2025-03-10, each 1 Day. Below them, Search Again, 3 Total Days and Add Location."
    caption="March 10, three years in a row."
  />
  <p>
    The years come one after the other in the order you added them, so add the
    earliest first.
  </p>
</section>

<section class="flex flex-col gap-3">
  <h2 id="save-it" class="text-2xl font-bold">Save It Straight Away</h2>
  <p>
    Press <span class="font-bold">Project</span>, then
    <span class="font-bold">Save Project</span>, so you never have to set up the
    years again. Then choose your colors and preview as with any project.
  </p>
  <p>
    A short project is a good fit for patterns made of pieces: try
    <span class="font-bold">Squares</span> or
    <span class="font-bold">Hexagons</span> for one square or hexagon a year.
  </p>
</section>

<section class="flex flex-col gap-3">
  <h2 id="if-something-goes-wrong" class="text-2xl font-bold">
    If Something Goes Wrong
  </h2>
  <h3 class="text-lg font-bold">A year is missing in the middle</h3>
  <p>
    Locations can't be reordered. Remove the ones after the gap (⋮, then
    <span class="font-bold">Remove Location</span>) and add them again in order,
    or leave it: a blanket of dates doesn't have to be in order.
  </p>
  <h3 class="text-lg font-bold">Searching is slow, or fails</h3>
  <p>
    Each year is a separate search. Give it time, and if it fails, press
    <span class="font-bold">Search Again</span> in a few minutes.
  </p>
  <h3 class="text-lg font-bold">An early year has no weather</h3>
  <p>
    Weather starts in 1940, and Meteostat often starts later. Use
    <span class="font-bold">Open-Meteo</span> in
    <span class="font-bold">Weather Source</span>.
  </p>
</section>

<RelatedReference slugs={['location-and-dates', 'weather', 'preview']} />

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

<!-- Location & Dates: Location.svelte, Locations.svelte, location-state.
Section ids are the old single page's (OLD_ANCHORS). -->

<script lang="ts">
  import DocsShot from '#lib/components/docs/DocsShot.svelte';
  import RelatedGuides from '#lib/components/docs/RelatedGuides.svelte';
  import {
    MAXIMUM_DAYS_PER_LOCATION,
    MAXIMUM_LOCATIONS,
  } from '#lib/constants/location-constants.js';
</script>

<p>
  Every project starts with a place and the dates your blanket covers. They're
  at the top of the Project Planner. Once they're set, press
  <span class="font-bold">Search</span> to
  <a href="/documentation/weather#get-weather-data" class="link"
    >get the weather</a
  >.
</p>

<section class="flex flex-col gap-3">
  <h2 id="choose-a-location" class="text-2xl font-bold">Choose a Place</h2>
  <ol class="ml-6 list-decimal space-y-1">
    <li>Type a city, region or landmark in the search box.</li>
    <li>
      Choose your place from the list that appears. Typing a name isn't enough:
      until you choose from the list, the box says
      <span class="font-bold">Choose a result</span>.
    </li>
  </ol>
  <p>
    Or press <span class="font-bold">My Location</span> to use where you are now.
    Your browser asks first.
  </p>
  <p>
    Once a place is chosen, <span class="font-bold">Details</span> shows its type,
    population and latitude and longitude, with a link to more about it. To search
    again, press ✕ in the search box.
  </p>
  <p>
    Small places aren't always listed. If yours isn't, choose a town nearby: the
    weather comes from an area around a place anyway.
  </p>
  <DocsShot
    src="location-and-dates/location"
    alt="The top of the Project Planner: London, England, United Kingdom chosen in the search box, with Details below it; From 2025-01-01 and To 2025-12-31 with Duration set to Custom; 365 Days; and the Search Again and Add Location buttons."
    caption="A place and a year of dates, ready to search."
  />
</section>

<section class="flex flex-col gap-3">
  <h2 id="select-dates" class="text-2xl font-bold">Choose Dates</h2>
  <p>Choose a <span class="font-bold">Duration</span>:</p>
  <ul class="ml-6 list-disc space-y-1">
    <li>
      <span class="font-bold">One Year:</span> choose the
      <span class="font-bold">Year</span>, <span class="font-bold">Month</span>
      and <span class="font-bold">Day</span> it starts, and it lasts a year from then.
    </li>
    <li>
      <span class="font-bold">Custom:</span> choose any
      <span class="font-bold">From</span> and <span class="font-bold">To</span>
      dates, up to {MAXIMUM_DAYS_PER_LOCATION} days.
    </li>
  </ul>
  <p>
    The number of days shows under the dates. Weather is only there for days
    that have passed, up to yesterday. A year that's still going is fine: the
    days still to come are left out for now, and come in when you press
    <span class="font-bold">Weather Data</span>, then
    <span class="font-bold">Only New Days</span> later.
    <a href="/documentation/guides/knit-along-all-year" class="link"
      >Making a blanket for this year</a
    >.
  </p>
</section>

<section class="flex flex-col gap-3">
  <h2 id="multiple-locations" class="text-2xl font-bold">
    More Than One Place
  </h2>
  <p>
    A blanket can follow you around: a trip, the places you've lived, or the
    same day in different years. Press <span class="font-bold"
      >Add Location</span
    >
    for another place with its own dates, up to {MAXIMUM_LOCATIONS} of them. The weather
    of each comes one after the other, in order, and the total number of days shows
    below.
  </p>
  <p>
    To remove one, press ⋮ beside it, then <span class="font-bold"
      >Remove Location</span
    >.
  </p>
  <p>
    <a href="/documentation/guides/same-date-several-years" class="link"
      >Using this for one date across several years</a
    >.
  </p>
</section>

<section class="flex flex-col gap-3">
  <h2 id="location-errors" class="text-2xl font-bold">
    If Something Goes Wrong
  </h2>
  <h3 class="text-lg font-bold">"Whoa! There's been a problem."</h3>
  <p>
    The place search couldn't reach the service that lists places. If you're
    offline, it says so. Otherwise refresh the page, or try again later.
  </p>
  <h3 class="text-lg font-bold">"Unable to retrieve your location"</h3>
  <p>
    <span class="font-bold">My Location</span> needs your permission. Allow location
    for this site in your browser's settings, or type a place instead.
  </p>
  <h3 class="text-lg font-bold">A message under the dates</h3>
  <ul class="ml-6 list-disc space-y-1">
    <li>
      <span class="font-bold"
        >The starting date must be at least one day in the past.</span
      > Choose an earlier start.
    </li>
    <li>
      <span class="font-bold"
        >Please select a maximum of {MAXIMUM_DAYS_PER_LOCATION} days.</span
      > Shorten the dates, or split them into two locations.
    </li>
    <li>
      <span class="font-bold"
        >…the selected end date comes before the selected start date.</span
      > Swap them.
    </li>
  </ul>
  <h3 class="text-lg font-bold">The places and dates can't be changed</h3>
  <p>
    You've <a href="/documentation/weather#edit-weather-data" class="link"
      >edited or imported weather</a
    >, so they're locked to keep your changes. Press
    <span class="font-bold">Reload Weather Data</span> to start over with the weather
    source, or open a new project.
  </p>
</section>

<RelatedGuides
  slugs={['plan-a-blanket', 'same-date-several-years', 'knit-along-all-year']}
/>

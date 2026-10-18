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

<!-- Crochet or Knit Along All Year. A saved project opens with its saved days
and never searches by itself (storage/projects.svelte.ts, weather-days):
the planner says how many new days are available, and Weather Data › Get
New Days adds only those. Search Again gets every day and asks before
changing saved ones (modals/SearchAgain.svelte). -->

<script lang="ts">
  import DocsShot from '#lib/components/docs/DocsShot.svelte';
  import RelatedReference from '#lib/components/docs/RelatedReference.svelte';
  import { OPEN_METEO_DELAY_DAYS } from '#lib/constants/weather-constants.js';
</script>

<p>
  Many people make a temperature blanket over a year, one row each day or a few
  each week, as the weather happens. Here's how to set up one project and keep
  using it all year.
</p>

<section class="flex flex-col gap-3">
  <h2 id="set-it-up" class="text-2xl font-bold">Set It Up</h2>
  <ol class="ml-6 list-decimal space-y-1">
    <li>
      Choose your place, and set <span class="font-bold">Duration</span> to
      <span class="font-bold">One Year</span> starting January 1 of this year (or
      whenever you start).
    </li>
    <li>
      Press <span class="font-bold">Search</span>. A warning under the dates
      says some days "are not in the past and won't have weather data". For a
      year that's still going, that's expected: carry on.
    </li>
    <li>
      Press <span class="font-bold">Project</span>, then
      <span class="font-bold">Save Project</span>, and give it a name with the
      pencil.
    </li>
  </ol>
  <DocsShot
    src="knit-along-all-year/future-days"
    alt="London from January 1 to December 31 of this year, 365 Days, with a warning under the dates that some of these days are not in the past and won't have weather data. Below it, Weather Data and Add Location."
    caption="A year that's still going."
  />
</section>

<section class="flex flex-col gap-3">
  <h2 id="fix-your-ranges" class="text-2xl font-bold">
    Fix Your Ranges at the Start
  </h2>
  <p>
    Auto ranges are made from the weather you have so far, and remade as more
    comes in. In March, your ranges would only cover winter, and change every
    time you look, so rows you've already made could end up a different color.
    Set ranges that won't move instead:
  </p>
  <ol class="ml-6 list-decimal space-y-1">
    <li>
      Think of the hottest and coldest days your place usually has in a year.
      Last year's project is a good guide: try it with last year's dates.
    </li>
    <li>
      Press <span class="font-bold">Ranges</span>, then
      <span class="font-bold">Manual steps…</span>, and choose steps that cover
      them, like every 5° from 35°.
    </li>
    <li>Press <span class="font-bold">Save</span>.</li>
  </ol>
  <p>
    Ranges you set yourself never change on their own.
    <a href="/documentation/guides/choose-ranges" class="link"
      >Choosing ranges</a
    >.
  </p>
</section>

<section class="flex flex-col gap-3">
  <h2 id="each-time" class="text-2xl font-bold">Each Time You Sit Down</h2>
  <ol class="ml-6 list-decimal space-y-1">
    <li>
      Open your project from <span class="font-bold">My Library</span>, or press
      <span class="font-bold">Project</span>, then
      <span class="font-bold">Open…</span>
    </li>
    <li>
      Under the title it says how many new days are available. Press
      <span class="font-bold">Weather Data</span>, then
      <span class="font-bold">Get New Days</span>. Only the days since are
      added: the days you've already made stay as they were saved.
    </li>
    <li>
      Find today's rows in the <span class="font-bold">Table</span> (turn on
      <span class="font-bold">Show Color Details</span> for each day's yarn), or touch
      them in the preview.
    </li>
  </ol>
  {#if __ACCOUNTS_ENABLED__}
    <p>
      Signed in, your project is on every device: plan on the computer, and
      check today's color on your phone.
    </p>
  {/if}
</section>

<section class="flex flex-col gap-3">
  <h2 id="stay-a-few-days-behind" class="text-2xl font-bold">
    Stay a Few Days Behind
  </h2>
  <p>
    Weather services can take up to a week to finish the newest days, so
    yesterday's numbers might still change. If you can, work about
    {OPEN_METEO_DELAY_DAYS} days behind. Your saved days stay as they are unless you
    choose otherwise, but keep a record of what you've made too: download the PDF
    each month or so.
    <a href="/documentation/guides/print-and-track" class="link"
      >Printing and keeping your place</a
    >.
  </p>
</section>

<section class="flex flex-col gap-3">
  <h2 id="if-something-goes-wrong" class="text-2xl font-bold">
    If Something Goes Wrong
  </h2>
  <h3 class="text-lg font-bold">Yesterday isn't there yet</h3>
  <p>
    The weather source may not have it yet. Try again later in the day, or
    tomorrow.
  </p>
  <h3 class="text-lg font-bold">A day I've already made changed color</h3>
  <p>
    Saved days don't change by themselves, so check whether the ranges moved
    (use Manual steps, above). If you used Search Again and chose a day's new
    values, that day changed on purpose: its old values aren't kept. A blanket
    doesn't need to match to the decimal.
    <a href="/documentation/guides/weather-doesnt-match" class="link"
      >When the weather changes</a
    >.
  </p>
  <h3 class="text-lg font-bold">Weather sources update recent days</h3>
  <p>
    The newest days are early data. Once they've settled, the planner says so
    and offers <span class="font-bold">Search Again</span>, which shows any day
    that's different now and keeps your saved values unless you choose the new
    ones.
    <a href="/documentation/weather#saved-weather-days" class="link"
      >Saved weather</a
    >.
  </p>
  <h3 class="text-lg font-bold">I edited a day, and now Search is gone</h3>
  <p>
    Edited weather is kept as yours, so it isn't looked up again, and the button
    says <span class="font-bold">Reload Weather Data</span> instead, which replaces
    your edits. For a project still in progress, it's best not to edit the weather
    until the year is done.
  </p>
</section>

<RelatedReference
  slugs={['location-and-dates', 'gauges-and-ranges', 'library-and-account']}
/>

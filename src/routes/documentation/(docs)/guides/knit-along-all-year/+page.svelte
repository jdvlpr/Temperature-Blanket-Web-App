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

<!-- Crochet or Knit Along All Year. A project with days still to come never
loads its saved weather (storage/projects.svelte.ts keeps it only if every
day had passed when the project was created), and nothing searches by
itself: it opens with Search, and each search gets every day up to
yesterday. Auto ranges are remade with the weather, so done rows could
change color: hence Manual steps. -->

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
      Press <span class="font-bold">Search</span>. A message under the dates
      says how many days are still to come; that's expected.
    </li>
    <li>
      Press <span class="font-bold">Project</span>, then
      <span class="font-bold">Save Project</span>, and give it a name with the
      pencil.
    </li>
  </ol>
  <DocsShot
    src="knit-along-all-year/future-days"
    alt="London from 2026-01-01 to 2026-12-31, 365 Days, with a warning under the dates: 75 of these days are not in the past and won't have weather data. Below it, Search Again and Add Location."
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
      Press <span class="font-bold">Search</span>. A project that's still going
      always looks up its weather fresh, so it has every day up to yesterday.
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
    {OPEN_METEO_DELAY_DAYS} days behind. Now and then, older days are corrected too,
    so keep a record of what you've made: download the PDF each month or so.
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
    Either the ranges moved (use Manual steps, above) or the weather source
    corrected that day. Keep your rows as they are: a blanket doesn't need to
    match to the decimal.
    <a href="/documentation/guides/weather-doesnt-match" class="link"
      >When the weather changes</a
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

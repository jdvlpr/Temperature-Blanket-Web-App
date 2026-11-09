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
the main button says Add N New Days (or Check for Updates), and adds
them, asking before changing saved ones
(modals/SearchAgain.svelte). -->

<script lang="ts">
  import DocsShot from '#lib/components/docs/DocsShot.svelte';
  import RelatedReference from '#lib/components/docs/RelatedReference.svelte';
  import { OPEN_METEO_DELAY_DAYS } from '#lib/constants/weather-constants.js';
</script>

<p>
  Many people make a temperature blanket over a year, one row each day or a few
  each week, as the weather happens. This guide shows how to set up one project
  and keep coming back to it all year.
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
      Press <span class="font-bold">Get Weather Data</span>. Beside the number
      of days, it says how many are still to come. Their weather is added as
      they pass.
    </li>
    <li>
      Press <span class="font-bold">Project</span>, then
      <span class="font-bold">Save Project</span>. To name it, press its name at
      the top and type a new one.
    </li>
  </ol>
  <DocsShot
    src="knit-along-all-year/future-days"
    alt="London from January 1 to December 31 of this year: 365 Days, and how many are still to come. Below it, Add another location, then Check for Updates."
    caption="A year that's still going."
  />
</section>

<section class="flex flex-col gap-3">
  <h2 id="fix-your-ranges" class="text-2xl font-bold">
    Fix Your Ranges at the Start
  </h2>
  <p>
    Auto ranges are made from the weather you have so far, and remade as more
    comes in. So in March, your ranges would only cover winter and would keep
    changing, which means rows you've already made could end up a different
    color. It's better to set ranges that won't move:
  </p>
  <ol class="ml-6 list-decimal space-y-1">
    <li>
      Think of the hottest and coldest days your place usually has in a year. A
      good way to find them is to try the project with last year's dates.
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
      The main button says <span class="font-bold">Add 3 New Days</span> (with however
      many are waiting). Press it to add them. If a day you saved has different weather
      now, you're asked first, and the days you've already made stay as they were
      saved unless you update them.
    </li>
    <li>
      Find today's rows in the <span class="font-bold">Table</span> (press
      <span class="font-bold">Today</span>, and turn on
      <span class="font-bold">Show Colors</span> for each day's color; press a color
      for its yarn), or touch them in the preview.
    </li>
  </ol>
  {#if __ACCOUNTS_ENABLED__}
    <p>
      When you're signed in, your project is on all your devices, so you can
      plan on your computer and check today's color on your phone.
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
    choose otherwise, but it's still a good idea to keep your own record. Downloading
    the PDF every month or so works well.
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
    (use Manual steps, above). If you used Check for Updates and chose a day's
    new values, that day changed on purpose: its old values aren't kept. Don't
    worry, a blanket doesn't need to match to the decimal.
    <a href="/documentation/guides/weather-doesnt-match" class="link"
      >When the weather changes</a
    >.
  </p>
  <h3 class="text-lg font-bold">Weather sources update recent days</h3>
  <p>
    The newest days are early data. Once they've settled, the planner says so
    and offers <span class="font-bold">Check for Updates</span>, which shows any
    day that's different now and keeps your saved values unless you choose the
    new ones.
    <a href="/documentation/weather#saved-weather-days" class="link"
      >Saved weather</a
    >.
  </p>
  <h3 class="text-lg font-bold">
    I edited a day, and now Check for Updates is gone
  </h3>
  <p>
    Once you edit the weather, it's treated as yours and isn't looked up again.
    The button says <span class="font-bold">Get Weather Data</span> instead, and
    it asks first, since <span class="font-bold">Reload Weather Data</span> replaces
    your edits. For a project still in progress, it's best not to edit the weather
    until the year is done.
  </p>
</section>

<RelatedReference
  slugs={['location-and-dates', 'gauges-and-ranges', 'library-and-account']}
/>

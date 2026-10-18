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

<!-- Plan a Blanket, Start to Finish: the whole Project Planner once, in
order, each step pointing to its reference page. Replaces the 2024 how-to
post (which links here). The old anchor about-the-project-planner lands
here. -->

<script lang="ts">
  import DocsShot from '#lib/components/docs/DocsShot.svelte';
  import RelatedReference from '#lib/components/docs/RelatedReference.svelte';
  import { MAXIMUM_DAYS_PER_LOCATION } from '#lib/constants/location-constants.js';
</script>

<p>
  This guide goes through one whole project: a place and dates, the weather,
  your colors and ranges, a preview, then saving and printing the pattern. Each
  step links to the full details if you want them.
</p>

<section class="flex flex-col gap-3">
  <h2 id="what-you-need" class="text-2xl font-bold">What You Need</h2>
  <ul class="ml-6 list-disc space-y-1">
    <li>
      The place your blanket is about, like your town, and its dates: a year, a
      trip, or any stretch up to {MAXIMUM_DAYS_PER_LOCATION} days.
    </li>
    <li>
      Yarn in mind, or not yet: you can choose colors first and match them to
      yarn later.
    </li>
    <li>
      Nothing else. You don't need an account{#if __ACCOUNTS_ENABLED__}, though
        signing in keeps your project on every device{/if}.
    </li>
  </ul>
</section>

<section class="flex flex-col gap-3">
  <h2 id="place-and-dates" class="text-2xl font-bold">
    1. Choose a Place and Dates
  </h2>
  <ol class="ml-6 list-decimal space-y-1">
    <li>
      Open the Project Planner: <span class="font-bold">Create</span>, then
      <span class="font-bold">Project</span>, in the site menu.
    </li>
    <li>Type your place in the search box, and choose it from the list.</li>
    <li>
      Choose a <span class="font-bold">Duration</span>:
      <span class="font-bold">One Year</span> (then the year, month and day it
      starts) or <span class="font-bold">Custom</span> (any
      <span class="font-bold">From</span> and <span class="font-bold">To</span> dates).
    </li>
  </ol>
  <p>
    Making a blanket for this year, as it happens? Choose the whole year anyway:
    the days still to come are filled in later.
    <a href="/documentation/guides/knit-along-all-year" class="link"
      >Crocheting or knitting along all year</a
    >.
  </p>
  <DocsShot
    src="location-and-dates/location"
    alt="The top of the Project Planner: London, England, United Kingdom chosen in the search box, with Details below it; From 2025-01-01 and To 2025-12-31 with Duration set to Custom; 365 Days; and the Search Again and Add Location buttons."
    caption="A place and a year of dates."
  />
</section>

<section class="flex flex-col gap-3">
  <h2 id="get-the-weather" class="text-2xl font-bold">2. Get the Weather</h2>
  <ol class="ml-6 list-decimal space-y-1">
    <li>
      Press <span class="font-bold">Search</span>. It takes a few seconds.
    </li>
    <li>
      Look it over: the <span class="font-bold">Summary</span> has your hottest
      and coldest days, the <span class="font-bold">Chart</span> shows the whole
      year, and the <span class="font-bold">Table</span> lists every day.
    </li>
    <li>
      Prefer °F and inches? Press <span class="font-bold">Units</span> above the weather.
    </li>
  </ol>
  <p>
    Weekly instead of daily rows? Choose <span class="font-bold">Grouping</span
    >, then <span class="font-bold">Weekly</span>. See
    <a href="/documentation/weather" class="link">Weather</a>.
  </p>
</section>

<section class="flex flex-col gap-3">
  <h2 id="choose-colors" class="text-2xl font-bold">3. Choose Your Colors</h2>
  <p>
    Below the weather is the <span class="font-bold">Temperature Gauge</span>,
    your blanket's key: a list of colors, each standing for a range of
    temperatures. It starts with colors to try; make them yours:
  </p>
  <ol class="ml-6 list-decimal space-y-1">
    <li>
      Choose how many colors you want in the menu below the gauge (like
      <span class="font-bold">12 Colors</span>). More colors means smaller
      ranges, and a more detailed blanket.
    </li>
    <li>
      Press <span class="font-bold">Get Colors</span>, then
      <span class="font-bold">Choose Colorways</span> to pick real yarn, or
      <span class="font-bold">Preset Gradients</span>,
      <span class="font-bold">From an Image</span> and more.
    </li>
    <li>To change one color, press its swatch.</li>
  </ol>
  <DocsShot
    src="colors-and-yarn/get-colors"
    alt="The Get Colors menu: My Palettes, Palette Gallery, Preset Gradients, Choose Colorways, From an Image, Random, and Paste Colors or Code, each with a short description."
    caption="Get Colors."
  />
  <p>
    <a href="/documentation/guides/match-your-yarn" class="link"
      >Matching yarn you have, or a photo</a
    >.
  </p>
</section>

<section class="flex flex-col gap-3">
  <h2 id="set-ranges" class="text-2xl font-bold">4. Set the Ranges</h2>
  <p>
    Each color's range is beside it, like 30 → 25. They're made from your
    weather to start with, so every day has a color. To change them:
  </p>
  <ul class="ml-6 list-disc space-y-1">
    <li>
      <span class="font-bold">One number:</span> press it, type the new one, and
      press <span class="font-bold">Save</span>. The next range follows along.
    </li>
    <li>
      <span class="font-bold">All of them:</span> press
      <span class="font-bold">Ranges</span>. Choose
      <span class="font-bold">Equal days</span> to use every color about as
      often, or <span class="font-bold">Manual steps…</span> for round steps like
      every 5°.
    </li>
  </ul>
  <DocsShot
    src="gauges-and-ranges/edit-range"
    alt="The Temperature Gauge as a list of ten colors, each with its range and how many days fall in it. The third color's range, 23° → 20°, has its To number open for typing, with ✕ and Save beside it."
    caption="Changing one range."
  />
  <p>
    <a href="/documentation/guides/choose-ranges" class="link"
      >Choosing ranges for your yarn</a
    >.
  </p>
</section>

<section class="flex flex-col gap-3">
  <h2 id="preview" class="text-2xl font-bold">5. Preview Your Blanket</h2>
  <ol class="ml-6 list-decimal space-y-1">
    <li>
      Choose a <span class="font-bold">Pattern</span> above the preview.
      <span class="font-bold">Rows</span> is the classic: one row a day.
    </li>
    <li>
      Set it up in the settings below it, like the number of stitches in a row,
      or squares across.
    </li>
    <li>Touch or click a row to see its date and weather.</li>
  </ol>
  <DocsShot
    src="preview/rows"
    alt="A Rows preview of a year of London's weather: one thin stripe per day from top to bottom, purples and blues in winter, warming through yellows and oranges to deep reds in summer, and back to blues and purples in December."
    caption="Rows, a year of London."
  />
  <p>
    See every pattern in <a href="/documentation/preview" class="link"
      >Preview</a
    >.
  </p>
</section>

<section class="flex flex-col gap-3">
  <h2 id="save" class="text-2xl font-bold">6. Save Your Project</h2>
  <ol class="ml-6 list-decimal space-y-1">
    <li>
      Press <span class="font-bold">Project</span> at the top, then
      <span class="font-bold">Save Project</span>.
    </li>
    <li>To give it a name, press the pencil beside its name at the top.</li>
  </ol>
  <p>
    From then on, your changes save by themselves. Your project is in
    <span class="font-bold">My Library</span>, in this browser{#if __ACCOUNTS_ENABLED__},
      and in your account when you're signed in{/if}.
    <a href="/documentation/guides/move-or-back-up" class="link"
      >Keeping your projects safe</a
    >.
  </p>
</section>

<section class="flex flex-col gap-3">
  <h2 id="download" class="text-2xl font-bold">7. Download the Pattern</h2>
  <ol class="ml-6 list-decimal space-y-1">
    <li>
      Press <span class="font-bold">Project</span>, then
      <span class="font-bold">Download</span>, then
      <span class="font-bold">PDF</span>.
    </li>
    <li>
      Press <span class="font-bold">Customize</span> to choose what's in it,
      then
      <span class="font-bold">Download</span>.
    </li>
  </ol>
  <p>
    The PDF has your colors and ranges, and every day's weather in its color.
    <a href="/documentation/guides/print-and-track" class="link"
      >Printing the pattern and keeping your place</a
    >.
  </p>
</section>

<section class="flex flex-col gap-3">
  <h2 id="if-something-goes-wrong" class="text-2xl font-bold">
    If Something Goes Wrong
  </h2>
  <h3 class="text-lg font-bold">My place isn't in the list</h3>
  <p>Choose a town nearby. The weather is for an area around a place anyway.</p>
  <h3 class="text-lg font-bold">Search can't be pressed</h3>
  <p>
    Choose your place from the list (typing it isn't enough), and check for a
    message under the dates. See
    <a href="/documentation/location-and-dates#location-errors" class="link"
      >Location & Dates</a
    >.
  </p>
  <h3 class="text-lg font-bold">The weather doesn't come, or looks wrong</h3>
  <p>
    <a href="/documentation/guides/weather-doesnt-match" class="link"
      >When the weather doesn't match your thermometer</a
    >, and
    <a href="/documentation/weather#weather-errors" class="link"
      >weather messages</a
    >.
  </p>
  <h3 class="text-lg font-bold">Some colors are hardly used</h3>
  <p>
    Your weather spends more time in some ranges than others. Choose
    <span class="font-bold">Ranges</span>, then
    <span class="font-bold">Equal days</span>.
  </p>
</section>

<RelatedReference
  slugs={[
    'location-and-dates',
    'weather',
    'gauges-and-ranges',
    'colors-and-yarn',
    'preview',
    'download',
  ]}
/>
